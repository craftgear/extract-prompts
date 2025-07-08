"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const a1111_1 = require("./a1111");
(0, vitest_1.describe)('parseA1111Parameters', () => {
    (0, vitest_1.it)('should parse complete A1111 parameters', () => {
        const input = `beautiful landscape, masterpiece
Negative prompt: blur, distorted, ugly
Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7, Seed: 1234567890, Size: 512x768, Model: sd_xl_base_1.0`;
        const result = (0, a1111_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result).toEqual({
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
    (0, vitest_1.it)('should parse parameters without negative prompt', () => {
        const input = `beautiful landscape, masterpiece
Steps: 25, CFG scale: 8.5, Seed: 42`;
        const result = (0, a1111_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive_prompt: 'beautiful landscape, masterpiece',
            steps: 25,
            cfg: 8.5,
            seed: 42,
            raw_text: input
        });
    });
    (0, vitest_1.it)('should handle case-insensitive parameters', () => {
        const input = `portrait, detailed
negative prompt: background
steps: 15, cfg scale: 6.0`;
        const result = (0, a1111_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result.negative_prompt).toBe('background');
        (0, vitest_1.expect)(result.steps).toBe(15);
        (0, vitest_1.expect)(result.cfg).toBe(6.0);
    });
    (0, vitest_1.it)('should handle advanced parameters', () => {
        const input = `portrait
Steps: 20, CFG scale: 7, Denoising strength: 0.7, Clip skip: 2, ENSD: 31337, Restore faces, Hires upscaler: ESRGAN_4x, Hires steps: 10, Hires denoising strength: 0.5`;
        const result = (0, a1111_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result.denoise).toBe(0.7);
        (0, vitest_1.expect)(result.clip_skip).toBe(2);
        (0, vitest_1.expect)(result.ensd).toBe('31337');
        (0, vitest_1.expect)(result.restore_faces).toBe(true);
        (0, vitest_1.expect)(result.hires_fix).toBe(true);
        (0, vitest_1.expect)(result.hires_upscaler).toBe('ESRGAN_4x');
        (0, vitest_1.expect)(result.hires_steps).toBe(10);
        (0, vitest_1.expect)(result.hires_denoising).toBe(0.5);
    });
    (0, vitest_1.it)('should handle malformed input gracefully', () => {
        const input = 'just some text without parameters';
        const result = (0, a1111_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive_prompt: input,
            raw_text: input
        });
    });
    (0, vitest_1.it)('should throw error for empty input', () => {
        (0, vitest_1.expect)(() => (0, a1111_1.parseA1111Parameters)('')).toThrow('Invalid input: text cannot be empty');
        (0, vitest_1.expect)(() => (0, a1111_1.parseA1111Parameters)('   ')).toThrow('Invalid input: text cannot be empty');
    });
    (0, vitest_1.it)('should throw error for invalid input types', () => {
        (0, vitest_1.expect)(() => (0, a1111_1.parseA1111Parameters)(null)).toThrow('Invalid input: text must be a non-empty string');
        (0, vitest_1.expect)(() => (0, a1111_1.parseA1111Parameters)(undefined)).toThrow('Invalid input: text must be a non-empty string');
        (0, vitest_1.expect)(() => (0, a1111_1.parseA1111Parameters)(123)).toThrow('Invalid input: text must be a non-empty string');
    });
});
(0, vitest_1.describe)('separatePrompts', () => {
    (0, vitest_1.it)('should separate positive and negative prompts', () => {
        const input = `beautiful landscape
Negative prompt: ugly, distorted
Steps: 20`;
        const result = (0, a1111_1.separatePrompts)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive: 'beautiful landscape',
            negative: 'ugly, distorted'
        });
    });
    (0, vitest_1.it)('should handle different negative markers', () => {
        const testCases = [
            'Negative prompt: test',
            'Negative: test',
            'negative prompt: test',
            'negative: test'
        ];
        for (const marker of testCases) {
            const input = `positive\n${marker}`;
            const result = (0, a1111_1.separatePrompts)(input);
            (0, vitest_1.expect)(result.positive).toBe('positive');
            (0, vitest_1.expect)(result.negative).toBe('test');
        }
    });
    (0, vitest_1.it)('should handle text without negative prompt', () => {
        const input = `beautiful landscape
Steps: 20, CFG scale: 7`;
        const result = (0, a1111_1.separatePrompts)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive: 'beautiful landscape',
            negative: ''
        });
    });
    (0, vitest_1.it)('should handle text without parameters', () => {
        const input = `beautiful landscape
Negative prompt: ugly`;
        const result = (0, a1111_1.separatePrompts)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive: 'beautiful landscape',
            negative: 'ugly'
        });
    });
    (0, vitest_1.it)('should handle text with only positive prompt', () => {
        const input = 'just a simple prompt';
        const result = (0, a1111_1.separatePrompts)(input);
        (0, vitest_1.expect)(result).toEqual({
            positive: 'just a simple prompt',
            negative: ''
        });
    });
    (0, vitest_1.it)('should find earliest parameter marker', () => {
        const input = `prompt
Negative prompt: negative
Size: 512x512, Steps: 20, CFG scale: 7`;
        const result = (0, a1111_1.separatePrompts)(input);
        (0, vitest_1.expect)(result.positive).toBe('prompt');
        (0, vitest_1.expect)(result.negative).toBe('negative');
    });
});
(0, vitest_1.describe)('extractGenerationSettings', () => {
    (0, vitest_1.it)('should extract basic generation settings', () => {
        const input = 'Steps: 20, Sampler: DPM++ 2M Karras, CFG scale: 7.5, Seed: 1234567890, Size: 512x768, Model: sd_xl_base_1.0';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result).toEqual({
            steps: 20,
            sampler: 'DPM++ 2M Karras',
            cfg: 7.5,
            seed: 1234567890,
            size: '512x768',
            model: 'sd_xl_base_1.0'
        });
    });
    (0, vitest_1.it)('should extract advanced settings', () => {
        const input = 'Denoising strength: 0.7, Clip skip: 2, ENSD: 31337';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result).toEqual({
            denoise: 0.7,
            clip_skip: 2,
            ensd: '31337'
        });
    });
    (0, vitest_1.it)('should detect hires fix settings', () => {
        const input = 'Hires upscale: 2.0, Hires upscaler: ESRGAN_4x, Hires steps: 15, Hires denoising strength: 0.5';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result.hires_fix).toBe(true);
        (0, vitest_1.expect)(result.hires_upscaler).toBe('ESRGAN_4x');
        (0, vitest_1.expect)(result.hires_steps).toBe(15);
        (0, vitest_1.expect)(result.hires_denoising).toBe(0.5);
    });
    (0, vitest_1.it)('should detect restore faces', () => {
        const input = 'Steps: 20, Restore faces';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result.steps).toBe(20);
        (0, vitest_1.expect)(result.restore_faces).toBe(true);
    });
    (0, vitest_1.it)('should handle case insensitive matching', () => {
        const input = 'steps: 25, cfg scale: 8.0, sampler: euler a';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result.steps).toBe(25);
        (0, vitest_1.expect)(result.cfg).toBe(8.0);
        (0, vitest_1.expect)(result.sampler).toBe('euler a');
    });
    (0, vitest_1.it)('should handle invalid numeric values', () => {
        const input = 'Steps: abc, CFG scale: xyz, Seed: invalid';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result).toEqual({});
    });
    (0, vitest_1.it)('should return empty object for text without parameters', () => {
        const input = 'just a regular prompt without any parameters';
        const result = (0, a1111_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result).toEqual({});
    });
});
(0, vitest_1.describe)('validateA1111Format', () => {
    (0, vitest_1.it)('should return true for valid A1111 format', () => {
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
            (0, vitest_1.expect)((0, a1111_1.validateA1111Format)(input)).toBe(true);
        }
    });
    (0, vitest_1.it)('should return false for invalid input', () => {
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
            (0, vitest_1.expect)((0, a1111_1.validateA1111Format)(input)).toBe(false);
        }
    });
    (0, vitest_1.it)('should be case insensitive', () => {
        const input = 'prompt\nsteps: 20';
        (0, vitest_1.expect)((0, a1111_1.validateA1111Format)(input)).toBe(true);
    });
});
(0, vitest_1.describe)('isValidPromptSeparation', () => {
    (0, vitest_1.it)('should return true for valid prompt separation', () => {
        const validInputs = [
            'positive prompt\nNegative prompt: negative',
            'positive prompt\nSteps: 20',
            'positive prompt'
        ];
        for (const input of validInputs) {
            (0, vitest_1.expect)((0, a1111_1.isValidPromptSeparation)(input)).toBe(true);
        }
    });
    (0, vitest_1.it)('should return false for invalid prompt separation', () => {
        const invalidInputs = [
            '',
            '   ',
            '\nNegative prompt: only negative', // No positive prompt
            'x'.repeat(10001), // Too long
            null,
            undefined
        ];
        for (const input of invalidInputs) {
            (0, vitest_1.expect)((0, a1111_1.isValidPromptSeparation)(input)).toBe(false);
        }
    });
    (0, vitest_1.it)('should validate negative prompt marker presence', () => {
        // This case should be handled by the separatePrompts logic
        const input = 'positive\nnegative'; // Missing "Negative prompt:" marker
        const result = (0, a1111_1.isValidPromptSeparation)(input);
        (0, vitest_1.expect)(result).toBe(true); // Should still be valid as it has positive content
    });
});
(0, vitest_1.describe)('validateA1111Parameters', () => {
    (0, vitest_1.it)('should return true for valid parameters', () => {
        const validParams = {
            positive_prompt: 'beautiful landscape',
            negative_prompt: 'ugly',
            steps: 20,
            cfg: 7.5,
            seed: 1234567890,
            denoise: 0.7,
            clip_skip: 2
        };
        (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(validParams)).toBe(true);
    });
    (0, vitest_1.it)('should return false for missing positive prompt', () => {
        const invalidParams = {
            negative_prompt: 'ugly',
            steps: 20
        };
        (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(invalidParams)).toBe(false);
    });
    (0, vitest_1.it)('should return false for invalid positive prompt type', () => {
        const invalidParams = {
            positive_prompt: 123,
            steps: 20
        };
        (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(invalidParams)).toBe(false);
    });
    (0, vitest_1.it)('should validate numeric parameter ranges', () => {
        const testCases = [
            { params: { positive_prompt: 'test', steps: 0 }, valid: false }, // steps too low
            { params: { positive_prompt: 'test', steps: 1001 }, valid: false }, // steps too high
            { params: { positive_prompt: 'test', cfg: -1 }, valid: false }, // cfg too low
            { params: { positive_prompt: 'test', cfg: 31 }, valid: false }, // cfg too high
            { params: { positive_prompt: 'test', denoise: -0.1 }, valid: false }, // denoise too low
            { params: { positive_prompt: 'test', denoise: 1.1 }, valid: false }, // denoise too high
            { params: { positive_prompt: 'test', clip_skip: 0 }, valid: false }, // clip_skip too low
            { params: { positive_prompt: 'test', clip_skip: 13 }, valid: false }, // clip_skip too high
            { params: { positive_prompt: 'test', steps: 20 }, valid: true }, // valid
            { params: { positive_prompt: 'test', cfg: 7.5 }, valid: true }, // valid
        ];
        for (const { params, valid } of testCases) {
            (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(params)).toBe(valid);
        }
    });
    (0, vitest_1.it)('should handle NaN values', () => {
        const invalidParams = {
            positive_prompt: 'test',
            steps: NaN
        };
        (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(invalidParams)).toBe(false);
    });
    (0, vitest_1.it)('should return false for invalid input types', () => {
        const invalidInputs = [
            null,
            undefined,
            'string',
            123,
            []
        ];
        for (const input of invalidInputs) {
            (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(input)).toBe(false);
        }
    });
    (0, vitest_1.it)('should allow undefined optional parameters', () => {
        const validParams = {
            positive_prompt: 'beautiful landscape'
        };
        (0, vitest_1.expect)((0, a1111_1.validateA1111Parameters)(validParams)).toBe(true);
    });
});
//# sourceMappingURL=a1111.test.js.map