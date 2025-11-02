/**
 * Cost Summary Component (Story 1.5, Task 2)
 *
 * AC#2: Total batch cost displayed prominently (e.g., "$102 for 12 videos")
 * Positioned above "Approve & Generate" button for clear visibility
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { formatCurrency, formatCostSummary, formatPerVideoAverage } from '@/lib/cost-calculator';
import { type CostResult, type WalletValidationResult } from '@/types/dashboard';
import { formatProviderName, getAddCreditsUrl } from '@/lib/wallet-balance';

export type CostSummaryProps = {
  costResult: CostResult | null;
  walletValidation?: WalletValidationResult | null;
  isLoading?: boolean;
};

export function CostSummary({ costResult, walletValidation, isLoading }: CostSummaryProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold text-[#f5f5f5]'>
            💰 Batch Cost Estimate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-[#f5f5f5]/60'>Calculating costs...</p>
        </CardContent>
      </Card>
    );
  }

  // No cost result yet
  if (!costResult) {
    return null;
  }

  // AC#2: Display total batch cost prominently
  const summary = formatCostSummary(costResult);
  const perVideoAvg = formatPerVideoAverage(costResult);

  // Check for pricing staleness warning (Task 5)
  const showStalenessWarning = costResult.pricingStale;

  // Check for insufficient funds (AC#6)
  const hasInsufficientFunds = walletValidation && !walletValidation.allSufficient;
  const insufficientProviders = walletValidation?.insufficientProviders || [];

  return (
    <div className='space-y-4'>
      {/* Main cost summary card */}
      <Card className='border-[#f5f5f5]/20 bg-[#1a1a1a]'>
        <CardHeader>
          <CardTitle className='text-lg font-semibold text-[#f5f5f5]'>
            💰 Batch Cost Estimate
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Prominent total cost display */}
          <div className='rounded-lg border-2 border-[#5F9EA0] bg-[#5F9EA0]/10 p-4'>
            <div className='text-center'>
              <p className='text-3xl font-bold text-[#f5f5f5]'>{summary}</p>
              <p className='mt-1 text-sm text-[#f5f5f5]/70'>{perVideoAvg}</p>
            </div>
          </div>

          {/* Quick breakdown */}
          <div className='space-y-2 text-sm text-[#f5f5f5]/80'>
            <div className='flex justify-between'>
              <span>Sora 2 API ({costResult.model}):</span>
              <span className='font-medium text-[#f5f5f5]'>
                {formatCurrency(costResult.soraApiSubtotal)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>LLM Costs (GPT-5, Claude):</span>
              <span className='font-medium text-[#f5f5f5]'>
                {formatCurrency(costResult.llmSubtotal)}
              </span>
            </div>
            {costResult.storageSubtotal > 0 && (
              <div className='flex justify-between'>
                <span>Storage:</span>
                <span className='font-medium text-[#f5f5f5]'>
                  {formatCurrency(costResult.storageSubtotal)}
                </span>
              </div>
            )}
            {costResult.storageSubtotal === 0 && (
              <div className='flex justify-between'>
                <span>Storage:</span>
                <span className='text-xs text-[#f5f5f5]/60'>
                  Local NAS (no cost)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing staleness warning (Task 5) */}
      {showStalenessWarning && (
        <Alert className='border-[#B7410E] bg-[#B7410E]/10'>
          <AlertDescription className='text-sm text-[#f5f5f5]'>
            ⚠️ Pricing data may be outdated (last updated &gt;30 days ago). Please verify current
            API rates before proceeding.
          </AlertDescription>
        </Alert>
      )}

      {/* Insufficient funds warning (AC#6) */}
      {hasInsufficientFunds && (
        <Alert className='border-[#B7410E] bg-[#B7410E]/10'>
          <AlertDescription className='space-y-3 text-sm text-[#f5f5f5]'>
            <p className='font-semibold'>
              ⚠️ Insufficient API credits across {insufficientProviders.length} provider
              {insufficientProviders.length === 1 ? '' : 's'}
            </p>

            {walletValidation.validations
              .filter(v => !v.sufficient)
              .map(validation => (
                <div
                  key={validation.provider}
                  className='rounded border border-[#f5f5f5]/20 bg-[#0a0a0a]/50 p-3'
                >
                  <p className='font-medium text-[#f5f5f5]'>
                    {formatProviderName(validation.provider)}:
                  </p>
                  <div className='mt-1 space-y-1 text-xs text-[#f5f5f5]/70'>
                    <p>Required: {formatCurrency(validation.required)}</p>
                    <p>Available: {formatCurrency(validation.available)}</p>
                    <p className='font-medium text-[#B7410E]'>
                      Shortfall: {formatCurrency(validation.shortfall)}
                    </p>
                  </div>
                  <a
                    href={getAddCreditsUrl(validation.provider)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-2 inline-block text-xs text-[#5F9EA0] hover:underline'
                  >
                    Add {formatProviderName(validation.provider)} Credits →
                  </a>
                </div>
              ))}

            <p className='text-xs text-[#f5f5f5]/60'>
              Please add credits to continue. Generation will be blocked until all providers have
              sufficient funds.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Provider balance breakdown (when sufficient) */}
      {walletValidation && walletValidation.allSufficient && (
        <div className='rounded-lg border border-[#f5f5f5]/10 bg-[#1a1a1a]/50 p-3'>
          <p className='mb-2 text-xs font-medium text-[#f5f5f5]/70'>Provider Cost Breakdown:</p>
          <div className='space-y-1 text-xs text-[#f5f5f5]/60'>
            {walletValidation.validations.map(validation => (
              <div key={validation.provider} className='flex justify-between'>
                <span>{formatProviderName(validation.provider)}:</span>
                <span>
                  {formatCurrency(validation.required)} / {formatCurrency(validation.available)}{' '}
                  available
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
