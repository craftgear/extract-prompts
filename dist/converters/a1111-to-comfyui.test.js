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
            // Workflow should have nodes array instead of prompt object
            (0, vitest_1.expect)(result.workflow?.nodes).toBeDefined();
            (0, vitest_1.expect)(result.workflow?.nodes).toBeInstanceOf(Array);
            // 基本的なノードが含まれているかチェック
            const nodes = result.workflow?.nodes;
            const nodeTypes = nodes.map(node => node.type);
            (0, vitest_1.expect)(nodeTypes).toContain('CheckpointLoaderSimple');
            (0, vitest_1.expect)(nodeTypes).toContain('CLIPTextEncode');
            (0, vitest_1.expect)(nodeTypes).toContain('EmptyLatentImage');
            (0, vitest_1.expect)(nodeTypes).toContain('KSampler');
            (0, vitest_1.expect)(nodeTypes).toContain('VAEDecode');
            (0, vitest_1.expect)(nodeTypes).toContain('SaveImage');
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
            const nodes = result.workflow?.nodes;
            const positiveNode = nodes.find((node) => node.type === 'CLIPTextEncode' &&
                node.widgets_values?.[0]?.includes('<lora:style:1.0>'));
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
    // ComfyUI UI Workflow Format Tests
    (0, vitest_1.describe)('ComfyUI Workflow Format', () => {
        (0, vitest_1.it)('should generate workflow with required top-level fields', () => {
            const params = {
                positive_prompt: 'test prompt',
                negative_prompt: 'test negative',
                steps: '20',
                cfg: '7',
                seed: '42'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.success).toBe(true);
            (0, vitest_1.expect)(result.workflow).toBeDefined();
            const workflow = result.workflow;
            // Required top-level fields for ComfyUI UI workflow format
            (0, vitest_1.expect)(workflow).toHaveProperty('version');
            (0, vitest_1.expect)(workflow).toHaveProperty('last_node_id');
            (0, vitest_1.expect)(workflow).toHaveProperty('last_link_id');
            (0, vitest_1.expect)(workflow).toHaveProperty('nodes');
            (0, vitest_1.expect)(workflow).toHaveProperty('links');
            (0, vitest_1.expect)(workflow).toHaveProperty('groups');
            (0, vitest_1.expect)(workflow).toHaveProperty('config');
            (0, vitest_1.expect)(workflow).toHaveProperty('extra');
        });
        (0, vitest_1.it)('should have correct version field', () => {
            const params = { positive_prompt: 'test' };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.workflow?.version).toBe(0.4);
        });
        (0, vitest_1.it)('should generate nodes as array with proper structure', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.workflow?.nodes).toBeInstanceOf(Array);
            (0, vitest_1.expect)(result.workflow?.nodes.length).toBeGreaterThan(0);
            // Check first node structure
            const firstNode = result.workflow?.nodes[0];
            (0, vitest_1.expect)(firstNode).toHaveProperty('id');
            (0, vitest_1.expect)(firstNode).toHaveProperty('type');
            (0, vitest_1.expect)(firstNode).toHaveProperty('pos');
            (0, vitest_1.expect)(firstNode).toHaveProperty('size');
            (0, vitest_1.expect)(firstNode).toHaveProperty('flags');
            (0, vitest_1.expect)(firstNode).toHaveProperty('order');
            (0, vitest_1.expect)(firstNode).toHaveProperty('mode');
            (0, vitest_1.expect)(firstNode).toHaveProperty('inputs');
            (0, vitest_1.expect)(firstNode).toHaveProperty('outputs');
            (0, vitest_1.expect)(firstNode).toHaveProperty('properties');
            (0, vitest_1.expect)(firstNode).toHaveProperty('widgets_values');
        });
        (0, vitest_1.it)('should generate links as array of connection tuples', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            (0, vitest_1.expect)(result.workflow?.links).toBeInstanceOf(Array);
            // Each link should be an array of 6 elements: [link_id, output_node_id, output_slot, input_node_id, input_slot, type]
            result.workflow?.links.forEach((link) => {
                (0, vitest_1.expect)(Array.isArray(link)).toBe(true);
                (0, vitest_1.expect)(link).toHaveLength(6);
                (0, vitest_1.expect)(typeof link[0]).toBe('number'); // link_id
                (0, vitest_1.expect)(typeof link[1]).toBe('number'); // output_node_id
                (0, vitest_1.expect)(typeof link[2]).toBe('number'); // output_slot
                (0, vitest_1.expect)(typeof link[3]).toBe('number'); // input_node_id
                (0, vitest_1.expect)(typeof link[4]).toBe('number'); // input_slot
                (0, vitest_1.expect)(typeof link[5]).toBe('string'); // type
            });
        });
        (0, vitest_1.it)('should include basic ComfyUI nodes', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            // Check for essential node types
            const nodeTypes = nodes.map((node) => node.type);
            (0, vitest_1.expect)(nodeTypes).toContain('CheckpointLoaderSimple');
            (0, vitest_1.expect)(nodeTypes).toContain('CLIPTextEncode'); // Should appear twice (positive/negative)
            (0, vitest_1.expect)(nodeTypes).toContain('EmptyLatentImage');
            (0, vitest_1.expect)(nodeTypes).toContain('KSampler');
            (0, vitest_1.expect)(nodeTypes).toContain('VAEDecode');
            (0, vitest_1.expect)(nodeTypes).toContain('SaveImage');
        });
        (0, vitest_1.it)('should generate LoRA nodes when LoRAs are present', () => {
            const params = {
                positive_prompt: 'test <lora:style1:0.8> <lora:style2:0.6>',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            // Should have LoraLoader nodes
            const loraNodes = nodes.filter((node) => node.type === 'LoraLoader');
            (0, vitest_1.expect)(loraNodes).toHaveLength(2);
            // Check LoRA node widgets_values contain LoRA names and strengths
            const firstLoraNode = loraNodes[0];
            (0, vitest_1.expect)(firstLoraNode.widgets_values).toContain('style1.safetensors');
            (0, vitest_1.expect)(firstLoraNode.widgets_values).toContain(0.8);
        });
        (0, vitest_1.it)('should generate upscaler nodes when hires.fix is enabled', () => {
            const params = {
                positive_prompt: 'test',
                hires_fix: 'true',
                hires_upscaler: 'ESRGAN_4x',
                hires_steps: '15'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            // Should have additional nodes for upscaling
            const nodeTypes = nodes.map((node) => node.type);
            (0, vitest_1.expect)(nodeTypes).toContain('UpscaleModelLoader');
            (0, vitest_1.expect)(nodeTypes).toContain('ImageUpscaleWithModel');
            // Should have two KSampler nodes (base + hires)
            const ksamplerNodes = nodes.filter((node) => node.type === 'KSampler');
            (0, vitest_1.expect)(ksamplerNodes.length).toBe(2);
        });
        (0, vitest_1.it)('should have proper node positioning', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            // All nodes should have valid positions
            nodes.forEach((node) => {
                (0, vitest_1.expect)(Array.isArray(node.pos)).toBe(true);
                (0, vitest_1.expect)(node.pos).toHaveLength(2);
                (0, vitest_1.expect)(typeof node.pos[0]).toBe('number'); // x coordinate
                (0, vitest_1.expect)(typeof node.pos[1]).toBe('number'); // y coordinate
                (0, vitest_1.expect)(Array.isArray(node.size)).toBe(true);
                (0, vitest_1.expect)(node.size).toHaveLength(2);
                (0, vitest_1.expect)(typeof node.size[0]).toBe('number'); // width
                (0, vitest_1.expect)(typeof node.size[1]).toBe('number'); // height
            });
        });
        (0, vitest_1.it)('should have incrementing node IDs', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            // Node IDs should be unique and incrementing
            const nodeIds = nodes.map((node) => node.id);
            const uniqueIds = new Set(nodeIds);
            (0, vitest_1.expect)(uniqueIds.size).toBe(nodeIds.length); // All IDs should be unique
            (0, vitest_1.expect)(Math.min(...nodeIds)).toBe(1); // Should start from 1
            (0, vitest_1.expect)(Math.max(...nodeIds)).toBe(nodeIds.length); // Should be consecutive
        });
        (0, vitest_1.it)('should generate correct link connections', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const nodes = result.workflow?.nodes || [];
            const links = result.workflow?.links || [];
            // Verify that all link node IDs reference actual nodes
            const nodeIds = new Set(nodes.map((node) => node.id));
            links.forEach((link) => {
                const [, outputNodeId, , inputNodeId] = link;
                (0, vitest_1.expect)(nodeIds.has(outputNodeId)).toBe(true);
                (0, vitest_1.expect)(nodeIds.has(inputNodeId)).toBe(true);
            });
        });
        (0, vitest_1.it)('should track last_node_id and last_link_id correctly', () => {
            const params = {
                positive_prompt: 'test prompt',
                steps: '20'
            };
            const result = (0, a1111_to_comfyui_1.convertA1111ToComfyUI)(params);
            const workflow = result.workflow;
            const nodes = workflow.nodes || [];
            const links = workflow.links || [];
            // last_node_id should equal the highest node ID
            const maxNodeId = Math.max(...nodes.map((node) => node.id));
            (0, vitest_1.expect)(workflow.last_node_id).toBe(maxNodeId);
            // last_link_id should equal the highest link ID
            if (links.length > 0) {
                const maxLinkId = Math.max(...links.map((link) => link[0]));
                (0, vitest_1.expect)(workflow.last_link_id).toBe(maxLinkId);
            }
        });
    });
});
//# sourceMappingURL=a1111-to-comfyui.test.js.map