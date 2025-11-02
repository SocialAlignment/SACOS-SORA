// Brand Canon Type Definition for QDRANT Vector Database
// Story 1.2: QDRANT Vector Database Setup

export interface BrandCanon {
  brand_id: string; // Unique identifier
  brand_name: string; // Display name
  voice: string; // Brand voice/tone description
  visual_style: string; // Visual aesthetic preferences
  icp_profile: string; // Ideal customer profile (Ideal Customer Profile)
  successful_prompts: string[]; // Past successful Sora prompts
  prohibited_content: string[]; // Content restrictions
}

// QDRANT Point structure for Brand Canon
export interface BrandCanonPoint {
  id: string; // Same as brand_id
  vector: number[]; // 1536-dimensional embedding from OpenAI
  payload: BrandCanon;
}

// Query result from QDRANT
export interface BrandSearchResult {
  brand: BrandCanon;
  score: number; // Similarity score (0-1, higher is better)
}
