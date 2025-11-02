// Performance Analytics Engine (Story 1.8, Task 3)
// Analyzes campaign history to identify winning patterns and top performers

import { campaignApi, combinationApi } from './campaign-api';
import { type TestedCombination } from './campaign-db';

// Analytics result types
export type DimensionPerformance = {
  dimension: string; // e.g., "funnelLevel", "aesthetic"
  value: string; // e.g., "problem-aware", "ugc"
  totalTests: number;
  winnerCount: number;
  winnerRate: number; // 0-100 percentage
  avgEngagementRate: number;
  avgViews: number;
  avgWatchTime: number;
};

export type TopPerformer = {
  combination_id: string;
  campaign_id: string;
  dimension_values: TestedCombination['dimension_values'];
  organic_metrics: TestedCombination['organic_metrics'];
  engagement_rate: number;
  views: number;
};

export type BrandAnalytics = {
  totalCampaigns: number;
  totalVideos: number;
  totalWinners: number;
  overallWinnerRate: number;
  avgEngagementRate: number;
  avgViews: number;
  topPerformingDimensions: DimensionPerformance[];
};

// Performance Analytics Class
export class PerformanceAnalytics {
  /**
   * Analyze performance by dimension (AC#4)
   * Returns performance stats for each value within a dimension
   */
  async analyzeByDimension(
    brandId: string,
    dimension: keyof TestedCombination['dimension_values']
  ): Promise<DimensionPerformance[]> {
    // Story 3.5: Get all tested combinations from backend API
    const combinations = await combinationApi.getByBrand(brandId);

    // Group by dimension value
    const dimensionMap = new Map<string, TestedCombination[]>();

    combinations.forEach((combo) => {
      const value = combo.dimension_values[dimension];
      if (!dimensionMap.has(value)) {
        dimensionMap.set(value, []);
      }
      dimensionMap.get(value)!.push(combo);
    });

    // Calculate performance for each value
    const results: DimensionPerformance[] = [];

    for (const [value, combos] of Array.from(dimensionMap.entries())) {
      const totalTests = combos.length;
      const winnerCount = combos.filter((c) => c.winner_status === 'winner').length;
      const winnerRate = totalTests > 0 ? (winnerCount / totalTests) * 100 : 0;

      // Calculate average metrics (only from combinations with data)
      const combosWithMetrics = combos.filter(
        (c) => c.organic_metrics.engagement_rate !== undefined
      );

      const avgEngagementRate =
        combosWithMetrics.length > 0
          ? combosWithMetrics.reduce((sum, c) => sum + (c.organic_metrics.engagement_rate || 0), 0) /
            combosWithMetrics.length
          : 0;

      const avgViews =
        combosWithMetrics.length > 0
          ? combosWithMetrics.reduce((sum, c) => sum + (c.organic_metrics.views || 0), 0) /
            combosWithMetrics.length
          : 0;

      const avgWatchTime =
        combosWithMetrics.length > 0
          ? combosWithMetrics.reduce((sum, c) => sum + (c.organic_metrics.watch_time_avg || 0), 0) /
            combosWithMetrics.length
          : 0;

      results.push({
        dimension,
        value,
        totalTests,
        winnerCount,
        winnerRate,
        avgEngagementRate,
        avgViews,
        avgWatchTime
      });
    }

    // Sort by winner rate descending
    return results.sort((a, b) => b.winnerRate - a.winnerRate);
  }

  /**
   * Get top-performing combinations (AC#4)
   * Returns the N best-performing tested combinations
   */
  async getTopPerformers(brandId: string, limit: number = 10): Promise<TopPerformer[]> {
    // Story 3.5: Get combinations from backend API
    const combinations = await combinationApi.getByBrand(brandId);

    // Filter to only combinations with engagement metrics
    const withMetrics = combinations.filter(
      (c) => c.organic_metrics.engagement_rate !== undefined && c.organic_metrics.views !== undefined
    );

    // Sort by engagement rate, then by views
    const sorted = withMetrics.sort((a, b) => {
      const engagementDiff = (b.organic_metrics.engagement_rate || 0) - (a.organic_metrics.engagement_rate || 0);
      if (engagementDiff !== 0) return engagementDiff;
      return (b.organic_metrics.views || 0) - (a.organic_metrics.views || 0);
    });

    // Return top N
    return sorted.slice(0, limit).map((combo) => ({
      combination_id: combo.combination_id!,
      campaign_id: combo.campaign_id,
      dimension_values: combo.dimension_values,
      organic_metrics: combo.organic_metrics,
      engagement_rate: combo.organic_metrics.engagement_rate || 0,
      views: combo.organic_metrics.views || 0
    }));
  }

  /**
   * Calculate overall winner rate for a brand (AC#5)
   */
  async getWinnerRate(brandId: string): Promise<number> {
    // Story 3.5: Get combinations from backend API
    const combinations = await combinationApi.getByBrand(brandId);

    if (combinations.length === 0) return 0;

    const winnerCount = combinations.filter((c) => c.winner_status === 'winner').length;
    return (winnerCount / combinations.length) * 100;
  }

  /**
   * Calculate average organic metrics across all tested combinations (AC#5)
   */
  async calculateAvgMetrics(brandId: string): Promise<{
    avgEngagementRate: number;
    avgViews: number;
    avgShares: number;
    avgComments: number;
    avgWatchTime: number;
  }> {
    // Story 3.5: Get combinations from backend API
    const combinations = await combinationApi.getByBrand(brandId);

    // Filter to combinations with metrics
    const withMetrics = combinations.filter(
      (c) => c.organic_metrics.engagement_rate !== undefined || c.organic_metrics.views !== undefined
    );

    if (withMetrics.length === 0) {
      return {
        avgEngagementRate: 0,
        avgViews: 0,
        avgShares: 0,
        avgComments: 0,
        avgWatchTime: 0
      };
    }

    const totals = withMetrics.reduce(
      (acc, combo) => ({
        engagement: acc.engagement + (combo.organic_metrics.engagement_rate || 0),
        views: acc.views + (combo.organic_metrics.views || 0),
        shares: acc.shares + (combo.organic_metrics.shares || 0),
        comments: acc.comments + (combo.organic_metrics.comments || 0),
        watchTime: acc.watchTime + (combo.organic_metrics.watch_time_avg || 0)
      }),
      { engagement: 0, views: 0, shares: 0, comments: 0, watchTime: 0 }
    );

    const count = withMetrics.length;

    return {
      avgEngagementRate: totals.engagement / count,
      avgViews: totals.views / count,
      avgShares: totals.shares / count,
      avgComments: totals.comments / count,
      avgWatchTime: totals.watchTime / count
    };
  }

  /**
   * Get comprehensive brand analytics (AC#4, AC#5)
   * Combines all analytics into a single report
   */
  async getBrandAnalytics(brandId: string): Promise<BrandAnalytics> {
    // Story 3.5: Get campaigns and combinations from backend API
    const campaigns = await campaignApi.getByBrand(brandId);

    // Get combinations
    const combinations = await combinationApi.getByBrand(brandId);

    const totalWinners = combinations.filter((c) => c.winner_status === 'winner').length;
    const overallWinnerRate = combinations.length > 0 ? (totalWinners / combinations.length) * 100 : 0;

    // Calculate average metrics
    const avgMetrics = await this.calculateAvgMetrics(brandId);

    // Get top-performing dimensions across all dimension types
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

    const allDimensionPerformance: DimensionPerformance[] = [];

    for (const dim of dimensions) {
      const dimResults = await this.analyzeByDimension(brandId, dim);
      allDimensionPerformance.push(...dimResults);
    }

    // Sort by winner rate and take top 10
    const topPerformingDimensions = allDimensionPerformance
      .sort((a, b) => b.winnerRate - a.winnerRate)
      .slice(0, 10);

    return {
      totalCampaigns: campaigns.length,
      totalVideos: combinations.length,
      totalWinners,
      overallWinnerRate,
      avgEngagementRate: avgMetrics.avgEngagementRate,
      avgViews: avgMetrics.avgViews,
      topPerformingDimensions
    };
  }

  /**
   * Identify dimension values that consistently underperform (AC#4)
   * Returns dimension values with winner rate below threshold
   */
  async getUnderperformingDimensions(
    brandId: string,
    threshold: number = 20 // Winner rate threshold (default 20%)
  ): Promise<DimensionPerformance[]> {
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

    const underperforming: DimensionPerformance[] = [];

    for (const dim of dimensions) {
      const dimResults = await this.analyzeByDimension(brandId, dim);
      // Filter to values with at least 3 tests (statistically meaningful)
      const filtered = dimResults.filter((d) => d.totalTests >= 3 && d.winnerRate < threshold);
      underperforming.push(...filtered);
    }

    // Sort by winner rate ascending (worst performers first)
    return underperforming.sort((a, b) => a.winnerRate - b.winnerRate);
  }

  /**
   * Compare two dimension values head-to-head (AC#4)
   * Useful for A/B testing analysis
   */
  async compareDimensionValues(
    brandId: string,
    dimension: keyof TestedCombination['dimension_values'],
    value1: string,
    value2: string
  ): Promise<{
    value1Performance: DimensionPerformance | null;
    value2Performance: DimensionPerformance | null;
    winner: string | 'tie';
    winnerBy: number; // Percentage point difference
  }> {
    const allResults = await this.analyzeByDimension(brandId, dimension);

    const value1Performance = allResults.find((r) => r.value === value1) || null;
    const value2Performance = allResults.find((r) => r.value === value2) || null;

    if (!value1Performance || !value2Performance) {
      return {
        value1Performance,
        value2Performance,
        winner: 'tie',
        winnerBy: 0
      };
    }

    const diff = value1Performance.winnerRate - value2Performance.winnerRate;

    return {
      value1Performance,
      value2Performance,
      winner: Math.abs(diff) < 5 ? 'tie' : diff > 0 ? value1 : value2,
      winnerBy: Math.abs(diff)
    };
  }
}

// Singleton instance
export const performanceAnalytics = new PerformanceAnalytics();
