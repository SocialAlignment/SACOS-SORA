// Notion Webhook Handler (Story 2.3, AC#5)
// Receives status updates from Notion or Sora 2 API polling

import { NextRequest, NextResponse } from 'next/server';
import { updateVideoVariationStatus, logVideoError } from '@/lib/notion-client';

/**
 * Webhook payload from Sora 2 polling or Notion updates
 */
type WebhookPayload = {
  notionPageId: string;
  soraVideoId?: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress?: number; // 0-100 for in_progress
  videoUrl?: string;
  error?: {
    type: 'compliance_failed' | 'api_error' | 'generation_failed' | 'download_failed';
    message: string;
    details?: Record<string, any>;
  };
};

/**
 * POST /api/notion/webhook
 * Handles status updates from Sora 2 polling system
 * Story 2.3, AC#3, AC#4, AC#5
 */
export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();

    // Validate payload
    if (!payload.notionPageId || !payload.status) {
      return NextResponse.json(
        { error: 'Missing required fields: notionPageId, status' },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Processing status update for ${payload.notionPageId}: ${payload.status}`);

    // Map Sora 2 status to Notion status (Story 2.3, AC#3)
    let notionStatus: 'Pending' | 'In Progress' | 'Completed' | 'Failed';

    switch (payload.status) {
      case 'queued':
        notionStatus = 'Pending';
        break;
      case 'in_progress':
        notionStatus = 'In Progress';
        break;
      case 'completed':
        notionStatus = 'Completed';
        break;
      case 'failed':
        notionStatus = 'Failed';
        break;
      default:
        notionStatus = 'Pending';
    }

    // Handle error case (Story 2.3, AC#4)
    if (payload.error) {
      await logVideoError(
        payload.notionPageId,
        payload.error.type,
        payload.error.message,
        payload.error.details
      );

      return NextResponse.json({
        success: true,
        message: 'Error logged successfully',
      });
    }

    // Update status in Notion
    const success = await updateVideoVariationStatus(payload.notionPageId, notionStatus, {
      videoUrl: payload.videoUrl,
      soraVideoId: payload.soraVideoId,
      progress: payload.progress,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update Notion record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status updated to ${notionStatus}`,
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notion/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Notion webhook handler is active',
  });
}
