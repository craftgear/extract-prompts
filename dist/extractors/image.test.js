"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const image_1 = require("./image");
const sharp_1 = __importDefault(require("sharp"));
// Mock sharp
vitest_1.vi.mock('sharp', () => ({
    default: vitest_1.vi.fn(() => ({
        metadata: vitest_1.vi.fn()
    }))
}));
(0, vitest_1.describe)('extractFromImage', () => {
    (0, vitest_1.it)('should return null for files without metadata', async () => {
        const result = await (0, image_1.extractFromImage)('test.png');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should throw error for unsupported formats', async () => {
        const mockSharp = sharp_1.default;
        mockSharp.mockReturnValue({
            metadata: vitest_1.vi.fn().mockResolvedValue({ exif: Buffer.from('test') })
        });
        await (0, vitest_1.expect)((0, image_1.extractFromImage)('test.gif')).rejects.toThrow('Unsupported file format: gif. Supported formats: png, jpg, jpeg, webp');
    });
    (0, vitest_1.it)('should handle PNG files', async () => {
        const mockSharp = sharp_1.default;
        mockSharp.mockReturnValue({
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
            })
        });
        const result = await (0, image_1.extractFromImage)('test.png');
        (0, vitest_1.expect)(result).toBeDefined();
    });
    (0, vitest_1.it)('should handle JPEG files', async () => {
        const mockSharp = sharp_1.default;
        mockSharp.mockReturnValue({
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
            })
        });
        const result = await (0, image_1.extractFromImage)('test.jpg');
        (0, vitest_1.expect)(result).toBeDefined();
    });
    (0, vitest_1.it)('should handle JPEG files with jpeg extension', async () => {
        const mockSharp = sharp_1.default;
        mockSharp.mockReturnValue({
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
            })
        });
        const result = await (0, image_1.extractFromImage)('test.jpeg');
        (0, vitest_1.expect)(result).toBeDefined();
    });
    (0, vitest_1.it)('should return null when no valid workflow is found', async () => {
        const mockSharp = sharp_1.default;
        mockSharp.mockReturnValue({
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: Buffer.from('invalid json data')
            })
        });
        const result = await (0, image_1.extractFromImage)('test.png');
        (0, vitest_1.expect)(result).toBeNull();
    });
});
//# sourceMappingURL=image.test.js.map