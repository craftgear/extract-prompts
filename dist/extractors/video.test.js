"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const video_1 = require("./video");
const child_process_1 = require("child_process");
const events_1 = require("events");
// Mock child_process
vitest_1.vi.mock('child_process', () => ({
    spawn: vitest_1.vi.fn()
}));
// Mock ffprobe-static
vitest_1.vi.mock('ffprobe-static', () => ({
    default: '/path/to/ffprobe'
}));
(0, vitest_1.describe)('extractFromVideo', () => {
    (0, vitest_1.it)('should throw error when ffprobe fails', async () => {
        const mockProcess = new events_1.EventEmitter();
        mockProcess.stdout = new events_1.EventEmitter();
        mockProcess.stderr = new events_1.EventEmitter();
        const mockSpawn = child_process_1.spawn;
        mockSpawn.mockReturnValue(mockProcess);
        const promise = (0, video_1.extractFromVideo)('test.mp4');
        // Simulate process error
        setTimeout(() => {
            mockProcess.stderr.emit('data', 'Error message');
            mockProcess.emit('close', 1);
        }, 0);
        await (0, vitest_1.expect)(promise).rejects.toThrow('External command failed: ffprobe (exit code: 1)');
    });
    (0, vitest_1.it)('should parse ffprobe output correctly', async () => {
        const mockProcess = new events_1.EventEmitter();
        mockProcess.stdout = new events_1.EventEmitter();
        mockProcess.stderr = new events_1.EventEmitter();
        const mockSpawn = child_process_1.spawn;
        mockSpawn.mockReturnValue(mockProcess);
        const mockMetadata = {
            format: {
                tags: {
                    comment: JSON.stringify({ '1': { class_type: 'TestNode' } })
                }
            },
            streams: []
        };
        const promise = (0, video_1.extractFromVideo)('test.mp4');
        // Simulate successful ffprobe output
        setTimeout(() => {
            mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
            mockProcess.emit('close', 0);
        }, 0);
        const result = await promise;
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result?.workflow).toBeDefined();
    });
    (0, vitest_1.it)('should handle metadata in stream tags', async () => {
        const mockProcess = new events_1.EventEmitter();
        mockProcess.stdout = new events_1.EventEmitter();
        mockProcess.stderr = new events_1.EventEmitter();
        const mockSpawn = child_process_1.spawn;
        mockSpawn.mockReturnValue(mockProcess);
        const mockMetadata = {
            format: { tags: {} },
            streams: [{
                    tags: {
                        workflow: JSON.stringify({ '1': { class_type: 'TestNode' } })
                    }
                }]
        };
        const promise = (0, video_1.extractFromVideo)('test.mp4');
        setTimeout(() => {
            mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
            mockProcess.emit('close', 0);
        }, 0);
        const result = await promise;
        (0, vitest_1.expect)(result).toBeDefined();
        (0, vitest_1.expect)(result?.workflow).toBeDefined();
    });
    (0, vitest_1.it)('should return null when no valid workflow is found', async () => {
        const mockProcess = new events_1.EventEmitter();
        mockProcess.stdout = new events_1.EventEmitter();
        mockProcess.stderr = new events_1.EventEmitter();
        const mockSpawn = child_process_1.spawn;
        mockSpawn.mockReturnValue(mockProcess);
        const mockMetadata = {
            format: { tags: {} },
            streams: []
        };
        const promise = (0, video_1.extractFromVideo)('test.mp4');
        setTimeout(() => {
            mockProcess.stdout.emit('data', JSON.stringify(mockMetadata));
            mockProcess.emit('close', 0);
        }, 0);
        const result = await promise;
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should handle invalid JSON output', async () => {
        const mockProcess = new events_1.EventEmitter();
        mockProcess.stdout = new events_1.EventEmitter();
        mockProcess.stderr = new events_1.EventEmitter();
        const mockSpawn = child_process_1.spawn;
        mockSpawn.mockReturnValue(mockProcess);
        const promise = (0, video_1.extractFromVideo)('test.mp4');
        setTimeout(() => {
            mockProcess.stdout.emit('data', 'invalid json');
            mockProcess.emit('close', 0);
        }, 0);
        await (0, vitest_1.expect)(promise).rejects.toThrow('Failed to parse ffprobe output');
    });
});
//# sourceMappingURL=video.test.js.map