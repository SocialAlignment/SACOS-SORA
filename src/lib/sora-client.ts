// Sora 2 API Client (Story 2.4)
// Asynchronous video generation with OpenAI Sora 2 API

/**
 * Sora 2 API Types
 */
export type SoraModel = 'sora-2' | 'sora-2-pro';

export type SoraDuration = 5 | 10 | 20; // seconds - REAL Sora 2 API values (Story 2.4, AC#6)

export type SoraVideoStatus = 'queued' | 'in_progress' | 'completed' | 'failed'; // (Story 2.4, AC#5)

/**
 * Request to generate a video (Story 2.4, AC#1)
 * ✅ REAL OpenAI Sora 2 API parameters (verified from 1-sora-quickstart.py)
 */
export type SoraGenerateRequest = {
  prompt: string;
  model: SoraModel;
  seconds: string; // ✅ REAL API: "5", "10", or "20" (string, not number)
  size?: string; // ✅ REAL API: Pixel dimensions like "720x1280", "1280x720", "1024x1024"
};

/**
 * Response from POST /videos (Story 2.4, AC#2)
 */
export type SoraGenerateResponse = {
  video_id: string; // Unique video identifier
  status: SoraVideoStatus; // Initial status (usually 'queued')
  model: SoraModel;
  duration: number;
  prompt: string;
  created_at: string; // ISO timestamp
};

/**
 * Response from GET /videos/{video_id} (Story 2.4, AC#3)
 * ✅ REAL OpenAI Sora 2 API response fields (verified from 1-sora-quickstart.py)
 */
export type SoraStatusResponse = {
  video_id: string;
  status: SoraVideoStatus;
  progress?: number; // 0-100 percentage when status = in_progress (Story 2.4, AC#4)
  model: SoraModel;
  duration: number;
  prompt: string;
  download_url?: string; // ✅ REAL API: Available when status = completed (NOT video_url)
  thumbnail_url?: string; // Thumbnail preview
  spritesheet_url?: string; // Frame-by-frame preview
  error?: {
    code: string;
    message: string;
    type: 'content_policy' | 'api_error' | 'generation_failed' | 'timeout';
  };
  created_at: string;
  completed_at?: string; // ISO timestamp when completed
};

/**
 * Sora 2 API Error
 */
export class SoraAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SoraAPIError';
  }
}

/**
 * Sora 2 API Client
 * Handles async video generation with OpenAI Sora 2 API
 */
export class SoraClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = baseUrl || process.env.SORA_API_BASE_URL || 'https://api.openai.com/v1/sora';

    if (!this.apiKey) {
      throw new SoraAPIError(
        'OPENAI_API_KEY is required for Sora video generation. Please set it in your .env.local file.',
        401,
        'missing_api_key'
      );
    }
  }

  /**
   * Generates a new video (Story 2.4, AC#1)
   * POST /videos
   */
  async generateVideo(request: SoraGenerateRequest): Promise<SoraGenerateResponse> {
    try {
      console.log(`[Sora Client] Generating video with ${request.model} (${request.seconds}s)`);

      // ✅ REAL API request body (verified from 1-sora-quickstart.py)
      const requestBody: any = {
        model: request.model,
        prompt: request.prompt,
        seconds: request.seconds, // ✅ REAL API: string like "5", "10", "20"
      };

      // Add size if provided (optional parameter)
      if (request.size) {
        requestBody.size = request.size; // ✅ REAL API: pixel dimensions like "720x1280"
      }

      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SoraAPIError(
          errorData.error?.message || `Sora API error: ${response.status}`,
          response.status,
          errorData.error?.code,
          errorData
        );
      }

      const data: SoraGenerateResponse = await response.json();

      console.log(`[Sora Client] Video queued: ${data.video_id} (status: ${data.status})`);

      return data;
    } catch (error) {
      if (error instanceof SoraAPIError) {
        throw error;
      }

      console.error('[Sora Client] Generate video failed:', error);
      throw new SoraAPIError(
        error instanceof Error ? error.message : 'Unknown error generating video',
        undefined,
        'network_error',
        error
      );
    }
  }

  /**
   * Gets video status (Story 2.4, AC#3)
   * GET /videos/{video_id}
   */
  async getVideoStatus(videoId: string): Promise<SoraStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SoraAPIError(
          errorData.error?.message || `Failed to get video status: ${response.status}`,
          response.status,
          errorData.error?.code,
          errorData
        );
      }

      const data: SoraStatusResponse = await response.json();

      console.log(
        `[Sora Client] Video ${videoId} status: ${data.status}${data.progress ? ` (${data.progress}%)` : ''}`
      );

      return data;
    } catch (error) {
      if (error instanceof SoraAPIError) {
        throw error;
      }

      console.error(`[Sora Client] Get status failed for ${videoId}:`, error);
      throw new SoraAPIError(
        error instanceof Error ? error.message : 'Unknown error getting video status',
        undefined,
        'network_error',
        error
      );
    }
  }

  /**
   * Downloads video content (Story 2.6 integration point)
   * GET /videos/{video_id}/content
   */
  async downloadVideo(
    videoId: string,
    variant: 'video' | 'thumbnail' | 'spritesheet' = 'video'
  ): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (variant !== 'video') {
        params.append('variant', variant);
      }

      const url = `${this.baseUrl}/videos/${videoId}/content${params.toString() ? `?${params.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new SoraAPIError(
          `Failed to download ${variant}: ${response.status}`,
          response.status,
          'download_failed'
        );
      }

      return await response.blob();
    } catch (error) {
      console.error(`[Sora Client] Download failed for ${videoId}:`, error);
      throw error instanceof SoraAPIError
        ? error
        : new SoraAPIError('Unknown download error', undefined, 'download_error');
    }
  }

  /**
   * Validates duration for model (Story 2.4, AC#6)
   */
  validateDuration(model: SoraModel, duration: SoraDuration): boolean {
    // All durations supported by both models currently
    const validDurations: SoraDuration[] = [5, 10, 20];
    return validDurations.includes(duration);
  }

  /**
   * Gets estimated cost for video generation
   */
  getEstimatedCost(model: SoraModel, duration: SoraDuration): number {
    // Pricing based on OpenAI rate cards
    const baseCost = model === 'sora-2-pro' ? 12 : 5;

    // Duration multiplier (longer videos cost more)
    const durationMultiplier = duration / 10; // Baseline 10s

    return parseFloat((baseCost * durationMultiplier).toFixed(2));
  }

  /**
   * Checks if API is configured (has API key)
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
export const soraClient = new SoraClient();
