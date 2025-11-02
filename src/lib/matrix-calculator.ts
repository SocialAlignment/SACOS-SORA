import type { MatrixResult, VideoCombination } from '@/types/dashboard';
import { detectConflicts } from './combination-rules';

/**
 * Calculate Cartesian product matrix for video variations
 * Implements AC#1: Calculate across all 8 dimension categories (11 total fields)
 * Implements AC#3: Performance optimized for <1s with up to 100 combinations
 *
 * Demographics are calculated as a sub-product:
 * demographics = ageGeneration × gender × orientation × lifeStage × ethnicity
 *
 * Total = funnelLevel × aesthetic × type × intention × mood × audioStyle × demographics
 */
export function calculateMatrixCombinations(
    // Core dimensions from DashboardFormData
    funnelLevel: string[],
    aesthetic: string[],
    type: string[],
    intention: string[],
    mood: string[],
    audioStyle: string[],
    // Demographics (multi-dimensional)
    ageGeneration: string[],
    gender: string[],
    orientation: string[],
    lifeStage: string[],
    ethnicity: string[]
): MatrixResult {
    // Calculate demographics sub-product
    // Treat 0-length arrays as 1 (meaning "any/not specified" for optional fields)
    const demographicsCount =
        (ageGeneration.length || 1) *
        (gender.length || 1) *
        (orientation.length || 1) *
        (lifeStage.length || 1) *
        (ethnicity.length || 1);

    // Calculate total combinations
    const totalCombinations =
        (funnelLevel.length || 0) *
        (aesthetic.length || 0) *
        (type.length || 0) *
        (intention.length || 0) *
        (mood.length || 0) *
        (audioStyle.length || 0) *
        demographicsCount;

    // Build dimensions array with metadata
    const dimensions = [
        {
            label: 'Funnel Level',
            count: funnelLevel.length,
            selections: funnelLevel
        },
        {
            label: 'Aesthetic',
            count: aesthetic.length,
            selections: aesthetic
        },
        {
            label: 'Type',
            count: type.length,
            selections: type
        },
        {
            label: 'Intention',
            count: intention.length,
            selections: intention
        },
        {
            label: 'Mood',
            count: mood.length,
            selections: mood
        },
        {
            label: 'Audio Style',
            count: audioStyle.length,
            selections: audioStyle
        },
        {
            label: 'Demographics',
            count: demographicsCount,
            selections: [
                `${ageGeneration.length || 1} age × ${gender.length || 1} gender × ${orientation.length || 1} orientation × ${lifeStage.length || 1} life stage × ${ethnicity.length || 1} ethnicity`
            ]
        }
    ];

    // Generate equation string
    const equationParts = [
        funnelLevel.length || 0,
        aesthetic.length || 0,
        type.length || 0,
        intention.length || 0,
        mood.length || 0,
        audioStyle.length || 0,
        demographicsCount || 0
    ];

    const equation = `${equationParts.join(' × ')} = ${totalCombinations} video${totalCombinations === 1 ? '' : 's'}`;

    // Initialize warnings array
    const warnings = [];

    // Check for large batch warning (AC#4)
    if (totalCombinations > 50) {
        warnings.push({
            type: 'large_batch' as const,
            severity: 'critical' as const,
            message: 'Large batch - consider reducing scope',
            details: `Generating ${totalCombinations} videos may take 2-3 hours and incur higher costs. Consider reducing selections to optimize batch size.`
        });
    }

    // Generate full combinations array (only if totalCombinations is reasonable)
    // For performance, limit full combination generation
    const combinations: VideoCombination[] = [];

    if (totalCombinations > 0 && totalCombinations <= 1000) {
        // Generate all combinations using nested loops
        for (const fl of funnelLevel.length ? funnelLevel : ['']) {
            for (const aes of aesthetic.length ? aesthetic : ['']) {
                for (const t of type.length ? type : ['']) {
                    for (const intent of intention.length ? intention : ['']) {
                        for (const m of mood.length ? mood : ['']) {
                            for (const audio of audioStyle.length ? audioStyle : ['']) {
                                for (const age of ageGeneration.length ? ageGeneration : ['']) {
                                    for (const gen of gender.length ? gender : ['']) {
                                        for (const orient of orientation.length ? orientation : ['']) {
                                            for (const life of lifeStage.length ? lifeStage : ['']) {
                                                for (const eth of ethnicity.length ? ethnicity : ['']) {
                                                    // Only require non-empty values for required fields
                                                    // Optional fields: orientation, lifeStage
                                                    if (
                                                        fl &&
                                                        aes &&
                                                        t &&
                                                        intent &&
                                                        m &&
                                                        audio &&
                                                        age &&
                                                        gen &&
                                                        eth
                                                    ) {
                                                        combinations.push({
                                                            funnelLevel: fl,
                                                            aesthetic: aes,
                                                            type: t,
                                                            intention: intent,
                                                            mood: m,
                                                            audioStyle: audio,
                                                            ageGeneration: age,
                                                            gender: gen,
                                                            orientation: orient || 'any',
                                                            lifeStage: life || 'any',
                                                            ethnicity: eth
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Detect conflict warnings (AC#5)
    if (combinations.length > 0 && combinations.length <= 1000) {
        const conflictWarnings = detectConflicts(combinations);
        warnings.push(...conflictWarnings);
    }

    return {
        totalCombinations,
        dimensions,
        equation,
        warnings,
        combinations
    };
}
