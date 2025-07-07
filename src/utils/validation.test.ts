import { describe, it, expect } from 'vitest';
import { validateComfyUIWorkflow, extractWorkflowInfo } from './validation';

describe('validateComfyUIWorkflow', () => {
  it('should return false for null or undefined', () => {
    expect(validateComfyUIWorkflow(null)).toBe(false);
    expect(validateComfyUIWorkflow(undefined)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(validateComfyUIWorkflow('string')).toBe(false);
    expect(validateComfyUIWorkflow(123)).toBe(false);
    expect(validateComfyUIWorkflow([])).toBe(false);
  });

  it('should return true for valid ComfyUI workflow with numeric keys', () => {
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
    expect(validateComfyUIWorkflow(validWorkflow)).toBe(true);
  });

  it('should return true for workflows with workflow/prompt/extra_pnginfo fields', () => {
    expect(validateComfyUIWorkflow({ workflow: {} })).toBe(true);
    expect(validateComfyUIWorkflow({ prompt: {} })).toBe(true);
    expect(validateComfyUIWorkflow({ extra_pnginfo: {} })).toBe(true);
  });

  it('should return true for array with ComfyUI nodes', () => {
    const arrayWorkflow = [
      { class_type: 'CheckpointLoaderSimple' },
      { class_type: 'CLIPTextEncode' }
    ];
    expect(validateComfyUIWorkflow(arrayWorkflow)).toBe(true);
  });

  it('should return false for objects without ComfyUI structure', () => {
    const invalidWorkflow = {
      random: 'data',
      nothing: 'useful'
    };
    expect(validateComfyUIWorkflow(invalidWorkflow)).toBe(false);
  });

  it('should return false for numeric keys without class_type', () => {
    const invalidWorkflow = {
      '1': { some: 'data' },
      '2': { other: 'data' }
    };
    expect(validateComfyUIWorkflow(invalidWorkflow)).toBe(false);
  });
});

describe('extractWorkflowInfo', () => {
  it('should return empty info for invalid input', () => {
    const info = extractWorkflowInfo(null);
    expect(info.nodeCount).toBe(0);
    expect(info.nodeTypes).toEqual([]);
    expect(info.hasPrompt).toBe(false);
    expect(info.hasModel).toBe(false);
  });

  it('should extract node count and types correctly', () => {
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

    const info = extractWorkflowInfo(workflow);
    expect(info.nodeCount).toBe(3);
    expect(info.nodeTypes).toEqual(['CheckpointLoaderSimple', 'CLIPTextEncode', 'KSampler']);
    expect(info.hasPrompt).toBe(false); // CLIPTextEncode doesn't contain 'prompt' in class_type
    expect(info.hasModel).toBe(true); // CheckpointLoaderSimple contains 'model'
  });

  it('should detect prompt nodes', () => {
    const workflow = {
      '1': {
        class_type: 'PromptNode',
        inputs: {}
      }
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasPrompt).toBe(true);
  });

  it('should detect model nodes', () => {
    const workflow = {
      '1': {
        class_type: 'ModelLoader',
        inputs: {}
      }
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasModel).toBe(true);
  });

  it('should detect checkpoint nodes as model nodes', () => {
    const workflow = {
      '1': {
        class_type: 'CheckpointLoaderSimple',
        inputs: {}
      }
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasModel).toBe(true);
  });

  it('should ignore non-numeric keys', () => {
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

    const info = extractWorkflowInfo(workflow);
    expect(info.nodeCount).toBe(1);
    expect(info.nodeTypes).toEqual(['ValidNode']);
  });
});