/**
 * Winning Formula Insights Component (Story 1.8, Task 6, AC#5)
 *
 * Displays performance analytics and insights after batch completion
 * Shows top performers, underperformers, and actionable recommendations
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Info, TrendingUp, TrendingDown, Target, Sparkles } from 'lucide-react';
import type { BrandAnalytics, DimensionPerformance } from '@/lib/performance-analytics';

export type WinningFormulaInsightsProps = {
  brandId: string;
  analytics: BrandAnalytics;
  onClose?: () => void;
};

export function WinningFormulaInsights({ brandId, analytics, onClose }: WinningFormulaInsightsProps) {
  const {
    totalCampaigns,
    totalVideos,
    totalWinners,
    overallWinnerRate,
    avgEngagementRate,
    avgViews,
    topPerformingDimensions
  } = analytics;

  // Separate top performers (winner rate > 60%) and underperformers (winner rate < 30%)
  const topPerformers = topPerformingDimensions.filter((d) => d.winnerRate >= 60);
  const underperformers = topPerformingDimensions.filter(
    (d) => d.winnerRate < 30 && d.totalTests >= 3
  );

  // Format dimension name for display
  const formatDimensionName = (dim: string): string => {
    return dim
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  // Format dimension value for display
  const formatValue = (value: string): string => {
    return value
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className='space-y-6'>
      {/* Header Card */}
      <Card className='border-[#5F9EA0] bg-[#1a1a1a]'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2 text-2xl font-bold text-[#f5f5f5]'>
                <Sparkles className='h-6 w-6 text-[#5F9EA0]' />
                Winning Formula Insights
              </CardTitle>
              <CardDescription className='mt-2 text-[#f5f5f5]/60'>
                Performance analytics based on {totalCampaigns} campaigns ({totalVideos} videos tested)
              </CardDescription>
            </div>
            {onClose && (
              <Button variant='outline' onClick={onClose} className='border-[#f5f5f5]/20 text-[#f5f5f5]'>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Overall Performance */}
      <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg font-semibold text-[#f5f5f5]'>
            <Target className='h-5 w-5 text-[#5F9EA0]' />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-1'>
            <p className='text-sm text-[#f5f5f5]/60'>Winner Rate</p>
            <p className='text-2xl font-bold text-[#5F9EA0]'>{overallWinnerRate.toFixed(1)}%</p>
            <p className='text-xs text-[#f5f5f5]/60'>
              {totalWinners} / {totalVideos} videos
            </p>
          </div>
          <div className='space-y-1'>
            <p className='text-sm text-[#f5f5f5]/60'>Avg Engagement</p>
            <p className='text-2xl font-bold text-[#f5f5f5]'>{avgEngagementRate.toFixed(1)}%</p>
            <p className='text-xs text-[#f5f5f5]/60'>Across all videos</p>
          </div>
          <div className='space-y-1'>
            <p className='text-sm text-[#f5f5f5]/60'>Avg Views</p>
            <p className='text-2xl font-bold text-[#f5f5f5]'>{avgViews.toLocaleString()}</p>
            <p className='text-xs text-[#f5f5f5]/60'>Per video</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <Card className='border-green-500/30 bg-[#1a1a1a]'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold text-[#f5f5f5]'>
              <TrendingUp className='h-5 w-5 text-green-500' />
              Top Performers
            </CardTitle>
            <CardDescription className='text-[#f5f5f5]/60'>
              Dimensions with consistently high success rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {topPerformers.slice(0, 5).map((performer, index) => (
                <div
                  key={`${performer.dimension}-${performer.value}`}
                  className='flex items-center justify-between rounded-lg bg-[#0a0a0a] p-3'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-[#f5f5f5]'>
                      <span className='text-[#5F9EA0]'>{formatValue(performer.value)}</span>
                      <span className='text-sm text-[#f5f5f5]/60'>
                        {' '}
                        ({formatDimensionName(performer.dimension)})
                      </span>
                    </p>
                    <p className='text-sm text-[#f5f5f5]/60'>
                      {performer.winnerCount} winners in {performer.totalTests} tests • Avg engagement:{' '}
                      {performer.avgEngagementRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className='ml-4 text-right'>
                    <p className='text-xl font-bold text-green-500'>{performer.winnerRate.toFixed(0)}%</p>
                    <p className='text-xs text-[#f5f5f5]/60'>Success Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Underperformers */}
      {underperformers.length > 0 && (
        <Card className='border-[#B7410E]/30 bg-[#1a1a1a]'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold text-[#f5f5f5]'>
              <TrendingDown className='h-5 w-5 text-[#B7410E]' />
              Underperformers
            </CardTitle>
            <CardDescription className='text-[#f5f5f5]/60'>
              Dimensions that may need reevaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {underperformers.slice(0, 3).map((underperformer) => (
                <div
                  key={`${underperformer.dimension}-${underperformer.value}`}
                  className='flex items-center justify-between rounded-lg bg-[#0a0a0a] p-3'
                >
                  <div className='flex-1'>
                    <p className='font-medium text-[#f5f5f5]'>
                      <span className='text-[#B7410E]'>{formatValue(underperformer.value)}</span>
                      <span className='text-sm text-[#f5f5f5]/60'>
                        {' '}
                        ({formatDimensionName(underperformer.dimension)})
                      </span>
                    </p>
                    <p className='text-sm text-[#f5f5f5]/60'>
                      {underperformer.winnerCount} winners in {underperformer.totalTests} tests
                    </p>
                  </div>
                  <div className='ml-4 text-right'>
                    <p className='text-xl font-bold text-[#B7410E]'>
                      {underperformer.winnerRate.toFixed(0)}%
                    </p>
                    <p className='text-xs text-[#f5f5f5]/60'>Success Rate</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Alert */}
      {topPerformers.length === 0 && underperformers.length === 0 && (
        <Alert className='border-[#5F9EA0]/30 bg-[#1a1a1a]'>
          <Info className='h-4 w-4 text-[#5F9EA0]' />
          <AlertDescription className='text-[#f5f5f5]'>
            Not enough data yet to show performance insights. Complete at least 3 campaigns with organic
            metrics to see winning formula analysis.
          </AlertDescription>
        </Alert>
      )}

      {/* Actionable Recommendations */}
      {topPerformers.length > 0 && (
        <Card className='border-[#5F9EA0]/30 bg-[#1a1a1a]'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg font-semibold text-[#f5f5f5]'>
              <Sparkles className='h-5 w-5 text-[#5F9EA0]' />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='space-y-2 text-sm text-[#f5f5f5]/80'>
              {topPerformers.slice(0, 3).map((performer, index) => (
                <li key={index} className='flex items-start gap-2'>
                  <span className='mt-1 text-[#5F9EA0]'>•</span>
                  <span>
                    Continue using <span className='font-semibold text-[#5F9EA0]'>{formatValue(performer.value)}</span> for{' '}
                    {formatDimensionName(performer.dimension)} - it has a{' '}
                    <span className='font-semibold'>{performer.winnerRate.toFixed(0)}%</span> success rate
                  </span>
                </li>
              ))}
              {underperformers.length > 0 && (
                <li className='flex items-start gap-2'>
                  <span className='mt-1 text-[#B7410E]'>•</span>
                  <span>
                    Consider avoiding <span className='font-semibold text-[#B7410E]'>{formatValue(underperformers[0].value)}</span> for{' '}
                    {formatDimensionName(underperformers[0].dimension)} - it has only a{' '}
                    <span className='font-semibold'>{underperformers[0].winnerRate.toFixed(0)}%</span> success rate
                  </span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
