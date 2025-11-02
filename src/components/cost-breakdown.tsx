/**
 * Cost Breakdown Component (Story 1.5, Task 3)
 *
 * AC#3: Cost breakdown expandable with itemized details
 * Shows Sora 2 API subtotal, LLM subtotal (GPT-5/Perplexity/Claude/Gemini), storage subtotal
 * Displays calculation methodology and transparent pricing formula
 */

'use client';

import * as React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Card, CardContent } from './ui/card';
import { formatCurrency } from '@/lib/cost-calculator';
import { type CostResult } from '@/types/dashboard';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export type CostBreakdownProps = {
  costResult: CostResult;
};

export function CostBreakdown({ costResult }: CostBreakdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
        <CollapsibleTrigger className='w-full'>
          <CardContent className='flex items-center justify-between p-4 hover:bg-[#f5f5f5]/5'>
            <div className='flex items-center gap-2'>
              {isOpen ? (
                <ChevronDown className='h-4 w-4 text-[#f5f5f5]/60' />
              ) : (
                <ChevronRight className='h-4 w-4 text-[#f5f5f5]/60' />
              )}
              <span className='text-sm font-medium text-[#f5f5f5]'>
                View Detailed Cost Breakdown
              </span>
            </div>
            <span className='text-xs text-[#f5f5f5]/60'>
              {costResult.videoCount} videos × {costResult.duration}s
            </span>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className='space-y-6 border-t border-[#f5f5f5]/10 p-4'>
            {/* Sora 2 API Breakdown */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <h4 className='text-sm font-semibold text-[#f5f5f5]'>Sora 2 API Costs</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className='h-3 w-3 text-[#f5f5f5]/40' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>
                        Sora 2 video generation charges based on model and duration
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className='rounded border border-[#f5f5f5]/10 bg-[#0a0a0a]/50 p-3'>
                <div className='space-y-2 text-xs text-[#f5f5f5]/70'>
                  <div className='flex justify-between'>
                    <span>Model:</span>
                    <span className='font-medium text-[#f5f5f5]'>{costResult.model}</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Duration per video:</span>
                    <span className='font-medium text-[#f5f5f5]'>{costResult.duration}s</span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Cost per video:</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.perVideoCost.soraApiCost)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Total videos:</span>
                    <span className='font-medium text-[#f5f5f5]'>{costResult.videoCount}</span>
                  </div>
                  <div className='mt-2 border-t border-[#f5f5f5]/10 pt-2'>
                    <div className='flex justify-between font-semibold'>
                      <span className='text-[#f5f5f5]'>Subtotal:</span>
                      <span className='text-[#5F9EA0]'>
                        {formatCurrency(costResult.soraApiSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='mt-3 rounded bg-[#f5f5f5]/5 p-2 text-xs text-[#f5f5f5]/50'>
                  <p className='font-mono'>
                    Calculation: {formatCurrency(costResult.perVideoCost.soraApiCost)} ×{' '}
                    {costResult.videoCount} videos = {formatCurrency(costResult.soraApiSubtotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* LLM Costs Breakdown */}
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <h4 className='text-sm font-semibold text-[#f5f5f5]'>LLM Costs</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className='h-3 w-3 text-[#f5f5f5]/40' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>
                        Language model costs for prompt generation, research, and validation
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className='rounded border border-[#f5f5f5]/10 bg-[#0a0a0a]/50 p-3'>
                <div className='space-y-2 text-xs text-[#f5f5f5]/70'>
                  <div className='flex justify-between'>
                    <span>GPT-5 Prompt Generation:</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.perVideoCost.llmCosts.gpt5)} × {costResult.videoCount} ={' '}
                      {formatCurrency(costResult.perVideoCost.llmCosts.gpt5 * costResult.videoCount)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Perplexity Research (cached):</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.perVideoCost.llmCosts.perplexity || 0.30)} × 1 batch ={' '}
                      {formatCurrency(0.30)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Claude Validation:</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.perVideoCost.llmCosts.claude)} × {costResult.videoCount} ={' '}
                      {formatCurrency(costResult.perVideoCost.llmCosts.claude * costResult.videoCount)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Gemini Fallback:</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.perVideoCost.llmCosts.gemini)} × {costResult.videoCount} ={' '}
                      {formatCurrency(costResult.perVideoCost.llmCosts.gemini * costResult.videoCount)}
                    </span>
                  </div>
                  <div className='mt-2 border-t border-[#f5f5f5]/10 pt-2'>
                    <div className='flex justify-between font-semibold'>
                      <span className='text-[#f5f5f5]'>Subtotal:</span>
                      <span className='text-[#5F9EA0]'>
                        {formatCurrency(costResult.llmSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className='mt-3 rounded bg-[#f5f5f5]/5 p-2 text-xs text-[#f5f5f5]/50'>
                  <p className='font-mono'>
                    Calculation: (GPT-5 + Claude) × {costResult.videoCount} + Perplexity batch
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Costs Breakdown (only show if using cloud storage) */}
            {costResult.storageSubtotal > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-semibold text-[#f5f5f5]'>Storage Costs</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className='h-3 w-3 text-[#f5f5f5]/40' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='text-xs'>
                          Cloud storage for generated video files
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className='rounded border border-[#f5f5f5]/10 bg-[#0a0a0a]/50 p-3'>
                  <div className='space-y-2 text-xs text-[#f5f5f5]/70'>
                    <div className='flex justify-between'>
                      <span>Estimated size per video:</span>
                      <span className='font-medium text-[#f5f5f5]'>
                        ~{Math.round((costResult.duration / 8) * 50)}MB
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Storage rate:</span>
                      <span className='font-medium text-[#f5f5f5]'>$0.02/GB/month</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Cost per video:</span>
                      <span className='font-medium text-[#f5f5f5]'>
                        {formatCurrency(costResult.perVideoCost.storageCost)}
                      </span>
                    </div>
                    <div className='mt-2 border-t border-[#f5f5f5]/10 pt-2'>
                      <div className='flex justify-between font-semibold'>
                        <span className='text-[#f5f5f5]'>Subtotal:</span>
                        <span className='text-[#5F9EA0]'>
                          {formatCurrency(costResult.storageSubtotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='mt-3 rounded bg-[#f5f5f5]/5 p-2 text-xs text-[#f5f5f5]/50'>
                    <p className='font-mono'>
                      Calculation: {formatCurrency(costResult.perVideoCost.storageCost)} ×{' '}
                      {costResult.videoCount} videos
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Local NAS Storage Note */}
            {costResult.storageSubtotal === 0 && (
              <div className='rounded border border-[#f5f5f5]/10 bg-[#0a0a0a]/50 p-3'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-sm font-semibold text-[#f5f5f5]'>Storage</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className='h-3 w-3 text-[#f5f5f5]/40' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='text-xs'>
                          Videos stored on local NAS - no recurring costs
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className='mt-2 text-xs text-[#f5f5f5]/60'>
                  Local NAS storage (no recurring costs)
                </p>
              </div>
            )}

            {/* Grand Total */}
            <div className='rounded-lg border-2 border-[#5F9EA0] bg-[#5F9EA0]/5 p-4'>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between text-[#f5f5f5]/70'>
                  <span>Sora 2 API:</span>
                  <span>{formatCurrency(costResult.soraApiSubtotal)}</span>
                </div>
                <div className='flex justify-between text-[#f5f5f5]/70'>
                  <span>LLM Costs:</span>
                  <span>{formatCurrency(costResult.llmSubtotal)}</span>
                </div>
                {costResult.storageSubtotal > 0 && (
                  <div className='flex justify-between text-[#f5f5f5]/70'>
                    <span>Storage:</span>
                    <span>{formatCurrency(costResult.storageSubtotal)}</span>
                  </div>
                )}
                <div className='border-t border-[#f5f5f5]/20 pt-2'>
                  <div className='flex justify-between text-lg font-bold'>
                    <span className='text-[#f5f5f5]'>Total Batch Cost:</span>
                    <span className='text-[#5F9EA0]'>
                      {formatCurrency(costResult.totalBatchCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Provider Attribution */}
            <div className='space-y-2'>
              <h4 className='text-sm font-semibold text-[#f5f5f5]'>Cost by Provider</h4>
              <div className='rounded border border-[#f5f5f5]/10 bg-[#0a0a0a]/50 p-3'>
                <div className='space-y-2 text-xs text-[#f5f5f5]/70'>
                  <div className='flex justify-between'>
                    <span>OpenAI (Sora 2 + GPT-5):</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.providerCosts.openai)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Anthropic (Claude):</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.providerCosts.anthropic)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Google (Gemini):</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.providerCosts.google)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Perplexity (Research):</span>
                    <span className='font-medium text-[#f5f5f5]'>
                      {formatCurrency(costResult.providerCosts.perplexity)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
