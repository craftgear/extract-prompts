import { describe, it, expect } from 'vitest';
import {
  parseA1111Parameters,
  separatePrompts,
  extractGenerationSettings,
  validateA1111Format,
  isValidPromptSeparation,
  validateA1111Parameters,
  A1111Parameters,
  GenerationSettings,
  PromptSeparationResult,
} from './index';

describe('Parsers module exports', () => {
  it('should export parseA1111Parameters function', () => {
    expect(typeof parseA1111Parameters).toBe('function');
  });

  it('should export separatePrompts function', () => {
    expect(typeof separatePrompts).toBe('function');
  });

  it('should export extractGenerationSettings function', () => {
    expect(typeof extractGenerationSettings).toBe('function');
  });

  it('should export validateA1111Format function', () => {
    expect(typeof validateA1111Format).toBe('function');
  });

  it('should export isValidPromptSeparation function', () => {
    expect(typeof isValidPromptSeparation).toBe('function');
  });

  it('should export validateA1111Parameters function', () => {
    expect(typeof validateA1111Parameters).toBe('function');
  });

  it('should have working parseA1111Parameters function', () => {
    const input = 'beautiful landscape\nSteps: 20, CFG scale: 7';
    const result = parseA1111Parameters(input);
    
    expect(result.positive_prompt).toBe('beautiful landscape');
    expect(result.steps).toBe(20);
    expect(result.cfg).toBe(7);
  });

  it('should have working separatePrompts function', () => {
    const input = 'positive\nNegative prompt: negative\nSteps: 20';
    const result = separatePrompts(input);
    
    expect(result.positive).toBe('positive');
    expect(result.negative).toBe('negative');
  });

  it('should have working extractGenerationSettings function', () => {
    const input = 'Steps: 25, CFG scale: 8.0, Sampler: DPM++';
    const result = extractGenerationSettings(input);
    
    expect(result.steps).toBe(25);
    expect(result.cfg).toBe(8.0);
    expect(result.sampler).toBe('DPM++');
  });

  it('should have working validateA1111Format function', () => {
    expect(validateA1111Format('prompt\nSteps: 20')).toBe(true);
    expect(validateA1111Format('just text')).toBe(false);
  });

  it('should have working isValidPromptSeparation function', () => {
    expect(isValidPromptSeparation('positive prompt')).toBe(true);
    expect(isValidPromptSeparation('')).toBe(false);
  });

  it('should have working validateA1111Parameters function', () => {
    const validParams: A1111Parameters = {
      positive_prompt: 'test'
    };
    const invalidParams = {
      negative_prompt: 'test'
    } as A1111Parameters;

    expect(validateA1111Parameters(validParams)).toBe(true);
    expect(validateA1111Parameters(invalidParams)).toBe(false);
  });
});

describe('Type exports', () => {
  it('should allow A1111Parameters type usage', () => {
    const params: A1111Parameters = {
      positive_prompt: 'test prompt',
      negative_prompt: 'negative',
      steps: 20,
      cfg: 7.5,
      seed: 123456
    };

    expect(params.positive_prompt).toBe('test prompt');
    expect(params.negative_prompt).toBe('negative');
    expect(params.steps).toBe(20);
    expect(params.cfg).toBe(7.5);
    expect(params.seed).toBe(123456);
  });

  it('should allow GenerationSettings type usage', () => {
    const settings: GenerationSettings = {
      steps: 30,
      cfg: 8.0,
      sampler: 'DPM++ 2M Karras',
      seed: 987654321
    };

    expect(settings.steps).toBe(30);
    expect(settings.cfg).toBe(8.0);
    expect(settings.sampler).toBe('DPM++ 2M Karras');
    expect(settings.seed).toBe(987654321);
  });

  it('should allow PromptSeparationResult type usage', () => {
    const result: PromptSeparationResult = {
      positive: 'positive prompt',
      negative: 'negative prompt'
    };

    expect(result.positive).toBe('positive prompt');
    expect(result.negative).toBe('negative prompt');
  });
});