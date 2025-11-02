// Video Approve API (Story 2.7, AC#5)
// Marks videos as approved in Notion

import { NextRequest, NextResponse } from 'next/server';
import { updateVideoVariationStatus } from '@/lib/notion-client';

/**
 * POST /api/videos/approve
 * Approves a video and marks it in Notion
 * Body: { notionPageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId } = body;

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    // Update Notion record with approved status
    // In production, this would add an "Approved" property
    // For now, we'll use a placeholder approach
    const success = await updateVideoVariationStatus(notionPageId, 'Completed', {
      // Could add custom properties like approved: true
    });

    if (!success) {
      throw new Error('Failed to update Notion');
    }

    return NextResponse.json({
      success: true,
      message: 'Video approved',
      notionPageId,
    });
  } catch (error) {
    console.error('[Video API] Error approving video:', error);
    return NextResponse.json(
      {
        error: 'Failed to approve video',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
