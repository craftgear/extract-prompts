import { describe, it, expect } from 'vitest';
import {
  ExtractedData,
  ComfyUIWorkflow,
  A1111Parameters,
  ExtractionResult,
  isComfyUIWorkflow,
  isA1111Parameters,
  isValidExtractedData,
  ExtractionError,
  UnsupportedFormatError
} from './index';

describe('Type Definitions', () => {
  describe('ExtractedData', () => {
    it('should validate ExtractedData structure', () => {
      const data: ExtractedData = {
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

      expect(isValidExtractedData(data)).toBe(true);
    });

    it('should reject invalid ExtractedData', () => {
      const invalidData = {
        randomField: 'test'
      };

      expect(isValidExtractedData(invalidData)).toBe(false);
    });
  });

  describe('ComfyUIWorkflow', () => {
    it('should validate ComfyUI workflow structure', () => {
      const workflow: ComfyUIWorkflow = {
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

      expect(isComfyUIWorkflow(workflow)).toBe(true);
    });

    it('should reject non-ComfyUI data', () => {
      const notWorkflow = {
        random: 'data'
      };

      expect(isComfyUIWorkflow(notWorkflow)).toBe(false);
    });
  });

  describe('A1111Parameters', () => {
    it('should validate A1111 parameters structure', () => {
      const params: A1111Parameters = {
        positive_prompt: 'test prompt',
        negative_prompt: 'bad quality',
        steps: '20',
        cfg: '7.5',
        sampler: 'DPM++ 2M',
        seed: '12345'
      };

      expect(isA1111Parameters(params)).toBe(true);
    });

    it('should reject non-A1111 parameters', () => {
      const notParams = {
        random: 'data'
      };

      expect(isA1111Parameters(notParams)).toBe(false);
    });
  });

  describe('ExtractionResult', () => {
    it('should create valid extraction result', () => {
      const result: ExtractionResult = {
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

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.filePath).toBe('test.png');
    });

    it('should create error extraction result', () => {
      const result: ExtractionResult = {
        success: false,
        error: 'File not found',
        filePath: 'missing.png'
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('File not found');
      expect(result.data).toBeUndefined();
    });
  });

  describe('Custom Error Types', () => {
    it('should create ExtractionError', () => {
      const error = new ExtractionError('Test error', 'test.png');
      
      expect(error.name).toBe('ExtractionError');
      expect(error.message).toBe('Test error');
      expect(error.filePath).toBe('test.png');
    });

    it('should create UnsupportedFormatError', () => {
      const error = new UnsupportedFormatError('bmp', 'test.bmp');
      
      expect(error.name).toBe('UnsupportedFormatError');
      expect(error.message).toBe('Unsupported file format: bmp');
      expect(error.filePath).toBe('test.bmp');
    });
  });
});