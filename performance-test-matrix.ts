/**
 * Performance test for matrix-calculator.ts (Story 1.4, Task 6)
 * Verifies NFR001: Calculation completes in <1 second for up to 100 combinations
 *
 * Run with: npx tsx performance-test-matrix.ts
 */

import { calculateMatrixCombinations } from './src/lib/matrix-calculator';

console.log('\n=== Matrix Calculator Performance Tests ===\n');

// Test Case 1: Exactly 100 combinations
console.log('Test 1: 100 combinations (2 × 5 × 2 × 1 × 1 × 1 × (5 × 2 × 1 × 1 × 1))');
const start1 = performance.now();
const result1 = calculateMatrixCombinations(
    ['awareness', 'consideration'], // 2
    ['ugc', 'cinema', 'animated-2d', 'animated-3d', 'professional'], // 5
    ['review-social-proof', 'broll-visual-narrative'], // 2
    ['educate'], // 1
    ['wholesome'], // 1
    ['dialog'], // 1
    ['gen-z', 'millennial', 'gen-x', 'baby-boomer', 'gen-alpha'], // 5
    ['male', 'female'], // 2
    [], // orientation optional (counts as 1)
    [], // lifeStage optional (counts as 1)
    ['white'] // 1
);
const end1 = performance.now();
const duration1 = end1 - start1;

console.log(`✓ Result: ${result1.totalCombinations} combinations`);
console.log(`✓ Duration: ${duration1.toFixed(2)}ms`);
console.log(`✓ Performance: ${duration1 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Test Case 2: 50 combinations (large batch warning threshold)
console.log('Test 2: 50 combinations - large batch warning threshold');
const start2 = performance.now();
const result2 = calculateMatrixCombinations(
    ['awareness'], // 1
    ['ugc', 'cinema', 'animated-2d', 'animated-3d', 'professional'], // 5
    ['review-social-proof', 'broll-visual-narrative'], // 2
    ['educate'], // 1
    ['wholesome'], // 1
    ['dialog'], // 1
    ['gen-z', 'millennial', 'gen-x', 'baby-boomer', 'gen-alpha'], // 5
    ['male', 'female'], // 2
    [], // orientation optional
    [], // lifeStage optional
    ['white'] // 1
);
const end2 = performance.now();
const duration2 = end2 - start2;

console.log(`✓ Result: ${result2.totalCombinations} combinations`);
console.log(`✓ Duration: ${duration2.toFixed(2)}ms`);
console.log(`✓ Large batch warning: ${result2.warnings.some(w => w.type === 'large_batch') ? 'YES (expected)' : 'NO (unexpected)'}`);
console.log(`✓ Performance: ${duration2 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Test Case 3: Small matrix (8 combinations)
console.log('Test 3: 8 combinations - small matrix');
const start3 = performance.now();
const result3 = calculateMatrixCombinations(
    ['awareness'], // 1
    ['ugc', 'cinema'], // 2
    ['review-social-proof'], // 1
    ['educate'], // 1
    ['wholesome'], // 1
    ['dialog'], // 1
    ['gen-z', 'millennial'], // 2
    ['male', 'female'], // 2
    [], // orientation optional
    [], // lifeStage optional
    ['white'] // 1
);
const end3 = performance.now();
const duration3 = end3 - start3;

console.log(`✓ Result: ${result3.totalCombinations} combinations`);
console.log(`✓ Duration: ${duration3.toFixed(2)}ms`);
console.log(`✓ Warnings: ${result3.warnings.length} (expected 0 for small batch)`);
console.log(`✓ Performance: ${duration3 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Test Case 4: Large theoretical matrix (1000 combinations limit)
console.log('Test 4: 1600 combinations - testing count calculation without full generation');
const start4 = performance.now();
const result4 = calculateMatrixCombinations(
    ['awareness', 'consideration', 'decision', 'purchase', 'retention'], // 5
    ['ugc', 'cinema', 'animated-2d', 'professional'], // 4
    ['review-social-proof', 'broll-visual-narrative'], // 2
    ['educate', 'entertain'], // 2
    ['wholesome', 'intense'], // 2
    ['dialog', 'vo'], // 2
    ['gen-z', 'millennial', 'gen-x', 'baby-boomer', 'gen-alpha'], // 5
    ['male', 'female'], // 2
    [], // orientation optional
    [], // lifeStage optional
    ['white'] // 1
);
const end4 = performance.now();
const duration4 = end4 - start4;

console.log(`✓ Result: ${result4.totalCombinations} combinations (count only)`);
console.log(`✓ Full combinations generated: ${result4.combinations.length} (expected 0 for >1000)`);
console.log(`✓ Duration: ${duration4.toFixed(2)}ms`);
console.log(`✓ Performance: ${duration4 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Test Case 5: With optional orientation and lifeStage selected
console.log('Test 5: 16 combinations - with optional demographic fields');
const start5 = performance.now();
const result5 = calculateMatrixCombinations(
    ['awareness'], // 1
    ['ugc', 'cinema'], // 2
    ['review-social-proof'], // 1
    ['educate'], // 1
    ['wholesome'], // 1
    ['dialog'], // 1
    ['gen-z', 'millennial'], // 2
    ['male', 'female'], // 2
    ['straight', 'lgbtqia'], // 2
    ['people', 'parents'], // 2
    ['white'] // 1
);
const end5 = performance.now();
const duration5 = end5 - start5;

console.log(`✓ Result: ${result5.totalCombinations} combinations`);
console.log(`✓ Full combinations generated: ${result5.combinations.length}`);
console.log(`✓ Duration: ${duration5.toFixed(2)}ms`);
console.log(`✓ Performance: ${duration5 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Test Case 6: Conflict detection
console.log('Test 6: Conflict detection - Gen Alpha × Vintage 80s');
const start6 = performance.now();
const result6 = calculateMatrixCombinations(
    ['awareness'], // 1
    ['ugc', 'cinema'], // 2
    ['vintage-80s-ad'], // 1 - should trigger conflict with Gen Alpha
    ['educate'], // 1
    ['wholesome'], // 1
    ['dialog'], // 1
    ['gen-alpha'], // 1 - conflicts with Vintage 80s
    ['male'], // 1
    [], // orientation optional
    [], // lifeStage optional
    ['white'] // 1
);
const end6 = performance.now();
const duration6 = end6 - start6;

console.log(`✓ Result: ${result6.totalCombinations} combinations`);
console.log(`✓ Conflict warnings: ${result6.warnings.filter(w => w.type === 'conflict').length}`);
console.log(`✓ Duration: ${duration6.toFixed(2)}ms`);
console.log(`✓ Performance: ${duration6 < 1000 ? 'PASS (<1 second)' : 'FAIL (≥1 second)'}\n`);

// Summary
console.log('=== Performance Test Summary ===');
const allTests = [duration1, duration2, duration3, duration4, duration5, duration6];
const maxDuration = Math.max(...allTests);
const avgDuration = allTests.reduce((a, b) => a + b, 0) / allTests.length;
const allPassed = allTests.every(d => d < 1000);

console.log(`Maximum duration: ${maxDuration.toFixed(2)}ms`);
console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
console.log(`Overall result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
console.log('\nNFR001 Requirement: <1 second for up to 100 combinations');
console.log(`Status: ${duration1 < 1000 ? '✅ SATISFIED' : '❌ NOT SATISFIED'}\n`);
