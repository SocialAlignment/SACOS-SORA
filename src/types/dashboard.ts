export type DashboardFormData = {
  // PROJECT SETUP
  brand: string;
  productCategory?: string; // Optional product category for Perplexity trend research
  productImage?: File | null;
  bigIdea: string;
  funnelLevel: string[]; // Multi-select

  // CREATIVE DIRECTION
  aesthetic: string[]; // Multi-select
  animationStyle?: string[]; // Conditional on aesthetic
  type: string[]; // Multi-select
  intention: string[]; // Multi-select
  mood: string[]; // Multi-select

  // VISUAL & AUDIO MESSAGING
  visualMessaging: string;
  audioMessaging: string;
  audioStyle: string[]; // Dialog and/or VO
  heroVoDescription?: string; // Conditional on VO
  matchDemographic?: boolean; // Conditional on VO

  // POST-PRODUCTION ASSETS
  hookVideo?: File | null;
  ctaVideo?: File | null;
  watermark?: File | null;

  // GENERATION SETTINGS
  music: boolean;
  sfx: boolean;
  ost: boolean;
  soraModel: 'sora-2' | 'sora-2-pro';
  videoDuration: 5 | 10 | 20;

  // DEMOGRAPHICS
  ageGeneration: string[]; // Multi-select
  gender: string[]; // Multi-select
  orientation: string[]; // Multi-select
  lifeStage: string[]; // Multi-select
  ethnicity: string[]; // Multi-select
  lifestyle: string;

  // BATCH SUBMISSION METADATA (Story 1.7)
  batchId?: string;
  submittedAt?: string; // ISO timestamp
  activeCombinations?: number;
  excludedCombinationIds?: string[];
  brandCanon?: import('@/types/brand-canon').BrandCanon | null;
  costEstimate?: CostResult;
};

// Matrix Calculator Types (Story 1.4)
export type MatrixDimension = {
  label: string;
  count: number;
  selections: string[];
};

export type MatrixWarning = {
  type: 'large_batch' | 'conflict';
  severity: 'critical' | 'info';
  message: string;
  details?: string;
};

export type VideoCombination = {
  funnelLevel: string;
  aesthetic: string;
  type: string;
  intention: string;
  mood: string;
  audioStyle: string;
  ageGeneration: string;
  gender: string;
  orientation: string;
  lifeStage: string;
  ethnicity: string;
};

export type MatrixResult = {
  totalCombinations: number;
  dimensions: MatrixDimension[];
  equation: string;
  warnings: MatrixWarning[];
  combinations: VideoCombination[];
};

// Cost Calculator Types (Story 1.5)
export type ProviderCosts = {
  openai: number;      // Sora 2 API + GPT-5 prompts
  anthropic: number;   // Claude validation
  google: number;      // Gemini fallback
  perplexity: number;  // Research queries (cached)
};

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

export type CostResult = {
  // Video configuration
  model: 'sora-2' | 'sora-2-pro';
  duration: 5 | 10 | 20;
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

// Wallet Balance Types (Story 1.5)
export type ApiProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export type ProviderBalance = {
  provider: ApiProvider;
  balance: number;
  currency: string;
  lastChecked: Date;
};

export type ProviderValidation = {
  provider: ApiProvider;
  required: number;
  available: number;
  sufficient: boolean;
  shortfall: number;
};

export type WalletValidationResult = {
  allSufficient: boolean;
  validations: ProviderValidation[];
  insufficientProviders: ApiProvider[];
  totalRequired: number;
  totalAvailable: number;
};
