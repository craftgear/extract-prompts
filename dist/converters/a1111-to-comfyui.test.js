"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const a1111_to_comfyui_1 = require("./a1111-to-comfyui");
(0, vitest_1.describe)('A1111 to ComfyUI Converter', () => {
    (0, vitest_1.describe)('extractLoRATags', () => {
        (0, vitest_1.it)('should extract single LoRA tag', () => {
            const prompt = 'beautiful girl <lora:style1:0.8> masterpiece';
            const result = (0, a1111_to_comfyui_1.extractLoRATags)(prompt);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0]).toEqual({
                name: 'style1',
                strength: 0.8,
                path: 'style1.safetensors'
            });
        });
        (0, vitest_1.it)('should extract multiple LoRA tags', () => {
            const prompt = 'beautiful girl <lora:style1:0.8> <lora:style2:0.6> masterpiece';
            const result = (0, a1111_to_comfyui_1.extractLoRATags)(prompt);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0]).toEqual({
                name: 'style1',
                strength: 0.8,
                path: 'style1.safetensors'
            });
            (0, vitest_1.expect)(result[1]).toEqual({
                name: 'style2',
                strength: 0.6,
                path: 'style2.safetensors'
            });
        });
        (0, vitest_1.it)('should return empty array when no LoRA tags found', () => {
            const prompt = 'beautiful girl masterpiece';
            const result = (0, a1111_to_comfyui_1.extractLoRATags)(prompt);
            (0, vitest_1.expect)(result).toHaveLength(0);
        });
        (0, vitest_1.it)('should handle LoRA tags with spaces in names', () => {
            const prompt = 'test <lora:character name:1.0> prompt';
            const result = (0, a1111_to_comfyui_1.extractLoRATags)(prompt);
            (0, vitest_1.expect)(result).toHaveLength(1);
            (0, vitest_1.expect)(result[0].name).toBe('character name');
        });
    });
    (0, vitest_1.describe)('removeLoRATagsFromPrompt', () => {
        (0, vitest_1.it)('should remove LoRA tags from prompt', () => {
            const prompt = 'beautiful girl <lora:style1:0.8> masterpiece';
            const result = (0, a1111_to_comfyui_1.removeLoRATagsFromPrompt)(prompt);
            (0, vitest_1.expect)(result).toBe('beautiful girl masterpiece');
        });
        (0, vitest_1.it)('should remove multiple LoRA tags', () => {
            const prompt = 'beautiful girl <lora:style1:0.8> <lora:style2:0.6> masterpiece';
            const result = (0, a1111_to_comfyui_1.removeLoRATagsFromPrompt)(prompt);
            (0, vitest_1.expect)(result).toBe('beautiful girl masterpiece');
        });
        (0, vitest_1.it)('should handle prompt without LoRA tags', () => {
            const prompt = 'beautiful girl masterpiece';
            const result = (0, a1111_to_comfyui_1.removeLoRATagsFromPrompt)(prompt);
            (0, vitest_1.expect)(result).toBe('beautiful girl masterpiece');
        });
        (0, vitest_1.it)('should normalize spaces after removing tags', () => {
            const prompt = 'beautiful   <lora:test:1.0>   girl   masterpiece';
            const result = (0, a1111_to_comfyui_1.removeLoRATagsFromPrompt)(prompt);
            (0, vitest_1.expect)(result).toBe('beautiful girl masterpiece');
        });
    });
    (0, vitest_1.describe)('extractUpscalerInfo', () => {
        (0, vitest_1.it)('should extract upscaler info when hires_fix is true', () => {
            const params = {
                positive_prompt: 'test',
                hires_fix: 'true',
                hires_upscaler: 'ESRGAN_4x',
                hires_steps: '15',
                hires_denoising: '0.7'
            };
            const result = (0, a1111_to_comfyui_1.extractUpscalerInfo)(params);
            (0, vitest_1.expect)(result).toEqual({
                model: 'ESRGAN_4x',
                steps: 15,
                denoising: 0.7,
                scale: 2.0
            });
        });
        (0, vitest_1.it)('should extract upscaler info when hires_upscaler is set', () => {
            const params = {
                positive_prompt: 'test',
                hires_upscaler: 'Real-ESRGAN'
            };
            const result = (0, a1111_to_comfyui_1.extractUpscalerInfo)(params);
            (0, vitest_1.expect)(result).toEqual({
                model: 'Real-ESRGAN',
                steps: 10,
                denoising: 0.5,
                scale: 2.0
            });
        });
        (0, vitest_1.it)('should return undefined when no upscaler info', () => {
            const params = {
                positive_prompt: 'test'
            };
            const result = (0, a1111_to_comfyui_1.extractUpscalerInfo)(params);
            (0, vitest_1.expect)(result).toBeUndefined();
        });
        (0, vitest_1.it)('should use default values when some fields missing', () => {
            const params = {
                positive_prompt: 'test',
                hires_fix: 'true'
            };
            const result = (0, a1111_to_comfyui_1.extractUpscalerInfo)(params);
            (0, vitest_1.expect)(result).toEqual({
                model: 'ESRGAN_4x',
                steps: 10,
                denoising: 0.5,
                scale: 2.0
            });
        });
    });
    (0, vitest_1.describe)('shouldConvertToComfyUI', () => {
        (0, vitest_1.it)('should return true for valid A1111 parameters', () => {
            const params = {
                positive_prompt: 'beautiful girl',
                steps: '20',
                cfg: '7.5'
            };
            (0, vitest_1.expect)((0, a1111_to_comfyui_1.shouldConvertToComfyUI)(params)).toBe(true);
        });
        (0, vitest_1.it)('should return true when only positive_prompt exists', () => {
            const params = {
                positive_prompt: 'test prompt'
            };
            (0, vitest_1.expect)((0, a1111_to_comfyui_1.shouldConvertToComfyUI)(params)).toBe(true);
        });
        (0, vitest_1.it)('should return true when only steps exists', () => {
            const params = {
                positive_prompt: 'test',
                steps: '20'
            };
            (0, vitest_1.expect)((0, a1111_to_comfyui_1.shouldConvertToComfyUI)(params)).toBe(true);
        });
        (0, vitest_1.it)('should return false for empty parameters', () => {
            const params = {
                positive_prompt: ''
            };
            (0, vitest_1.expect)((0, a1111_to_comfyui_1.shouldConvertToComfyUI)(params)).toBe(false);
        });
    });
    (0, vitest_1.describe)('convertA1111ToComfyUI', () => {
        (0, vitest_1.it)('should convert basic A1111 parameters to ComfyUI workflow', () => {
            const params = {
                positive_prompt: 'beautiful girl',
                negative_prompt: 'ugly, bad quality',
                steps: '20',
                cfg: '7.5',
                sampler: 'DPM++ 2M Karras',
                seed: '12345',
                size: '512x768'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.workflow).toBeDefined();
            (0, vitest_1.expect)(result.originalParameters).toEqual(params);
            // WorkflowにPromptが含まれているかチェック
            (0, vitest_1.expect)(result.workflow?.prompt).toBeDefined();
            // 基本的なノードが含まれているかチェック
            const prompt = result.workflow?.prompt;
            (0, vitest_1.expect)(Object.keys(prompt)).toContain('1'); // CheckpointLoader
            (0, vitest_1.expect)(Object.keys(prompt)).toContain('2'); // CLIPTextEncode positive
            (0, vitest_1.expect)(Object.keys(prompt)).toContain('3'); // CLIPTextEncode negative
            (0, vitest_1.expect)(Object.keys(prompt)).toContain('4'); // EmptyLatentImage
            (0, vitest_1.expect)(Object.keys(prompt)).toContain('5'); // KSampler
        });
        (0, vitest_1.it)('should handle LoRA tags in prompts', () => {
            const params = {
                positive_prompt: 'beautiful girl <lora:style1:0.8> <lora:style2:0.6>',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.loras).toHaveLength(2);
            (0, vitest_1.expect)(result.loras?.[0]).toEqual({
                name: 'style1',
                strength: 0.8,
                path: 'style1.safetensors'
            });
            (0, vitest_1.expect)(result.loras?.[1]).toEqual({
                name: 'style2',
                strength: 0.6,
                path: 'style2.safetensors'
            });
        });
        (0, vitest_1.it)('should handle upscaler parameters', () => {
            const params = {
                positive_prompt: 'test',
                hires_fix: 'true',
                hires_upscaler: 'ESRGAN_4x',
                hires_steps: '15',
                hires_denoising: '0.7'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.upscaler).toEqual({
                model: 'ESRGAN_4x',
                steps: 15,
                denoising: 0.7,
                scale: 2.0
            });
        });
        (0, vitest_1.it)('should use default values for missing parameters', () => {
            const params = {
                positive_prompt: 'test'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.workflow).toBeDefined();
        });
        (0, vitest_1.it)('should handle conversion options', () => {
            const params = {
                positive_prompt: 'test <lora:style:1.0>'
            };
            const options = {
                removeLoRATags: false,
                defaultModel: 'custom_model.safetensors',
                startNodeId: 10
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params, options);
            (0, vitest_1.expect)(result.success).toBe(true);
            // LoRAタグが除去されていないことを確認
            const prompt = result.workflow?.prompt;
            const positiveNode = Object.values(prompt).find((node) => node.class_type === 'CLIPTextEncode' &&
                node.inputs?.text?.includes('<lora:style:1.0>'));
            (0, vitest_1.expect)(positiveNode).toBeDefined();
        });
        (0, vitest_1.it)('should handle empty parameters gracefully', () => {
            // 空のパラメータは成功するが基本的なワークフローを生成
            const params = {};
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.workflow).toBeDefined();
            (0, vitest_1.expect)(result.originalParameters).toEqual(params);
        });
    });
});
//# sourceMappingURL=a1111-to-comfyui.test.js.map