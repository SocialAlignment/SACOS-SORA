// Asset Download and Storage System (Story 2.6)
// Downloads MP4, thumbnail, spritesheet within 1-hour window with versioning
// Enhanced with multi-backend storage support (local, NAS, Google Drive)

import { soraClient } from './sora-client';
import { updateVideoVariationStatus, logVideoError } from './notion-client';
import { StorageAdapter, createStorageAdapter, StoredFile } from './storage-adapters';
import path from 'path';

/**
 * Asset types to download (Story 2.6, AC#1-3)
 */
export type AssetType = 'video' | 'thumbnail' | 'spritesheet';

/**
 * Downloaded asset metadata
 */
export type DownloadedAsset = StoredFile & {
  type: AssetType;
  version: number;
};

/**
 * Download job tracking (Story 2.6, AC#6)
 */
export type DownloadJob = {
  notionPageId: string;
  soraVideoId: string;
  batchId: string;
  completedAt: Date; // When video completed generation
  expiresAt: Date; // 1-hour expiration (completedAt + 1 hour)
  downloadedAssets: DownloadedAsset[];
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'expired';
  retryCount: number;
  maxRetries: number;
  error?: string;
};

/**
 * Download status summary
 */
export type DownloadSummary = {
  pending: number;
  downloading: number;
  completed: number;
  failed: number;
  expired: number;
  approachingExpiration: number; // <10 minutes remaining
};

const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const EXPIRATION_WARNING_MS = 10 * 60 * 1000; // 10 minutes before expiration
const MAX_RETRY_ATTEMPTS = 3; // Story 2.6 retry logic

/**
 * Asset Download Manager
 * Manages downloads within 1-hour window with versioning (Story 2.6)
 * Enhanced with multi-backend storage support (local, NAS, Google Drive)
 */
export class AssetDownloadManager {
  private downloadJobs: Map<string, DownloadJob> = new Map(); // notionPageId -> job
  private storage: StorageAdapter;
  private expirationCheckInterval?: NodeJS.Timeout;

  constructor(storage?: StorageAdapter) {
    // Use provided storage adapter or create one from environment config
    this.storage = storage || createStorageAdapter();

    // Start expiration checker (Story 2.6, AC#6)
    this.startExpirationChecker();
  }

  /**
   * Queues a video for download when it completes (Story 2.6, AC#1)
   */
  async queueDownload(
    notionPageId: string,
    soraVideoId: string,
    batchId: string,
    completedAt: Date
  ): Promise<void> {
    console.log(`[Download Manager] Queueing download for ${soraVideoId}`);

    const expiresAt = new Date(completedAt.getTime() + ONE_HOUR_MS);

    const job: DownloadJob = {
      notionPageId,
      soraVideoId,
      batchId,
      completedAt,
      expiresAt,
      downloadedAssets: [],
      status: 'pending',
      retryCount: 0,
      maxRetries: MAX_RETRY_ATTEMPTS,
    };

    this.downloadJobs.set(notionPageId, job);

    // Start download immediately (AC#1)
    await this.startDownload(notionPageId);
  }

  /**
   * Starts downloading all assets for a video (Story 2.6, AC#1-3)
   */
  private async startDownload(notionPageId: string): Promise<void> {
    const job = this.downloadJobs.get(notionPageId);
    if (!job) return;

    // Check if expired (AC#6)
    if (this.isExpired(job)) {
      console.warn(`[Download Manager] Download window expired for ${job.soraVideoId}`);
      job.status = 'expired';
      job.error = 'Download window expired (>1 hour since completion)';

      // Log error to Notion
      await logVideoError(
        notionPageId,
        'download_failed',
        job.error,
        { soraVideoId: job.soraVideoId, expiresAt: job.expiresAt }
      );
      return;
    }

    job.status = 'downloading';
    console.log(`[Download Manager] Starting download for ${job.soraVideoId}`);

    try {
      // Determine version number (AC#4 - versioning)
      const version = await this.getNextVersion(job.batchId, job.soraVideoId);

      // Download all three assets (AC#1-3)
      const videoAsset = await this.downloadAsset(job, 'video', version);
      const thumbnailAsset = await this.downloadAsset(job, 'thumbnail', version);
      const spritesheetAsset = await this.downloadAsset(job, 'spritesheet', version);

      // Store asset metadata
      job.downloadedAssets = [videoAsset, thumbnailAsset, spritesheetAsset];
      job.status = 'completed';

      console.log(`[Download Manager] Download completed for ${job.soraVideoId}`);

      // Update Notion with file paths/URLs (AC#5)
      await this.updateNotionWithAssets(job);
    } catch (error) {
      console.error(`[Download Manager] Download failed for ${job.soraVideoId}:`, error);

      job.retryCount++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';

      // Retry logic (Story 2.6 retry)
      if (job.retryCount < job.maxRetries && !this.isExpired(job)) {
        console.log(`[Download Manager] Retrying download (${job.retryCount}/${job.maxRetries})`);
        job.status = 'pending';

        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, job.retryCount - 1) * 1000;
        setTimeout(() => this.startDownload(notionPageId), delayMs);
      } else {
        job.status = 'failed';
        job.error = errorMessage;

        // Log error to Notion
        await logVideoError(notionPageId, 'download_failed', errorMessage, {
          soraVideoId: job.soraVideoId,
          retryCount: job.retryCount,
        });
      }
    }
  }

  /**
   * Downloads a single asset (video, thumbnail, or spritesheet)
   */
  private async downloadAsset(
    job: DownloadJob,
    assetType: AssetType,
    version: number
  ): Promise<DownloadedAsset> {
    console.log(`[Download Manager] Downloading ${assetType} for ${job.soraVideoId}`);

    // Call Sora 2 API to download asset (Story 2.4 integration, AC#1-3)
    const blob = await soraClient.downloadVideo(job.soraVideoId, assetType);

    // Generate file name with version (AC#4)
    const fileName = this.generateFileName(job.soraVideoId, assetType, version);
    const relativePath = path.join(job.batchId, fileName);

    // Convert blob to buffer
    const buffer = Buffer.from(await blob.arrayBuffer());

    // Save using storage adapter
    const storedFile = await this.storage.saveFile(relativePath, buffer);

    console.log(`[Download Manager] Saved ${assetType} to storage (${storedFile.backend})`);

    return {
      ...storedFile,
      type: assetType,
      version,
    };
  }

  /**
   * Generates file name with version (Story 2.6, AC#4)
   */
  private generateFileName(soraVideoId: string, assetType: AssetType, version: number): string {
    const extensions = {
      video: 'mp4',
      thumbnail: 'webp',
      spritesheet: 'jpg',
    };

    const ext = extensions[assetType];
    return `${soraVideoId}_V${version}${assetType === 'video' ? '' : `_${assetType}`}.${ext}`;
  }

  /**
   * Gets next version number for a video (AC#4 - versioning)
   */
  private async getNextVersion(batchId: string, soraVideoId: string): Promise<number> {
    try {
      // List files in batch directory using storage adapter
      const files = await this.storage.listFiles(batchId);

      // Find highest version number for this video
      const versionRegex = new RegExp(`${soraVideoId}_V(\\d+)`);
      let maxVersion = 0;

      for (const file of files) {
        const match = file.match(versionRegex);
        if (match) {
          const version = parseInt(match[1]);
          if (version > maxVersion) {
            maxVersion = version;
          }
        }
      }

      return maxVersion + 1; // Next version
    } catch (error) {
      // Directory doesn't exist or is empty, start at V1
      return 1;
    }
  }

  /**
   * Updates Notion record with asset file paths/URLs (Story 2.6, AC#5)
   */
  private async updateNotionWithAssets(job: DownloadJob): Promise<void> {
    console.log(`[Download Manager] Updating Notion with asset URLs for ${job.notionPageId}`);

    try {
      // Get video asset URL from storage adapter
      const videoAsset = job.downloadedAssets.find((a) => a.type === 'video');
      const videoUrl = videoAsset?.url;

      // Update Notion (Story 2.3 integration, AC#5)
      await updateVideoVariationStatus(job.notionPageId, 'Completed', {
        videoUrl,
      });

      console.log(`[Download Manager] Notion updated with video URL: ${videoUrl}`);
    } catch (error) {
      console.error(`[Download Manager] Failed to update Notion:`, error);
      throw error;
    }
  }

  /**
   * Checks if download job is expired (Story 2.6, AC#6)
   */
  private isExpired(job: DownloadJob): boolean {
    return Date.now() > job.expiresAt.getTime();
  }

  /**
   * Checks if download job is approaching expiration (<10 minutes) (AC#6)
   */
  private isApproachingExpiration(job: DownloadJob): boolean {
    const timeRemaining = job.expiresAt.getTime() - Date.now();
    return timeRemaining > 0 && timeRemaining < EXPIRATION_WARNING_MS;
  }

  /**
   * Starts periodic expiration checker (Story 2.6, AC#6)
   */
  private startExpirationChecker(): void {
    // Check every 5 minutes
    this.expirationCheckInterval = setInterval(() => {
      this.checkExpirations();
    }, 5 * 60 * 1000);
  }

  /**
   * Checks for expired or expiring downloads (Story 2.6, AC#6)
   */
  private checkExpirations(): void {
    for (const [notionPageId, job] of this.downloadJobs.entries()) {
      if (job.status === 'pending' || job.status === 'downloading') {
        if (this.isExpired(job)) {
          console.warn(`[Download Manager] Download EXPIRED for ${job.soraVideoId}`);
          job.status = 'expired';
          job.error = 'Download window expired (>1 hour since completion)';

          // Log to Notion
          logVideoError(
            notionPageId,
            'download_failed',
            job.error,
            { soraVideoId: job.soraVideoId, expiresAt: job.expiresAt }
          );
        } else if (this.isApproachingExpiration(job)) {
          const minutesRemaining = Math.floor(
            (job.expiresAt.getTime() - Date.now()) / (60 * 1000)
          );
          console.warn(
            `[Download Manager] Download EXPIRING SOON for ${job.soraVideoId} (${minutesRemaining} minutes remaining)`
          );

          // Could send alert/notification here
        }
      }
    }
  }

  /**
   * Gets download status for a specific video
   */
  getDownloadStatus(notionPageId: string): DownloadJob | undefined {
    return this.downloadJobs.get(notionPageId);
  }

  /**
   * Gets download summary
   */
  getDownloadSummary(): DownloadSummary {
    let pending = 0;
    let downloading = 0;
    let completed = 0;
    let failed = 0;
    let expired = 0;
    let approachingExpiration = 0;

    for (const job of this.downloadJobs.values()) {
      switch (job.status) {
        case 'pending':
          pending++;
          break;
        case 'downloading':
          downloading++;
          break;
        case 'completed':
          completed++;
          break;
        case 'failed':
          failed++;
          break;
        case 'expired':
          expired++;
          break;
      }

      if (
        (job.status === 'pending' || job.status === 'downloading') &&
        this.isApproachingExpiration(job)
      ) {
        approachingExpiration++;
      }
    }

    return {
      pending,
      downloading,
      completed,
      failed,
      expired,
      approachingExpiration,
    };
  }

  /**
   * Gets all pending downloads
   */
  getPendingDownloads(): DownloadJob[] {
    return Array.from(this.downloadJobs.values()).filter((job) => job.status === 'pending');
  }

  /**
   * Gets all downloads approaching expiration
   */
  getExpiringDownloads(): DownloadJob[] {
    return Array.from(this.downloadJobs.values()).filter(
      (job) =>
        (job.status === 'pending' || job.status === 'downloading') &&
        this.isApproachingExpiration(job)
    );
  }

  /**
   * Retries a failed download
   */
  async retryDownload(notionPageId: string): Promise<void> {
    const job = this.downloadJobs.get(notionPageId);
    if (!job) {
      throw new Error(`Download job not found for ${notionPageId}`);
    }

    if (job.status !== 'failed') {
      throw new Error(`Cannot retry download with status: ${job.status}`);
    }

    if (this.isExpired(job)) {
      throw new Error('Cannot retry expired download');
    }

    console.log(`[Download Manager] Manual retry for ${job.soraVideoId}`);
    job.status = 'pending';
    job.retryCount = 0; // Reset retry count for manual retry
    job.error = undefined;

    await this.startDownload(notionPageId);
  }

  /**
   * Clears completed downloads from tracking
   */
  clearCompleted(): void {
    for (const [notionPageId, job] of this.downloadJobs.entries()) {
      if (job.status === 'completed') {
        this.downloadJobs.delete(notionPageId);
      }
    }
    console.log('[Download Manager] Cleared completed downloads');
  }

  /**
   * Stops expiration checker and clears all jobs
   */
  stop(): void {
    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = undefined;
    }
    this.downloadJobs.clear();
    console.log('[Download Manager] Stopped');
  }
}

// Singleton instance
export const assetDownloadManager = new AssetDownloadManager();
