// Download Retry API (Story 2.6)
// Manually retry failed downloads

import { NextRequest, NextResponse } from 'next/server';
import { assetDownloadManager } from '@/lib/asset-download-manager';

/**
 * POST /api/downloads/retry
 * Retries a failed download
 * Body: { notionPageId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notionPageId } = body;

    if (!notionPageId) {
      return NextResponse.json({ error: 'notionPageId is required' }, { status: 400 });
    }

    await assetDownloadManager.retryDownload(notionPageId);

    return NextResponse.json({
      success: true,
      message: 'Download retry initiated',
    });
  } catch (error) {
    console.error('[Download API] Error retrying download:', error);
    return NextResponse.json(
      {
        error: 'Failed to retry download',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
