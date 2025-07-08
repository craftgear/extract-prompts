import { describe, it, expect } from 'vitest';
import {
  convertA1111ToComfyUI,
  extractLoRATags,
  removeLoRATagsFromPrompt,
  extractUpscalerInfo,
  shouldConvertToComfyUI,
  convertSamplerName
} from './a1111-to-comfyui';
import { A1111Parameters } from '../types';

describe('A1111 to ComfyUI Converter', () => {
  describe('extractLoRATags', () => {
    it('should extract single LoRA tag', () => {
      const prompt = 'beautiful girl <lora:style1:0.8> masterpiece';
      const result = extractLoRATags(prompt);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'style1',
        strength: 0.8,
        path: 'style1.safetensors'
      });
    });

    it('should extract multiple LoRA tags', () => {
      const prompt = 'beautiful girl <lora:style1:0.8> <lora:style2:0.6> masterpiece';
      const result = extractLoRATags(prompt);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: 'style1',
        strength: 0.8,
        path: 'style1.safetensors'
      });
      expect(result[1]).toEqual({
        name: 'style2',
        strength: 0.6,
        path: 'style2.safetensors'
      });
    });

    it('should return empty array when no LoRA tags found', () => {
      const prompt = 'beautiful girl masterpiece';
      const result = extractLoRATags(prompt);
      
      expect(result).toHaveLength(0);
    });

    it('should handle LoRA tags with spaces in names', () => {
      const prompt = 'test <lora:character name:1.0> prompt';
      const result = extractLoRATags(prompt);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('character name');
    });
  });

  describe('removeLoRATagsFromPrompt', () => {
    it('should remove LoRA tags from prompt', () => {
      const prompt = 'beautiful girl <lora:style1:0.8> masterpiece';
      const result = removeLoRATagsFromPrompt(prompt);
      
      expect(result).toBe('beautiful girl masterpiece');
    });

    it('should remove multiple LoRA tags', () => {
      const prompt = 'beautiful girl <lora:style1:0.8> <lora:style2:0.6> masterpiece';
      const result = removeLoRATagsFromPrompt(prompt);
      
      expect(result).toBe('beautiful girl masterpiece');
    });

    it('should handle prompt without LoRA tags', () => {
      const prompt = 'beautiful girl masterpiece';
      const result = removeLoRATagsFromPrompt(prompt);
      
      expect(result).toBe('beautiful girl masterpiece');
    });

    it('should normalize spaces after removing tags', () => {
      const prompt = 'beautiful   <lora:test:1.0>   girl   masterpiece';
      const result = removeLoRATagsFromPrompt(prompt);
      
      expect(result).toBe('beautiful girl masterpiece');
    });
  });

  describe('extractUpscalerInfo', () => {
    it('should extract upscaler info when hires_fix is true', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        hires_fix: 'true',
        hires_upscaler: 'ESRGAN_4x',
        hires_steps: '15',
        hires_denoising: '0.7'
      };
      
      const result = extractUpscalerInfo(params);
      
      expect(result).toEqual({
        model: 'ESRGAN_4x',
        steps: 15,
        denoising: 0.7,
        scale: 2.0
      });
    });

    it('should extract upscaler info when hires_upscaler is set', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        hires_upscaler: 'Real-ESRGAN'
      };
      
      const result = extractUpscalerInfo(params);
      
      expect(result).toEqual({
        model: 'Real-ESRGAN',
        steps: 10,
        denoising: 0.5,
        scale: 2.0
      });
    });

    it('should return undefined when no upscaler info', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test'
      };
      
      const result = extractUpscalerInfo(params);
      
      expect(result).toBeUndefined();
    });

    it('should use default values when some fields missing', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        hires_fix: 'true'
      };
      
      const result = extractUpscalerInfo(params);
      
      expect(result).toEqual({
        model: 'ESRGAN_4x',
        steps: 10,
        denoising: 0.5,
        scale: 2.0
      });
    });
  });

  describe('shouldConvertToComfyUI', () => {
    it('should return true for valid A1111 parameters', () => {
      const params: A1111Parameters = {
        positive_prompt: 'beautiful girl',
        steps: '20',
        cfg: '7.5'
      };
      
      expect(shouldConvertToComfyUI(params)).toBe(true);
    });

    it('should return true when only positive_prompt exists', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt'
      };
      
      expect(shouldConvertToComfyUI(params)).toBe(true);
    });

    it('should return true when only steps exists', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        steps: '20'
      };
      
      expect(shouldConvertToComfyUI(params)).toBe(true);
    });

    it('should return false for empty parameters', () => {
      const params: A1111Parameters = {
        positive_prompt: ''
      };
      
      expect(shouldConvertToComfyUI(params)).toBe(false);
    });
  });

  describe('convertA1111ToComfyUI', () => {
    it('should convert basic A1111 parameters to ComfyUI workflow', () => {
      const params: A1111Parameters = {
        positive_prompt: 'beautiful girl',
        negative_prompt: 'ugly, bad quality',
        steps: '20',
        cfg: '7.5',
        sampler: 'DPM++ 2M Karras',
        seed: '12345',
        size: '512x768'
      };
      
      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.originalParameters).toEqual(params);
      
      // Workflow should have nodes array instead of prompt object
      expect(result.workflow?.nodes).toBeDefined();
      expect(result.workflow?.nodes).toBeInstanceOf(Array);
      
      // 基本的なノードが含まれているかチェック
      const nodes = result.workflow?.nodes as any[];
      const nodeTypes = nodes.map(node => node.type);
      expect(nodeTypes).toContain('CheckpointLoaderSimple');
      expect(nodeTypes).toContain('CLIPTextEncode');
      expect(nodeTypes).toContain('EmptyLatentImage');
      expect(nodeTypes).toContain('KSampler');
      expect(nodeTypes).toContain('VAEDecode');
      expect(nodeTypes).toContain('SaveImage');
    });

    it('should handle LoRA tags in prompts', () => {
      const params: A1111Parameters = {
        positive_prompt: 'beautiful girl <lora:style1:0.8> <lora:style2:0.6>',
        steps: '20'
      };
      
      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.loras).toHaveLength(2);
      expect(result.loras?.[0]).toEqual({
        name: 'style1',
        strength: 0.8,
        path: 'style1.safetensors'
      });
      expect(result.loras?.[1]).toEqual({
        name: 'style2',
        strength: 0.6,
        path: 'style2.safetensors'
      });
    });

    it('should handle upscaler parameters', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        hires_fix: 'true',
        hires_upscaler: 'ESRGAN_4x',
        hires_steps: '15',
        hires_denoising: '0.7'
      };
      
      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.upscaler).toEqual({
        model: 'ESRGAN_4x',
        steps: 15,
        denoising: 0.7,
        scale: 2.0
      });
    });

    it('should use default values for missing parameters', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test'
      };
      
      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
    });

    it('should handle conversion options', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test <lora:style:1.0>'
      };
      
      const options = {
        removeLoRATags: false,
        defaultModel: 'custom_model.safetensors',
        startNodeId: 10
      };
      
      const result = convertA1111ToComfyUI(params, options);
      
      expect(result.success).toBe(true);
      
      // LoRAタグが除去されていないことを確認
      const nodes = result.workflow?.nodes as any[];
      const positiveNode = nodes.find((node: any) => 
        node.type === 'CLIPTextEncode' && 
        node.widgets_values?.[0]?.includes('<lora:style:1.0>')
      );
      expect(positiveNode).toBeDefined();
    });

    it('should handle empty parameters gracefully', () => {
      // 空のパラメータは成功するが基本的なワークフローを生成
      const params = {} as A1111Parameters;
      
      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      expect(result.originalParameters).toEqual(params);
    });
  });

  // ComfyUI UI Workflow Format Tests
  describe('ComfyUI Workflow Format', () => {
    it('should generate workflow with required top-level fields', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        negative_prompt: 'test negative',
        steps: '20',
        cfg: '7',
        seed: '42'
      };

      const result = convertA1111ToComfyUI(params);
      
      expect(result.success).toBe(true);
      expect(result.workflow).toBeDefined();
      
      const workflow = result.workflow!;
      
      // Required top-level fields for ComfyUI UI workflow format
      expect(workflow).toHaveProperty('version');
      expect(workflow).toHaveProperty('last_node_id');
      expect(workflow).toHaveProperty('last_link_id');
      expect(workflow).toHaveProperty('nodes');
      expect(workflow).toHaveProperty('links');
      expect(workflow).toHaveProperty('groups');
      expect(workflow).toHaveProperty('config');
      expect(workflow).toHaveProperty('extra');
    });

    it('should have correct version field', () => {
      const params: A1111Parameters = { positive_prompt: 'test' };
      const result = convertA1111ToComfyUI(params);
      
      expect(result.workflow?.version).toBe(0.4);
    });

    it('should generate nodes as array with proper structure', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      
      expect(result.workflow?.nodes).toBeInstanceOf(Array);
      expect(result.workflow?.nodes.length).toBeGreaterThan(0);
      
      // Check first node structure
      const firstNode = result.workflow?.nodes[0];
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('type');
      expect(firstNode).toHaveProperty('pos');
      expect(firstNode).toHaveProperty('size');
      expect(firstNode).toHaveProperty('flags');
      expect(firstNode).toHaveProperty('order');
      expect(firstNode).toHaveProperty('mode');
      expect(firstNode).toHaveProperty('inputs');
      expect(firstNode).toHaveProperty('outputs');
      expect(firstNode).toHaveProperty('properties');
      expect(firstNode).toHaveProperty('widgets_values');
    });

    it('should generate links as array of connection tuples', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      
      expect(result.workflow?.links).toBeInstanceOf(Array);
      
      // Each link should be an array of 6 elements: [link_id, output_node_id, output_slot, input_node_id, input_slot, type]
      result.workflow?.links.forEach((link: any) => {
        expect(Array.isArray(link)).toBe(true);
        expect(link).toHaveLength(6);
        expect(typeof link[0]).toBe('number'); // link_id
        expect(typeof link[1]).toBe('number'); // output_node_id
        expect(typeof link[2]).toBe('number'); // output_slot
        expect(typeof link[3]).toBe('number'); // input_node_id
        expect(typeof link[4]).toBe('number'); // input_slot
        expect(typeof link[5]).toBe('string'); // type
      });
    });

    it('should include basic ComfyUI nodes', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      
      // Check for essential node types
      const nodeTypes = nodes.map((node: any) => node.type);
      expect(nodeTypes).toContain('CheckpointLoaderSimple');
      expect(nodeTypes).toContain('CLIPTextEncode'); // Should appear twice (positive/negative)
      expect(nodeTypes).toContain('EmptyLatentImage');
      expect(nodeTypes).toContain('KSampler');
      expect(nodeTypes).toContain('VAEDecode');
      expect(nodeTypes).toContain('SaveImage');
    });

    it('should generate LoRA nodes when LoRAs are present', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test <lora:style1:0.8> <lora:style2:0.6>',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      
      // Should have LoraLoader nodes
      const loraNodes = nodes.filter((node: any) => node.type === 'LoraLoader');
      expect(loraNodes).toHaveLength(2);
      
      // Check LoRA node widgets_values contain LoRA names and strengths
      const firstLoraNode = loraNodes[0];
      expect(firstLoraNode.widgets_values).toContain('style1.safetensors');
      expect(firstLoraNode.widgets_values).toContain(0.8);
    });

    it('should generate upscaler nodes when hires.fix is enabled', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test',
        hires_fix: 'true',
        hires_upscaler: 'ESRGAN_4x',
        hires_steps: '15'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      
      // Should have additional nodes for upscaling
      const nodeTypes = nodes.map((node: any) => node.type);
      expect(nodeTypes).toContain('UpscaleModelLoader');
      expect(nodeTypes).toContain('ImageUpscaleWithModel');
      
      // Should have two KSampler nodes (base + hires)
      const ksamplerNodes = nodes.filter((node: any) => node.type === 'KSampler');
      expect(ksamplerNodes.length).toBe(2);
    });

    it('should have proper node positioning', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      
      // All nodes should have valid positions
      nodes.forEach((node: any) => {
        expect(Array.isArray(node.pos)).toBe(true);
        expect(node.pos).toHaveLength(2);
        expect(typeof node.pos[0]).toBe('number'); // x coordinate
        expect(typeof node.pos[1]).toBe('number'); // y coordinate
        
        expect(Array.isArray(node.size)).toBe(true);
        expect(node.size).toHaveLength(2);
        expect(typeof node.size[0]).toBe('number'); // width
        expect(typeof node.size[1]).toBe('number'); // height
      });
    });

    it('should have incrementing node IDs', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      
      // Node IDs should be unique and incrementing
      const nodeIds = nodes.map((node: any) => node.id);
      const uniqueIds = new Set(nodeIds);
      
      expect(uniqueIds.size).toBe(nodeIds.length); // All IDs should be unique
      expect(Math.min(...nodeIds)).toBe(1); // Should start from 1
      expect(Math.max(...nodeIds)).toBe(nodeIds.length); // Should be consecutive
    });

    it('should generate correct link connections', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const nodes = result.workflow?.nodes || [];
      const links = result.workflow?.links || [];
      
      // Verify that all link node IDs reference actual nodes
      const nodeIds = new Set(nodes.map((node: any) => node.id));
      
      links.forEach((link: any) => {
        const [, outputNodeId, , inputNodeId] = link;
        expect(nodeIds.has(outputNodeId)).toBe(true);
        expect(nodeIds.has(inputNodeId)).toBe(true);
      });
    });

    it('should track last_node_id and last_link_id correctly', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        steps: '20'
      };

      const result = convertA1111ToComfyUI(params);
      const workflow = result.workflow!;
      const nodes = workflow.nodes || [];
      const links = workflow.links || [];
      
      // last_node_id should equal the highest node ID
      const maxNodeId = Math.max(...nodes.map((node: any) => node.id));
      expect(workflow.last_node_id).toBe(maxNodeId);
      
      // last_link_id should equal the highest link ID
      if (links.length > 0) {
        const maxLinkId = Math.max(...links.map((link: any) => link[0]));
        expect(workflow.last_link_id).toBe(maxLinkId);
      }
    });
  });

  describe('convertSamplerName', () => {
    it('should convert DPM++ samplers correctly', () => {
      expect(convertSamplerName('DPM++ 2M Karras')).toEqual({
        sampler: 'dpmpp_2m',
        scheduler: 'karras'
      });
      
      expect(convertSamplerName('DPM++ 2M')).toEqual({
        sampler: 'dpmpp_2m',
        scheduler: 'normal'
      });
      
      expect(convertSamplerName('DPM++ SDE Karras')).toEqual({
        sampler: 'dpmpp_sde',
        scheduler: 'karras'
      });
      
      expect(convertSamplerName('DPM++ 2S Karras')).toEqual({
        sampler: 'dpmpp_2s_ancestral',
        scheduler: 'karras'
      });
    });

    it('should convert Euler samplers correctly', () => {
      expect(convertSamplerName('Euler')).toEqual({
        sampler: 'euler',
        scheduler: 'normal'
      });
      
      expect(convertSamplerName('Euler a')).toEqual({
        sampler: 'euler_ancestral',
        scheduler: 'normal'
      });
    });

    it('should convert DPM2 samplers correctly', () => {
      expect(convertSamplerName('DPM2')).toEqual({
        sampler: 'dpm_2',
        scheduler: 'normal'
      });
      
      expect(convertSamplerName('DPM2 Karras')).toEqual({
        sampler: 'dpm_2',
        scheduler: 'karras'
      });
      
      expect(convertSamplerName('DPM2 a')).toEqual({
        sampler: 'dpm_2_ancestral',
        scheduler: 'normal'
      });
    });

    it('should convert LMS samplers correctly', () => {
      expect(convertSamplerName('LMS')).toEqual({
        sampler: 'lms',
        scheduler: 'normal'
      });
      
      expect(convertSamplerName('LMS Karras')).toEqual({
        sampler: 'lms',
        scheduler: 'karras'
      });
    });

    it('should handle case insensitive input', () => {
      expect(convertSamplerName('dpm++ 2m karras')).toEqual({
        sampler: 'dpmpp_2m',
        scheduler: 'karras'
      });
      
      expect(convertSamplerName('EULER A')).toEqual({
        sampler: 'euler_ancestral',
        scheduler: 'normal'
      });
    });

    it('should fallback to euler normal for unknown samplers', () => {
      expect(convertSamplerName('Unknown Sampler')).toEqual({
        sampler: 'euler',
        scheduler: 'normal'
      });
      
      expect(convertSamplerName('')).toEqual({
        sampler: 'euler',
        scheduler: 'normal'
      });
    });
  });
});