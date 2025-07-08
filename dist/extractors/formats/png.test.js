"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const png_js_1 = require("./png.js");
// Mock fs/promises
vitest_1.vi.mock('fs/promises', () => ({
    readFile: vitest_1.vi.fn()
}));
(0, vitest_1.describe)('PNG Extractor', () => {
    (0, vitest_1.describe)('validatePngSignature', () => {
        (0, vitest_1.it)('should validate correct PNG signature', () => {
            const validPngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            const buffer = Buffer.concat([validPngSignature, Buffer.from('test data')]);
            (0, vitest_1.expect)((0, png_js_1.validatePngSignature)(buffer)).toBe(true);
        });
        (0, vitest_1.it)('should reject invalid PNG signature', () => {
            const invalidSignature = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
            (0, vitest_1.expect)((0, png_js_1.validatePngSignature)(invalidSignature)).toBe(false);
        });
        (0, vitest_1.it)('should reject buffer too short for signature', () => {
            const shortBuffer = Buffer.from([0x89, 0x50]);
            (0, vitest_1.expect)((0, png_js_1.validatePngSignature)(shortBuffer)).toBe(false);
        });
    });
    (0, vitest_1.describe)('findTextChunk', () => {
        (0, vitest_1.it)('should find existing chunk by keyword', () => {
            const chunks = [
                { keyword: 'parameters', text: 'test parameters' },
                { keyword: 'workflow', text: 'test workflow' }
            ];
            (0, vitest_1.expect)((0, png_js_1.findTextChunk)(chunks, 'parameters')).toBe('test parameters');
            (0, vitest_1.expect)((0, png_js_1.findTextChunk)(chunks, 'workflow')).toBe('test workflow');
        });
        (0, vitest_1.it)('should return null for non-existing chunk', () => {
            const chunks = [
                { keyword: 'parameters', text: 'test parameters' }
            ];
            (0, vitest_1.expect)((0, png_js_1.findTextChunk)(chunks, 'nonexistent')).toBeNull();
        });
    });
    (0, vitest_1.describe)('extractFromPNG', () => {
        (0, vitest_1.it)('should return null for non-existent files', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const mockReadFile = fs.readFile;
            mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));
            const result = await (0, png_js_1.extractFromPNG)('nonexistent.png');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should extract A1111 parameters from PNG text chunks', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const mockReadFile = fs.readFile;
            // Create a minimal PNG buffer with tEXt chunk containing A1111 parameters
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            const parametersText = 'beautiful landscape\\nNegative prompt: ugly\\nSteps: 30, CFG scale: 7.5';
            const keyword = 'parameters';
            const textData = Buffer.concat([
                Buffer.from(keyword, 'utf8'),
                Buffer.from([0]), // null terminator
                Buffer.from(parametersText, 'utf8')
            ]);
            // Create tEXt chunk: length + type + data + crc
            const chunkLength = Buffer.alloc(4);
            chunkLength.writeUInt32BE(textData.length, 0);
            const chunkType = Buffer.from([0x74, 0x45, 0x58, 0x74]); // 'tEXt'
            const chunkCrc = Buffer.alloc(4); // dummy CRC
            const pngBuffer = Buffer.concat([
                pngSignature,
                chunkLength,
                chunkType,
                textData,
                chunkCrc
            ]);
            mockReadFile.mockResolvedValue(pngBuffer);
            const result = await (0, png_js_1.extractFromPNG)('test.png');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result?.parameters).toBeDefined();
            (0, vitest_1.expect)(result?.raw_parameters).toBe(parametersText);
        });
        (0, vitest_1.it)('should extract ComfyUI workflow from PNG text chunks', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const mockReadFile = fs.readFile;
            // Create a minimal PNG buffer with tEXt chunk containing ComfyUI workflow
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            const workflowJson = JSON.stringify({
                '1': { class_type: 'CheckpointLoaderSimple', inputs: {} },
                '2': { class_type: 'CLIPTextEncode', inputs: { text: 'test prompt' } }
            });
            const keyword = 'workflow';
            const textData = Buffer.concat([
                Buffer.from(keyword, 'utf8'),
                Buffer.from([0]), // null terminator
                Buffer.from(workflowJson, 'utf8')
            ]);
            // Create tEXt chunk: length + type + data + crc
            const chunkLength = Buffer.alloc(4);
            chunkLength.writeUInt32BE(textData.length, 0);
            const chunkType = Buffer.from([0x74, 0x45, 0x58, 0x74]); // 'tEXt'
            const chunkCrc = Buffer.alloc(4); // dummy CRC
            const pngBuffer = Buffer.concat([
                pngSignature,
                chunkLength,
                chunkType,
                textData,
                chunkCrc
            ]);
            mockReadFile.mockResolvedValue(pngBuffer);
            const result = await (0, png_js_1.extractFromPNG)('test.png');
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result?.workflow).toBeDefined();
            (0, vitest_1.expect)(result?.workflow['1']).toBeDefined();
            (0, vitest_1.expect)(result?.workflow['1'].class_type).toBe('CheckpointLoaderSimple');
        });
        (0, vitest_1.it)('should return null when no relevant text chunks are found', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const mockReadFile = fs.readFile;
            // Create a minimal PNG buffer with no tEXt chunks
            const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
            mockReadFile.mockResolvedValue(pngSignature);
            const result = await (0, png_js_1.extractFromPNG)('test.png');
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle invalid PNG signature', async () => {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const mockReadFile = fs.readFile;
            const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
            mockReadFile.mockResolvedValue(invalidBuffer);
            await (0, vitest_1.expect)((0, png_js_1.extractFromPNG)('invalid.png')).rejects.toThrow('PNG extraction failed');
        });
    });
});
//# sourceMappingURL=png.test.js.map