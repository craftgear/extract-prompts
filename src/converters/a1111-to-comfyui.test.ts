import { describe, it, expect } from 'vitest';
import {
  convertA1111ToComfyUI,
  extractLoRATags,
  removeLoRATagsFromPrompt,
  extractUpscalerInfo,
  shouldConvertToComfyUI
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
      
      // WorkflowにPromptが含まれているかチェック
      expect(result.workflow?.prompt).toBeDefined();
      
      // 基本的なノードが含まれているかチェック
      const prompt = result.workflow?.prompt as any;
      expect(Object.keys(prompt)).toContain('1'); // CheckpointLoader
      expect(Object.keys(prompt)).toContain('2'); // CLIPTextEncode positive
      expect(Object.keys(prompt)).toContain('3'); // CLIPTextEncode negative
      expect(Object.keys(prompt)).toContain('4'); // EmptyLatentImage
      expect(Object.keys(prompt)).toContain('5'); // KSampler
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
      const prompt = result.workflow?.prompt as any;
      const positiveNode = Object.values(prompt).find((node: any) => 
        node.class_type === 'CLIPTextEncode' && 
        node.inputs?.text?.includes('<lora:style:1.0>')
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
});