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

  it('should return true for UI format workflows with nodes array', () => {
    const uiFormatWorkflow = {
      id: 'test-workflow',
      nodes: [
        {
          id: 1,
          type: 'CheckpointLoaderSimple',
          pos: [50, 50],
          size: [315, 98],
          widgets_values: ['model.safetensors']
        },
        {
          id: 2,
          type: 'CLIPTextEncode',
          pos: [400, 50],
          size: [400, 200],
          widgets_values: ['test prompt']
        },
        {
          id: 3,
          type: 'KSampler',
          pos: [800, 50],
          size: [315, 262],
          widgets_values: [42, 'randomize', 20, 7, 'euler', 'normal', 1]
        }
      ],
      links: [
        [1, 1, 0, 3, 0, 'MODEL'],
        [2, 2, 0, 3, 1, 'CONDITIONING']
      ]
    };
    expect(validateComfyUIWorkflow(uiFormatWorkflow)).toBe(true);
  });

  it('should return false for empty nodes array in UI format', () => {
    const emptyUIWorkflow = {
      id: 'empty-workflow',
      nodes: [],
      links: []
    };
    expect(validateComfyUIWorkflow(emptyUIWorkflow)).toBe(false);
  });

  it('should return false for invalid UI format nodes', () => {
    const invalidUIWorkflow = {
      nodes: [
        { invalidNode: true },
        { alsoInvalid: 'yes' }
      ]
    };
    expect(validateComfyUIWorkflow(invalidUIWorkflow)).toBe(false);
  });

  it('should return true for mixed valid and invalid UI format nodes', () => {
    const mixedUIWorkflow = {
      nodes: [
        { id: 1, type: 'ValidNode' },
        { invalidNode: true },
        { id: 2, type: 'AnotherValidNode' }
      ]
    };
    expect(validateComfyUIWorkflow(mixedUIWorkflow)).toBe(true);
  });

  it('should return true for workflows with workflow/prompt/extra_pnginfo fields', () => {
    expect(validateComfyUIWorkflow({ workflow: {} })).toBe(true);
    expect(validateComfyUIWorkflow({ prompt: {} })).toBe(true);
    expect(validateComfyUIWorkflow({ extra_pnginfo: {} })).toBe(true);
  });

  it('should return true for array with ComfyUI nodes (legacy format)', () => {
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

  it('should handle strict mode validation', () => {
    const workflowWithoutValidNodes = {
      '1': { invalid: 'node' },
      '2': { also: 'invalid' }
    };
    
    // Non-strict mode should pass (default behavior)
    expect(validateComfyUIWorkflow(workflowWithoutValidNodes, false)).toBe(false);
    
    // Strict mode should also fail
    expect(validateComfyUIWorkflow(workflowWithoutValidNodes, true)).toBe(false);
    
    const validWorkflow = {
      '1': { class_type: 'ValidNode' }
    };
    
    expect(validateComfyUIWorkflow(validWorkflow, true)).toBe(true);
    expect(validateComfyUIWorkflow(validWorkflow, false)).toBe(true);
  });

  it('should handle UI format with node id as string', () => {
    const uiWorkflowStringIds = {
      nodes: [
        { id: '1', type: 'CheckpointLoaderSimple' },
        { id: '2', type: 'CLIPTextEncode' }
      ]
    };
    expect(validateComfyUIWorkflow(uiWorkflowStringIds)).toBe(true);
  });

  it('should handle UI format with missing id field', () => {
    const uiWorkflowNoIds = {
      nodes: [
        { type: 'CheckpointLoaderSimple' },
        { type: 'CLIPTextEncode' }
      ]
    };
    expect(validateComfyUIWorkflow(uiWorkflowNoIds)).toBe(false);
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

  it('should extract node count and types correctly from API format', () => {
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

  it('should extract node count and types correctly from UI format', () => {
    const uiWorkflow = {
      id: 'test-workflow',
      nodes: [
        {
          id: 1,
          type: 'CheckpointLoaderSimple',
          widgets_values: ['model.safetensors']
        },
        {
          id: 2,
          type: 'CLIPTextEncode',
          widgets_values: ['positive prompt']
        },
        {
          id: 3,
          type: 'KSampler',
          widgets_values: [42, 'randomize', 20, 7, 'euler', 'normal', 1]
        },
        {
          id: 4,
          type: 'WanVideoSampler',
          widgets_values: [123, 'fixed', 15, 6, 'ddim', 'karras', 0.8]
        }
      ],
      links: []
    };

    const info = extractWorkflowInfo(uiWorkflow);
    expect(info.nodeCount).toBe(4);
    expect(info.nodeTypes).toEqual(['CheckpointLoaderSimple', 'CLIPTextEncode', 'KSampler', 'WanVideoSampler']);
    expect(info.hasPrompt).toBe(true); // CLIPTextEncode contains 'text'
    expect(info.hasModel).toBe(true); // CheckpointLoaderSimple contains 'model'
  });

  it('should detect prompt nodes in API format', () => {
    const workflow = {
      '1': {
        class_type: 'PromptNode',
        inputs: {}
      }
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasPrompt).toBe(true);
  });

  it('should detect text nodes as prompt nodes in UI format', () => {
    const uiWorkflow = {
      nodes: [
        {
          id: 1,
          type: 'TextPromptNode',
          widgets_values: ['test prompt']
        },
        {
          id: 2,
          type: 'CLIPTextEncode',
          widgets_values: ['another prompt']
        }
      ]
    };

    const info = extractWorkflowInfo(uiWorkflow);
    expect(info.hasPrompt).toBe(true);
  });

  it('should detect model nodes in API format', () => {
    const workflow = {
      '1': {
        class_type: 'ModelLoader',
        inputs: {}
      }
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasModel).toBe(true);
  });

  it('should detect model nodes in UI format', () => {
    const uiWorkflow = {
      nodes: [
        {
          id: 1,
          type: 'CustomModelLoader',
          widgets_values: ['custom_model.safetensors']
        }
      ]
    };

    const info = extractWorkflowInfo(uiWorkflow);
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

  it('should detect checkpoint nodes as model nodes in UI format', () => {
    const uiWorkflow = {
      nodes: [
        {
          id: 1,
          type: 'CheckpointLoaderAdvanced',
          widgets_values: ['checkpoint.ckpt']
        }
      ]
    };

    const info = extractWorkflowInfo(uiWorkflow);
    expect(info.hasModel).toBe(true);
  });

  it('should ignore non-numeric keys in API format', () => {
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

  it('should handle empty UI format workflow', () => {
    const emptyUIWorkflow = {
      nodes: [],
      links: []
    };

    const info = extractWorkflowInfo(emptyUIWorkflow);
    expect(info.nodeCount).toBe(0);
    expect(info.nodeTypes).toEqual([]);
    expect(info.hasPrompt).toBe(false);
    expect(info.hasModel).toBe(false);
  });

  it('should handle malformed UI format nodes', () => {
    const malformedUIWorkflow = {
      nodes: [
        { id: 1, type: 'ValidNode' },
        { invalidNode: true },
        null,
        { id: 2 }, // Missing type
        { type: 'ValidNode2' } // Missing id, but has type
      ]
    };

    const info = extractWorkflowInfo(malformedUIWorkflow);
    expect(info.nodeCount).toBe(5); // UI format counts all nodes in the array, malformed nodes are just ignored for type extraction
    expect(info.nodeTypes).toEqual(['ValidNode', 'ValidNode2']);
  });

  it('should handle mixed case in node type detection', () => {
    const workflow = {
      nodes: [
        { id: 1, type: 'MODELLOADERCASE' },
        { id: 2, type: 'textpromptcase' },
        { id: 3, type: 'CheckPointLoader' }
      ]
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.hasModel).toBe(true); // Should detect 'model' and 'checkpoint' case-insensitively
    expect(info.hasPrompt).toBe(true); // Should detect 'text' case-insensitively
  });

  it('should count unique node types correctly', () => {
    const workflow = {
      nodes: [
        { id: 1, type: 'KSampler' },
        { id: 2, type: 'KSampler' },
        { id: 3, type: 'CLIPTextEncode' },
        { id: 4, type: 'KSampler' }
      ]
    };

    const info = extractWorkflowInfo(workflow);
    expect(info.nodeCount).toBe(4);
    expect(info.nodeTypes).toEqual(['KSampler', 'CLIPTextEncode']); // Unique types only
  });
});