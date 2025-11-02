// QDRANT Client for Brand Canon Management
// Story 1.2: QDRANT Vector Database Setup
// Pattern follows: src/lib/notion-client.ts

import { QdrantClient } from '@qdrant/js-client-rest';
import { v5 as uuidv5 } from 'uuid';
import type {
  BrandCanon,
  BrandSearchResult,
} from '@/types/brand-canon';

// Initialize QDRANT client
const QDRANT_URL = process.env.QDRANT_URL || 'http://192.168.0.78:6333';
const COLLECTION_NAME = 'brand__canon_v1';

const qdrant = new QdrantClient({ url: QDRANT_URL });

// UUID namespace for brand IDs (consistent UUID generation)
const BRAND_UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // ISO OID namespace

/**
 * Generate deterministic UUID from brand_id string
 */
function brandIdToUuid(brandId: string): string {
  return uuidv5(brandId, BRAND_UUID_NAMESPACE);
}

// Retry configuration for connection failures
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Initial delay, will use exponential backoff

/**
 * Helper: Exponential backoff retry logic with proper generics
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `QDRANT operation failed (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms...`,
          error
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('QDRANT operation failed after retries');
}

/**
 * Validate BrandCanon object has all required fields
 */
function validateBrandCanon(brand: BrandCanon): { valid: boolean; missing: string[] } {
  const requiredFields: (keyof BrandCanon)[] = [
    'brand_id',
    'brand_name',
    'voice',
    'visual_style',
    'icp_profile',
    'successful_prompts',
    'prohibited_content',
  ];

  const missing: string[] = [];

  for (const field of requiredFields) {
    const value = brand[field];
    if (value === undefined || value === null || value === '') {
      missing.push(field);
    }
    // Special validation for arrays
    if (field === 'successful_prompts' || field === 'prohibited_content') {
      if (!Array.isArray(value) || value.length === 0) {
        missing.push(`${field} (must be non-empty array)`);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Type guard to safely cast QDRANT payload to BrandCanon
 */
function isBrandCanonPayload(payload: unknown): payload is BrandCanon {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.brand_id === 'string' &&
    typeof p.brand_name === 'string' &&
    typeof p.voice === 'string' &&
    typeof p.visual_style === 'string' &&
    typeof p.icp_profile === 'string' &&
    Array.isArray(p.successful_prompts) &&
    Array.isArray(p.prohibited_content)
  );
}

/**
 * Query brand canon by brand_id
 */
export async function queryBrandCanon(
  brandId: string
): Promise<BrandCanon | null> {
  try {
    return await retryWithBackoff(async () => {
      const uuid = brandIdToUuid(brandId);
      const result = await qdrant.retrieve(COLLECTION_NAME, {
        ids: [uuid],
        with_payload: true,
      });

      if (result.length === 0) {
        return null;
      }

      const payload = result[0].payload;
      if (!isBrandCanonPayload(payload)) {
        console.error('Invalid BrandCanon payload structure:', payload);
        return null;
      }

      return payload;
    });
  } catch (error) {
    console.error('Error querying brand canon:', error);
    // Graceful degradation: return null, caller can fallback to Demo Brand
    return null;
  }
}

/**
 * Search brands by vector similarity (for semantic search)
 * Requires generating embeddings from query text using OpenAI
 */
export async function searchBrands(
  queryVector: number[],
  limit: number = 5
): Promise<BrandSearchResult[]> {
  try {
    return await retryWithBackoff(async () => {
      const results = await qdrant.search(COLLECTION_NAME, {
        vector: queryVector,
        limit,
        with_payload: true,
      });

      return results
        .filter((result) => isBrandCanonPayload(result.payload))
        .map((result) => ({
          brand: result.payload,
          score: result.score,
        }));
    });
  } catch (error) {
    console.error('Error searching brands:', error);
    return [];
  }
}

/**
 * Get all brands with pagination support (for dropdown population)
 */
export async function getAllBrands(options?: {
  limit?: number;
  offset?: string;
}): Promise<{ brands: BrandCanon[]; nextOffset?: string }> {
  const limit = options?.limit || 100;
  const offset = options?.offset;

  try {
    return await retryWithBackoff(async () => {
      // Scroll through points with pagination
      const result = await qdrant.scroll(COLLECTION_NAME, {
        limit,
        offset,
        with_payload: true,
      });

      const brands = result.points
        .filter((point) => isBrandCanonPayload(point.payload))
        .map((point) => point.payload);

      return {
        brands,
        nextOffset: result.next_page_offset || undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching all brands:', error);
    // Graceful degradation: return empty array
    return { brands: [] };
  }
}

/**
 * Get all brands (simplified version for backward compatibility)
 */
export async function getAllBrandsSimple(): Promise<BrandCanon[]> {
  const result = await getAllBrands({ limit: 100 });
  return result.brands;
}

/**
 * Upsert (insert or update) brand canon entry with validation
 */
export async function upsertBrandCanon(
  brand: BrandCanon,
  vector: number[]
): Promise<{ success: boolean; error?: string }> {
  // Validate brand has all required fields
  const validation = validateBrandCanon(brand);
  if (!validation.valid) {
    const error = `Invalid brand canon: missing required fields: ${validation.missing.join(', ')}`;
    console.error(error);
    return { success: false, error };
  }

  // Validate vector dimensions
  if (!Array.isArray(vector) || vector.length !== 1536) {
    const error = `Invalid vector: expected 1536 dimensions, got ${vector?.length || 0}`;
    console.error(error);
    return { success: false, error };
  }

  try {
    await retryWithBackoff(async () => {
      const uuid = brandIdToUuid(brand.brand_id);
      await qdrant.upsert(COLLECTION_NAME, {
        wait: true,
        points: [
          {
            id: uuid,
            vector,
            payload: brand as unknown as Record<string, unknown>,
          },
        ],
      });
    });

    return { success: true };
  } catch (error) {
    const errorMsg = `Error upserting brand canon: ${error}`;
    console.error(errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Delete brand canon entry
 */
export async function deleteBrandCanon(brandId: string): Promise<boolean> {
  try {
    return await retryWithBackoff(async () => {
      const uuid = brandIdToUuid(brandId);
      await qdrant.delete(COLLECTION_NAME, {
        wait: true,
        points: [uuid],
      });

      return true;
    });
  } catch (error) {
    console.error('Error deleting brand canon:', error);
    return false;
  }
}

/**
 * Check QDRANT connection health
 */
export async function checkQdrantHealth(): Promise<boolean> {
  try {
    const collections = await qdrant.getCollections();
    return collections.collections.some((c) => c.name === COLLECTION_NAME);
  } catch (error) {
    console.error('QDRANT health check failed:', error);
    return false;
  }
}

/**
 * Get Demo Brand fallback (when QDRANT unavailable)
 */
export function getDemoBrand(): BrandCanon {
  return {
    brand_id: 'demo-brand',
    brand_name: 'Demo Brand',
    voice: 'Professional, friendly, approachable',
    visual_style: 'Clean, modern, minimalist',
    icp_profile: 'General audience, ages 25-45, tech-savvy',
    successful_prompts: ['Sample prompt showing best practices'],
    prohibited_content: [
      'No copyrighted content',
      'No real people',
      'No explicit text/logos',
    ],
  };
}
