import type { MatrixWarning, VideoCombination } from '@/types/dashboard';

/**
 * Conflict Rule Definition
 * Defines nonsensical combinations that may not work well together
 */
export type ConflictRule = {
    dimension1: keyof VideoCombination;
    value1: string | string[]; // Allow array for multiple matching values
    dimension2: keyof VideoCombination;
    value2: string | string[];
    warning: string;
};

/**
 * Conflict Detection Rules (Story 1.4, AC#5)
 * Identifies nonsensical combinations across dimensions
 */
export const conflictRules: ConflictRule[] = [
    // Demographic × Aesthetic conflicts
    {
        dimension1: 'ageGeneration',
        value1: 'Gen Alpha',
        dimension2: 'aesthetic',
        value2: 'Vintage 80s',
        warning: 'Gen Alpha × Vintage 80s aesthetic may conflict'
    },
    {
        dimension1: 'ageGeneration',
        value1: 'Baby Boomers',
        dimension2: 'aesthetic',
        value2: ['TikTok UGC', 'Gen Z Meme Culture'],
        warning: 'Baby Boomers may not align with TikTok-style content'
    },
    {
        dimension1: 'ageGeneration',
        value1: 'Gen X',
        dimension2: 'aesthetic',
        value2: 'Gen Z Meme Culture',
        warning: 'Gen X × Gen Z aesthetics may not resonate'
    },

    // Funnel × Intention conflicts
    {
        dimension1: 'funnelLevel',
        value1: 'Awareness',
        dimension2: 'intention',
        value2: ['Hard Sell', 'Convert'],
        warning: 'Awareness Funnel × Hard Sell Intention may reduce effectiveness - consider softer approach'
    },
    {
        dimension1: 'funnelLevel',
        value1: 'Decision',
        dimension2: 'intention',
        value2: 'Educate',
        warning: 'Decision Funnel × Educate Intention may miss conversion opportunity - consider stronger CTA'
    },

    // Mood × Audio Style conflicts
    {
        dimension1: 'mood',
        value1: 'Serious',
        dimension2: 'audioStyle',
        value2: 'Upbeat',
        warning: 'Serious Mood × Upbeat Audio may send mixed signals'
    },
    {
        dimension1: 'mood',
        value1: 'Playful',
        dimension2: 'audioStyle',
        value2: 'Somber',
        warning: 'Playful Mood × Somber Audio may confuse tone'
    },

    // Intention × Mood conflicts
    {
        dimension1: 'intention',
        value1: 'Inspire',
        dimension2: 'mood',
        value2: 'Clinical',
        warning: 'Inspire Intention × Clinical Mood may lack emotional impact'
    },

    // Type × Aesthetic conflicts
    {
        dimension1: 'type',
        value1: 'Product Showcase',
        dimension2: 'aesthetic',
        value2: 'Abstract Art',
        warning: 'Product Showcase × Abstract Art may reduce product clarity'
    }
];

/**
 * Check if a value matches a rule value (handles both string and string[])
 */
function valueMatches(actual: string, ruleValue: string | string[]): boolean {
    if (Array.isArray(ruleValue)) {
        return ruleValue.some((v) => actual.toLowerCase().includes(v.toLowerCase()));
    }
    return actual.toLowerCase().includes(ruleValue.toLowerCase());
}

/**
 * Detect conflicts in video combinations based on defined rules
 * Returns array of conflict warnings
 */
export function detectConflicts(combinations: VideoCombination[]): MatrixWarning[] {
    const warnings: MatrixWarning[] = [];
    const detectedConflicts = new Set<string>();

    for (const combo of combinations) {
        for (const rule of conflictRules) {
            const value1 = combo[rule.dimension1];
            const value2 = combo[rule.dimension2];

            if (valueMatches(value1, rule.value1) && valueMatches(value2, rule.value2)) {
                // Avoid duplicate warnings
                if (!detectedConflicts.has(rule.warning)) {
                    warnings.push({
                        type: 'conflict',
                        severity: 'info',
                        message: rule.warning,
                        details: 'These combinations may work, but consider reviewing for brand alignment.'
                    });
                    detectedConflicts.add(rule.warning);
                }
            }
        }
    }

    return warnings;
}
