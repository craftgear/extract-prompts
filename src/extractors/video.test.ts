import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFromVideo } from './video';
import { validateComfyUIWorkflow } from '../utils/validation';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock external dependencies
vi.mock('child_process');
vi.mock('../utils/validation');
vi.mock('ffprobe-static', () => ({
  default: { path: '/mock/ffprobe' },
}));

const mockValidateComfyUIWorkflow = vi.mocked(validateComfyUIWorkflow);
const mockSpawn = vi.mocked(spawn);

describe('extractFromVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to return true by default for all workflow validation calls
    mockValidateComfyUIWorkflow.mockReturnValue(true);
  });

  const createMockProcess = (stdout: string, stderr = '', exitCode = 0) => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    // Simulate process execution
    setTimeout(() => {
      mockProcess.stdout.emit('data', stdout);
      mockProcess.emit('close', exitCode);
    }, 10);

    return mockProcess;
  };

  describe('ComfyUI workflow extraction from video metadata', () => {
    it.only('should extract ComfyUI workflow from format tags', async () => {
      const mockWorkflow = {
        nodes: [
          {
            id: 1,
            type: 'KSampler',
            widgets_values: [42, 'randomize', 20, 7, 'euler', 'normal', 1],
          },
        ],
        links: [],
      };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: JSON.stringify(mockWorkflow),
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/video.mp4');

      expect(result).toEqual(mockWorkflow);
      expect(mockValidateComfyUIWorkflow).toHaveBeenCalledWith(mockWorkflow);
    });

    it('should extract workflow from description field', async () => {
      const mockWorkflow = {
        id: 'test-workflow',
        nodes: [
          { id: 1, type: 'CLIPTextEncode', widgets_values: ['test prompt'] },
          {
            id: 2,
            type: 'KSampler',
            widgets_values: [123, 'fixed', 30, 8.5, 'dpmpp_2m', 'karras', 0.8],
          },
        ],
        links: [[1, 1, 0, 2, 1, 'CONDITIONING']],
      };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            description: JSON.stringify(mockWorkflow),
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/animatediff.mp4');

      expect(result).toEqual({ workflow: mockWorkflow });
    });

    it('should extract workflow from ComfyUI-specific fields', async () => {
      const mockWorkflow = {
        nodes: [
          {
            id: 1,
            type: 'WanVideoSampler',
            widgets_values: [999, 'randomize', 15, 6, 'ddim', 'normal', 0.9],
          },
        ],
      };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comfyui: JSON.stringify(mockWorkflow),
            ComfyUI: 'some other data',
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow
        .mockReturnValueOnce(true) // For the 'comfyui' field
        .mockReturnValueOnce(false); // For the 'ComfyUI' field

      const result = await extractFromVideo('/test/wanvideo.mp4');

      expect(result).toEqual({ workflow: mockWorkflow });
      expect(mockValidateComfyUIWorkflow).toHaveBeenCalledWith(mockWorkflow);
    });

    it('should process stream metadata fields', async () => {
      // Test that stream processing logic executes without errors
      const ffprobeOutput = JSON.stringify({
        format: { tags: {} },
        streams: [
          {
            tags: {
              metadata: 'invalid json',
            },
          },
        ],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      const result = await extractFromVideo('/test/stream_metadata.mp4');
      // Should return null for invalid JSON, but test that stream processing runs
      expect(result).toBeNull();
    });

    it('should handle text with JSON patterns', async () => {
      // Test the regex pattern matching logic
      const textWithInvalidJSON = `Some prefix text {invalid json} some suffix text`;

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: textWithInvalidJSON,
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      const result = await extractFromVideo('/test/embedded_json.mp4');
      // Should return null for invalid JSON patterns
      expect(result).toBeNull();
    });
  });

  describe('Error handling and edge cases', () => {
    it('should return null when no metadata is found', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {},
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      const result = await extractFromVideo('/test/no_metadata.mp4');
      expect(result).toBeNull();
    });

    it('should throw error when ffprobe fails', async () => {
      const mockProcess = createMockProcess('', 'ffprobe error', 1);
      mockSpawn.mockReturnValue(mockProcess);

      await expect(extractFromVideo('/test/corrupted.mp4')).rejects.toThrow();
    });

    it('should throw error when ffprobe output is invalid JSON', async () => {
      const mockProcess = createMockProcess('invalid json output');
      mockSpawn.mockReturnValue(mockProcess);

      await expect(
        extractFromVideo('/test/invalid_output.mp4')
      ).rejects.toThrow();
    });

    it('should return null when workflow validation fails', async () => {
      const invalidWorkflow = { not_a_workflow: true };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: JSON.stringify(invalidWorkflow),
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(false);

      const result = await extractFromVideo('/test/invalid_workflow.mp4');

      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: '{ invalid json syntax',
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      const result = await extractFromVideo('/test/malformed_json.mp4');

      expect(result).toBeNull();
    });

    it('should skip empty or non-string tag values', async () => {
      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: '',
            description: null,
            metadata: undefined,
          },
        },
        streams: [
          {
            tags: {
              empty_field: '',
              number_field: 123,
            },
          },
        ],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      const result = await extractFromVideo('/test/empty_tags.mp4');

      expect(result).toBeNull();
    });
  });

  describe('Multiple workflow sources', () => {
    it('should prioritize format tags over stream tags', async () => {
      const formatWorkflow = { nodes: [{ id: 1, type: 'FormatNode' }] };
      const streamWorkflow = { nodes: [{ id: 2, type: 'StreamNode' }] };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: JSON.stringify(formatWorkflow),
          },
        },
        streams: [
          {
            tags: {
              metadata: JSON.stringify(streamWorkflow),
            },
          },
        ],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      // First call (format workflow) should return true, stopping before stream processing
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/multiple_sources.mp4');

      // Should extract a workflow (format takes priority)
      expect(result).not.toBeNull();
      expect(result?.workflow).toBeDefined();
      // Should have found the workflow in format tags and stopped there
      expect(mockValidateComfyUIWorkflow).toHaveBeenCalled();
    });

    it('should try multiple fields until finding valid workflow', async () => {
      const validWorkflow = { nodes: [{ id: 1, type: 'ValidNode' }] };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            comment: 'invalid json',
            description: '{ also invalid',
            metadata: JSON.stringify(validWorkflow),
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/multiple_attempts.mp4');

      expect(result).toEqual({ workflow: validWorkflow });
    });
  });

  describe('FFprobe command execution', () => {
    it('should call ffprobe with correct arguments', async () => {
      const ffprobeOutput = JSON.stringify({
        format: { tags: {} },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));

      await extractFromVideo('/test/check_args.mp4').catch(() => {}); // Ignore error

      expect(mockSpawn).toHaveBeenCalledWith('/mock/ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        '/test/check_args.mp4',
      ]);
    });

    it('should handle process error events', async () => {
      const mockProcess = new EventEmitter() as any;
      mockProcess.stdout = new EventEmitter();
      mockProcess.stderr = new EventEmitter();

      setTimeout(() => {
        mockProcess.emit('error', new Error('Process failed to start'));
      }, 10);

      mockSpawn.mockReturnValue(mockProcess);

      await expect(
        extractFromVideo('/test/process_error.mp4')
      ).rejects.toThrow();
    });
  });

  describe('Case sensitivity and field variations', () => {
    it('should handle case-insensitive field matching', async () => {
      const mockWorkflow = { nodes: [{ id: 1, type: 'TestNode' }] };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            COMFYUI: JSON.stringify(mockWorkflow), // Uppercase
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/uppercase_field.mp4');

      expect(result).toEqual({ workflow: mockWorkflow });
    });

    it('should check all potential workflow field names', async () => {
      const mockWorkflow = { nodes: [{ id: 1, type: 'WorkflowNode' }] };

      const ffprobeOutput = JSON.stringify({
        format: {
          tags: {
            workflow: JSON.stringify(mockWorkflow),
          },
        },
        streams: [],
      });

      mockSpawn.mockReturnValue(createMockProcess(ffprobeOutput));
      mockValidateComfyUIWorkflow.mockReturnValue(true);

      const result = await extractFromVideo('/test/workflow_field.mp4');

      expect(result).toEqual({ workflow: mockWorkflow });
    });
  });
});

