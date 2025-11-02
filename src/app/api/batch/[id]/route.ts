// Story 1.6: Batch Status API
// Returns real-time batch generation status with video variations

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignApi, combinationApi } from '@/lib/campaign-api';
import { getBatchVariations } from '@/lib/notion-client';

export type BatchStatusResponse = {
  batchId: string;
  brand: string;
  bigIdea: string;
  status: 'initializing' | 'generating' | 'completed' | 'failed' | 'partial';
  totalVideos: number;
  queuedCount: number;
  inProgressCount: number;
  completedCount: number;
  failedCount: number;
  progressPercentage: number;
  estimatedCompletionTime?: string;
  videos: VideoStatus[];
  createdAt: string;
};

export type VideoStatus = {
  combinationId: string;
  notionPageId?: string;
  status: 'Queued' | 'In Progress' | 'Completed' | 'Failed';
  funnelLevel: string;
  aesthetic: string;
  contentType: string;
  intention: string;
  mood: string;
  demographic: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  errorMessage?: string;
  cost: number;
  progress?: number;
  soraVideoId?: string;
};

/**
 * GET /api/batch/[id]
 * Story 1.6: Batch Status Endpoint
 *
 * Returns real-time status of batch generation including:
 * - Overall batch progress
 * - Individual video statuses
 * - Estimated completion time
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batchId = params.id;

    // Fetch campaign data
    const campaign = await campaignApi.getById(batchId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Fetch all combinations for this batch
    const combinations = await combinationApi.getByCampaign(batchId);

    // Fetch Notion records for detailed status
    const notionRecords = await getBatchVariations(batchId);

    // Map combinations to video status
    const videos: VideoStatus[] = combinations.map((combo) => {
      // Find matching Notion record for additional details
      const notionRecord = notionRecords.find(
        (n) => n.combinationId === combo.combination_id
      );

      return {
        combinationId: combo.combination_id || '',
        notionPageId: combo.notion_record_id || undefined,
        status: mapWinnerStatusToVideoStatus(combo.winner_status),
        funnelLevel: combo.dimension_values.funnelLevel || '',
        aesthetic: combo.dimension_values.aesthetic || '',
        contentType: combo.dimension_values.type || '',
        intention: combo.dimension_values.intention || '',
        mood: combo.dimension_values.mood || '',
        demographic: buildDemographic(combo.dimension_values),
        videoUrl: combo.video_url || notionRecord?.videoUrl,
        thumbnailUrl: undefined, // TODO: Add thumbnail support
        errorMessage: notionRecord?.errorLogs,
        cost: calculateCost(combo),
        progress: notionRecord?.status === 'In Progress' ? 50 : undefined,
        soraVideoId: notionRecord?.soraVideoId,
      };
    });

    // Calculate status counts
    const statusCounts = videos.reduce(
      (acc, video) => {
        switch (video.status) {
          case 'Queued':
            acc.queued++;
            break;
          case 'In Progress':
            acc.inProgress++;
            break;
          case 'Completed':
            acc.completed++;
            break;
          case 'Failed':
            acc.failed++;
            break;
        }
        return acc;
      },
      { queued: 0, inProgress: 0, completed: 0, failed: 0 }
    );

    // Calculate overall batch status
    const batchStatus = calculateBatchStatus(
      statusCounts,
      videos.length
    );

    // Calculate progress percentage
    const progressPercentage = videos.length > 0
      ? Math.round((statusCounts.completed / videos.length) * 100)
      : 0;

    // Estimate completion time (assuming 4 videos concurrently at ~4 min each)
    const remainingVideos = statusCounts.queued + statusCounts.inProgress;
    const estimatedMinutes = remainingVideos > 0
      ? Math.ceil(remainingVideos / 4) * 4
      : 0;
    const estimatedCompletionTime = remainingVideos > 0
      ? new Date(Date.now() + estimatedMinutes * 60000).toISOString()
      : undefined;

    const response: BatchStatusResponse = {
      batchId: campaign.campaign_id,
      brand: campaign.brand_id,
      bigIdea: campaign.big_idea,
      status: batchStatus,
      totalVideos: videos.length,
      queuedCount: statusCounts.queued,
      inProgressCount: statusCounts.inProgress,
      completedCount: statusCounts.completed,
      failedCount: statusCounts.failed,
      progressPercentage,
      estimatedCompletionTime,
      videos,
      createdAt: campaign.created_at.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Batch Status] Error fetching batch status:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch batch status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Maps database winner_status to video status
 */
function mapWinnerStatusToVideoStatus(
  winnerStatus: 'pending' | 'winner' | 'loser' | 'generating'
): VideoStatus['status'] {
  switch (winnerStatus) {
    case 'generating':
      return 'In Progress';
    case 'winner':
    case 'loser':
      return 'Completed';
    case 'pending':
    default:
      return 'Queued';
  }
}

/**
 * Builds demographic string from dimension values
 */
function buildDemographic(dimensions: any): string {
  const parts: string[] = [];

  if (dimensions.ageGeneration && dimensions.ageGeneration !== 'any') {
    parts.push(dimensions.ageGeneration);
  }
  if (dimensions.gender && dimensions.gender !== 'any') {
    parts.push(dimensions.gender);
  }
  if (dimensions.ethnicity && dimensions.ethnicity !== 'any') {
    parts.push(dimensions.ethnicity);
  }

  return parts.length > 0 ? parts.join(', ') : 'any';
}

/**
 * Calculates video generation cost
 */
function calculateCost(combination: any): number {
  // Default cost if not available
  return combination.estimated_cost || 5.0;
}

/**
 * Calculates overall batch status based on video counts
 */
function calculateBatchStatus(
  counts: { queued: number; inProgress: number; completed: number; failed: number },
  total: number
): BatchStatusResponse['status'] {
  // All completed
  if (counts.completed === total) {
    return 'completed';
  }

  // All failed
  if (counts.failed === total) {
    return 'failed';
  }

  // Some completed, some failed, none in progress/queued
  if (
    counts.completed > 0 &&
    counts.failed > 0 &&
    counts.queued === 0 &&
    counts.inProgress === 0
  ) {
    return 'partial';
  }

  // Currently generating
  if (counts.inProgress > 0 || counts.queued > 0) {
    return 'generating';
  }

  // Initializing
  return 'initializing';
}
