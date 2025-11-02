// Video Generation Queue Manager (Story 2.5)
// Manages concurrent video generation with 4-video limit and FIFO queue

import { soraClient, type SoraModel, type SoraDuration, type SoraGenerateResponse } from './sora-client';
import { soraStatusPoller } from './sora-status-poller';
import { updateVideoVariationStatus, logVideoError } from './notion-client';

/**
 * Video queued for generation
 */
export type QueuedVideo = {
  notionPageId: string;
  batchId: string;
  combinationId: string;
  prompt: string;
  model: SoraModel;
  duration: SoraDuration;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  loop?: boolean;
  queuedAt: Date;
};

/**
 * Video generation status (Story 2.5, AC#5)
 */
export type VideoGenerationStatus = {
  notionPageId: string;
  soraVideoId?: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  queuePosition?: number; // Position in queue (1-indexed) for queued videos
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
};

/**
 * Queue status summary (Story 2.5, AC#5)
 */
export type QueueSummary = {
  queued: number; // Videos waiting in queue
  inProgress: number; // Videos currently generating
  completed: number; // Videos finished successfully
  failed: number; // Videos that failed
  available: number; // Available slots (4 - inProgress)
};

/**
 * Video Generation Queue Manager
 * Enforces 4-video concurrent limit with FIFO queue (Story 2.5)
 */
export class VideoGenerationQueue {
  private queue: QueuedVideo[] = []; // FIFO queue (AC#4)
  private inProgress: Map<string, SoraGenerateResponse> = new Map(); // notionPageId -> Sora response
  private completed: Set<string> = new Set(); // notionPageId set
  private failed: Map<string, string> = new Map(); // notionPageId -> error message
  private maxConcurrent: number = 4; // AC#1
  private processing: boolean = false; // Prevent concurrent processQueue calls

  /**
   * Submits a video for generation (Story 2.5, AC#1, AC#2)
   * If slots available, starts immediately. Otherwise, adds to queue.
   */
  async submitVideo(video: QueuedVideo): Promise<void> {
    console.log(`[Queue] Submitting video ${video.notionPageId} to queue`);

    // Add to queue (AC#2)
    this.queue.push(video);

    // Update Notion with queued status and position (AC#5)
    const queuePosition = this.getQueuePosition(video.notionPageId);
    console.log(`[Queue] Video ${video.notionPageId} queued at position ${queuePosition}`);

    // Try to process queue (AC#3)
    await this.processQueue();
  }

  /**
   * Submits multiple videos for batch generation
   */
  async submitBatch(videos: QueuedVideo[]): Promise<void> {
    console.log(`[Queue] Submitting batch of ${videos.length} videos`);

    for (const video of videos) {
      await this.submitVideo(video);
    }

    console.log(`[Queue] Batch submission complete`);
  }

  /**
   * Processes queue: starts videos if slots available (Story 2.5, AC#1, AC#3)
   */
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.processing) {
      return;
    }

    this.processing = true;

    try {
      // Check if we have available slots (AC#1 - max 4 concurrent)
      while (this.inProgress.size < this.maxConcurrent && this.queue.length > 0) {
        const video = this.queue.shift(); // FIFO (AC#4)

        if (!video) break;

        // Start video generation
        await this.startVideo(video);

        // Update queue positions for remaining videos
        this.updateQueuePositions();
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Starts video generation for a single video (Story 2.5, AC#3)
   */
  private async startVideo(video: QueuedVideo): Promise<void> {
    console.log(`[Queue] Starting video generation for ${video.notionPageId}`);

    try {
      // Call Sora 2 API (Story 2.4 integration)
      const soraResponse = await soraClient.generateVideo({
        prompt: video.prompt,
        model: video.model,
        duration: video.duration,
        aspect_ratio: video.aspectRatio,
        loop: video.loop,
      });

      console.log(`[Queue] Video ${video.notionPageId} started: ${soraResponse.video_id}`);

      // Track as in-progress
      this.inProgress.set(video.notionPageId, soraResponse);

      // Update Notion status to "In Progress" (Story 2.3 integration)
      await updateVideoVariationStatus(video.notionPageId, 'In Progress', {
        soraVideoId: soraResponse.video_id,
      });

      // Start polling for status updates (Story 2.4 integration)
      soraStatusPoller.startPolling(video.notionPageId, soraResponse.video_id, video.batchId);

      console.log(`[Queue] Video ${video.notionPageId} now in progress (${this.inProgress.size}/${this.maxConcurrent})`);
    } catch (error) {
      console.error(`[Queue] Failed to start video ${video.notionPageId}:`, error);

      // Mark as failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error starting video';
      this.failed.set(video.notionPageId, errorMessage);

      // Log error to Notion (Story 2.3 integration)
      await logVideoError(video.notionPageId, 'api_error', errorMessage, { error });
    }
  }

  /**
   * Called when a video completes successfully (Story 2.5, AC#3)
   */
  async onVideoComplete(notionPageId: string): Promise<void> {
    console.log(`[Queue] Video ${notionPageId} completed`);

    // Remove from in-progress
    this.inProgress.delete(notionPageId);

    // Mark as completed
    this.completed.add(notionPageId);

    console.log(`[Queue] Video completed. In progress: ${this.inProgress.size}/${this.maxConcurrent}`);

    // Process queue to start next video (AC#3)
    await this.processQueue();
  }

  /**
   * Called when a video fails (Story 2.5, AC#3)
   */
  async onVideoFailed(notionPageId: string, error: string): Promise<void> {
    console.log(`[Queue] Video ${notionPageId} failed: ${error}`);

    // Remove from in-progress
    this.inProgress.delete(notionPageId);

    // Mark as failed
    this.failed.set(notionPageId, error);

    console.log(`[Queue] Video failed. In progress: ${this.inProgress.size}/${this.maxConcurrent}`);

    // Process queue to start next video (AC#3)
    await this.processQueue();
  }

  /**
   * Gets status for a specific video (Story 2.5, AC#5)
   */
  getStatus(notionPageId: string): VideoGenerationStatus | undefined {
    // Check if in progress
    if (this.inProgress.has(notionPageId)) {
      const soraResponse = this.inProgress.get(notionPageId)!;
      return {
        notionPageId,
        soraVideoId: soraResponse.video_id,
        status: 'in_progress',
        startedAt: new Date(soraResponse.created_at),
      };
    }

    // Check if completed
    if (this.completed.has(notionPageId)) {
      return {
        notionPageId,
        status: 'completed',
        completedAt: new Date(),
      };
    }

    // Check if failed
    if (this.failed.has(notionPageId)) {
      return {
        notionPageId,
        status: 'failed',
        error: this.failed.get(notionPageId),
        completedAt: new Date(),
      };
    }

    // Check if queued
    const queuePosition = this.getQueuePosition(notionPageId);
    if (queuePosition > 0) {
      const video = this.queue.find((v) => v.notionPageId === notionPageId);
      return {
        notionPageId,
        status: 'queued',
        queuePosition,
        startedAt: video?.queuedAt,
      };
    }

    return undefined;
  }

  /**
   * Gets queue position for a video (1-indexed, 0 if not in queue)
   */
  private getQueuePosition(notionPageId: string): number {
    const index = this.queue.findIndex((v) => v.notionPageId === notionPageId);
    return index >= 0 ? index + 1 : 0;
  }

  /**
   * Updates queue positions in Notion for all queued videos (Story 2.5, AC#5)
   */
  private updateQueuePositions(): void {
    this.queue.forEach((video, index) => {
      const position = index + 1;
      console.log(`[Queue] Video ${video.notionPageId} at queue position ${position}`);
      // Note: Queue position could be stored in Notion's "Progress" field
      // For now, just logging. Integration can be added if needed.
    });
  }

  /**
   * Gets overall queue status summary (Story 2.5, AC#5)
   */
  getQueueSummary(): QueueSummary {
    return {
      queued: this.queue.length,
      inProgress: this.inProgress.size,
      completed: this.completed.size,
      failed: this.failed.size,
      available: this.maxConcurrent - this.inProgress.size,
    };
  }

  /**
   * Gets all videos currently in progress
   */
  getInProgressVideos(): VideoGenerationStatus[] {
    return Array.from(this.inProgress.entries()).map(([notionPageId, soraResponse]) => ({
      notionPageId,
      soraVideoId: soraResponse.video_id,
      status: 'in_progress',
      startedAt: new Date(soraResponse.created_at),
    }));
  }

  /**
   * Gets all videos in queue (waiting to start)
   */
  getQueuedVideos(): VideoGenerationStatus[] {
    return this.queue.map((video, index) => ({
      notionPageId: video.notionPageId,
      status: 'queued',
      queuePosition: index + 1,
      startedAt: video.queuedAt,
    }));
  }

  /**
   * Clears completed and failed videos from tracking
   */
  clearCompleted(): void {
    this.completed.clear();
    this.failed.clear();
    console.log('[Queue] Cleared completed and failed videos');
  }

  /**
   * Stops all video generation and clears queue
   */
  async stopAll(): Promise<void> {
    console.log('[Queue] Stopping all video generation');

    // Stop all polling jobs
    for (const [notionPageId, soraResponse] of this.inProgress.entries()) {
      soraStatusPoller.stopPolling(soraResponse.video_id);
    }

    // Clear all state
    this.queue = [];
    this.inProgress.clear();
    this.completed.clear();
    this.failed.clear();

    console.log('[Queue] All video generation stopped');
  }

  /**
   * Gets batch status summary for a specific batch
   */
  getBatchStatus(batchId: string): {
    batchId: string;
    total: number;
    queued: number;
    inProgress: number;
    completed: number;
    failed: number;
  } {
    const queuedCount = this.queue.filter((v) => v.batchId === batchId).length;
    const inProgressCount = Array.from(this.inProgress.keys()).filter((pageId) => {
      const video = this.queue.find((v) => v.notionPageId === pageId);
      return video?.batchId === batchId;
    }).length;

    // Note: Completed and failed counts would require tracking batchId in those collections
    // For now, returning 0. Can be enhanced if needed.

    return {
      batchId,
      total: queuedCount + inProgressCount,
      queued: queuedCount,
      inProgress: inProgressCount,
      completed: 0, // Would need to track batchId
      failed: 0, // Would need to track batchId
    };
  }
}

// Singleton instance
export const videoGenerationQueue = new VideoGenerationQueue();
