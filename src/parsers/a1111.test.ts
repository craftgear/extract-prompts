import { describe, it, expect } from 'vitest';
import {
  parseA1111Parameters,
  separatePrompts,
  extractGenerationSettings,
  validateA1111Format,
  isValidPromptSeparation,
  validateA1111Parameters,
  A1111Parameters,
  PromptSeparationResult,
  GenerationSettings
} from './a1111';

describe('parseA1111Parameters', () => {
  it('should parse complete A1111 parameters', () => {
    const input = `beautiful landscape, masterpiece
Negative prompt: blur, distorted, ugly
Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234567890, Size: 512x768, Model: sd_xl_base_1.0`;

    const result = parseA1111Parameters(input);

    expect(result).toEqual({
      positive_prompt: 'beautiful landscape, masterpiece',
      negative_prompt: 'blur, distorted, ugly',
      steps: 20,
      sampler: 'DPM++ 2M Karras',
      cfg: 7,
      seed: 1234567890,
      size: '512x768',
      model: 'sd_xl_base_1.0',
      raw_text: input
    });
  });

  it('should parse parameters without negative prompt', () => {
    const input = `beautiful landscape, masterpiece
Steps: 25, CFG scale: 8.5, Seed: 42`;

    const result = parseA1111Parameters(input);

    expect(result).toEqual({
      positive_prompt: 'beautiful landscape, masterpiece',
      steps: 25,
      cfg: 8.5,
      seed: 42,
      raw_text: input
    });
  });

  it('should handle case-insensitive parameters', () => {
    const input = `portrait, detailed
negative prompt: background
steps: 15, cfg scale: 6.0`;

    const result = parseA1111Parameters(input);

    expect(result.negative_prompt).toBe('background');
    expect(result.steps).toBe(15);
    expect(result.cfg).toBe(6.0);
  });

  it('should handle advanced parameters', () => {
    const input = `portrait
Steps: 20, CFG scale: 7, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, Restore faces, Hires upscaler: ESRGAN_4x, Hires steps: 10, Hires denoising strength: 0.5`;

    const result = parseA1111Parameters(input);

    expect(result.denoise).toBe(0.7);
    expect(result.clip_skip).toBe(2);
    expect(result.ensd).toBe('31337');
    expect(result.restore_faces).toBe(true);
    expect(result.hires_fix).toBe(true);
    expect(result.hires_upscaler).toBe('ESRGAN_4x');
    expect(result.hires_steps).toBe(10);
    expect(result.hires_denoising).toBe(0.5);
  });

  it('should handle malformed input gracefully', () => {
    const input = 'just some text without parameters';
    const result = parseA1111Parameters(input);

    expect(result).toEqual({
      positive_prompt: input,
      raw_text: input
    });
  });

  it('should throw error for empty input', () => {
    expect(() => parseA1111Parameters('')).toThrow('Invalid input: text cannot be empty');
    expect(() => parseA1111Parameters('   ')).toThrow('Invalid input: text cannot be empty');
  });

  it('should throw error for invalid input types', () => {
    expect(() => parseA1111Parameters(null as any)).toThrow('Invalid input: text must be a non-empty string');
    expect(() => parseA1111Parameters(undefined as any)).toThrow('Invalid input: text must be a non-empty string');
    expect(() => parseA1111Parameters(123 as any)).toThrow('Invalid input: text must be a non-empty string');
  });
});

describe('separatePrompts', () => {
  it('should separate positive and negative prompts', () => {
    const input = `beautiful landscape
Negative prompt: ugly, distorted
Steps: 20`;

    const result = separatePrompts(input);

    expect(result).toEqual({
      positive: 'beautiful landscape',
      negative: 'ugly, distorted'
    });
  });

  it('should handle different negative markers', () => {
    const testCases = [
      'Negative prompt: test',
      'Negative: test',
      'negative prompt: test',
      'negative: test'
    ];

    for (const marker of testCases) {
      const input = `positive\n${marker}`;
      const result = separatePrompts(input);
      
      expect(result.positive).toBe('positive');
      expect(result.negative).toBe('test');
    }
  });

  it('should handle text without negative prompt', () => {
    const input = `beautiful landscape
Steps: 20, CFG scale: 7`;

    const result = separatePrompts(input);

    expect(result).toEqual({
      positive: 'beautiful landscape',
      negative: ''
    });
  });

  it('should handle text without parameters', () => {
    const input = `beautiful landscape
Negative prompt: ugly`;

    const result = separatePrompts(input);

    expect(result).toEqual({
      positive: 'beautiful landscape',
      negative: 'ugly'
    });
  });

  it('should handle text with only positive prompt', () => {
    const input = 'just a simple prompt';

    const result = separatePrompts(input);

    expect(result).toEqual({
      positive: 'just a simple prompt',
      negative: ''
    });
  });

  it('should find earliest parameter marker', () => {
    const input = `prompt
Negative prompt: negative
Size: 512x512, Steps: 20, CFG scale: 7`;

    const result = separatePrompts(input);

    expect(result.positive).toBe('prompt');
    expect(result.negative).toBe('negative');
  });
});

describe('extractGenerationSettings', () => {
  it('should extract basic generation settings', () => {
    const input = 'Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7.5, Seed: 1234567890, Size: 512x768, Model: sd_xl_base_1.0';

    const result = extractGenerationSettings(input);

    expect(result).toEqual({
      steps: 20,
      sampler: 'DPM++ 2M Karras',
      cfg: 7.5,
      seed: 1234567890,
      size: '512x768',
      model: 'sd_xl_base_1.0'
    });
  });

  it('should extract advanced settings', () => {
    const input = 'Denoising strength: 0.7, Clip skip: 2, ENSD: 31337';

    const result = extractGenerationSettings(input);

    expect(result).toEqual({
      denoise: 0.7,
      clip_skip: 2,
      ensd: '31337'
    });
  });

  it('should detect hires fix settings', () => {
    const input = 'Hires upscale: 2.0, Hires upscaler: ESRGAN_4x, Hires steps: 15, Hires denoising strength: 0.5';

    const result = extractGenerationSettings(input);

    expect(result.hires_fix).toBe(true);
    expect(result.hires_upscaler).toBe('ESRGAN_4x');
    expect(result.hires_steps).toBe(15);
    expect(result.hires_denoising).toBe(0.5);
  });

  it('should detect restore faces', () => {
    const input = 'Steps: 20, Restore faces';

    const result = extractGenerationSettings(input);

    expect(result.steps).toBe(20);
    expect(result.restore_faces).toBe(true);
  });

  it('should handle case insensitive matching', () => {
    const input = 'steps: 25, cfg scale: 8.0, sampler: euler a';

    const result = extractGenerationSettings(input);

    expect(result.steps).toBe(25);
    expect(result.cfg).toBe(8.0);
    expect(result.sampler).toBe('euler a');
  });

  it('should handle invalid numeric values', () => {
    const input = 'Steps: abc, CFG scale: xyz, Seed: invalid';

    const result = extractGenerationSettings(input);

    expect(result).toEqual({});
  });

  it('should return empty object for text without parameters', () => {
    const input = 'just a regular prompt without any parameters';

    const result = extractGenerationSettings(input);

    expect(result).toEqual({});
  });
});

describe('validateA1111Format', () => {
  it('should return true for valid A1111 format', () => {
    const validInputs = [
      'prompt\nSteps: 20',
      'prompt\nCFG scale: 7.5',
      'prompt\nSampler: DPM++ 2M',
      'prompt\nSeed: 123456',
      'prompt\nModel: sd_model',
      'prompt\nSize: 512x512',
      'prompt\nNegative prompt: negative'
    ];

    for (const input of validInputs) {
      expect(validateA1111Format(input)).toBe(true);
    }
  });

  it('should return false for invalid input', () => {
    const invalidInputs = [
      '',
      '   ',
      'just a regular text',
      'prompt without any parameters',
      null,
      undefined,
      123
    ];

    for (const input of invalidInputs) {
      expect(validateA1111Format(input as any)).toBe(false);
    }
  });

  it('should be case insensitive', () => {
    const input = 'prompt\nsteps: 20';
    expect(validateA1111Format(input)).toBe(true);
  });
});

describe('isValidPromptSeparation', () => {
  it('should return true for valid prompt separation', () => {
    const validInputs = [
      'positive prompt\nNegative prompt: negative',
      'positive prompt\nSteps: 20',
      'positive prompt'
    ];

    for (const input of validInputs) {
      expect(isValidPromptSeparation(input)).toBe(true);
    }
  });

  it('should return false for invalid prompt separation', () => {
    const invalidInputs = [
      '',
      '   ',
      '\nNegative prompt: only negative',  // No positive prompt
      'x'.repeat(10001),  // Too long
      null,
      undefined
    ];

    for (const input of invalidInputs) {
      expect(isValidPromptSeparation(input as any)).toBe(false);
    }
  });

  it('should validate negative prompt marker presence', () => {
    // This case should be handled by the separatePrompts logic
    const input = 'positive\nnegative';  // Missing "Negative prompt:" marker
    const result = isValidPromptSeparation(input);
    expect(result).toBe(true);  // Should still be valid as it has positive content
  });
});

describe('validateA1111Parameters', () => {
  it('should return true for valid parameters', () => {
    const validParams: A1111Parameters = {
      positive_prompt: 'beautiful landscape',
      negative_prompt: 'ugly',
      steps: 20,
      cfg: 7.5,
      seed: 1234567890,
      denoise: 0.7,
      clip_skip: 2
    };

    expect(validateA1111Parameters(validParams)).toBe(true);
  });

  it('should return false for missing positive prompt', () => {
    const invalidParams = {
      negative_prompt: 'ugly',
      steps: 20
    } as A1111Parameters;

    expect(validateA1111Parameters(invalidParams)).toBe(false);
  });

  it('should return false for invalid positive prompt type', () => {
    const invalidParams = {
      positive_prompt: 123,
      steps: 20
    } as any;

    expect(validateA1111Parameters(invalidParams)).toBe(false);
  });

  it('should validate numeric parameter ranges', () => {
    const testCases = [
      { params: { positive_prompt: 'test', steps: 0 }, valid: false },  // steps too low
      { params: { positive_prompt: 'test', steps: 1001 }, valid: false },  // steps too high
      { params: { positive_prompt: 'test', cfg: -1 }, valid: false },  // cfg too low
      { params: { positive_prompt: 'test', cfg: 31 }, valid: false },  // cfg too high
      { params: { positive_prompt: 'test', denoise: -0.1 }, valid: false },  // denoise too low
      { params: { positive_prompt: 'test', denoise: 1.1 }, valid: false },  // denoise too high
      { params: { positive_prompt: 'test', clip_skip: 0 }, valid: false },  // clip_skip too low
      { params: { positive_prompt: 'test', clip_skip: 13 }, valid: false },  // clip_skip too high
      { params: { positive_prompt: 'test', steps: 20 }, valid: true },  // valid
      { params: { positive_prompt: 'test', cfg: 7.5 }, valid: true },  // valid
    ];

    for (const { params, valid } of testCases) {
      expect(validateA1111Parameters(params as A1111Parameters)).toBe(valid);
    }
  });

  it('should handle NaN values', () => {
    const invalidParams = {
      positive_prompt: 'test',
      steps: NaN
    } as A1111Parameters;

    expect(validateA1111Parameters(invalidParams)).toBe(false);
  });

  it('should return false for invalid input types', () => {
    const invalidInputs = [
      null,
      undefined,
      'string',
      123,
      []
    ];

    for (const input of invalidInputs) {
      expect(validateA1111Parameters(input as any)).toBe(false);
    }
  });

  it('should allow undefined optional parameters', () => {
    const validParams: A1111Parameters = {
      positive_prompt: 'beautiful landscape'
    };

    expect(validateA1111Parameters(validParams)).toBe(true);
  });
});