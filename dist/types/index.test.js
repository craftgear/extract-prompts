"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
(0, vitest_1.describe)('Type Definitions', () => {
    (0, vitest_1.describe)('ExtractedData', () => {
        (0, vitest_1.it)('should validate ExtractedData structure', () => {
            const data = {
                workflow: {
                    '1': {
                        class_type: 'CheckpointLoaderSimple',
                        inputs: {
                            ckpt_name: 'model.safetensors'
                        }
                    }
                },
                parameters: {
                    positive_prompt: 'test prompt',
                    steps: '20',
                    cfg: '7.5'
                },
                file: 'test.png'
            };
            (0, vitest_1.expect)((0, index_1.isValidExtractedData)(data)).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid ExtractedData', () => {
            const invalidData = {
                randomField: 'test'
            };
            (0, vitest_1.expect)((0, index_1.isValidExtractedData)(invalidData)).toBe(false);
        });
    });
    (0, vitest_1.describe)('ComfyUIWorkflow', () => {
        (0, vitest_1.it)('should validate ComfyUI workflow structure', () => {
            const workflow = {
                '1': {
                    class_type: 'CheckpointLoaderSimple',
                    inputs: {
                        ckpt_name: 'model.safetensors'
                    }
                },
                '2': {
                    class_type: 'CLIPTextEncode',
                    inputs: {
                        text: 'test prompt'
                    }
                }
            };
            (0, vitest_1.expect)((0, index_1.isComfyUIWorkflow)(workflow)).toBe(true);
        });
        (0, vitest_1.it)('should reject non-ComfyUI data', () => {
            const notWorkflow = {
                random: 'data'
            };
            (0, vitest_1.expect)((0, index_1.isComfyUIWorkflow)(notWorkflow)).toBe(false);
        });
    });
    (0, vitest_1.describe)('A1111Parameters', () => {
        (0, vitest_1.it)('should validate A1111 parameters structure', () => {
            const params = {
                positive_prompt: 'test prompt',
                negative_prompt: 'bad quality',
                steps: '20',
                cfg: '7.5',
                sampler: 'DPM++ 2M',
                seed: '12345'
            };
            (0, vitest_1.expect)((0, index_1.isA1111Parameters)(params)).toBe(true);
        });
        (0, vitest_1.it)('should reject non-A1111 parameters', () => {
            const notParams = {
                random: 'data'
            };
            (0, vitest_1.expect)((0, index_1.isA1111Parameters)(notParams)).toBe(false);
        });
    });
    (0, vitest_1.describe)('ExtractionResult', () => {
        (0, vitest_1.it)('should create valid extraction result', () => {
            const result = {
                success: true,
                data: {
                    file: 'test.png',
                    workflow: {
                        '1': {
                            class_type: 'KSampler',
                            inputs: {
                                steps: 20
                            }
                        }
                    }
                },
                filePath: 'test.png',
                processingTime: 100
            };
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.data).toBeDefined();
            (0, vitest_1.expect)(result.filePath).toBe('test.png');
        });
        (0, vitest_1.it)('should create error extraction result', () => {
            const result = {
                success: false,
                error: 'File not found',
                filePath: 'missing.png'
            };
            (0, vitest_1.expect)(result.success).toBe(false);
            (0, vitest_1.expect)(result.error).toBe('File not found');
            (0, vitest_1.expect)(result.data).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Custom Error Types', () => {
        (0, vitest_1.it)('should create ExtractionError', () => {
            const error = new index_1.ExtractionError('Test error', 'test.png');
            (0, vitest_1.expect)(error.name).toBe('ExtractionError');
            (0, vitest_1.expect)(error.message).toBe('Test error');
            (0, vitest_1.expect)(error.filePath).toBe('test.png');
        });
        (0, vitest_1.it)('should create UnsupportedFormatError', () => {
            const error = new index_1.UnsupportedFormatError('bmp', 'test.bmp');
            (0, vitest_1.expect)(error.name).toBe('UnsupportedFormatError');
            (0, vitest_1.expect)(error.message).toBe('Unsupported file format: bmp');
            (0, vitest_1.expect)(error.filePath).toBe('test.bmp');
        });
    });
});
//# sourceMappingURL=index.test.js.map