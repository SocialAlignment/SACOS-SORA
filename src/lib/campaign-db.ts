// Campaign History Database - Dexie/IndexedDB Schema
// Story 1.8: Track campaign history and tested combinations for AI recommendations

import Dexie, { Table } from 'dexie';

// Campaign History Types
export type CampaignHistory = {
  id?: number; // Auto-increment
  campaign_id: string; // UUID
  brand_id: string;
  big_idea: string;
  product_category?: string;
  created_at: Date;
  status: 'draft' | 'generating' | 'completed' | 'analyzed';
  total_variations: number;
  winner_count?: number;
  avg_organic_performance?: number;
  notion_database_id?: string;
};

export type TestedCombination = {
  id?: number; // Auto-increment
  combination_id: string; // UUID
  campaign_id: string;
  brand_id: string;
  dimension_values: {
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
  dimension_hash: string; // SHA-256 hash for duplicate detection
  organic_metrics: {
    views?: number;
    engagement_rate?: number;
    shares?: number;
    comments?: number;
    watch_time_avg?: number;
    platform?: 'tiktok' | 'instagram' | 'linkedin';
  };
  winner_status: 'pending' | 'winner' | 'loser' | 'test';
  video_url?: string;
  notion_record_id?: string;
  created_at: Date;
  analyzed_at?: Date;
};

// Dexie Database Class
export class CampaignDatabase extends Dexie {
  campaigns!: Table<CampaignHistory>;
  combinations!: Table<TestedCombination>;

  constructor() {
    super('CampaignDatabase');

    // Schema version 1
    this.version(1).stores({
      campaigns: '++id, campaign_id, brand_id, created_at, status',
      combinations: '++id, combination_id, campaign_id, brand_id, winner_status, [brand_id+dimension_hash]'
    });
  }
}

// Singleton instance
export const campaignDb = new CampaignDatabase();

// Helper function to generate dimension hash for duplicate detection
export function hashDimensions(dimensions: TestedCombination['dimension_values']): string {
  // Create deterministic hash from dimension values
  const values = [
    dimensions.funnelLevel,
    dimensions.aesthetic,
    dimensions.type,
    dimensions.intention,
    dimensions.mood,
    dimensions.audioStyle,
    dimensions.ageGeneration,
    dimensions.gender,
    dimensions.orientation,
    dimensions.lifeStage,
    dimensions.ethnicity
  ];

  // Simple hash (for production, use crypto.subtle.digest for SHA-256)
  const str = values.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

// Database initialization
export async function initCampaignDatabase(): Promise<void> {
  try {
    await campaignDb.open();
    console.log('Campaign database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize campaign database:', error);
    throw error;
  }
}

// Query helpers
export async function getCampaignsByBrand(brandId: string): Promise<CampaignHistory[]> {
  return await campaignDb.campaigns
    .where('brand_id')
    .equals(brandId)
    .reverse()
    .sortBy('created_at');
}

export async function getTestedCombinationsByBrand(brandId: string): Promise<TestedCombination[]> {
  return await campaignDb.combinations
    .where('brand_id')
    .equals(brandId)
    .toArray();
}

export async function getTestedCombinationsByCampaign(campaignId: string): Promise<TestedCombination[]> {
  return await campaignDb.combinations
    .where('campaign_id')
    .equals(campaignId)
    .toArray();
}

// Check if combination already tested
export async function isCombinationTested(
  brandId: string,
  dimensionHash: string
): Promise<boolean> {
  const count = await campaignDb.combinations
    .where('[brand_id+dimension_hash]')
    .equals([brandId, dimensionHash])
    .count();

  return count > 0;
}
