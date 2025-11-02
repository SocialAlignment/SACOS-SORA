// Video Retry API (Story 2.8, AC#3, AC#5)
// Retries failed video generation with optional prompt modification

import { NextRequest, NextResponse } from 'next/server';
import { soraClient, SoraModel, SoraDuration } from '@/lib/sora-client';
import { videoGenerationQueue } from '@/lib/video-generation-queue';
import { updateVideoVariationStatus } from '@/lib/notion-client';
import {
  categorizeError,
  createRetryAttempt,
  shouldAutoRetry,
  getRetryDelay,
} from '@/lib/video-error-handler';

/**
 * POST /api/videos/retry
 * Retries a failed video with optional prompt modification
 * Body: { notionPageId: string, modifiedPrompt?: string, batchId: string, model: string, duration: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId, modifiedPrompt, batchId, combinationId, model, duration, aspectRatio } =
      body;

    if (!notionPageId || !batchId) {
      return NextResponse.json(
        { error: 'notionPageId and batchId are required' },
        { status: 400 }
      );
    }

    // Get current retry count from Notion (Story 2.8, AC#5)
    // In production, this would fetch from Notion metadata
    const currentRetryCount = 0; // Placeholder

    // Create retry attempt record (Story 2.8, AC#5)
    const retryAttempt = createRetryAttempt(
      currentRetryCount + 1,
      'Previous generation failed',
      modifiedPrompt
    );

    console.log(
      `[Retry API] Retry attempt #${retryAttempt.attemptNumber} for ${notionPageId}${modifiedPrompt ? ' (with modified prompt)' : ''}`
    );

    // Update Notion with retry attempt (Story 2.8, AC#5)
    await updateVideoVariationStatus(notionPageId, 'In Progress', {
      retryCount: retryAttempt.attemptNumber,
      lastRetryAt: retryAttempt.timestamp.toISOString(),
      modifiedPrompt: modifiedPrompt || undefined,
    });

    // Get the prompt to use
    const promptToUse = modifiedPrompt || body.originalPrompt || 'Default video prompt';

    // Resubmit to generation queue (Story 2.8, AC#3)
    await videoGenerationQueue.submitVideo({
      notionPageId,
      batchId,
      combinationId: combinationId || notionPageId,
      prompt: promptToUse,
      model: (model as SoraModel) || 'sora-2',
      duration: (duration as SoraDuration) || 10,
      aspectRatio: aspectRatio || '16:9',
      queuedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Video retry queued',
      notionPageId,
      retryAttempt: retryAttempt.attemptNumber,
      modifiedPrompt: modifiedPrompt || null,
    });
  } catch (error) {
    console.error('[Retry API] Error retrying video:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/videos/retry/:id/status
 * Gets retry history for a video
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const notionPageId = searchParams.get('notionPageId');

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    // In production, fetch retry history from Notion
    // For now, return mock data
    const retryHistory = [
      {
        attemptNumber: 1,
        timestamp: new Date().toISOString(),
        previousError: 'API timeout',
        outcome: 'failed',
        newError: 'Connection timeout',
      },
      {
        attemptNumber: 2,
        timestamp: new Date().toISOString(),
        previousError: 'Connection timeout',
        modifiedPrompt: 'Updated prompt with better phrasing',
        outcome: 'pending',
      },
    ];

    return NextResponse.json({
      notionPageId,
      retryHistory,
      totalAttempts: retryHistory.length,
    });
  } catch (error) {
    console.error('[Retry API] Error fetching retry history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch retry history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
