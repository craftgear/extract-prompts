"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const validation_1 = require("./validation");
(0, vitest_1.describe)('validateComfyUIWorkflow', () => {
    (0, vitest_1.it)('should return false for null or undefined', () => {
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(null)).toBe(false);
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(undefined)).toBe(false);
    });
    (0, vitest_1.it)('should return false for non-objects', () => {
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)('string')).toBe(false);
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(123)).toBe(false);
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)([])).toBe(false);
    });
    (0, vitest_1.it)('should return true for valid ComfyUI workflow with numeric keys', () => {
        const validWorkflow = {
            '1': {
                class_type: 'CheckpointLoaderSimple',
                inputs: {}
            },
            '2': {
                class_type: 'CLIPTextEncode',
                inputs: {}
            }
        };
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(validWorkflow)).toBe(true);
    });
    (0, vitest_1.it)('should return true for workflows with workflow/prompt/extra_pnginfo fields', () => {
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)({ workflow: {} })).toBe(true);
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)({ prompt: {} })).toBe(true);
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)({ extra_pnginfo: {} })).toBe(true);
    });
    (0, vitest_1.it)('should return true for array with ComfyUI nodes', () => {
        const arrayWorkflow = [
            { class_type: 'CheckpointLoaderSimple' },
            { class_type: 'CLIPTextEncode' }
        ];
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(arrayWorkflow)).toBe(true);
    });
    (0, vitest_1.it)('should return false for objects without ComfyUI structure', () => {
        const invalidWorkflow = {
            random: 'data',
            nothing: 'useful'
        };
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(invalidWorkflow)).toBe(false);
    });
    (0, vitest_1.it)('should return false for numeric keys without class_type', () => {
        const invalidWorkflow = {
            '1': { some: 'data' },
            '2': { other: 'data' }
        };
        (0, vitest_1.expect)((0, validation_1.validateComfyUIWorkflow)(invalidWorkflow)).toBe(false);
    });
});
(0, vitest_1.describe)('extractWorkflowInfo', () => {
    (0, vitest_1.it)('should return empty info for invalid input', () => {
        const info = (0, validation_1.extractWorkflowInfo)(null);
        (0, vitest_1.expect)(info.nodeCount).toBe(0);
        (0, vitest_1.expect)(info.nodeTypes).toEqual([]);
        (0, vitest_1.expect)(info.hasPrompt).toBe(false);
        (0, vitest_1.expect)(info.hasModel).toBe(false);
    });
    (0, vitest_1.it)('should extract node count and types correctly', () => {
        const workflow = {
            '1': {
                class_type: 'CheckpointLoaderSimple',
                inputs: {}
            },
            '2': {
                class_type: 'CLIPTextEncode',
                inputs: {}
            },
            '3': {
                class_type: 'KSampler',
                inputs: {}
            }
        };
        const info = (0, validation_1.extractWorkflowInfo)(workflow);
        (0, vitest_1.expect)(info.nodeCount).toBe(3);
        (0, vitest_1.expect)(info.nodeTypes).toEqual(['CheckpointLoaderSimple', 'CLIPTextEncode', 'KSampler']);
        (0, vitest_1.expect)(info.hasPrompt).toBe(false); // CLIPTextEncode doesn't contain 'prompt' in class_type
        (0, vitest_1.expect)(info.hasModel).toBe(true); // CheckpointLoaderSimple contains 'model'
    });
    (0, vitest_1.it)('should detect prompt nodes', () => {
        const workflow = {
            '1': {
                class_type: 'PromptNode',
                inputs: {}
            }
        };
        const info = (0, validation_1.extractWorkflowInfo)(workflow);
        (0, vitest_1.expect)(info.hasPrompt).toBe(true);
    });
    (0, vitest_1.it)('should detect model nodes', () => {
        const workflow = {
            '1': {
                class_type: 'ModelLoader',
                inputs: {}
            }
        };
        const info = (0, validation_1.extractWorkflowInfo)(workflow);
        (0, vitest_1.expect)(info.hasModel).toBe(true);
    });
    (0, vitest_1.it)('should detect checkpoint nodes as model nodes', () => {
        const workflow = {
            '1': {
                class_type: 'CheckpointLoaderSimple',
                inputs: {}
            }
        };
        const info = (0, validation_1.extractWorkflowInfo)(workflow);
        (0, vitest_1.expect)(info.hasModel).toBe(true);
    });
    (0, vitest_1.it)('should ignore non-numeric keys', () => {
        const workflow = {
            '1': {
                class_type: 'ValidNode',
                inputs: {}
            },
            nonNumeric: {
                class_type: 'InvalidNode',
                inputs: {}
            }
        };
        const info = (0, validation_1.extractWorkflowInfo)(workflow);
        (0, vitest_1.expect)(info.nodeCount).toBe(1);
        (0, vitest_1.expect)(info.nodeTypes).toEqual(['ValidNode']);
    });
});
//# sourceMappingURL=validation.test.js.map