"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const a1111_1 = require("./a1111");
/**
 * Integration tests for the A1111 parser
 */
describe('A1111 Parser Integration', () => {
    test('should parse real A1111 parameter string', () => {
        const realA1111String = `masterpiece, best quality, 1girl, solo, looking at viewer, blonde hair, blue eyes, white dress, garden background
Negative prompt: nsfw, ugly, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry
Steps: 28, Sampler: DPM++ 2M Karras, CFG scale: 7.5, Seed: 1234567890, Size: 512x768, Model hash: 81274d13, Model: deliberate_v2, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, Hires upscale: 2, Hires upscaler: R-ESRGAN 4x+, Hires steps: 14, Hires denoising strength: 0.5`;
        const result = (0, a1111_1.parseA1111Parameters)(realA1111String);
        expect(result.positive_prompt).toBe('masterpiece, best quality, 1girl, solo, looking at viewer, blonde hair, blue eyes, white dress, garden background');
        expect(result.negative_prompt).toBe('nsfw, ugly, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry');
        expect(result.steps).toBe(28);
        expect(result.sampler).toBe('DPM++ 2M Karras');
        expect(result.cfg).toBe(7.5);
        expect(result.seed).toBe(1234567890);
        expect(result.size).toBe('512x768');
        expect(result.model).toBe('deliberate_v2');
        expect(result.denoise).toBe(0.7);
        expect(result.clip_skip).toBe(2);
        expect(result.ensd).toBe('31337');
        expect(result.hires_fix).toBe(true);
        expect(result.hires_upscaler).toBe('R-ESRGAN 4x+');
        expect(result.hires_steps).toBe(14);
        expect(result.hires_denoising).toBe(0.5);
    });
    test('should handle A1111 string with minimal parameters', () => {
        const minimalA1111String = `simple prompt
Steps: 20, CFG scale: 7.0, Sampler: Euler a, Seed: 123456789`;
        const result = (0, a1111_1.parseA1111Parameters)(minimalA1111String);
        expect(result.positive_prompt).toBe('simple prompt');
        expect(result.negative_prompt).toBeUndefined();
        expect(result.steps).toBe(20);
        expect(result.cfg).toBe(7.0);
        expect(result.sampler).toBe('Euler a');
        expect(result.seed).toBe(123456789);
    });
    test('should maintain backward compatibility', () => {
        const legacyInput = `portrait, detailed
Negative prompt: blurry
Steps: 25, CFG scale: 8.0, Sampler: DDIM, Seed: 987654321`;
        const result = (0, a1111_1.parseA1111Parameters)(legacyInput);
        // Check that all expected fields are present
        expect(result).toHaveProperty('positive_prompt');
        expect(result).toHaveProperty('negative_prompt');
        expect(result).toHaveProperty('steps');
        expect(result).toHaveProperty('cfg');
        expect(result).toHaveProperty('sampler');
        expect(result).toHaveProperty('seed');
        expect(result).toHaveProperty('raw_text');
        // Check values are correct types
        expect(typeof result.positive_prompt).toBe('string');
        expect(typeof result.negative_prompt).toBe('string');
        expect(typeof result.steps).toBe('number');
        expect(typeof result.cfg).toBe('number');
        expect(typeof result.sampler).toBe('string');
        expect(typeof result.seed).toBe('number');
        expect(typeof result.raw_text).toBe('string');
    });
});
//# sourceMappingURL=integration.test.js.map