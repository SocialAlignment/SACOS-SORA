// Compliance Validator (Story 2.1)
// Dual-layer validation: OpenAI API restrictions + brand-specific constraints

export type ValidationErrorType =
  | 'content_policy_violation'
  | 'script_length_exceeded'
  | 'syllable_count_exceeded'
  | 'visual_restriction';

export type ValidationError = {
  type: ValidationErrorType;
  message: string;
  remediation: string;
  details?: Record<string, any>;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
  layer1Passed: boolean;
  layer2Passed: boolean;
};

export type ScriptContent = {
  prompt: string; // Full Sora 2 prompt
  spokenWords?: string; // Extracted dialog/voiceover text
  visualDescription: string; // Visual elements described
};

/**
 * Layer 1: OpenAI API Content Policy Validation
 * Validates against Sora 2 API restrictions
 */
class Layer1Validator {
  /**
   * Checks for prohibited content in OpenAI API
   * - No real people by name
   * - No copyrighted characters/music
   * - No text visible in scenes
   * - No logos on clothing/objects
   */
  validate(script: ScriptContent): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check for real people names
    const realPeoplePattern = /\b(person named|celebrity|president|CEO|founder|named character)\b/gi;
    if (realPeoplePattern.test(script.prompt) || realPeoplePattern.test(script.visualDescription)) {
      errors.push({
        type: 'content_policy_violation',
        message: 'Script references real people by name or title',
        remediation:
          'Remove references to real people, celebrities, or named individuals. Use generic descriptions like "a person" or "a professional".',
        details: {
          matches: script.prompt.match(realPeoplePattern) || []
        }
      });
    }

    // Check for copyrighted content
    const copyrightedPattern =
      /\b(Mickey Mouse|Superman|Batman|Spider-Man|Disney|Marvel|Coca-Cola|McDonald|Nike|Apple|Microsoft|trademarked|copyrighted song|licensed music)\b/gi;
    if (copyrightedPattern.test(script.prompt) || copyrightedPattern.test(script.visualDescription)) {
      errors.push({
        type: 'content_policy_violation',
        message: 'Script contains copyrighted characters, brands, or music references',
        remediation:
          'Remove all trademarked characters, brand names, and copyrighted music references. Use generic equivalents.',
        details: {
          matches: script.prompt.match(copyrightedPattern) || []
        }
      });
    }

    // Check for visible text in scenes
    const textPattern =
      /\b(text on screen|subtitle|caption|words appear|text displays|showing text|readable text|written words|sign with text|text overlay)\b/gi;
    if (textPattern.test(script.prompt) || textPattern.test(script.visualDescription)) {
      errors.push({
        type: 'visual_restriction',
        message: 'Script describes visible text or on-screen text elements',
        remediation:
          'Remove descriptions of visible text, captions, subtitles, or text overlays. Sora 2 cannot reliably generate readable text.',
        details: {
          matches: script.prompt.match(textPattern) || []
        }
      });
    }

    // Check for logos on clothing/objects
    const logoPattern = /\b(logo on|branded clothing|shirt with logo|hat with brand|logo visible)\b/gi;
    if (logoPattern.test(script.prompt) || logoPattern.test(script.visualDescription)) {
      errors.push({
        type: 'visual_restriction',
        message: 'Script describes logos on clothing or objects',
        remediation: 'Remove descriptions of logos, brand marks, or branded clothing/objects.',
        details: {
          matches: script.prompt.match(logoPattern) || []
        }
      });
    }

    return errors;
  }
}

/**
 * Layer 2: Brand-Specific Compliance Validation
 * Validates against brand-defined constraints
 */
class Layer2Validator {
  private readonly MAX_SPOKEN_WORDS = 45;
  private readonly MAX_SYLLABLES = 65;

  /**
   * Counts words in a text string
   */
  private countWords(text: string): number {
    // Remove extra whitespace and split by spaces
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Counts syllables in a text string (approximation)
   * Uses vowel counting heuristic
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
      if (word.length === 0) continue;

      // Remove non-alphabetic characters
      const cleanWord = word.replace(/[^a-z]/g, '');
      if (cleanWord.length === 0) continue;

      // Count vowel groups (consecutive vowels = 1 syllable)
      const vowelGroups = cleanWord.match(/[aeiouy]+/g);
      let syllables = vowelGroups ? vowelGroups.length : 0;

      // Adjustments for common patterns
      if (cleanWord.endsWith('e')) {
        syllables = Math.max(1, syllables - 1); // Silent 'e'
      }
      if (cleanWord.endsWith('le') && cleanWord.length > 2) {
        syllables += 1; // 'le' at end usually adds syllable
      }

      // Minimum 1 syllable per word
      syllables = Math.max(1, syllables);

      totalSyllables += syllables;
    }

    return totalSyllables;
  }

  /**
   * Validates brand-specific constraints
   * - Max 45 spoken words
   * - Max 65 syllables
   * - No captions, subtitles, on-screen graphics
   */
  validate(script: ScriptContent): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check spoken word count
    if (script.spokenWords) {
      const wordCount = this.countWords(script.spokenWords);
      if (wordCount > this.MAX_SPOKEN_WORDS) {
        errors.push({
          type: 'script_length_exceeded',
          message: `Script contains ${wordCount} spoken words (max ${this.MAX_SPOKEN_WORDS})`,
          remediation: `Reduce script by ${wordCount - this.MAX_SPOKEN_WORDS} words. Focus on concise, impactful messaging.`,
          details: {
            currentWords: wordCount,
            maxWords: this.MAX_SPOKEN_WORDS,
            excess: wordCount - this.MAX_SPOKEN_WORDS
          }
        });
      }

      // Check syllable count
      const syllableCount = this.countSyllables(script.spokenWords);
      if (syllableCount > this.MAX_SYLLABLES) {
        errors.push({
          type: 'syllable_count_exceeded',
          message: `Script contains ${syllableCount} syllables (max ${this.MAX_SYLLABLES})`,
          remediation: `Reduce syllable count by ${syllableCount - this.MAX_SYLLABLES}. Use shorter, simpler words.`,
          details: {
            currentSyllables: syllableCount,
            maxSyllables: this.MAX_SYLLABLES,
            excess: syllableCount - this.MAX_SYLLABLES
          }
        });
      }
    }

    // Check for captions/subtitles
    const captionPattern =
      /\b(with captions|subtitle|subtitles|on-screen text|text caption|with text overlay)\b/gi;
    if (
      captionPattern.test(script.prompt) ||
      captionPattern.test(script.visualDescription)
    ) {
      errors.push({
        type: 'visual_restriction',
        message: 'Script describes captions, subtitles, or on-screen text',
        remediation: 'Remove all references to captions, subtitles, or text overlays. Brand policy prohibits on-screen text.',
        details: {
          matches: script.prompt.match(captionPattern) || []
        }
      });
    }

    // Check for on-screen graphics
    const graphicsPattern =
      /\b(with graphics|animated graphics|overlay graphic|infographic|chart on screen|graph displays)\b/gi;
    if (
      graphicsPattern.test(script.prompt) ||
      graphicsPattern.test(script.visualDescription)
    ) {
      errors.push({
        type: 'visual_restriction',
        message: 'Script describes on-screen graphics or visual overlays',
        remediation: 'Remove descriptions of graphics, charts, or visual overlays. Focus on pure video storytelling.',
        details: {
          matches: script.prompt.match(graphicsPattern) || []
        }
      });
    }

    return errors;
  }
}

/**
 * Compliance Validator
 * Orchestrates Layer 1 (OpenAI) and Layer 2 (Brand) validation
 */
export class ComplianceValidator {
  private layer1Validator: Layer1Validator;
  private layer2Validator: Layer2Validator;

  constructor() {
    this.layer1Validator = new Layer1Validator();
    this.layer2Validator = new Layer2Validator();
  }

  /**
   * Validates script content against both compliance layers
   * Returns comprehensive validation result with errors and warnings
   */
  validate(script: ScriptContent): ValidationResult {
    const layer1Errors = this.layer1Validator.validate(script);
    const layer2Errors = this.layer2Validator.validate(script);

    const allErrors = [...layer1Errors, ...layer2Errors];
    const warnings: string[] = [];

    // Add warnings for edge cases
    if (script.spokenWords) {
      const wordCount = script.spokenWords.trim().split(/\s+/).length;
      if (wordCount > 35 && wordCount <= 45) {
        warnings.push(
          `Script is close to word limit (${wordCount}/45 words). Consider reducing for safety margin.`
        );
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings,
      layer1Passed: layer1Errors.length === 0,
      layer2Passed: layer2Errors.length === 0
    };
  }

  /**
   * Validates multiple scripts (batch validation)
   */
  validateBatch(scripts: ScriptContent[]): Map<number, ValidationResult> {
    const results = new Map<number, ValidationResult>();

    scripts.forEach((script, index) => {
      results.set(index, this.validate(script));
    });

    return results;
  }

  /**
   * Returns human-readable summary of validation result
   */
  getSummary(result: ValidationResult): string {
    if (result.valid) {
      return 'Script passed all compliance checks';
    }

    const errorSummary = result.errors
      .map((err) => `- ${err.message}`)
      .join('\n');

    return `Compliance validation failed:\n${errorSummary}`;
  }
}

// Singleton instance
export const complianceValidator = new ComplianceValidator();
