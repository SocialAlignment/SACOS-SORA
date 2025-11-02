/**
 * Matrix Preview Table Component (Story 1.6, Task 1)
 *
 * AC#1: Screen 2 displays complete matrix with all combinations listed
 * AC#2: Each combination row shows Demographics + Aesthetics + Type + Messaging (human-readable)
 * AC#3: Exclude checkbox next to each combination
 */

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { type MatrixResult, type VideoCombination } from '@/types/dashboard';

export type MatrixPreviewTableProps = {
  matrixResult: MatrixResult;
  excludedCombinations: Set<string>;
  onToggleExclusion: (combinationId: string) => void;
};

// Generate unique ID for each combination
function generateCombinationId(combo: VideoCombination): string {
  return `${combo.funnelLevel}-${combo.aesthetic}-${combo.type}-${combo.intention}-${combo.mood}-${combo.audioStyle}-${combo.ageGeneration}-${combo.gender}-${combo.orientation}-${combo.lifeStage}-${combo.ethnicity}`;
}

// Format field values to human-readable labels
function formatFieldValue(value: string): string {
  // Convert kebab-case to Title Case
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function MatrixPreviewTable({
  matrixResult,
  excludedCombinations,
  onToggleExclusion,
}: MatrixPreviewTableProps) {
  const { combinations, totalCombinations } = matrixResult;
  const activeCount = totalCombinations - excludedCombinations.size;

  // Check if all combinations are excluded
  const allExcluded = excludedCombinations.size === totalCombinations;

  return (
    <div className='space-y-4'>
      {/* Header with count */}
      <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
        <CardHeader>
          <CardTitle className='flex items-center justify-between text-lg font-semibold text-[#f5f5f5]'>
            <span>Video Matrix Preview</span>
            <span className='text-sm font-normal text-[#f5f5f5]/70'>
              {activeCount} of {totalCombinations} videos selected
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-[#f5f5f5]/60'>
            Review each combination below. Uncheck any you wish to exclude from generation.
          </p>
        </CardContent>
      </Card>

      {/* Warning if all combinations excluded */}
      {allExcluded && (
        <Alert className='border-[#B7410E] bg-[#B7410E]/10'>
          <AlertDescription className='text-sm text-[#f5f5f5]'>
            ⚠️ All combinations are excluded. You must select at least one combination to proceed.
          </AlertDescription>
        </Alert>
      )}

      {/* Combinations table */}
      <Card className='border-[#f5f5f5]/10 bg-[#1a1a1a]'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='border-b border-[#f5f5f5]/10 bg-[#0a0a0a]/50'>
                <tr>
                  <th className='sticky left-0 z-10 bg-[#0a0a0a]/50 px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Include
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Funnel Level
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Aesthetic
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Type
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Intention
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Mood
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Audio Style
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Age Gen
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Gender
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Orient.
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Life Stage
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold text-[#f5f5f5]/70'>
                    Ethnicity
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#f5f5f5]/5'>
                {combinations.map((combo, index) => {
                  const comboId = generateCombinationId(combo);
                  const isExcluded = excludedCombinations.has(comboId);

                  return (
                    <tr
                      key={comboId}
                      className={`hover:bg-[#f5f5f5]/5 ${
                        isExcluded ? 'opacity-50' : ''
                      }`}
                    >
                      <td className='sticky left-0 z-10 bg-[#1a1a1a] px-4 py-3'>
                        <Checkbox
                          checked={!isExcluded}
                          onCheckedChange={() => onToggleExclusion(comboId)}
                          aria-label={`Include combination ${index + 1}`}
                        />
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.funnelLevel)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.aesthetic)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.type)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.intention)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.mood)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.audioStyle)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.ageGeneration)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.gender)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.orientation)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.lifeStage)}
                      </td>
                      <td className='px-4 py-3 text-[#f5f5f5]/80'>
                        {formatFieldValue(combo.ethnicity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
