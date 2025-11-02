/**
 * Cost Calculation Engine (Story 1.5, Task 1)
 *
 * Calculates per-video and batch costs with breakdown by provider
 * NO MOCK DATA - uses real API pricing from pricing-config.ts
 */

import {
  getSoraCost,
  estimateStorageCost,
  LLM_COSTS,
  isPricingStale,
  type SoraModel,
  type VideoDuration,
} from './pricing-config';

/**
 * Cost breakdown by API provider
 * Enables per-provider wallet balance validation (AC#6)
 */
export type ProviderCosts = {
  openai: number;      // Sora 2 API + GPT-5 prompts
  anthropic: number;   // Claude validation
  google: number;      // Gemini fallback
  perplexity: number;  // Research queries (cached)
};

/**
 * Itemized cost breakdown for a single video
 */
export type VideoCostBreakdown = {
  soraApiCost: number;
  llmCosts: {
    gpt5: number;
    perplexity: number;
    claude: number;
    gemini: number;
    total: number;
  };
  storageCost: number;
  totalPerVideo: number;
};

/**
 * Complete batch cost result
 */
export type CostResult = {
  // Video configuration
  model: SoraModel;
  duration: VideoDuration;
  videoCount: number;

  // Per-video breakdown
  perVideoCost: VideoCostBreakdown;

  // Batch totals
  totalBatchCost: number;
  soraApiSubtotal: number;
  llmSubtotal: number;
  storageSubtotal: number;

  // Provider attribution for wallet validation
  providerCosts: ProviderCosts;

  // Warnings
  pricingStale: boolean;
};

/**
 * Calculate cost for a single video
 * AC#1: System calculates per-video costs
 */
export function calculateVideoCost(
  model: SoraModel,
  duration: VideoDuration
): VideoCostBreakdown {
  // Sora 2 API cost (throws error if invalid combination)
  const soraApiCost = getSoraCost(model, duration);

  // LLM costs per video
  const llmCosts = {
    gpt5: LLM_COSTS.gpt5PromptGeneration,
    perplexity: 0, // Calculated at batch level (cached)
    claude: LLM_COSTS.claudeValidation,
    gemini: 0, // Only used conditionally as fallback
    total: LLM_COSTS.gpt5PromptGeneration + LLM_COSTS.claudeValidation,
  };

  // Storage cost (negligible but included for transparency)
  const storageCost = estimateStorageCost(duration);

  // Total per-video cost
  const totalPerVideo = soraApiCost + llmCosts.total + storageCost;

  return {
    soraApiCost,
    llmCosts,
    storageCost,
    totalPerVideo,
  };
}

/**
 * Calculate batch cost with provider attribution
 * AC#1, AC#2, AC#6: Calculate total batch cost and break down by provider
 */
export function calculateBatchCost(
  model: SoraModel,
  duration: VideoDuration,
  videoCount: number
): CostResult {
  // Per-video cost calculation
  const perVideoCost = calculateVideoCost(model, duration);

  // Batch subtotals
  const soraApiSubtotal = perVideoCost.soraApiCost * videoCount;
  const llmSubtotal = perVideoCost.llmCosts.total * videoCount + LLM_COSTS.perplexityResearch;
  const storageSubtotal = perVideoCost.storageCost * videoCount;

  // Total batch cost
  const totalBatchCost = soraApiSubtotal + llmSubtotal + storageSubtotal;

  // Provider cost attribution (AC#6)
  // This breakdown enables per-provider wallet validation
  const providerCosts: ProviderCosts = {
    // OpenAI: Sora 2 API + GPT-5 prompts
    openai: soraApiSubtotal + (LLM_COSTS.gpt5PromptGeneration * videoCount),

    // Anthropic: Claude validation
    anthropic: LLM_COSTS.claudeValidation * videoCount,

    // Google: Gemini fallback (conditional, set to 0 if not used)
    google: 0,

    // Perplexity: Research queries (cached across batch)
    perplexity: LLM_COSTS.perplexityResearch,
  };

  // Check pricing staleness (Task 5)
  const pricingStale = isPricingStale();

  return {
    model,
    duration,
    videoCount,
    perVideoCost,
    totalBatchCost,
    soraApiSubtotal,
    llmSubtotal,
    storageSubtotal,
    providerCosts,
    pricingStale,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/**
 * Format cost summary for display
 * AC#2: Total batch cost displayed prominently (e.g., "$102 for 12 videos")
 */
export function formatCostSummary(costResult: CostResult): string {
  return `${formatCurrency(costResult.totalBatchCost)} for ${costResult.videoCount} video${costResult.videoCount === 1 ? '' : 's'}`;
}

/**
 * Calculate per-video average for display
 * AC#2: Show per-video average cost
 */
export function formatPerVideoAverage(costResult: CostResult): string {
  const average = costResult.totalBatchCost / costResult.videoCount;
  return `${formatCurrency(average)} per video`;
}
