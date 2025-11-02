// Story 3.5: Campaign API Client
// Replaces IndexedDB with backend API calls for persistent storage

import { TestedCombination, CampaignHistory, hashDimensions } from './campaign-db';

/**
 * API Response Types
 */
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Campaign API - Replaces campaignDb.campaigns
 */
export const campaignApi = {
  /**
   * Create a new campaign
   */
  async create(campaign: Omit<CampaignHistory, 'id'>): Promise<CampaignHistory> {
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brandId: campaign.brand_id,
        name: campaign.big_idea, // Using big_idea as campaign name
        description: campaign.product_category || '',
        status: campaign.status,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create campaign');
    }

    const result = await response.json();
    const apiCampaign = result.campaign;

    // Map backend response to frontend format
    return {
      campaign_id: apiCampaign.id,
      brand_id: apiCampaign.brandId,
      big_idea: apiCampaign.name,
      product_category: apiCampaign.description,
      created_at: new Date(apiCampaign.createdAt),
      status: apiCampaign.status,
      total_variations: 0, // Will be updated as combinations are added
      winner_count: 0,
    };
  },

  /**
   * Get all campaigns for a brand
   */
  async getByBrand(brandId: string): Promise<CampaignHistory[]> {
    const response = await fetch(`/api/campaigns?brandId=${brandId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    const result = await response.json();

    // Map backend campaigns to frontend format
    return result.campaigns.map((c: any) => ({
      campaign_id: c.id,
      brand_id: c.brandId,
      big_idea: c.name,
      product_category: c.description,
      created_at: new Date(c.createdAt),
      status: c.status,
      total_variations: c._count?.combinations || 0,
      winner_count: 0, // TODO: Calculate from combinations
    }));
  },

  /**
   * Get a single campaign by ID
   */
  async getById(campaignId: string): Promise<CampaignHistory | undefined> {
    const response = await fetch(`/api/campaigns/${campaignId}`);

    if (!response.ok) {
      if (response.status === 404) return undefined;
      throw new Error('Failed to fetch campaign');
    }

    const result = await response.json();
    const c = result.campaign;

    return {
      campaign_id: c.id,
      brand_id: c.brandId,
      big_idea: c.name,
      product_category: c.description,
      created_at: new Date(c.createdAt),
      status: c.status,
      total_variations: c.combinations?.length || 0,
      winner_count: c.combinations?.filter((comb: any) => comb.winnerStatus).length || 0,
    };
  },

  /**
   * Update campaign status
   */
  async update(campaignId: string, updates: Partial<CampaignHistory>): Promise<void> {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: updates.status,
        name: updates.big_idea,
        description: updates.product_category,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update campaign');
    }
  },

  /**
   * Delete a campaign
   */
  async delete(campaignId: string): Promise<void> {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete campaign');
    }
  },
};

/**
 * Combination API - Replaces campaignDb.combinations
 */
export const combinationApi = {
  /**
   * Add a tested combination
   */
  async add(combination: Omit<TestedCombination, 'id'>): Promise<TestedCombination> {
    const response = await fetch(`/api/campaigns/${combination.campaign_id}/combinations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: combination.combination_id,
        prompt: JSON.stringify(combination.dimension_values), // Store dimensions as JSON in prompt
        stylePreset: combination.dimension_values.aesthetic,
        aspectRatio: combination.dimension_values.orientation,
        organicMetrics: combination.organic_metrics,
        winnerStatus: combination.winner_status === 'winner',
        notionRecordId: combination.notion_record_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add combination');
    }

    const result = await response.json();
    return combination; // Return the original for now
  },

  /**
   * Get all combinations for a campaign
   */
  async getByCampaign(campaignId: string): Promise<TestedCombination[]> {
    const response = await fetch(`/api/campaigns/${campaignId}/combinations`);

    if (!response.ok) {
      throw new Error('Failed to fetch combinations');
    }

    const result = await response.json();

    // Map backend combinations to frontend format
    return result.combinations.map((c: any) => ({
      combination_id: c.videoId,
      campaign_id: c.campaignId || campaignId,
      brand_id: '', // TODO: Get from campaign
      dimension_values: c.prompt ? JSON.parse(c.prompt) : {},
      dimension_hash: '', // TODO: Calculate
      organic_metrics: c.organicMetrics || {},
      winner_status: c.winnerStatus ? 'winner' : 'pending',
      video_url: c.videoUrl,
      notion_record_id: c.notionRecordId,
      created_at: new Date(c.createdAt),
      analyzed_at: c.analyzedAt ? new Date(c.analyzedAt) : undefined,
    }));
  },

  /**
   * Get all combinations for a brand
   */
  async getByBrand(brandId: string): Promise<TestedCombination[]> {
    const response = await fetch(`/api/campaigns?brandId=${brandId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }

    const result = await response.json();
    const allCombinations: TestedCombination[] = [];

    // Fetch combinations for each campaign
    for (const campaign of result.campaigns) {
      const combinations = await this.getByCampaign(campaign.id);
      allCombinations.push(...combinations);
    }

    return allCombinations;
  },

  /**
   * Get winner combinations for a brand
   */
  async getWinners(brandId: string): Promise<TestedCombination[]> {
    const all = await this.getByBrand(brandId);
    return all.filter(c => c.winner_status === 'winner');
  },

  /**
   * Update combination organic metrics
   */
  async updateMetrics(
    combinationId: string,
    campaignId: string,
    metrics: TestedCombination['organic_metrics']
  ): Promise<void> {
    // For now, we'll need to fetch and re-create
    // TODO: Add a PATCH endpoint for updating just metrics
    console.warn('Metric updates not yet implemented in backend API');
  },
};

/**
 * Analytics API - Replaces direct database queries
 */
export const analyticsApi = {
  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    const response = await fetch(`/api/analytics/campaigns/${campaignId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    return await response.json();
  },

  /**
   * Get brand-level analytics
   */
  async getBrandAnalytics(brandId: string) {
    // TODO: Implement brand-level analytics endpoint
    console.warn('Brand analytics not yet implemented');
    return null;
  },
};

/**
 * Helper: Check if backend is available
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/campaigns', { method: 'HEAD' });
    return response.ok || response.status === 401; // 401 means API exists but needs auth
  } catch {
    return false;
  }
}

/**
 * Migration Helper: Sync IndexedDB to Backend
 */
export async function migrateIndexedDBToBackend() {
  const { campaignDb } = await import('./campaign-db');

  console.log('🔄 Starting IndexedDB → Backend migration...');

  try {
    // Get all campaigns from IndexedDB
    const localCampaigns = await campaignDb.campaigns.toArray();
    console.log(`Found ${localCampaigns.length} campaigns in IndexedDB`);

    for (const campaign of localCampaigns) {
      try {
        // Check if campaign already exists in backend
        const existing = await campaignApi.getById(campaign.campaign_id);

        if (!existing) {
          // Create in backend
          await campaignApi.create(campaign);
          console.log(`✅ Migrated campaign: ${campaign.campaign_id}`);

          // Migrate combinations
          const combinations = await campaignDb.combinations
            .where('campaign_id')
            .equals(campaign.campaign_id)
            .toArray();

          for (const combo of combinations) {
            await combinationApi.add(combo);
          }
          console.log(`✅ Migrated ${combinations.length} combinations`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate campaign ${campaign.campaign_id}:`, error);
      }
    }

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
