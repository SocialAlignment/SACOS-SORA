/**
 * API Wallet Balance Validation (Story 1.5, Task 7)
 *
 * Multi-provider balance checking to prevent mid-generation failures
 * Enables client rate limiting by validating before batch approval
 *
 * AC#6: System checks API wallet balance and blocks generation if insufficient funds
 */

import { type ProviderCosts } from './cost-calculator';

/**
 * API Provider identifiers
 */
export type ApiProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

/**
 * Wallet balance for a single provider
 */
export type ProviderBalance = {
  provider: ApiProvider;
  balance: number;
  currency: string;
  lastChecked: Date;
};

/**
 * Balance validation result for a single provider
 */
export type ProviderValidation = {
  provider: ApiProvider;
  required: number;
  available: number;
  sufficient: boolean;
  shortfall: number; // 0 if sufficient, otherwise (required - available)
};

/**
 * Complete wallet validation result
 */
export type WalletValidationResult = {
  allSufficient: boolean;
  validations: ProviderValidation[];
  insufficientProviders: ApiProvider[];
  totalRequired: number;
  totalAvailable: number;
};

/**
 * Get wallet balance for OpenAI
 * Calls: GET /v1/organization/billing/balance
 *
 * NOTE: This is a placeholder for actual API integration
 * Implementation requires OpenAI SDK and API key
 */
export async function getOpenAIBalance(): Promise<ProviderBalance> {
  // TODO: Implement actual OpenAI billing API call
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const response = await openai.billing.balance();

  // For now, throw error to enforce explicit implementation
  throw new Error(
    'OpenAI balance check not implemented. ' +
    'Implement getOpenAIBalance() with OpenAI SDK: ' +
    'GET /v1/organization/billing/balance'
  );

  // Expected implementation:
  // return {
  //   provider: 'openai',
  //   balance: response.balance,
  //   currency: response.currency || 'USD',
  //   lastChecked: new Date(),
  // };
}

/**
 * Get wallet balance for Anthropic
 * Calls: GET /v1/account/balance
 *
 * NOTE: This is a placeholder for actual API integration
 */
export async function getAnthropicBalance(): Promise<ProviderBalance> {
  // TODO: Implement actual Anthropic account API call
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const response = await anthropic.account.balance();

  throw new Error(
    'Anthropic balance check not implemented. ' +
    'Implement getAnthropicBalance() with Anthropic SDK: ' +
    'GET /v1/account/balance'
  );

  // Expected implementation:
  // return {
  //   provider: 'anthropic',
  //   balance: response.balance,
  //   currency: 'USD',
  //   lastChecked: new Date(),
  // };
}

/**
 * Get quota/balance for Google Vertex AI
 *
 * NOTE: This is a placeholder for actual API integration
 */
export async function getGoogleBalance(): Promise<ProviderBalance> {
  // TODO: Implement actual Google Vertex AI quota check
  // const vertexAI = new VertexAI({ projectId: process.env.GOOGLE_PROJECT_ID });
  // const response = await vertexAI.checkQuota();

  throw new Error(
    'Google balance check not implemented. ' +
    'Implement getGoogleBalance() with Google Cloud SDK to check Vertex AI quota'
  );

  // Expected implementation:
  // return {
  //   provider: 'google',
  //   balance: response.availableCredits,
  //   currency: 'USD',
  //   lastChecked: new Date(),
  // };
}

/**
 * Get credits balance for Perplexity
 *
 * NOTE: This is a placeholder for actual API integration
 */
export async function getPerplexityBalance(): Promise<ProviderBalance> {
  // TODO: Implement actual Perplexity credits API call
  // const response = await fetch('https://api.perplexity.ai/credits', {
  //   headers: { Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}` }
  // });

  throw new Error(
    'Perplexity balance check not implemented. ' +
    'Implement getPerplexityBalance() with Perplexity API'
  );

  // Expected implementation:
  // return {
  //   provider: 'perplexity',
  //   balance: response.credits,
  //   currency: 'USD',
  //   lastChecked: new Date(),
  // };
}

/**
 * Get balance for a specific provider
 */
export async function getProviderBalance(provider: ApiProvider): Promise<ProviderBalance> {
  switch (provider) {
    case 'openai':
      return getOpenAIBalance();
    case 'anthropic':
      return getAnthropicBalance();
    case 'google':
      return getGoogleBalance();
    case 'perplexity':
      return getPerplexityBalance();
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Get balances for all providers
 * Fetches in parallel for performance
 */
export async function getAllProviderBalances(): Promise<ProviderBalance[]> {
  const providers: ApiProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];

  const balancePromises = providers.map(provider =>
    getProviderBalance(provider).catch(error => {
      // Return error as balance object for graceful handling
      console.error(`Failed to fetch balance for ${provider}:`, error);
      return {
        provider,
        balance: 0,
        currency: 'USD',
        lastChecked: new Date(),
      };
    })
  );

  return Promise.all(balancePromises);
}

/**
 * Validate wallet balance against required costs
 * AC#6: Check EACH provider separately and block if ANY has insufficient funds
 */
export function validateWalletBalance(
  providerCosts: ProviderCosts,
  providerBalances: ProviderBalance[]
): WalletValidationResult {
  const validations: ProviderValidation[] = [];

  // Create balance lookup map
  const balanceMap = new Map<ApiProvider, number>();
  for (const balance of providerBalances) {
    balanceMap.set(balance.provider, balance.balance);
  }

  // Validate each provider
  const providers: ApiProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];

  for (const provider of providers) {
    const required = providerCosts[provider];
    const available = balanceMap.get(provider) || 0;
    const sufficient = available >= required;
    const shortfall = sufficient ? 0 : required - available;

    validations.push({
      provider,
      required,
      available,
      sufficient,
      shortfall,
    });
  }

  // Check if all providers have sufficient funds
  const allSufficient = validations.every(v => v.sufficient);

  // Get list of insufficient providers
  const insufficientProviders = validations
    .filter(v => !v.sufficient)
    .map(v => v.provider);

  // Calculate totals
  const totalRequired = Object.values(providerCosts).reduce((sum, cost) => sum + cost, 0);
  const totalAvailable = Array.from(balanceMap.values()).reduce((sum, balance) => sum + balance, 0);

  return {
    allSufficient,
    validations,
    insufficientProviders,
    totalRequired,
    totalAvailable,
  };
}

/**
 * Format provider name for display
 */
export function formatProviderName(provider: ApiProvider): string {
  const names: Record<ApiProvider, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    perplexity: 'Perplexity',
  };
  return names[provider];
}

/**
 * Get "Add Credits" URL for provider
 */
export function getAddCreditsUrl(provider: ApiProvider): string {
  const urls: Record<ApiProvider, string> = {
    openai: 'https://platform.openai.com/account/billing',
    anthropic: 'https://console.anthropic.com/settings/billing',
    google: 'https://console.cloud.google.com/billing',
    perplexity: 'https://www.perplexity.ai/settings/api',
  };
  return urls[provider];
}
