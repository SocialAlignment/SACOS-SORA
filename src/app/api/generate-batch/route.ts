// Epic 2: Batch Video Generation API
// Connects dashboard form → Sora API → Notion → Queue management
// Enhanced with GPT-5 prompt builder for brand-aligned, ad-worthy content

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { campaignApi, combinationApi } from '@/lib/campaign-api';
import { createBatchRecords, type VideoVariationRecord } from '@/lib/notion-client';
import { videoGenerationQueue } from '@/lib/video-generation-queue';
import { gpt5PromptBuilder, type PromptGenerationInput } from '@/lib/gpt-5-prompt-builder';
import type { DashboardFormData, VideoCombination } from '@/types/dashboard';
import type { SoraModel, SoraDuration } from '@/lib/sora-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/generate-batch
 * Epic 2 Story 2.1: Batch Submission API
 *
 * Takes dashboard form data and:
 * 1. Creates campaign in database (Epic 3)
 * 2. Creates Notion records for each video variation
 * 3. Queues videos for generation with Sora API
 * 4. Returns batch ID for tracking
 */
export async function POST(req: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const {
      formData,
      matrixResult,
      excludedCombinations,
      batchId,
    }: {
      formData: DashboardFormData;
      matrixResult: { combinations: VideoCombination[] };
      excludedCombinations: Set<string> | string[];
      batchId: string;
    } = body;

    // Convert excludedCombinations to Set if it's an array
    const excluded = Array.isArray(excludedCombinations)
      ? new Set(excludedCombinations)
      : excludedCombinations;

    // Filter out excluded combinations
    const activeCombinations = matrixResult.combinations.filter((combo) => {
      const comboId = `${combo.funnelLevel}-${combo.aesthetic}-${combo.type}-${combo.intention}-${combo.mood}`;
      return !excluded.has(comboId);
    });

    console.log(`[Batch Gen] Creating batch ${batchId} with ${activeCombinations.length} videos`);

    // Step 1: Create campaign in database (Epic 3 integration)
    try {
      await campaignApi.create({
        campaign_id: batchId,
        brand_id: formData.brand,
        big_idea: formData.bigIdea,
        product_category: formData.productCategory || '',
        created_at: new Date(),
        status: 'generating',
        total_variations: activeCombinations.length,
        winner_count: 0,
      });

      console.log(`[Batch Gen] Campaign ${batchId} created in database`);
    } catch (error) {
      console.error('[Batch Gen] Failed to create campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // Step 2: Generate brand-aligned prompts with GPT-5 builder
    console.log(`[Batch Gen] Generating ${activeCombinations.length} brand-aligned prompts...`);
    const promptResults = await Promise.all(
      activeCombinations.map(async (combo, index) => {
        const input: PromptGenerationInput = {
          batchId,
          brandId: formData.brand,
          productCategory: formData.productCategory || '',
          bigIdea: formData.bigIdea,
          combination: combo,
          visualMessaging: formData.visualMessaging,
          audioMessaging: formData.audioMessaging,
          heroVoDescription: formData.heroVoDescription,
        };

        const result = await gpt5PromptBuilder.generatePrompt(input);

        if (!result.success || !result.prompt) {
          console.warn(`[Batch Gen] Prompt generation failed for combination ${index}:`, result.error);
          // Fallback to simple prompt if GPT-5 fails
          return {
            prompt: buildSoraPromptFallback(formData, combo),
            compliant: false,
            error: result.error?.message,
          };
        }

        // Check compliance validation
        if (!result.prompt.complianceValidation.valid) {
          console.warn(
            `[Batch Gen] Compliance validation failed for combination ${index}:`,
            result.prompt.complianceValidation.errors
          );
          return {
            prompt: result.prompt.fullPrompt,
            compliant: false,
            complianceErrors: result.prompt.complianceValidation.errors,
          };
        }

        console.log(
          `[Batch Gen] ✓ Generated compliant prompt for ${combo.funnelLevel}-${combo.aesthetic}-${combo.type}`
        );

        return {
          prompt: result.prompt.fullPrompt,
          spokenDialog: result.prompt.spokenDialog,
          compliant: true,
          brandCanonUsed: result.prompt.brandCanon.brand_id,
          trendContext: result.prompt.trendContext,
        };
      })
    );

    // Calculate compliance metrics
    const compliantCount = promptResults.filter(r => r.compliant).length;
    const complianceRate = ((compliantCount / promptResults.length) * 100).toFixed(1);

    console.log(`[Batch Gen] Compliance rate: ${complianceRate}% (${compliantCount}/${promptResults.length})`);

    // Step 3: Create Notion records with generated prompts
    const notionVariations: Omit<
      VideoVariationRecord,
      'notionPageId' | 'createdAt' | 'updatedAt' | 'batchId'
    >[] = activeCombinations.map((combo, index) => {
      const promptResult = promptResults[index];

      return {
        combinationId: uuidv4(),
        bigIdea: formData.bigIdea,
        brand: formData.brand,
        aesthetic: combo.aesthetic,
        type: combo.type,
        demographic: `${combo.ageGeneration} | ${combo.gender} | ${combo.ethnicity}`,
        status: 'Pending' as const,
        prompt: promptResult.prompt,
        cost: calculateVideoCost(formData.soraModel, formData.videoDuration),
      };
    });

    let notionRecords: VideoVariationRecord[] = [];
    try {
      const notionResult = await createBatchRecords(batchId, notionVariations);
      if (!notionResult.success) {
        throw new Error('Notion record creation failed');
      }
      notionRecords = notionResult.records;
      console.log(`[Batch Gen] Created ${notionRecords.length} Notion records`);
    } catch (error) {
      console.error('[Batch Gen] Failed to create Notion records:', error);
      // Continue anyway - Notion is for tracking, not critical path
      console.warn('[Batch Gen] Continuing without Notion tracking');
    }

    // Step 4: Create tested combination records in database
    for (let i = 0; i < activeCombinations.length; i++) {
      const combo = activeCombinations[i];
      const notionRecord = notionRecords[i];

      try {
        await combinationApi.add({
          combination_id: notionRecord?.combinationId || uuidv4(),
          campaign_id: batchId,
          brand_id: formData.brand,
          dimension_values: combo,
          dimension_hash: '', // Will be calculated by backend
          organic_metrics: {},
          winner_status: 'pending',
          video_url: undefined,
          notion_record_id: notionRecord?.notionPageId,
          created_at: new Date(),
        });
      } catch (error) {
        console.error(`[Batch Gen] Failed to create combination record:`, error);
        // Non-blocking - continue with other videos
      }
    }

    console.log(`[Batch Gen] Created ${activeCombinations.length} combination records`);

    // Step 5: Queue videos for generation (Epic 2 Story 2.5)
    const queuedVideos = notionRecords
      .map((record, index) => {
        // Skip videos without valid Notion records
        if (!record.notionPageId) {
          console.warn(`[Batch Gen] Skipping video ${index} - no Notion record`);
          return null;
        }

        return {
          notionPageId: record.notionPageId,
          batchId,
          combinationId: record.combinationId,
          prompt: promptResults[index].prompt,
          model: formData.soraModel as SoraModel,
          duration: formData.videoDuration as SoraDuration,
          aspectRatio: mapOrientationToAspectRatio(activeCombinations[index].orientation),
          loop: false,
          queuedAt: new Date(),
        };
      })
      .filter((video): video is NonNullable<typeof video> => video !== null);

    // Submit to video generation queue
    try {
      await videoGenerationQueue.submitBatch(queuedVideos);
      console.log(`[Batch Gen] Queued ${queuedVideos.length} videos for generation`);
    } catch (error) {
      console.error('[Batch Gen] Failed to queue videos:', error);
      return NextResponse.json(
        { error: 'Failed to queue videos for generation' },
        { status: 500 }
      );
    }

    // Return success with batch info
    return NextResponse.json({
      success: true,
      batchId,
      totalVideos: activeCombinations.length,
      notionRecords: notionRecords.length,
      status: 'queued',
      compliance: {
        compliantVideos: compliantCount,
        totalVideos: promptResults.length,
        complianceRate: parseFloat(complianceRate),
      },
      message: `Batch ${batchId} submitted successfully. ${activeCombinations.length} videos queued for generation (${complianceRate}% brand-compliant).`,
    });
  } catch (error) {
    console.error('[Batch Gen] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Simple prompt builder (used only when GPT-5 builder fails)
 * This is a basic implementation without brand canon or compliance validation
 */
function buildSoraPromptFallback(formData: DashboardFormData, combo: VideoCombination): string {
  console.warn('[Batch Gen] Using fallback prompt builder (no brand alignment)');

  // Combine form data with combination to create detailed prompt
  const parts: string[] = [];

  // Big idea as foundation
  parts.push(formData.bigIdea);

  // Visual messaging
  if (formData.visualMessaging) {
    parts.push(formData.visualMessaging);
  }

  // Combination dimensions
  parts.push(`Style: ${combo.aesthetic}`);
  parts.push(`Type: ${combo.type}`);
  parts.push(`Mood: ${combo.mood}`);
  parts.push(`Intention: ${combo.intention}`);

  // Target demographic if specified
  if (combo.ageGeneration !== 'any') {
    parts.push(`Target: ${combo.ageGeneration}`);
  }
  if (combo.gender !== 'any') {
    parts.push(`Gender: ${combo.gender}`);
  }

  // Funnel level context
  parts.push(`Funnel: ${combo.funnelLevel}`);

  return parts.join('. ');
}

/**
 * Maps orientation to Sora aspect ratio
 */
function mapOrientationToAspectRatio(
  orientation: string
): '16:9' | '9:16' | '1:1' {
  if (orientation.includes('Portrait') || orientation.includes('9:16')) {
    return '9:16';
  } else if (orientation.includes('Square') || orientation.includes('1:1')) {
    return '1:1';
  } else {
    return '16:9'; // Default to landscape
  }
}

/**
 * Calculates video generation cost
 */
function calculateVideoCost(model: 'sora-2' | 'sora-2-pro', duration: number): number {
  const baseCost = model === 'sora-2-pro' ? 12 : 5;
  const durationMultiplier = duration / 10; // Baseline 10s
  return parseFloat((baseCost * durationMultiplier).toFixed(2));
}
