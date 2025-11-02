// Video Reject API (Story 2.7, AC#5)
// Marks videos as rejected in Notion with optional reason

import { NextRequest, NextResponse } from 'next/server';
import { logVideoError } from '@/lib/notion-client';

/**
 * POST /api/videos/reject
 * Rejects a video and logs reason in Notion
 * Body: { notionPageId: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId, reason } = body;

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    // Log rejection in Notion as an error with reason
    const errorMessage = reason || 'Video rejected by reviewer';

    const success = await logVideoError(
      notionPageId,
      'download_failed', // Using existing error type, could add 'rejected' type
      errorMessage,
      {
        rejectedAt: new Date().toISOString(),
        rejectedBy: 'user', // Could add user ID from auth
      }
    );

    if (!success) {
      throw new Error('Failed to update Notion');
    }

    return NextResponse.json({
      success: true,
      message: 'Video rejected',
      notionPageId,
      reason: errorMessage,
    });
  } catch (error) {
    console.error('[Video API] Error rejecting video:', error);
    return NextResponse.json(
      {
        error: 'Failed to reject video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
