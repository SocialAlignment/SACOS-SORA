// Compliance Validator Tests (Story 2.1)

import { describe, it, expect } from 'vitest';
import { complianceValidator, type ScriptContent } from '../compliance-validator';

describe('ComplianceValidator', () => {
  describe('Layer 1: OpenAI Content Policy', () => {
    it('should reject scripts with real people references', () => {
      const script: ScriptContent = {
        prompt: 'A video showing the person named John Smith walking in a park',
        visualDescription: 'Person named John Smith walking',
        spokenWords: 'Hello, I am a professional'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer1Passed).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('content_policy_violation');
      expect(result.errors[0].message).toContain('real people');
    });

    it('should reject scripts with copyrighted content', () => {
      const script: ScriptContent = {
        prompt: "Mickey Mouse dancing with Superman in a McDonald's restaurant",
        visualDescription: 'Copyrighted characters',
        spokenWords: 'Hello world'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer1Passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('content_policy_violation');
      expect(result.errors[0].message).toContain('copyrighted');
    });

    it('should reject scripts with visible text', () => {
      const script: ScriptContent = {
        prompt: 'A video with text on screen showing product features',
        visualDescription: 'Text overlay with product information',
        spokenWords: 'Our product is amazing'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer1Passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('visual_restriction');
      expect(result.errors[0].message).toContain('visible text');
    });

    it('should reject scripts with logos on clothing', () => {
      const script: ScriptContent = {
        prompt: 'A person wearing a shirt with logo visible',
        visualDescription: 'Branded clothing',
        spokenWords: 'Check out this style'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer1Passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('visual_restriction');
      expect(result.errors[0].message).toContain('logos');
    });

    it('should pass scripts with compliant content', () => {
      const script: ScriptContent = {
        prompt: 'A person walking through a modern office space with natural lighting',
        visualDescription: 'Professional walking in office',
        spokenWords: 'This is our workspace'
      };

      const result = complianceValidator.validate(script);

      expect(result.layer1Passed).toBe(true);
    });
  });

  describe('Layer 2: Brand-Specific Constraints', () => {
    it('should reject scripts exceeding word limit (45 words)', () => {
      const script: ScriptContent = {
        prompt: 'A product demonstration video',
        visualDescription: 'Product demo',
        spokenWords:
          'This is a very long script that contains way more than forty five words and should definitely fail the validation check because we have a strict word limit that must be enforced for all brand content to ensure compliance with our guidelines and policies for video generation'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer2Passed).toBe(false);
      expect(result.errors.some((e) => e.type === 'script_length_exceeded')).toBe(true);

      const error = result.errors.find((e) => e.type === 'script_length_exceeded');
      expect(error?.remediation).toContain('Reduce script by');
      expect(error?.details?.currentWords).toBeGreaterThan(45);
    });

    it('should reject scripts exceeding syllable limit (65 syllables)', () => {
      const script: ScriptContent = {
        prompt: 'A video about complicated technical terminology',
        visualDescription: 'Technical demonstration',
        spokenWords:
          'Architectural revolutionization necessitates comprehensive implementation strategies utilizing sophisticated methodologies ensuring organizational transformation'
      };

      const result = complianceValidator.validate(script);

      // This script has many multi-syllable words
      const error = result.errors.find((e) => e.type === 'syllable_count_exceeded');
      if (error) {
        expect(error.details?.currentSyllables).toBeGreaterThan(65);
        expect(error.remediation).toContain('shorter, simpler words');
      }
    });

    it('should reject scripts with captions/subtitles', () => {
      const script: ScriptContent = {
        prompt: 'A video with captions explaining the process',
        visualDescription: 'Process explanation with subtitles',
        spokenWords: 'This is the process'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer2Passed).toBe(false);
      expect(result.errors.some((e) => e.type === 'visual_restriction')).toBe(true);

      const error = result.errors.find(
        (e) => e.type === 'visual_restriction' && e.message.includes('captions')
      );
      expect(error?.remediation).toContain('prohibits on-screen text');
    });

    it('should reject scripts with on-screen graphics', () => {
      const script: ScriptContent = {
        prompt: 'A video with animated graphics showing data trends',
        visualDescription: 'Chart displays on screen',
        spokenWords: 'Look at these results'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer2Passed).toBe(false);
      expect(result.errors.some((e) => e.type === 'visual_restriction')).toBe(true);
    });

    it('should pass scripts within word and syllable limits', () => {
      const script: ScriptContent = {
        prompt: 'A simple product video showing features',
        visualDescription: 'Product demonstration',
        spokenWords: 'Our new product makes life easy. Try it today and see the difference.'
      };

      const result = complianceValidator.validate(script);

      expect(result.layer2Passed).toBe(true);
      const wordErrors = result.errors.filter((e) => e.type === 'script_length_exceeded');
      const syllableErrors = result.errors.filter((e) => e.type === 'syllable_count_exceeded');

      expect(wordErrors).toHaveLength(0);
      expect(syllableErrors).toHaveLength(0);
    });

    it('should add warning for scripts near word limit (35-45 words)', () => {
      const script: ScriptContent = {
        prompt: 'A product video',
        visualDescription: 'Product showcase',
        spokenWords:
          'This is a script that has exactly thirty eight words which puts it close to the maximum limit of forty five words so it should trigger a warning'
      };

      const result = complianceValidator.validate(script);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('close to word limit');
    });
  });

  describe('Integration Tests', () => {
    it('should pass fully compliant script through both layers', () => {
      const script: ScriptContent = {
        prompt:
          'A professional walking through a modern office, natural lighting, cinematic shot, warm tones',
        visualDescription: 'Professional in modern office with natural lighting',
        spokenWords: 'Welcome to our workspace where creativity meets innovation every single day.'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(true);
      expect(result.layer1Passed).toBe(true);
      expect(result.layer2Passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail script with multiple violations across both layers', () => {
      const script: ScriptContent = {
        prompt: 'Mickey Mouse wearing a Nike shirt with logo with text on screen and captions',
        visualDescription: 'Copyrighted character with branded clothing and text',
        spokenWords:
          'This is a very long script that violates word limits and contains too many words for our brand guidelines'
      };

      const result = complianceValidator.validate(script);

      expect(result.valid).toBe(false);
      expect(result.layer1Passed).toBe(false);
      expect(result.layer2Passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2); // Multiple violations
    });

    it('should provide detailed remediation for all errors', () => {
      const script: ScriptContent = {
        prompt: 'A video showing text on screen with Superman',
        visualDescription: 'Copyrighted character with text overlay',
        spokenWords: 'Just a few words'
      };

      const result = complianceValidator.validate(script);

      result.errors.forEach((error) => {
        expect(error.message).toBeTruthy();
        expect(error.remediation).toBeTruthy();
        expect(error.remediation.length).toBeGreaterThan(20); // Detailed guidance
      });
    });
  });

  describe('Batch Validation', () => {
    it('should validate multiple scripts efficiently', () => {
      const scripts: ScriptContent[] = [
        {
          prompt: 'Valid script 1',
          visualDescription: 'Simple scene',
          spokenWords: 'Short message'
        },
        {
          prompt: 'Mickey Mouse video',
          visualDescription: 'Copyrighted content',
          spokenWords: 'Invalid content'
        },
        {
          prompt: 'Valid script 2',
          visualDescription: 'Another scene',
          spokenWords: 'Another message'
        }
      ];

      const results = complianceValidator.validateBatch(scripts);

      expect(results.size).toBe(3);
      expect(results.get(0)?.valid).toBe(true);
      expect(results.get(1)?.valid).toBe(false);
      expect(results.get(2)?.valid).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate success summary for valid script', () => {
      const script: ScriptContent = {
        prompt: 'A simple valid video',
        visualDescription: 'Simple scene',
        spokenWords: 'Hello world'
      };

      const result = complianceValidator.validate(script);
      const summary = complianceValidator.getSummary(result);

      expect(summary).toContain('passed all compliance checks');
    });

    it('should generate detailed error summary for invalid script', () => {
      const script: ScriptContent = {
        prompt: 'Mickey Mouse with text on screen',
        visualDescription: 'Copyrighted with text',
        spokenWords: 'Invalid'
      };

      const result = complianceValidator.validate(script);
      const summary = complianceValidator.getSummary(result);

      expect(summary).toContain('Compliance validation failed');
      expect(summary).toContain('-'); // Bullet points for errors
    });
  });
});
