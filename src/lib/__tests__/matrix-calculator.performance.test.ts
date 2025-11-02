/**
 * Performance test for matrix-calculator.ts (Story 1.4, Task 6)
 * Verifies NFR001: Calculation completes in <1 second for up to 100 combinations
 */

import { calculateMatrixCombinations } from '../matrix-calculator';

describe('Matrix Calculator Performance', () => {
    it('should calculate 100 combinations in <1 second', () => {
        // Test Case 1: Exactly 100 combinations
        // 2 × 5 × 2 × 1 × 1 × 1 × (5 × 2 × 1 × 1 × 1) = 100
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

        expect(result1.totalCombinations).toBe(100);
        expect(duration1).toBeLessThan(1000); // <1 second
        console.log(`✓ 100 combinations calculated in ${duration1.toFixed(2)}ms`);
    });

    it('should calculate 50 combinations (warning threshold) in <1 second', () => {
        // Test Case 2: 50 combinations (large batch warning threshold)
        // 1 × 5 × 2 × 1 × 1 × 1 × (5 × 2 × 1 × 1 × 1) = 50
        const start = performance.now();
        const result = calculateMatrixCombinations(
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
        const end = performance.now();
        const duration = end - start;

        expect(result.totalCombinations).toBe(50);
        expect(result.warnings.length).toBeGreaterThan(0); // Should have large batch warning
        expect(result.warnings[0].type).toBe('large_batch');
        expect(duration).toBeLessThan(1000);
        console.log(`✓ 50 combinations calculated in ${duration.toFixed(2)}ms`);
    });

    it('should calculate small matrix (8 combinations) in <1 second', () => {
        // Test Case 3: Small matrix
        // 1 × 2 × 1 × 1 × 1 × 1 × (2 × 2 × 1 × 1 × 1) = 8
        const start = performance.now();
        const result = calculateMatrixCombinations(
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
        const end = performance.now();
        const duration = end - start;

        expect(result.totalCombinations).toBe(8);
        expect(result.warnings.length).toBe(0); // No warnings for small batch
        expect(duration).toBeLessThan(1000);
        console.log(`✓ 8 combinations calculated in ${duration.toFixed(2)}ms`);
    });

    it('should handle large theoretical matrix (1000 combinations limit)', () => {
        // Test Case 4: At the edge of full combination generation
        // 5 × 4 × 2 × 2 × 2 × 2 × (5 × 2 × 1 × 1 × 1) = 1600 combinations
        // But full combination generation only happens up to 1000
        const start = performance.now();
        const result = calculateMatrixCombinations(
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
        const end = performance.now();
        const duration = end - start;

        expect(result.totalCombinations).toBe(1600);
        expect(result.combinations.length).toBe(0); // No full generation for >1000
        expect(result.warnings.some(w => w.type === 'large_batch')).toBe(true);
        expect(duration).toBeLessThan(1000);
        console.log(`✓ 1600 combination count calculated in ${duration.toFixed(2)}ms (no full generation)`);
    });

    it('should handle optional demographic fields correctly', () => {
        // Test Case 5: With optional orientation and lifeStage selected
        // 1 × 2 × 1 × 1 × 1 × 1 × (2 × 2 × 2 × 2 × 1) = 16
        const start = performance.now();
        const result = calculateMatrixCombinations(
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
        const end = performance.now();
        const duration = end - start;

        expect(result.totalCombinations).toBe(16);
        expect(result.combinations.length).toBe(16); // Should generate all combinations
        expect(duration).toBeLessThan(1000);
        console.log(`✓ 16 combinations with optional fields calculated in ${duration.toFixed(2)}ms`);
    });
});
