"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
(0, vitest_1.describe)('Parsers module exports', () => {
    (0, vitest_1.it)('should export parseA1111Parameters function', () => {
        (0, vitest_1.expect)(typeof index_1.parseA1111Parameters).toBe('function');
    });
    (0, vitest_1.it)('should export separatePrompts function', () => {
        (0, vitest_1.expect)(typeof index_1.separatePrompts).toBe('function');
    });
    (0, vitest_1.it)('should export extractGenerationSettings function', () => {
        (0, vitest_1.expect)(typeof index_1.extractGenerationSettings).toBe('function');
    });
    (0, vitest_1.it)('should export validateA1111Format function', () => {
        (0, vitest_1.expect)(typeof index_1.validateA1111Format).toBe('function');
    });
    (0, vitest_1.it)('should export isValidPromptSeparation function', () => {
        (0, vitest_1.expect)(typeof index_1.isValidPromptSeparation).toBe('function');
    });
    (0, vitest_1.it)('should export validateA1111Parameters function', () => {
        (0, vitest_1.expect)(typeof index_1.validateA1111Parameters).toBe('function');
    });
    (0, vitest_1.it)('should have working parseA1111Parameters function', () => {
        const input = 'beautiful landscape\nSteps: 20, CFG scale: 7';
        const result = (0, index_1.parseA1111Parameters)(input);
        (0, vitest_1.expect)(result.positive_prompt).toBe('beautiful landscape');
        (0, vitest_1.expect)(result.steps).toBe(20);
        (0, vitest_1.expect)(result.cfg).toBe(7);
    });
    (0, vitest_1.it)('should have working separatePrompts function', () => {
        const input = 'positive\nNegative prompt: negative\nSteps: 20';
        const result = (0, index_1.separatePrompts)(input);
        (0, vitest_1.expect)(result.positive).toBe('positive');
        (0, vitest_1.expect)(result.negative).toBe('negative');
    });
    (0, vitest_1.it)('should have working extractGenerationSettings function', () => {
        const input = 'Steps: 25, CFG scale: 8.0, Sampler: DPM++';
        const result = (0, index_1.extractGenerationSettings)(input);
        (0, vitest_1.expect)(result.steps).toBe(25);
        (0, vitest_1.expect)(result.cfg).toBe(8.0);
        (0, vitest_1.expect)(result.sampler).toBe('DPM++');
    });
    (0, vitest_1.it)('should have working validateA1111Format function', () => {
        (0, vitest_1.expect)((0, index_1.validateA1111Format)('prompt\nSteps: 20')).toBe(true);
        (0, vitest_1.expect)((0, index_1.validateA1111Format)('just text')).toBe(false);
    });
    (0, vitest_1.it)('should have working isValidPromptSeparation function', () => {
        (0, vitest_1.expect)((0, index_1.isValidPromptSeparation)('positive prompt')).toBe(true);
        (0, vitest_1.expect)((0, index_1.isValidPromptSeparation)('')).toBe(false);
    });
    (0, vitest_1.it)('should have working validateA1111Parameters function', () => {
        const validParams = {
            positive_prompt: 'test'
        };
        const invalidParams = {
            negative_prompt: 'test'
        };
        (0, vitest_1.expect)((0, index_1.validateA1111Parameters)(validParams)).toBe(true);
        (0, vitest_1.expect)((0, index_1.validateA1111Parameters)(invalidParams)).toBe(false);
    });
});
(0, vitest_1.describe)('Type exports', () => {
    (0, vitest_1.it)('should allow A1111Parameters type usage', () => {
        const params = {
            positive_prompt: 'test prompt',
            negative_prompt: 'negative',
            steps: 20,
            cfg: 7.5,
            seed: 123456
        };
        (0, vitest_1.expect)(params.positive_prompt).toBe('test prompt');
        (0, vitest_1.expect)(params.negative_prompt).toBe('negative');
        (0, vitest_1.expect)(params.steps).toBe(20);
        (0, vitest_1.expect)(params.cfg).toBe(7.5);
        (0, vitest_1.expect)(params.seed).toBe(123456);
    });
    (0, vitest_1.it)('should allow GenerationSettings type usage', () => {
        const settings = {
            steps: 30,
            cfg: 8.0,
            sampler: 'DPM++ 2M Karras',
            seed: 987654321
        };
        (0, vitest_1.expect)(settings.steps).toBe(30);
        (0, vitest_1.expect)(settings.cfg).toBe(8.0);
        (0, vitest_1.expect)(settings.sampler).toBe('DPM++ 2M Karras');
        (0, vitest_1.expect)(settings.seed).toBe(987654321);
    });
    (0, vitest_1.it)('should allow PromptSeparationResult type usage', () => {
        const result = {
            positive: 'positive prompt',
            negative: 'negative prompt'
        };
        (0, vitest_1.expect)(result.positive).toBe('positive prompt');
        (0, vitest_1.expect)(result.negative).toBe('negative prompt');
    });
});
//# sourceMappingURL=index.test.js.map