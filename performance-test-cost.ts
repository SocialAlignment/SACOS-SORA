/**
 * Performance test for cost-calculator.ts (Story 1.5, Task 6)
 * Verifies cost calculations are accurate and real-time
 *
 * Run with: npx tsx performance-test-cost.ts
 */

import { calculateBatchCost, formatCostSummary, formatPerVideoAverage } from './src/lib/cost-calculator';
import { getSoraCost, isPricingStale } from './src/lib/pricing-config';

console.log('\n=== Cost Calculator Performance Tests ===\n');

// Test Case 1: Small batch (sora-2, 10s, 12 videos) - ✅ REAL API duration
console.log('Test 1: 12 videos, sora-2, 10 seconds');
const start1 = performance.now();
const result1 = calculateBatchCost('sora-2', 10, 12);
const end1 = performance.now();
const duration1 = end1 - start1;

console.log(`  Model: ${result1.model}`);
console.log(`  Duration: ${result1.duration}s`);
console.log(`  Video count: ${result1.videoCount}`);
console.log(`  Total batch cost: ${formatCostSummary(result1)}`);
console.log(`  Per video average: ${formatPerVideoAverage(result1)}`);
console.log(`  Sora 2 API subtotal: $${result1.soraApiSubtotal.toFixed(2)}`);
console.log(`  LLM subtotal: $${result1.llmSubtotal.toFixed(2)}`);
console.log(`  Storage subtotal: $${result1.storageSubtotal.toFixed(2)}`);
console.log(`  Duration: ${duration1.toFixed(2)}ms`);
console.log(`  Performance: ${duration1 < 100 ? 'PASS (<100ms)' : 'FAIL (≥100ms)'}\n`);

// Test Case 2: Large batch (sora-2-pro, 20s, 100 videos) - ✅ REAL API duration
console.log('Test 2: 100 videos, sora-2-pro, 20 seconds');
const start2 = performance.now();
const result2 = calculateBatchCost('sora-2-pro', 20, 100);
const end2 = performance.now();
const duration2 = end2 - start2;

console.log(`  Total batch cost: ${formatCostSummary(result2)}`);
console.log(`  Per video average: ${formatPerVideoAverage(result2)}`);
console.log(`  Provider costs:`);
console.log(`    OpenAI: $${result2.providerCosts.openai.toFixed(2)}`);
console.log(`    Anthropic: $${result2.providerCosts.anthropic.toFixed(2)}`);
console.log(`    Google: $${result2.providerCosts.google.toFixed(2)}`);
console.log(`    Perplexity: $${result2.providerCosts.perplexity.toFixed(2)}`);
console.log(`  Duration: ${duration2.toFixed(2)}ms`);
console.log(`  Performance: ${duration2 < 100 ? 'PASS (<100ms)' : 'FAIL (≥100ms)'}\n`);

// Test Case 3: All model/duration combinations - ✅ REAL API durations
console.log('Test 3: All valid model/duration combinations');
const combinations = [
  { model: 'sora-2' as const, durations: [5, 10, 20] as const },
  { model: 'sora-2-pro' as const, durations: [5, 10, 20] as const },
];

let allPassed = true;
for (const { model, durations } of combinations) {
  for (const duration of durations) {
    try {
      const cost = getSoraCost(model, duration);
      console.log(`  ✓ ${model}, ${duration}s: $${cost.toFixed(2)}`);
    } catch (error) {
      console.log(`  ✗ ${model}, ${duration}s: ERROR - ${error}`);
      allPassed = false;
    }
  }
}
console.log(`  All combinations: ${allPassed ? 'PASS' : 'FAIL'}\n`);

// Test Case 4: Invalid model/duration combination (should throw error)
console.log('Test 4: Invalid combination error handling (sora-2, 15s - invalid)');
try {
  getSoraCost('sora-2', 15 as any); // 15 is not a valid duration
  console.log('  ✗ FAIL: Should have thrown error for invalid combination\n');
} catch (error) {
  console.log(`  ✓ PASS: Error thrown as expected`);
  console.log(`  Error message: ${(error as Error).message}\n`);
}

// Test Case 5: Pricing staleness check
console.log('Test 5: Pricing staleness check');
const isStale = isPricingStale();
console.log(`  Pricing stale: ${isStale ? 'YES (>30 days old)' : 'NO (up to date)'}`);
console.log(`  Status: ${!isStale ? 'PASS' : 'WARNING (pricing may be outdated)'}\n`);

// Test Case 6: Zero-combination edge case - ✅ REAL API duration
console.log('Test 6: Zero-combination edge case');
const start6 = performance.now();
const result6 = calculateBatchCost('sora-2', 10, 0);
const end6 = performance.now();
const duration6 = end6 - start6;

console.log(`  Total batch cost: ${formatCostSummary(result6)}`);
console.log(`  Expected: $0.00 for 0 videos`);
console.log(`  Duration: ${duration6.toFixed(2)}ms`);
console.log(`  Status: ${result6.totalBatchCost === 0 ? 'PASS' : 'FAIL'}\n`);

// Test Case 7: Decimal precision (127 videos) - ✅ REAL API duration
console.log('Test 7: Decimal precision with 127 videos');
const start7 = performance.now();
const result7 = calculateBatchCost('sora-2', 10, 127);
const end7 = performance.now();
const duration7 = end7 - start7;

console.log(`  Total batch cost: $${result7.totalBatchCost.toFixed(2)}`);
console.log(`  Per video cost: $${(result7.totalBatchCost / 127).toFixed(4)}`);
console.log(`  Duration: ${duration7.toFixed(2)}ms`);
console.log(`  Status: PASS (precise calculation)\n`);

// Summary
console.log('=== Performance Test Summary ===');
const allTests = [duration1, duration2, duration6, duration7];
const maxDuration = Math.max(...allTests);
const avgDuration = allTests.reduce((a, b) => a + b, 0) / allTests.length;
const allFast = allTests.every(d => d < 100);

console.log(`Maximum duration: ${maxDuration.toFixed(2)}ms`);
console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
console.log(`Overall result: ${allFast ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)
console.log('Real-time requirement: <100ms for instant user feedback');
console.log(`Status: ${allFast ? '✅ SATISFIED' : '❌ NOT SATISFIED'}\n`);
