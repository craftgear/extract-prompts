import { describe, it, expect } from 'vitest';
import { parseA1111Parameters } from './parameters';

describe('parseA1111Parameters', () => {
  it('should parse basic A1111 parameters', () => {
    const text = `beautiful landscape
Negative prompt: bad quality, blurry
Steps: 20, CFG scale: 7.5, Sampler: DPM++ 2M Karras, Seed: 1234567890, Model: test_model_v1`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('beautiful landscape');
    expect(result.negative_prompt).toBe('bad quality, blurry');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('DPM++ 2M Karras');
    expect(result.seed).toBe('1234567890');
    expect(result.model).toBe('test_model_v1');
  });

  it('should handle text with only positive prompt and parameters', () => {
    const text = `amazing artwork, detailed
Steps: 30, CFG scale: 8.0, Sampler: Euler a, Seed: 987654321`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('amazing artwork, detailed');
    expect(result.negative_prompt).toBeUndefined();
    expect(result.steps).toBe('30');
    expect(result.cfg).toBe('8.0');
    expect(result.sampler).toBe('Euler a');
    expect(result.seed).toBe('987654321');
  });

  it('should handle text with only positive prompt', () => {
    const text = 'just a simple prompt without parameters';

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('just a simple prompt without parameters');
    expect(result.negative_prompt).toBeUndefined();
    expect(result.steps).toBeUndefined();
    expect(result.cfg).toBeUndefined();
    expect(result.sampler).toBeUndefined();
    expect(result.seed).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it('should handle multiline prompts', () => {
    const text = `beautiful portrait,
highly detailed,
masterpiece
Negative prompt: bad anatomy,
low quality,
blurry
Steps: 25, CFG scale: 7.0`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('beautiful portrait,\nhighly detailed,\nmasterpiece');
    expect(result.negative_prompt).toBe('bad anatomy,\nlow quality,\nblurry');
    expect(result.steps).toBe('25');
    expect(result.cfg).toBe('7.0');
  });

  it('should handle parameters in different order', () => {
    const text = `test prompt
Negative prompt: test negative
Steps: 15, CFG scale: 6.5, Seed: 555, Sampler: DDIM, Model: custom_model`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.negative_prompt).toBe('test negative');
    expect(result.steps).toBe('15');
    expect(result.cfg).toBe('6.5');
    expect(result.sampler).toBe('DDIM');
    expect(result.seed).toBe('555');
    expect(result.model).toBe('custom_model');
  });

  it('should handle case insensitive parameter names', () => {
    const text = `test prompt
Steps: 20, cfg scale: 7.5, sampler: Test Sampler, seed: 123, model: Test Model`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test Sampler');
    expect(result.seed).toBe('123');
    expect(result.model).toBe('Test Model');
  });

  it('should handle partial parameters', () => {
    const text = `test prompt
Steps: 20, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBeUndefined();
    expect(result.seed).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it('should handle fractional CFG values', () => {
    const text = `test prompt
Steps: 20, CFG scale: 7.5, Sampler: Test`;

    const result = parseA1111Parameters(text);

    expect(result.cfg).toBe('7.5');
  });

  it('should handle integer CFG values', () => {
    const text = `test prompt
Steps: 20, CFG scale: 8, Sampler: Test`;

    const result = parseA1111Parameters(text);

    expect(result.cfg).toBe('8');
  });

  it('should handle complex sampler names', () => {
    const text = `test prompt
Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.sampler).toBe('DPM++ 2M Karras');
  });

  it('should handle model names with special characters', () => {
    const text = `test prompt
Steps: 20, Model: model_v1.2-beta, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.model).toBe('model_v1.2-beta');
  });

  it('should handle large seed numbers', () => {
    const text = `test prompt
Steps: 20, Seed: 9876543210123456789, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.seed).toBe('9876543210123456789');
  });

  it('should handle empty negative prompt', () => {
    const text = `test prompt
Negative prompt: 
Steps: 20, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.negative_prompt).toBe('');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
  });

  it('should handle parameters with extra whitespace', () => {
    const text = `test prompt
Steps:   20  , CFG scale:  7.5  , Sampler:   Test Sampler   `;

    const result = parseA1111Parameters(text);

    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test Sampler');
  });

  it('should handle parameters separated by newlines', () => {
    const text = `test prompt
Steps: 20
CFG scale: 7.5
Sampler: Test Sampler
Seed: 123`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test Sampler');
    expect(result.seed).toBe('123');
  });

  it('should handle mixed parameter formats', () => {
    const text = `test prompt
Negative prompt: negative text
Steps: 20, CFG scale: 7.5
Sampler: Test Sampler
Seed: 123`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.negative_prompt).toBe('negative text');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test Sampler');
    expect(result.seed).toBe('123');
  });

  it('should handle empty input', () => {
    const result = parseA1111Parameters('');

    expect(result.positive_prompt).toBe('');
    expect(Object.keys(result)).toEqual(['positive_prompt']);
  });

  it('should handle only whitespace input', () => {
    const result = parseA1111Parameters('   \n  \t  ');

    expect(result.positive_prompt).toBe('');
    expect(Object.keys(result)).toEqual(['positive_prompt']);
  });

  it('should handle parameters without commas', () => {
    const text = `test prompt
Steps: 20 CFG scale: 7.5 Sampler: Test`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('test prompt');
    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test');
  });

  it('should handle parameters with different spacing', () => {
    const text = `test prompt
Steps:20,CFG scale:7.5,Sampler:Test Sampler,Seed:123`;

    const result = parseA1111Parameters(text);

    expect(result.steps).toBe('20');
    expect(result.cfg).toBe('7.5');
    expect(result.sampler).toBe('Test Sampler');
    expect(result.seed).toBe('123');
  });

  it('should handle real-world A1111 export format', () => {
    const text = `a beautiful landscape with mountains and lakes, highly detailed, 8k, photorealistic
Negative prompt: low quality, blurry, bad anatomy, worst quality, low resolution
Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234567890, Size: 512x768, Model hash: abc123def, Model: dreamshaper_v7, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337`;

    const result = parseA1111Parameters(text);

    expect(result.positive_prompt).toBe('a beautiful landscape with mountains and lakes, highly detailed, 8k, photorealistic');
    expect(result.negative_prompt).toBe('low quality, blurry, bad anatomy, worst quality, low resolution');
    expect(result.steps).toBe('20');
    expect(result.sampler).toBe('DPM++ 2M Karras');
    expect(result.cfg).toBe('7');
    expect(result.seed).toBe('1234567890');
    expect(result.model).toBe('dreamshaper_v7');
  });

  it('should handle parameters with colons in values', () => {
    const text = `test prompt
Steps: 20, Sampler: DPM++2M:Karras, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.sampler).toBe('DPM++2M:Karras');
  });

  it('should prioritize first match for duplicate parameters', () => {
    const text = `test prompt
Steps: 20, Steps: 30, CFG scale: 7.5`;

    const result = parseA1111Parameters(text);

    expect(result.steps).toBe('20'); // Should use first match
  });
});