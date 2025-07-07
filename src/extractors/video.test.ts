import { describe, it, expect, vi } from 'vitest';
import { extractFromVideo } from './video';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn()
}));

// Mock ffprobe-static
vi.mock('ffprobe-static', () => ({
  default: '/path/to/ffprobe'
}));

describe('extractFromVideo', () => {
  it('should throw error when ffprobe fails', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    const mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockProcess);

    const promise = extractFromVideo('test.mp4');

    // Simulate process error
    setTimeout(() => {
      mockProcess.stderr.emit('data', 'Error message');
      mockProcess.emit('close', 1);
    }, 0);

    await expect(promise).rejects.toThrow('External command failed: ffprobe (exit code: 1)');
  });

  it('should parse ffprobe output correctly', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    const mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockProcess);

    const mockMetadata = {
      format: {
        tags: {
          comment: JSON.stringify({ '1': { class_type: 'TestNode' } })
        }
      },
      streams: []
    };

    const promise = extractFromVideo('test.mp4');

    // Simulate successful ffprobe output
    setTimeout(() => {
      mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
      mockProcess.emit('close', 0);
    }, 0);

    const result = await promise;
    expect(result).toBeDefined();
    expect(result?.workflow).toBeDefined();
  });

  it('should handle metadata in stream tags', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    const mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockProcess);

    const mockMetadata = {
      format: { tags: {} },
      streams: [{
        tags: {
          workflow: JSON.stringify({ '1': { class_type: 'TestNode' } })
        }
      }]
    };

    const promise = extractFromVideo('test.mp4');

    setTimeout(() => {
      mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
      mockProcess.emit('close', 0);
    }, 0);

    const result = await promise;
    expect(result).toBeDefined();
    expect(result?.workflow).toBeDefined();
  });

  it('should return null when no valid workflow is found', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    const mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockProcess);

    const mockMetadata = {
      format: { tags: {} },
      streams: []
    };

    const promise = extractFromVideo('test.mp4');

    setTimeout(() => {
      mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
      mockProcess.emit('close', 0);
    }, 0);

    const result = await promise;
    expect(result).toBeNull();
  });

  it('should handle invalid JSON output', async () => {
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();

    const mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockProcess);

    const promise = extractFromVideo('test.mp4');

    setTimeout(() => {
      mockProcess.stdout.emit('data', 'invalid json');
      mockProcess.emit('close', 0);
    }, 0);

    await expect(promise).rejects.toThrow('Failed to parse ffprobe output');
  });
});