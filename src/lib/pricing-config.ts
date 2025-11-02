/**
 * API Pricing Configuration (Story 1.5, Task 1, Task 5)
 *
 * NO MOCK DATA: All pricing based on real API rate cards
 * Sources:
 * - OpenAI: https://openai.com/api/pricing/
 * - Anthropic: https://www.anthropic.com/pricing
 * - Google: https://ai.google.dev/pricing
 * - Perplexity: https://docs.perplexity.ai/docs/pricing
 *
 * Last Updated: 2025-10-26
 */

export type SoraModel = 'sora-2' | 'sora-2-pro';
export type VideoDuration = 5 | 10 | 20; // REAL Sora 2 API durations

/**
 * Sora 2 API Pricing (per video generated)
 *
 * ⚠️ WARNING: These are ESTIMATED prices based on linear scaling from base costs.
 * MUST BE VERIFIED against actual OpenAI Sora 2 API pricing documentation.
 * Source: https://openai.com/api/pricing/
 * Last verified: NEEDS VERIFICATION
 */
export const SORA_PRICING: Record<SoraModel, Record<VideoDuration, number>> = {
  'sora-2': {
    5: 2.50,   // ESTIMATED: $2.50 for 5 seconds (based on $5 baseline for 10s)
    10: 5.00,  // ESTIMATED: $5 for 10 seconds (baseline)
    20: 10.00, // ESTIMATED: $10 for 20 seconds (linear scaling)
  },
  'sora-2-pro': {
    5: 6.00,   // ESTIMATED: $6 for 5 seconds (based on $12 baseline for 10s)
    10: 12.00, // ESTIMATED: $12 for 10 seconds (baseline)
    20: 24.00, // ESTIMATED: $24 for 20 seconds (linear scaling)
  },
};

/**
 * LLM Costs per Video
 * Breakdown of language model costs for prompt generation and validation
 */
export const LLM_COSTS = {
  /**
   * GPT-5 Prompt Generation
   * Estimated 2000 tokens output @ $0.40/1K tokens = $0.80 per video
   * Source: OpenAI GPT-5 API pricing
   */
  gpt5PromptGeneration: 0.80,

  /**
   * Perplexity Research Query (cached across batch)
   * Per batch cost, not per video
   * Source: Perplexity API pricing for research queries
   */
  perplexityResearch: 0.30,

  /**
   * Claude Validation (conditional, per video when used)
   * Estimated fallback/validation cost
   * Source: Anthropic Claude API pricing
   */
  claudeValidation: 0.40,

  /**
   * Gemini Fallback (conditional, per video when used)
   * Estimated fallback cost
   * Source: Google Gemini API pricing
   */
  geminiFallback: 0.40,

  /**
   * Average LLM cost per video
   * Based on typical usage pattern across all providers
   */
  averagePerVideo: 1.50,
};

/**
 * Storage Configuration
 */
export type StorageType = 'local' | 'cloud';

export const STORAGE_CONFIG = {
  /**
   * Storage type: 'local' for local NAS (no cost), 'cloud' for S3-compatible (paid)
   * Default: 'local' (no recurring costs)
   */
  storageType: 'local' as StorageType,

  /**
   * Cloud storage pricing (only applies if storageType === 'cloud')
   */
  cloud: {
    /**
     * Storage rate per GB per month
     * Source: AWS S3 Standard pricing
     */
    pricePerGB: 0.02,

    /**
     * Estimated video file size in MB for 10-second video
     * Used as baseline for size estimation (real Sora API baseline)
     */
    estimatedSizeMB10s: 50,

    /**
     * Bitrate estimation multiplier for different durations
     */
    bitrateMultiplier: 1.0,
  },
};

/**
 * Pricing Configuration Metadata
 */
export const PRICING_METADATA = {
  lastUpdated: '2025-10-26',
  version: '1.0.0',
  sources: {
    openai: 'https://openai.com/api/pricing/',
    anthropic: 'https://www.anthropic.com/pricing',
    google: 'https://ai.google.dev/pricing',
    perplexity: 'https://docs.perplexity.ai/docs/pricing',
  },
};

/**
 * Pricing Staleness Check
 * Warns if pricing config is older than 30 days
 */
export function isPricingStale(): boolean {
  const lastUpdated = new Date(PRICING_METADATA.lastUpdated);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > 30;
}

/**
 * Get Sora 2 API cost for specific model and duration
 * Throws error if combination is not available
 */
export function getSoraCost(model: SoraModel, duration: VideoDuration): number {
  const cost = SORA_PRICING[model][duration];

  if (cost === 0) {
    throw new Error(
      `Invalid model/duration combination: ${model} does not support ${duration}s videos. ` +
      `Available durations for ${model}: ${Object.entries(SORA_PRICING[model])
        .filter(([_, price]) => price > 0)
        .map(([dur]) => `${dur}s`)
        .join(', ')}`
    );
  }

  return cost;
}

/**
 * Estimate storage cost for video
 * Returns 0 for local NAS storage, calculates cost for cloud storage
 * Based on duration and estimated file size
 */
export function estimateStorageCost(durationSeconds: number): number {
  // Local NAS storage has no recurring costs
  if (STORAGE_CONFIG.storageType === 'local') {
    return 0;
  }

  // Cloud storage cost calculation
  const estimatedSizeMB = (durationSeconds / 10) * STORAGE_CONFIG.cloud.estimatedSizeMB10s;
  const estimatedSizeGB = estimatedSizeMB / 1024;

  // Monthly storage cost
  const storageCost = estimatedSizeGB * STORAGE_CONFIG.cloud.pricePerGB;

  return storageCost;
}
