// Queue Status API (Story 2.5, AC#5)
// Real-time queue position and status tracking for dashboard

import { NextRequest, NextResponse } from 'next/server';
import { videoGenerationQueue } from '@/lib/video-generation-queue';

/**
 * GET /api/queue/status
 * Returns overall queue status summary
 */
export async function GET(request: NextRequest) {
  try {
    const summary = videoGenerationQueue.getQueueSummary();
    const inProgress = videoGenerationQueue.getInProgressVideos();
    const queued = videoGenerationQueue.getQueuedVideos();

    return NextResponse.json({
      summary,
      inProgress,
      queued,
    });
  } catch (error) {
    console.error('[Queue API] Error getting queue status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get queue status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/queue/status
 * Returns status for a specific video
 * Body: { notionPageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId } = body;

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    const status = videoGenerationQueue.getStatus(notionPageId);

    if (!status) {
      return NextResponse.json({ error: 'Video not found in queue' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Queue API] Error getting video status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get video status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
