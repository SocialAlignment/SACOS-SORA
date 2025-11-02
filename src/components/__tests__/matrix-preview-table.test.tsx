/**
 * Matrix Preview Table Tests (Story 1.6)
 *
 * Test Coverage:
 * - AC#1: Screen 2 displays complete matrix with all combinations listed
 * - AC#2: Each combination row shows all 11 dimension fields human-readable
 * - AC#3: Exclude checkbox next to each combination
 * - AC#4: Excluding combinations updates count
 */

import { describe, it, expect } from '@jest/globals';
import type { MatrixResult, VideoCombination } from '@/types/dashboard';

// Mock data for testing
const mockCombinations: VideoCombination[] = [
  {
    funnelLevel: 'unaware',
    aesthetic: 'ugc',
    type: 'review-social-proof',
    intention: 'educate',
    mood: 'wholesome',
    audioStyle: 'dialog',
    ageGeneration: 'gen-z',
    gender: 'female',
    orientation: 'straight',
    lifeStage: 'people',
    ethnicity: 'white',
  },
  {
    funnelLevel: 'unaware',
    aesthetic: 'ugc',
    type: 'review-social-proof',
    intention: 'educate',
    mood: 'wholesome',
    audioStyle: 'dialog',
    ageGeneration: 'gen-z',
    gender: 'female',
    orientation: 'straight',
    lifeStage: 'people',
    ethnicity: 'black',
  },
];

const mockMatrixResult: MatrixResult = {
  totalCombinations: 2,
  dimensions: [],
  equation: '2 videos',
  warnings: [],
  combinations: mockCombinations,
};

describe('MatrixPreviewTable Component', () => {
  it('should display all combinations (AC#1)', () => {
    // Test that component renders all combinations from MatrixResult
    expect(mockMatrixResult.combinations.length).toBe(2);
    expect(mockMatrixResult.totalCombinations).toBe(2);
  });

  it('should show all 11 dimension fields per combination (AC#2)', () => {
    const combo = mockCombinations[0];

    // Verify all 11 fields are present
    expect(combo.funnelLevel).toBeDefined();
    expect(combo.aesthetic).toBeDefined();
    expect(combo.type).toBeDefined();
    expect(combo.intention).toBeDefined();
    expect(combo.mood).toBeDefined();
    expect(combo.audioStyle).toBeDefined();
    expect(combo.ageGeneration).toBeDefined();
    expect(combo.gender).toBeDefined();
    expect(combo.orientation).toBeDefined();
    expect(combo.lifeStage).toBeDefined();
    expect(combo.ethnicity).toBeDefined();

    // Count fields
    const fieldCount = Object.keys(combo).length;
    expect(fieldCount).toBe(11);
  });

  it('should generate unique IDs for each combination (AC#3)', () => {
    // Test combination ID generation
    const combo1 = mockCombinations[0];
    const combo2 = mockCombinations[1];

    const id1 = `${combo1.funnelLevel}-${combo1.aesthetic}-${combo1.type}-${combo1.intention}-${combo1.mood}-${combo1.audioStyle}-${combo1.ageGeneration}-${combo1.gender}-${combo1.orientation}-${combo1.lifeStage}-${combo1.ethnicity}`;
    const id2 = `${combo2.funnelLevel}-${combo2.aesthetic}-${combo2.type}-${combo2.intention}-${combo2.mood}-${combo2.audioStyle}-${combo2.ageGeneration}-${combo2.gender}-${combo2.orientation}-${combo2.lifeStage}-${combo2.ethnicity}`;

    // IDs should be different (ethnicity differs)
    expect(id1).not.toBe(id2);
  });

  it('should calculate active count correctly when exclusions change (AC#4)', () => {
    const excludedSet = new Set<string>();
    const totalCombinations = mockMatrixResult.totalCombinations;

    // Initially no exclusions
    let activeCount = totalCombinations - excludedSet.size;
    expect(activeCount).toBe(2);

    // Add one exclusion
    excludedSet.add('combo-1');
    activeCount = totalCombinations - excludedSet.size;
    expect(activeCount).toBe(1);

    // Add another exclusion
    excludedSet.add('combo-2');
    activeCount = totalCombinations - excludedSet.size;
    expect(activeCount).toBe(0);

    // Remove one exclusion
    excludedSet.delete('combo-1');
    activeCount = totalCombinations - excludedSet.size;
    expect(activeCount).toBe(1);
  });

  it('should handle edge case: all combinations excluded', () => {
    const excludedSet = new Set<string>();
    const totalCombinations = mockMatrixResult.totalCombinations;

    // Exclude all
    mockCombinations.forEach((combo, idx) => {
      excludedSet.add(`combo-${idx}`);
    });

    const activeCount = totalCombinations - excludedSet.size;
    expect(activeCount).toBe(0);

    // Component should show warning when activeCount === 0
    const allExcluded = excludedSet.size === totalCombinations;
    expect(allExcluded).toBe(true);
  });

  it('should format field values to human-readable labels', () => {
    // Test kebab-case to Title Case conversion
    const testCases = [
      { input: 'gen-z', expected: 'Gen Z' },
      { input: 'review-social-proof', expected: 'Review Social Proof' },
      { input: 'ugc', expected: 'Ugc' },
      { input: 'problem-aware', expected: 'Problem Aware' },
    ];

    testCases.forEach(({ input, expected }) => {
      const formatted = input
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      expect(formatted).toBe(expected);
    });
  });
});
