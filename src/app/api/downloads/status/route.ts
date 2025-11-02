// Download Status API (Story 2.6)
// Real-time download status and expiration tracking

import { NextRequest, NextResponse } from 'next/server';
import { assetDownloadManager } from '@/lib/asset-download-manager';

/**
 * GET /api/downloads/status
 * Returns overall download status summary
 */
export async function GET(request: NextRequest) {
  try {
    const summary = assetDownloadManager.getDownloadSummary();
    const pending = assetDownloadManager.getPendingDownloads();
    const expiring = assetDownloadManager.getExpiringDownloads();

    return NextResponse.json({
      summary,
      pending: pending.length,
      expiring: expiring.length,
      expiringDownloads: expiring.map((job) => ({
        notionPageId: job.notionPageId,
        soraVideoId: job.soraVideoId,
        expiresAt: job.expiresAt,
        minutesRemaining: Math.floor((job.expiresAt.getTime() - Date.now()) / (60 * 1000)),
      })),
    });
  } catch (error) {
    console.error('[Download API] Error getting download status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get download status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/downloads/status
 * Returns download status for a specific video
 * Body: { notionPageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId } = body;

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    const status = assetDownloadManager.getDownloadStatus(notionPageId);

    if (!status) {
      return NextResponse.json({ error: 'Download job not found' }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('[Download API] Error getting download status:', error);
    return NextResponse.json(
      {
        error: 'Failed to get download status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
