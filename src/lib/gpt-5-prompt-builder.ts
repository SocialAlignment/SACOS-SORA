// GPT-5 Prompt Builder (Story 2.2)
// Generates Sora 2-compliant prompts using GPT-5 with brand canon integration

import { queryBrandCanon } from './qdrant-client';
import { perplexityClient, type TrendResearch } from './perplexity-client';
import { complianceValidator, type ScriptContent, type ValidationResult } from './compliance-validator';
import type { BrandCanon } from '@/types/brand-canon';
import type { DashboardFormData } from '@/types/dashboard';
import type { MatrixResult } from '@/types/dashboard';

// Batch-level cache (Story 2.2, AC#3)
// Cache persists for the lifetime of a batch generation session
type BatchCache = {
  batchId: string;
  brandCanon: Map<string, BrandCanon>; // brandId -> canon
  trendResearch: Map<string, TrendResearch>; // productCategory -> research
  createdAt: Date;
};

const batchCaches = new Map<string, BatchCache>();
const CACHE_EXPIRY_MS = 1000 * 60 * 60; // 1 hour

// OpenAI Sora 2 Prompt Structure Template (Story 2.2, AC#2)
const SORA_PROMPT_STRUCTURE = {
  shotType: ['wide shot', 'medium shot', 'close-up', 'extreme close-up', 'establishing shot', 'over-the-shoulder'],
  cameraMovement: ['static', 'slow pan', 'tracking shot', 'dolly in', 'dolly out', 'handheld'],
  lighting: ['natural lighting', 'soft lighting', 'dramatic lighting', 'golden hour', 'studio lighting', 'high contrast'],
  setting: ['indoor', 'outdoor', 'urban', 'natural', 'modern interior', 'vintage interior']
};

// Compliance constraints for system instructions (Story 2.2, AC#4)
const COMPLIANCE_CONSTRAINTS = `
STRICT COMPLIANCE REQUIREMENTS:

Layer 1 (OpenAI API Restrictions):
- NO real people by name (e.g., "Steve Jobs", "celebrity")
- NO copyrighted characters or brands (e.g., "Mickey Mouse", "Superman", "Nike")
- NO visible text in scenes (no text overlays, subtitles, or readable signs)
- NO logos on clothing or objects

Layer 2 (Brand Constraints):
- Spoken dialog MUST NOT exceed 45 words
- Spoken dialog MUST NOT exceed 65 syllables
- NO captions or subtitles visible in video
- NO on-screen graphics or text overlays

Visual Focus:
- Describe visual storytelling through cinematography
- Use specific shot types, lighting, and camera movements
- Focus on actions, expressions, and environmental details
`;

export type PromptGenerationInput = {
  batchId: string;
  brandId: string;
  productCategory?: string;
  bigIdea: string;
  combination: MatrixResult['combinations'][0]; // Matrix dimension values
  visualMessaging?: string;
  audioMessaging?: string;
  heroVoDescription?: string;
  brandCanon?: BrandCanon; // Optional override (if already fetched)
};

export type GeneratedPrompt = {
  combinationId: string;
  fullPrompt: string; // Complete Sora 2 prompt
  spokenDialog?: string; // Extracted dialog/voiceover
  visualElements: string; // Visual description
  complianceValidation: ValidationResult;
  brandCanon: BrandCanon;
  trendContext?: string;
  generatedAt: Date;
  cacheHits: {
    brandCanon: boolean;
    trendResearch: boolean;
  };
};

export type PromptGenerationResult = {
  success: boolean;
  prompt?: GeneratedPrompt;
  error?: {
    type: 'api_error' | 'compliance_failed' | 'missing_data';
    message: string;
    validationResult?: ValidationResult;
  };
};

/**
 * GPT-5 Prompt Builder
 * Generates compliant Sora 2 prompts with brand canon and trend integration
 */
export class GPT5PromptBuilder {
  private openaiApiKey: string;
  private openaiBaseUrl = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.openaiApiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  /**
   * Gets or creates batch cache (Story 2.2, AC#3)
   */
  private getBatchCache(batchId: string): BatchCache {
    let cache = batchCaches.get(batchId);

    // Create new cache if doesn't exist or expired
    if (!cache || Date.now() - cache.createdAt.getTime() > CACHE_EXPIRY_MS) {
      cache = {
        batchId,
        brandCanon: new Map(),
        trendResearch: new Map(),
        createdAt: new Date()
      };
      batchCaches.set(batchId, cache);
    }

    return cache;
  }

  /**
   * Fetches brand canon with batch-level caching (Story 2.2, AC#3)
   */
  private async getBrandCanon(batchId: string, brandId: string): Promise<{ canon: BrandCanon; cacheHit: boolean }> {
    const cache = this.getBatchCache(batchId);

    // Check cache first
    const cached = cache.brandCanon.get(brandId);
    if (cached) {
      console.log(`[Prompt Builder] Brand canon cache hit for ${brandId}`);
      return { canon: cached, cacheHit: true };
    }

    // Query QDRANT
    console.log(`[Prompt Builder] Fetching brand canon for ${brandId} from QDRANT`);
    const result = await queryBrandCanon(brandId);

    if (!result) {
      throw new Error(`Brand canon not found for ${brandId}`);
    }

    // Cache the result
    cache.brandCanon.set(brandId, result);
    return { canon: result, cacheHit: false };
  }

  /**
   * Fetches trend research with batch-level caching (Story 2.2, AC#3)
   */
  private async getTrendResearch(
    batchId: string,
    brandId: string,
    productCategory: string
  ): Promise<{ research: TrendResearch; cacheHit: boolean }> {
    const cache = this.getBatchCache(batchId);

    // Check cache first (keyed by product category since trends are category-specific)
    const cacheKey = productCategory || 'general';
    const cached = cache.trendResearch.get(cacheKey);

    if (cached) {
      console.log(`[Prompt Builder] Trend research cache hit for ${cacheKey}`);
      return { research: cached, cacheHit: true };
    }

    // Fetch from Perplexity
    console.log(`[Prompt Builder] Fetching trend research for ${brandId} / ${productCategory}`);
    const research = await perplexityClient.fetchTrendResearch(brandId, productCategory);

    // Cache the result
    cache.trendResearch.set(cacheKey, research);
    return { research, cacheHit: false };
  }

  /**
   * Builds system instructions with compliance constraints and brand voice (Story 2.2, AC#4)
   */
  private buildSystemInstructions(brandCanon: BrandCanon): string {
    return `You are a professional video prompt engineer specializing in Sora 2 video generation.

${COMPLIANCE_CONSTRAINTS}

BRAND VOICE:
${brandCanon.voice || 'Professional and engaging'}

VISUAL STYLE:
${brandCanon.visual_style || 'Modern and clean'}

BRAND GUIDELINES:
${brandCanon.prohibited_content?.join(', ') || 'Follow standard content guidelines'}

Your task is to generate a single, detailed Sora 2 prompt that:
1. Follows OpenAI's structure (shot type, subject, action, setting, lighting, camera movement)
2. Matches the brand voice and visual style
3. Complies with ALL restrictions listed above
4. Tells a compelling visual story without relying on text or logos
5. Keeps any spoken dialog under 45 words and 65 syllables

Output format:
- Prompt: [Complete Sora 2 prompt]
- Dialog: [Spoken words, if any - max 45 words]

Be specific and cinematic in your descriptions.`;
  }

  /**
   * Builds user prompt with batch inputs and dimension values (Story 2.2, AC#2)
   */
  private buildUserPrompt(input: PromptGenerationInput, trendContext?: string): string {
    const { bigIdea, combination, visualMessaging, audioMessaging, heroVoDescription } = input;

    return `Generate a Sora 2 video prompt with the following requirements:

BIG IDEA: ${bigIdea}

DIMENSIONS:
- Funnel Level: ${combination.funnelLevel}
- Aesthetic: ${combination.aesthetic}
- Video Type: ${combination.type}
- Intention: ${combination.intention}
- Mood: ${combination.mood}
- Audio Style: ${combination.audioStyle}
- Target Demographic: ${combination.ageGeneration}, ${combination.gender}, ${combination.ethnicity}

${visualMessaging ? `VISUAL MESSAGING: ${visualMessaging}` : ''}
${audioMessaging ? `AUDIO MESSAGING: ${audioMessaging}` : ''}
${heroVoDescription ? `HERO/SUBJECT: ${heroVoDescription}` : ''}

${trendContext ? `TREND CONTEXT:\n${trendContext}\n` : ''}

Generate a compelling Sora 2 prompt that brings this concept to life while adhering to all compliance requirements.`;
  }

  /**
   * Calls GPT-5 API to generate prompt (Story 2.2, AC#2)
   */
  private async callGPT5(systemInstructions: string, userPrompt: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4', // Use gpt-4 for now; will upgrade to gpt-5 when available
          messages: [
            { role: 'system', content: systemInstructions },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error(`GPT-5 API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('[Prompt Builder] GPT-5 API call failed:', error);
      throw error;
    }
  }

  /**
   * Parses GPT-5 response to extract prompt and dialog
   */
  private parseGPT5Response(response: string): { prompt: string; dialog?: string } {
    // Extract prompt and dialog using regex
    const promptMatch = response.match(/Prompt:\s*(.+?)(?:\n|$)/i);
    const dialogMatch = response.match(/Dialog:\s*(.+?)(?:\n|$)/i);

    const prompt = promptMatch ? promptMatch[1].trim() : response;
    const dialog = dialogMatch ? dialogMatch[1].trim() : undefined;

    return { prompt, dialog };
  }

  /**
   * Generates a single Sora 2 prompt for a video variation (Story 2.2, AC#5)
   */
  async generatePrompt(input: PromptGenerationInput): Promise<PromptGenerationResult> {
    try {
      // 1. Fetch brand canon (with caching) (Story 2.2, AC#1, AC#3)
      const brandCanonResult = await this.getBrandCanon(input.batchId, input.brandId);
      const brandCanon = input.brandCanon || brandCanonResult.canon;

      // 2. Fetch trend research (with caching) (Story 2.2, AC#3)
      let trendContext: string | undefined;
      let trendCacheHit = false;

      if (input.productCategory) {
        const trendResult = await this.getTrendResearch(input.batchId, input.brandId, input.productCategory);
        // Build summary from trends array
        trendContext = trendResult.research.trends.slice(0, 3).join('. ');
        trendCacheHit = trendResult.cacheHit;
      }

      // 3. Build system instructions with compliance constraints (Story 2.2, AC#4)
      const systemInstructions = this.buildSystemInstructions(brandCanon);

      // 4. Build user prompt with dimension values (Story 2.2, AC#2)
      const userPrompt = this.buildUserPrompt(input, trendContext);

      // 5. Call GPT-5 to generate prompt
      const gpt5Response = await this.callGPT5(systemInstructions, userPrompt);

      // 6. Parse response
      const { prompt, dialog } = this.parseGPT5Response(gpt5Response);

      // 7. Validate compliance (Story 2.1 integration)
      const scriptContent: ScriptContent = {
        prompt,
        visualDescription: prompt, // Full prompt includes visual description
        spokenWords: dialog
      };

      const validation = complianceValidator.validate(scriptContent);

      // 8. Return result
      const generatedPrompt: GeneratedPrompt = {
        combinationId: this.generateCombinationId(input.combination),
        fullPrompt: prompt,
        spokenDialog: dialog,
        visualElements: prompt,
        complianceValidation: validation,
        brandCanon,
        trendContext,
        generatedAt: new Date(),
        cacheHits: {
          brandCanon: brandCanonResult.cacheHit,
          trendResearch: trendCacheHit
        }
      };

      // If validation failed, return error
      if (!validation.valid) {
        return {
          success: false,
          error: {
            type: 'compliance_failed',
            message: `Prompt failed compliance validation: ${validation.errors.length} errors`,
            validationResult: validation
          }
        };
      }

      return {
        success: true,
        prompt: generatedPrompt
      };
    } catch (error) {
      console.error('[Prompt Builder] Prompt generation failed:', error);
      return {
        success: false,
        error: {
          type: 'api_error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generates prompts for all combinations in a batch (Story 2.2, AC#5)
   */
  async generateBatch(
    batchId: string,
    brandId: string,
    productCategory: string,
    bigIdea: string,
    combinations: MatrixResult['combinations'],
    options?: {
      visualMessaging?: string;
      audioMessaging?: string;
      heroVoDescription?: string;
    }
  ): Promise<PromptGenerationResult[]> {
    console.log(`[Prompt Builder] Generating ${combinations.length} prompts for batch ${batchId}`);

    const results: PromptGenerationResult[] = [];

    for (const combination of combinations) {
      const input: PromptGenerationInput = {
        batchId,
        brandId,
        productCategory,
        bigIdea,
        combination,
        visualMessaging: options?.visualMessaging,
        audioMessaging: options?.audioMessaging,
        heroVoDescription: options?.heroVoDescription
      };

      const result = await this.generatePrompt(input);
      results.push(result);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate cache effectiveness (Story 2.2, AC#6)
    const successfulPrompts = results.filter(r => r.success && r.prompt);
    const brandCanonCacheHits = successfulPrompts.filter(r => r.prompt?.cacheHits.brandCanon).length;
    const trendCacheHits = successfulPrompts.filter(r => r.prompt?.cacheHits.trendResearch).length;

    const brandCanonCacheRate = (brandCanonCacheHits / successfulPrompts.length) * 100;
    const trendCacheRate = (trendCacheHits / successfulPrompts.length) * 100;

    console.log(`[Prompt Builder] Batch complete:`);
    console.log(`  - Brand canon cache rate: ${brandCanonCacheRate.toFixed(1)}%`);
    console.log(`  - Trend research cache rate: ${trendCacheRate.toFixed(1)}%`);
    console.log(`  - Estimated cost savings: ${((brandCanonCacheRate + trendCacheRate) / 4).toFixed(1)}%`);

    return results;
  }

  /**
   * Generates unique ID for combination
   */
  private generateCombinationId(combo: MatrixResult['combinations'][0]): string {
    return `${combo.funnelLevel}-${combo.aesthetic}-${combo.type}-${combo.intention}-${combo.mood}`;
  }

  /**
   * Clears batch cache (for testing or manual cleanup)
   */
  clearBatchCache(batchId?: string): void {
    if (batchId) {
      batchCaches.delete(batchId);
      console.log(`[Prompt Builder] Cleared cache for batch ${batchId}`);
    } else {
      batchCaches.clear();
      console.log(`[Prompt Builder] Cleared all batch caches`);
    }
  }
}

// Singleton instance
export const gpt5PromptBuilder = new GPT5PromptBuilder();
