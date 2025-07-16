import { describe, it, expect } from 'vitest';
import { formatOutput } from './output';
import { ExtractedData } from '../types';

describe('formatOutput', () => {
  describe('ComfyUI UI format workflow pretty printing', () => {
    it('should extract negative prompts from WanVideoTextEncode nodes', () => {
      const workflow = {
        id: 'test-workflow',
        nodes: [
          {
            id: 1,
            type: 'WanVideoTextEncode',
            widgets_values: [
              'a beautiful sunset over mountains',
              'blurry, low quality, distorted',
              true
            ]
          },
          {
            id: 2,
            type: 'WanVideoTextEncode',
            widgets_values: [
              'a serene lake with reflections',
              'noise, artifacts, jpeg compression',
              true
            ]
          }
        ],
        links: []
      };

      const result: ExtractedData = { workflow };
      const output = formatOutput('test.mp4', result, 'pretty');

      // Should contain both positive and negative prompts
      expect(output).toContain('a beautiful sunset over mountains');
      expect(output).toContain('blurry, low quality, distorted');
      expect(output).toContain('a serene lake with reflections');
      expect(output).toContain('noise, artifacts, jpeg compression');
      expect(output).toContain('Prompts:');
    });

    it('should extract sampler settings from WanVideoSampler nodes', () => {
      const workflow = {
        id: 'test-workflow',
        nodes: [
          {
            id: 1,
            type: 'WanVideoSampler',
            widgets_values: [
              5,      // index 0: steps
              6,      // index 1: cfg
              2,      // index 2: unknown
              98662,  // index 3: seed
              'randomize',// index 4: randomize seed
              true,   // index 5: not used
              'euler',// index 6: sampler
              0,      // index 7: unknown
              1,      // index 8: unknown
              false,  // index 9: unknown
              'normal'// index 10: scheduler
            ]
          }
        ],
        links: []
      };

      const result: ExtractedData = { workflow };
      const output = formatOutput('test.mp4', result, 'pretty');

      expect(output).toContain('Steps: 5');
      expect(output).toContain('CFG Scale: 6');
      expect(output).toContain('Seed: 98662');
      expect(output).toContain('Sampler: euler');
      expect(output).toContain('Scheduler: normal');
    });

    it('should extract and display complete sampler settings from UI format workflow', () => {
      const uiFormatWorkflow = {
        id: 'test-workflow',
        nodes: [
          {
            id: 1,
            type: 'KSampler',
            widgets_values: [12345, 'randomize', 30, 8.5, 'dpmpp_2m', 'karras', 0.8],
            inputs: [
              { name: 'model', link: 1 },
              { name: 'positive', link: 2 },
              { name: 'negative', link: 3 },
              { name: 'latent_image', link: 4 }
            ],
            outputs: [{ name: 'LATENT', links: [5] }]
          },
          {
            id: 2,
            type: 'CLIPTextEncode',
            widgets_values: ['beautiful landscape, masterpiece'],
            outputs: [{ name: 'CONDITIONING', links: [2] }]
          },
          {
            id: 3,
            type: 'CLIPTextEncode', 
            widgets_values: ['blurry, bad quality'],
            outputs: [{ name: 'CONDITIONING', links: [3] }]
          },
          {
            id: 4,
            type: 'CheckpointLoaderSimple',
            widgets_values: ['sd_xl_base_1.0.safetensors'],
            outputs: [
              { name: 'MODEL', links: [1] },
              { name: 'CLIP', links: [6, 7] },
              { name: 'VAE', links: [8] }
            ]
          }
        ],
        links: [
          [1, 4, 0, 1, 0, 'MODEL'],
          [2, 2, 0, 1, 1, 'CONDITIONING'],
          [3, 3, 0, 1, 2, 'CONDITIONING'],
          [4, 5, 0, 1, 3, 'LATENT'],
          [5, 1, 0, 6, 0, 'LATENT']
        ]
      };

      const extractedData: ExtractedData = { workflow: uiFormatWorkflow };
      const result = formatOutput('test_image.png', extractedData, 'pretty');

      // サンプラー設定の確認
      expect(result).toContain('Sampler Settings:');
      expect(result).toContain('Steps: 30');
      expect(result).toContain('CFG Scale: 8.5');
      expect(result).toContain('Sampler: dpmpp_2m');
      expect(result).toContain('Scheduler: karras');
      expect(result).toContain('Seed: 12345');
      expect(result).toContain('Denoise: 0.8');
    });

    it('should properly separate positive and negative prompts in UI format workflow', () => {
      const uiWorkflowWithPrompts = {
        id: 'test-prompt-workflow',
        nodes: [
          {
            id: 1,
            type: 'KSampler',
            widgets_values: [42, 'randomize', 20, 7.0, 'euler', 'normal', 1.0],
            inputs: [
              { name: 'positive', link: 1 },
              { name: 'negative', link: 2 }
            ]
          },
          {
            id: 2,
            type: 'CLIPTextEncode',
            widgets_values: ['anime girl, detailed, high quality'],
            outputs: [{ name: 'CONDITIONING', links: [1] }]
          },
          {
            id: 3,
            type: 'CLIPTextEncode',
            widgets_values: ['blurry, low resolution, bad anatomy'],
            outputs: [{ name: 'CONDITIONING', links: [2] }]
          }
        ],
        links: [
          [1, 2, 0, 1, 1, 'CONDITIONING'],
          [2, 3, 0, 1, 2, 'CONDITIONING']
        ]
      };

      const extractedData: ExtractedData = { workflow: uiWorkflowWithPrompts };
      const result = formatOutput('test_prompts.png', extractedData, 'pretty');

      // プロンプトの分離確認
      expect(result).toContain('Prompts:');
      expect(result).toContain('Positive 1: anime girl, detailed, high quality');
      expect(result).toContain('Negative 1: blurry, low resolution, bad anatomy');
    });

    it('should extract LoRA models from UI format workflow', () => {
      const workflowWithLoRA = {
        id: 'test-lora-workflow',
        nodes: [
          {
            id: 1,
            type: 'LoraLoader',
            widgets_values: ['style_model.safetensors', 0.8, 0.8],
            inputs: [
              { name: 'model', link: 1 },
              { name: 'clip', link: 2 }
            ],
            outputs: [
              { name: 'MODEL', links: [3] },
              { name: 'CLIP', links: [4] }
            ]
          },
          {
            id: 2,
            type: 'LoraLoader',
            widgets_values: ['detail_enhancer.safetensors', 1.2, 1.0],
            inputs: [
              { name: 'model', link: 3 },
              { name: 'clip', link: 4 }
            ],
            outputs: [
              { name: 'MODEL', links: [5] },
              { name: 'CLIP', links: [6] }
            ]
          },
          {
            id: 3,
            type: 'CheckpointLoaderSimple',
            widgets_values: ['base_model.safetensors']
          }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: workflowWithLoRA };
      const result = formatOutput('test_lora.png', extractedData, 'pretty');

      // LoRAモデルの確認
      expect(result).toContain('LoRA Models:');
      expect(result).toContain('1. style_model.safetensors (strength: 0.8)');
      expect(result).toContain('2. detail_enhancer.safetensors (strength: 1.2)');
    });

    it('should extract models from UI format workflow', () => {
      const workflowWithModel = {
        id: 'test-model-workflow',
        nodes: [
          {
            id: 1,
            type: 'CheckpointLoaderSimple',
            widgets_values: ['realistic_vision_v3.safetensors'],
            outputs: [
              { name: 'MODEL', links: [1] },
              { name: 'CLIP', links: [2] },
              { name: 'VAE', links: [3] }
            ]
          }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: workflowWithModel };
      const result = formatOutput('test_model.png', extractedData, 'pretty');

      // モデルの確認
      expect(result).toContain('Models:');
      expect(result).toContain('1. realistic_vision_v3.safetensors');
    });

    it('should show correct workflow stats for UI format', () => {
      const uiWorkflow = {
        id: 'test-stats-workflow',
        nodes: [
          { id: 1, type: 'CheckpointLoaderSimple', widgets_values: ['model.safetensors'] },
          { id: 2, type: 'CLIPTextEncode', widgets_values: ['positive prompt'] },
          { id: 3, type: 'CLIPTextEncode', widgets_values: ['negative prompt'] },
          { id: 4, type: 'KSampler', widgets_values: [42, 'randomize', 20, 7, 'euler', 'normal', 1] },
          { id: 5, type: 'VAEDecode', widgets_values: [] }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: uiWorkflow };
      const result = formatOutput('test_stats.png', extractedData, 'pretty');

      // ワークフロー統計の確認
      expect(result).toContain('Workflow Stats:');
      expect(result).toContain('Total Nodes: 5');
      expect(result).toContain('Node Types: CheckpointLoaderSimple, CLIPTextEncode, KSampler, VAEDecode');
    });
  });

  describe('ComfyUI API format workflow compatibility', () => {
    it('should handle API format workflows with numeric keys', () => {
      const apiFormatWorkflow = {
        "1": {
          class_type: "CheckpointLoaderSimple",
          inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" }
        },
        "2": {
          class_type: "CLIPTextEncode",
          inputs: { text: "beautiful landscape" }
        },
        "3": {
          class_type: "KSampler", 
          inputs: {
            steps: 25,
            cfg: 7.5,
            sampler_name: "dpmpp_2m",
            scheduler: "karras",
            seed: 12345,
            denoise: 1.0
          }
        }
      };

      const extractedData: ExtractedData = { workflow: apiFormatWorkflow };
      const result = formatOutput('api_workflow.png', extractedData, 'pretty');

      expect(result).toContain('Steps: 25');
      expect(result).toContain('CFG Scale: 7.5');
      expect(result).toContain('Sampler: dpmpp_2m');
      expect(result).toContain('sd_xl_base_1.0.safetensors');
    });
  });

  describe('Advanced sampler node types', () => {
    it('should handle WanVideoSampler nodes', () => {
      const workflowWithWanVideo = {
        id: 'wan-video-workflow',
        nodes: [
          {
            id: 1,
            type: 'WanVideoSampler',
            widgets_values: [2, 6, 15, 999, 'randomize', true, 'ddim', 0, 1, false, 'normal'],
            inputs: [],
            outputs: []
          }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: workflowWithWanVideo };
      const result = formatOutput('wan_video.mp4', extractedData, 'pretty');

      expect(result).toContain('Sampler Settings:');
      expect(result).toContain('Steps: 2');
      expect(result).toContain('CFG Scale: 6');
      expect(result).toContain('Sampler: ddim');
      expect(result).toContain('Scheduler: normal');
      expect(result).toContain('Seed: 999');
    });

    it('should handle nodes with Sampler in class name', () => {
      const workflowWithCustomSampler = {
        "1": {
          class_type: "CustomAdvancedSampler",
          inputs: {
            steps: 40,
            cfg: 9.0,
            sampler_name: "dpmpp_3m_sde",
            scheduler: "exponential",
            seed: 54321,
            denoise: 0.7
          }
        }
      };

      const extractedData: ExtractedData = { workflow: workflowWithCustomSampler };
      const result = formatOutput('custom_sampler.png', extractedData, 'pretty');

      expect(result).toContain('Steps: 40');
      expect(result).toContain('CFG Scale: 9');
      expect(result).toContain('Sampler: dpmpp_3m_sde');
      expect(result).toContain('Scheduler: exponential');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty workflow gracefully', () => {
      const emptyWorkflow = { nodes: [], links: [] };
      const extractedData: ExtractedData = { workflow: emptyWorkflow };
      const result = formatOutput('empty.png', extractedData, 'pretty');

      expect(result).toContain('ComfyUI Workflow:');
      expect(result).toContain('Total Nodes: 0');
    });

    it('should handle workflow without sampler nodes', () => {
      const workflowNoSampler = {
        nodes: [
          {
            id: 1,
            type: 'LoadImage',
            widgets_values: ['input.png']
          },
          {
            id: 2,
            type: 'SaveImage',
            widgets_values: ['output']
          }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: workflowNoSampler };
      const result = formatOutput('no_sampler.png', extractedData, 'pretty');

      expect(result).toContain('ComfyUI Workflow:');
      expect(result).toContain('Total Nodes: 2');
      expect(result).not.toContain('Sampler Settings:');
    });

    it('should handle malformed sampler data gracefully', () => {
      const workflowBadSampler = {
        nodes: [
          {
            id: 1,
            type: 'KSampler',
            widgets_values: ['invalid', null, undefined], // 不正なデータ
            inputs: []
          }
        ],
        links: []
      };

      const extractedData: ExtractedData = { workflow: workflowBadSampler };
      const result = formatOutput('bad_sampler.png', extractedData, 'pretty');

      expect(result).toContain('ComfyUI Workflow:');
      // エラーが発生せず、正常に処理されることを確認
      expect(result).toBeTruthy();
    });
  });

  describe('A1111 parameters fallback', () => {
    it('should display A1111 parameters when no workflow is present', () => {
      const a1111Data: ExtractedData = {
        parameters: {
          positive_prompt: 'beautiful portrait, detailed',
          negative_prompt: 'blurry, low quality',
          steps: '25',
          cfg: '7.5',
          sampler: 'DPM++ 2M Karras',
          seed: '12345',
          model: 'realistic_vision_v3.safetensors'
        }
      };

      const result = formatOutput('a1111_image.png', a1111Data, 'pretty');

      expect(result).toContain('A1111-style Parameters:');
      expect(result).toContain('Positive: beautiful portrait, detailed');
      expect(result).toContain('Negative: blurry, low quality');
      expect(result).toContain('Steps: 25');
      expect(result).toContain('CFG Scale: 7.5');
      expect(result).toContain('Sampler: DPM++ 2M Karras');
    });
  });

  describe('JSON output format', () => {
    it('should return properly formatted JSON when format is json', () => {
      const testData: ExtractedData = {
        workflow: {
          nodes: [{ id: 1, type: 'TestNode', widgets_values: [] }],
          links: []
        }
      };

      const result = formatOutput('test.png', testData, 'json');
      
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.workflow).toBeDefined();
      expect(parsed.workflow.nodes).toHaveLength(1);
    });
  });
});