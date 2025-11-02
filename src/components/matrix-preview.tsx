import * as React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

import type { MatrixResult } from '@/types/dashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface MatrixPreviewProps {
    result: MatrixResult | null;
    isLoading?: boolean;
}

/**
 * Matrix Preview Component (Story 1.4, AC#2)
 * Displays calculated video variations with equation, breakdown, and warnings
 */
export function MatrixPreview({ result, isLoading }: MatrixPreviewProps) {
    if (isLoading) {
        return (
            <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <span className='text-lg font-semibold text-[#f5f5f5]'>
                            📊 Video Matrix Preview
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-[#f5f5f5]/60'>Calculating combinations...</p>
                </CardContent>
            </Card>
        );
    }

    if (!result || result.totalCombinations === 0) {
        return (
            <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <span className='text-lg font-semibold text-[#f5f5f5]'>
                            📊 Video Matrix Preview
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-[#f5f5f5]/60'>
                        Select options across multiple dimensions to calculate video variations
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <span className='text-lg font-semibold text-[#f5f5f5]'>
                        📊 Video Matrix Preview
                    </span>
                </div>
            </CardHeader>

            <CardContent className='space-y-4'>
                {/* Equation Display */}
                <div className='rounded-md border border-[#f5f5f5]/10 bg-[#0a0a0a] p-4'>
                    <p className='text-center text-xl font-bold text-[#f5f5f5]'>{result.equation}</p>
                </div>

                {/* Dimension Breakdown */}
                <div>
                    <h4 className='mb-2 text-sm font-medium text-[#f5f5f5]'>Breakdown:</h4>
                    <ul className='space-y-1 text-sm text-[#f5f5f5]/80'>
                        {result.dimensions.map((dim, idx) => (
                            <li key={idx}>
                                <span className='font-medium text-[#f5f5f5]'>{dim.label}:</span>{' '}
                                {dim.count > 0 ? (
                                    dim.label === 'Demographics' ? (
                                        <span className='text-[#f5f5f5]/60'>{dim.selections[0]}</span>
                                    ) : (
                                        <span className='text-[#f5f5f5]/60'>{dim.selections.join(', ')}</span>
                                    )
                                ) : (
                                    <span className='italic text-[#f5f5f5]/40'>None selected</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Warnings */}
                {result.warnings.length > 0 && (
                    <div className='space-y-2'>
                        {result.warnings.map((warning, idx) => (
                            <Alert
                                key={idx}
                                variant={warning.severity === 'critical' ? 'destructive' : 'default'}
                                className={cn(
                                    'border',
                                    warning.severity === 'critical'
                                        ? 'border-[#B7410E]/30 bg-[#B7410E]/10'
                                        : 'border-[#5F9EA0]/30 bg-[#5F9EA0]/10'
                                )}
                            >
                                <div className='flex items-start gap-2'>
                                    {warning.severity === 'critical' ? (
                                        <AlertTriangle className='h-4 w-4 text-[#B7410E]' />
                                    ) : (
                                        <Info className='h-4 w-4 text-[#5F9EA0]' />
                                    )}
                                    <div className='flex-1'>
                                        <AlertDescription className='text-sm'>
                                            <strong className='font-semibold'>{warning.message}</strong>
                                            {warning.details && (
                                                <p className='mt-1 text-xs opacity-80'>{warning.details}</p>
                                            )}
                                        </AlertDescription>
                                    </div>
                                </div>
                            </Alert>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
