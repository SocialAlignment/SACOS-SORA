// AI Recommendation Engine (Story 1.8, Task 5)
// Generates intelligent recommendations for untested combinations (AC#2, AC#3, AC#6)

import { campaignApi, combinationApi } from './campaign-api';
import { hashDimensions, type TestedCombination } from './campaign-db';
import { performanceAnalytics, type DimensionPerformance } from './performance-analytics';
import { perplexityClient } from './perplexity-client';

// Recommendation types
export type DimensionRecommendation = {
  dimension: keyof TestedCombination['dimension_values'];
  currentValue: string;
  recommendedValue: string;
  currentPerformance: number; // Winner rate %
  recommendedPerformance: number; // Winner rate %
  improvement: number; // Percentage point difference
  reason: string;
  confidence: 'high' | 'medium' | 'low';
};

export type UntestedCombinationRecommendation = {
  combination: TestedCombination['dimension_values'];
  score: number; // 0-100 confidence score
  reason: string;
  trendInsight?: string;
  basedOnCampaigns: number;
};

export type AIRecommendationResult = {
  brandId: string;
  hasSufficientData: boolean; // At least 3 campaigns with metrics
  totalCampaigns: number;
  totalCombinationsTested: number;
  dimensionRecommendations: DimensionRecommendation[];
  untestedCombinations: UntestedCombinationRecommendation[];
  trendInsight: string;
  generatedAt: Date;
};

/**
 * AI Recommendation Engine
 * Analyzes historical data to recommend winning strategies
 */
export class AIRecommendationEngine {
  /**
   * Generate comprehensive AI recommendations for a brand (AC#2)
   */
  async generateRecommendations(
    brandId: string,
    productCategory: string
  ): Promise<AIRecommendationResult> {
    // Story 3.5: Get campaign history from backend API
    const campaigns = await campaignApi.getByBrand(brandId);

    const combinations = await combinationApi.getByBrand(brandId);

    // Check if we have sufficient data for recommendations
    const combosWithMetrics = combinations.filter(
      (c) => c.organic_metrics.engagement_rate !== undefined
    );
    const hasSufficientData = combosWithMetrics.length >= 3;

    // Get trend insights from Perplexity
    const trendInsight = await perplexityClient.getSummaryInsight(brandId, productCategory);

    // Generate dimension-level recommendations (AC#3)
    const dimensionRecommendations = hasSufficientData
      ? await this.generateDimensionRecommendations(brandId)
      : [];

    // Find untested combinations (AC#2, AC#6)
    const untestedCombinations = hasSufficientData
      ? await this.findUntestedCombinations(brandId, productCategory)
      : [];

    return {
      brandId,
      hasSufficientData,
      totalCampaigns: campaigns.length,
      totalCombinationsTested: combinations.length,
      dimensionRecommendations,
      untestedCombinations,
      trendInsight,
      generatedAt: new Date()
    };
  }

  /**
   * Generate dimension-level recommendations (AC#3)
   * Compares user's current selections with top performers
   */
  async generateDimensionRecommendations(
    brandId: string,
    currentSelections?: Partial<TestedCombination['dimension_values']>
  ): Promise<DimensionRecommendation[]> {
    const recommendations: DimensionRecommendation[] = [];

    if (!currentSelections) {
      return recommendations;
    }

    const dimensions: Array<keyof TestedCombination['dimension_values']> = [
      'funnelLevel',
      'aesthetic',
      'type',
      'intention',
      'mood',
      'audioStyle',
      'ageGeneration',
      'gender',
      'orientation',
      'lifeStage',
      'ethnicity'
    ];

    for (const dim of dimensions) {
      const currentValue = currentSelections[dim];
      if (!currentValue) continue;

      // Get performance data for this dimension
      const dimPerformance = await performanceAnalytics.analyzeByDimension(brandId, dim);

      // Find current value's performance
      const current = dimPerformance.find((p) => p.value === currentValue);
      if (!current || current.totalTests < 2) continue; // Need at least 2 tests

      // Find best-performing alternative (with at least 3 tests for reliability)
      const alternatives = dimPerformance
        .filter((p) => p.value !== currentValue && p.totalTests >= 3)
        .sort((a, b) => b.winnerRate - a.winnerRate);

      if (alternatives.length === 0) continue;

      const best = alternatives[0];
      const improvement = best.winnerRate - current.winnerRate;

      // Only recommend if improvement is significant (>15 percentage points)
      if (improvement > 15) {
        let confidence: 'high' | 'medium' | 'low';
        if (best.totalTests >= 10 && improvement > 30) {
          confidence = 'high';
        } else if (best.totalTests >= 5 && improvement > 20) {
          confidence = 'medium';
        } else {
          confidence = 'low';
        }

        recommendations.push({
          dimension: dim,
          currentValue,
          recommendedValue: best.value,
          currentPerformance: current.winnerRate,
          recommendedPerformance: best.winnerRate,
          improvement,
          reason: `${best.value} has ${best.winnerRate.toFixed(0)}% success rate vs ${currentValue}'s ${current.winnerRate.toFixed(0)}% (based on ${best.totalTests} tests)`,
          confidence
        });
      }
    }

    // Sort by improvement (highest first)
    return recommendations.sort((a, b) => b.improvement - a.improvement);
  }

  /**
   * Find untested combinations to recommend (AC#2, AC#6)
   * Identifies high-potential untested combinations based on individual dimension performance
   */
  async findUntestedCombinations(
    brandId: string,
    productCategory: string,
    limit: number = 5
  ): Promise<UntestedCombinationRecommendation[]> {
    // Story 3.5: Get all tested combinations from backend API
    const tested = await combinationApi.getByBrand(brandId);

    // Get top-performing dimension values for each dimension
    const dimensions: Array<keyof TestedCombination['dimension_values']> = [
      'funnelLevel',
      'aesthetic',
      'type',
      'intention',
      'mood',
      'audioStyle',
      'ageGeneration',
      'gender',
      'orientation',
      'lifeStage',
      'ethnicity'
    ];

    // Build list of top performers per dimension
    const topPerformers: Record<string, DimensionPerformance[]> = {};

    for (const dim of dimensions) {
      const dimPerformance = await performanceAnalytics.analyzeByDimension(brandId, dim);
      // Filter to values with at least 3 tests and winner rate > 40%
      topPerformers[dim] = dimPerformance
        .filter((p) => p.totalTests >= 3 && p.winnerRate > 40)
        .sort((a, b) => b.winnerRate - a.winnerRate)
        .slice(0, 3); // Top 3 per dimension
    }

    // Get trend research for context
    const trendResearch = await perplexityClient.fetchTrendResearch(brandId, productCategory);

    // Generate candidate combinations from top performers
    const candidates: UntestedCombinationRecommendation[] = [];
    const maxCombinations = 100; // Limit candidate generation

    let generated = 0;

    // Generate combinations by mixing top performers
    for (const funnelLevel of topPerformers['funnelLevel'] || []) {
      if (generated >= maxCombinations) break;
      for (const aesthetic of topPerformers['aesthetic'] || []) {
        if (generated >= maxCombinations) break;
        for (const type of topPerformers['type'] || []) {
          if (generated >= maxCombinations) break;

          // Use first top performer for other dimensions
          const combination: TestedCombination['dimension_values'] = {
            funnelLevel: funnelLevel.value,
            aesthetic: aesthetic.value,
            type: type.value,
            intention: topPerformers['intention']?.[0]?.value || 'educate',
            mood: topPerformers['mood']?.[0]?.value || 'energetic',
            audioStyle: topPerformers['audioStyle']?.[0]?.value || 'dialog',
            ageGeneration: topPerformers['ageGeneration']?.[0]?.value || 'gen-z',
            gender: topPerformers['gender']?.[0]?.value || 'any',
            orientation: topPerformers['orientation']?.[0]?.value || 'any',
            lifeStage: topPerformers['lifeStage']?.[0]?.value || 'any',
            ethnicity: topPerformers['ethnicity']?.[0]?.value || 'any'
          };

          // Story 3.5: Check if this combination has been tested (in-memory check)
          const hash = hashDimensions(combination);
          const isTested = tested.some(t => t.dimension_hash === hash);

          if (!isTested) {
            // Calculate confidence score based on dimension performance
            const score = this.calculateCombinationScore(
              funnelLevel,
              aesthetic,
              type,
              topPerformers
            );

            // Build recommendation reason
            const reason = `Based on ${tested.length} previous campaigns: ${aesthetic.value} (${aesthetic.winnerRate.toFixed(0)}% success) + ${type.value} (${type.winnerRate.toFixed(0)}% success) + ${funnelLevel.value}`;

            // Add trend insight if relevant
            let trendInsight: string | undefined;
            const trendingPlatforms = trendResearch.platforms
              .filter((p) => p.trending)
              .map((p) => p.platform);
            if (trendingPlatforms.length > 0) {
              trendInsight = `Trending on ${trendingPlatforms.join(', ')} (source: Perplexity)`;
            }

            candidates.push({
              combination,
              score,
              reason,
              trendInsight,
              basedOnCampaigns: tested.length
            });

            generated++;
          }
        }
      }
    }

    // Sort by score and return top N
    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate confidence score for a combination (0-100)
   * Based on individual dimension performance
   */
  private calculateCombinationScore(
    funnelLevel: DimensionPerformance,
    aesthetic: DimensionPerformance,
    type: DimensionPerformance,
    allTopPerformers: Record<string, DimensionPerformance[]>
  ): number {
    // Weighted average of dimension winner rates
    const weights = {
      funnelLevel: 0.2,
      aesthetic: 0.3, // Aesthetic is highly impactful
      type: 0.3, // Type is highly impactful
      other: 0.2
    };

    // Calculate other dimensions average
    const otherDims = ['intention', 'mood', 'audioStyle', 'ageGeneration'] as const;
    const otherAvg =
      otherDims.reduce((sum, dim) => {
        const topPerformer = allTopPerformers[dim]?.[0];
        return sum + (topPerformer?.winnerRate || 50); // Default to 50% if no data
      }, 0) / otherDims.length;

    const score =
      funnelLevel.winnerRate * weights.funnelLevel +
      aesthetic.winnerRate * weights.aesthetic +
      type.winnerRate * weights.type +
      otherAvg * weights.other;

    return Math.round(score);
  }

  /**
   * Get warning message for low-performing selections (AC#3)
   */
  async getPerformanceWarning(
    brandId: string,
    dimension: keyof TestedCombination['dimension_values'],
    selectedValue: string
  ): Promise<string | null> {
    const dimPerformance = await performanceAnalytics.analyzeByDimension(brandId, dimension);

    const selected = dimPerformance.find((p) => p.value === selectedValue);
    if (!selected || selected.totalTests < 2) {
      return null; // Not enough data
    }

    // Find best performer
    const best = dimPerformance
      .filter((p) => p.totalTests >= 3)
      .sort((a, b) => b.winnerRate - a.winnerRate)[0];

    if (!best || best.value === selectedValue) {
      return null; // Selected value is already the best
    }

    const improvement = best.winnerRate - selected.winnerRate;

    // Only warn if improvement is significant (>20 percentage points)
    if (improvement > 20) {
      return `Consider ${best.value} (${best.winnerRate.toFixed(0)}% success rate vs ${selectedValue}'s ${selected.winnerRate.toFixed(0)}%)`;
    }

    return null;
  }
}

// Singleton instance
export const aiRecommendations = new AIRecommendationEngine();
