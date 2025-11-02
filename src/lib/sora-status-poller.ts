// Sora 2 Status Polling System (Story 2.3, AC#5, Story 2.4, 2.5, 2.6 integration)
// Polls Sora 2 API every 30 seconds for video status updates

import type { VideoVariationRecord } from './notion-client';
import { soraClient, type SoraStatusResponse } from './sora-client';
import { videoGenerationQueue } from './video-generation-queue';
import { assetDownloadManager } from './asset-download-manager';

/**
 * Polling job tracking
 */
type PollingJob = {
  notionPageId: string;
  soraVideoId: string;
  batchId: string;
  startedAt: Date;
  lastPolledAt: Date;
  pollCount: number;
  maxPolls: number; // Timeout after X polls
};

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds (Story 2.3, AC#5)
const MAX_POLL_ATTEMPTS = 120; // 1 hour max (120 * 30s)

/**
 * Sora Status Poller
 * Manages polling for multiple videos in a batch
 */
export class SoraStatusPoller {
  private activeJobs: Map<string, PollingJob> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/notion/webhook`
      : 'http://localhost:3000/api/notion/webhook';
  }

  /**
   * Starts polling for a video variation
   */
  startPolling(notionPageId: string, soraVideoId: string, batchId: string): void {
    // Don't start if already polling
    if (this.activeJobs.has(soraVideoId)) {
      console.log(`[Poller] Already polling ${soraVideoId}`);
      return;
    }

    const job: PollingJob = {
      notionPageId,
      soraVideoId,
      batchId,
      startedAt: new Date(),
      lastPolledAt: new Date(),
      pollCount: 0,
      maxPolls: MAX_POLL_ATTEMPTS,
    };

    this.activeJobs.set(soraVideoId, job);

    // Start polling immediately
    this.pollVideo(soraVideoId);

    // Set up interval
    const interval = setInterval(() => {
      this.pollVideo(soraVideoId);
    }, POLL_INTERVAL_MS);

    this.pollingIntervals.set(soraVideoId, interval);

    console.log(`[Poller] Started polling ${soraVideoId} (${notionPageId})`);
  }

  /**
   * Stops polling for a video
   */
  stopPolling(soraVideoId: string): void {
    const interval = this.pollingIntervals.get(soraVideoId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(soraVideoId);
    }

    this.activeJobs.delete(soraVideoId);
    console.log(`[Poller] Stopped polling ${soraVideoId}`);
  }

  /**
   * Polls Sora 2 API for video status
   */
  private async pollVideo(soraVideoId: string): Promise<void> {
    const job = this.activeJobs.get(soraVideoId);
    if (!job) return;

    job.pollCount++;
    job.lastPolledAt = new Date();

    try {
      // Call Sora 2 API (Story 2.4 integration point)
      const status = await this.fetchSoraVideoStatus(soraVideoId);

      // Send status update to webhook
      await this.sendStatusUpdate(job.notionPageId, soraVideoId, status);

      // Stop polling if terminal state reached
      if (status.status === 'completed' || status.status === 'failed') {
        console.log(`[Poller] Video ${soraVideoId} reached terminal state: ${status.status}`);
        this.stopPolling(soraVideoId);

        // Notify queue manager to advance queue (Story 2.5, AC#3)
        if (status.status === 'completed') {
          await videoGenerationQueue.onVideoComplete(job.notionPageId);

          // Queue asset download (Story 2.6, AC#1)
          console.log(`[Poller] Queueing asset download for ${soraVideoId}`);
          await assetDownloadManager.queueDownload(
            job.notionPageId,
            soraVideoId,
            job.batchId,
            new Date() // completedAt
          );
        } else {
          const errorMessage = status.error?.message || 'Video generation failed';
          await videoGenerationQueue.onVideoFailed(job.notionPageId, errorMessage);
        }
      }

      // Stop polling if max attempts reached (Story 2.5 queue advancement on timeout)
      if (job.pollCount >= job.maxPolls) {
        console.warn(`[Poller] Max poll attempts reached for ${soraVideoId}`);
        const timeoutError = `Polling timeout after ${job.maxPolls} attempts`;
        await this.sendStatusUpdate(job.notionPageId, soraVideoId, {
          video_id: soraVideoId,
          status: 'failed',
          error: {
            code: 'timeout',
            message: timeoutError,
          },
        });
        this.stopPolling(soraVideoId);

        // Notify queue manager to advance queue (Story 2.5, AC#3)
        await videoGenerationQueue.onVideoFailed(job.notionPageId, timeoutError);
      }
    } catch (error) {
      console.error(`[Poller] Error polling ${soraVideoId}:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown polling error';

      // Send error update
      await this.sendStatusUpdate(job.notionPageId, soraVideoId, {
        video_id: soraVideoId,
        status: 'failed',
        error: {
          code: 'polling_error',
          message: errorMessage,
        },
      });

      // Notify queue manager to advance queue (Story 2.5, AC#3)
      await videoGenerationQueue.onVideoFailed(job.notionPageId, errorMessage);
    }
  }

  /**
   * Fetches video status from Sora 2 API (Story 2.4 integration)
   * Uses SoraClient for real API calls or mock mode
   */
  private async fetchSoraVideoStatus(videoId: string): Promise<SoraStatusResponse> {
    try {
      return await soraClient.getVideoStatus(videoId);
    } catch (error) {
      console.error(`[Poller] Failed to fetch Sora status for ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Sends status update to webhook handler (Story 2.3, AC#5)
   */
  private async sendStatusUpdate(
    notionPageId: string,
    soraVideoId: string,
    status: SoraStatusResponse
  ): Promise<void> {
    try {
      const payload: any = {
        notionPageId,
        soraVideoId,
        status: status.status,
        progress: status.progress,
        videoUrl: status.download_url, // ✅ REAL API: Changed from video_url to download_url
      };

      // Add error if present (Story 2.3, AC#4, Story 2.4 error handling)
      if (status.error) {
        payload.error = {
          type: status.error.type === 'content_policy' ? 'compliance_failed' : 'generation_failed',
          message: status.error.message,
          details: {
            code: status.error.code,
            errorType: status.error.type,
          },
        };
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[Poller] Webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error('[Poller] Failed to send status update:', error);
    }
  }

  /**
   * Starts polling for all videos in a batch
   */
  startBatchPolling(variations: VideoVariationRecord[]): void {
    console.log(`[Poller] Starting batch polling for ${variations.length} videos`);

    for (const variation of variations) {
      if (variation.soraVideoId && variation.notionPageId) {
        this.startPolling(variation.notionPageId, variation.soraVideoId, variation.batchId);
      }
    }
  }

  /**
   * Stops polling for all videos in a batch
   */
  stopBatchPolling(batchId: string): void {
    console.log(`[Poller] Stopping batch polling for ${batchId}`);

    for (const [soraVideoId, job] of this.activeJobs.entries()) {
      if (job.batchId === batchId) {
        this.stopPolling(soraVideoId);
      }
    }
  }

  /**
   * Gets polling status for a video
   */
  getPollingStatus(soraVideoId: string): PollingJob | undefined {
    return this.activeJobs.get(soraVideoId);
  }

  /**
   * Gets all active polling jobs
   */
  getActiveJobs(): PollingJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Stops all polling jobs (cleanup)
   */
  stopAll(): void {
    console.log('[Poller] Stopping all polling jobs');

    for (const soraVideoId of this.activeJobs.keys()) {
      this.stopPolling(soraVideoId);
    }
  }
}

// Singleton instance
export const soraStatusPoller = new SoraStatusPoller();
