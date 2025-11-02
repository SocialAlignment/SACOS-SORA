// Batch Queue Status API (Story 2.5, AC#5)
// Returns queue status for an entire batch

import { NextRequest, NextResponse } from 'next/server';
import { videoGenerationQueue } from '@/lib/video-generation-queue';

/**
 * GET /api/queue/batch?batchId={batchId}
 * Returns queue status for a specific batch
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json({ error: 'batchId query parameter is required' }, { status: 400 });
    }

    const batchStatus = videoGenerationQueue.getBatchStatus(batchId);

    return NextResponse.json(batchStatus);
  } catch (error) {
    console.error('[Queue API] Error getting batch status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get batch status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
