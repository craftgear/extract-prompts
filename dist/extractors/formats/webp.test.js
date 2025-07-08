"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const webp_1 = require("./webp");
// Mock dependencies
vitest_1.vi.mock('sharp', () => ({
    default: vitest_1.vi.fn(() => ({
        metadata: vitest_1.vi.fn()
    }))
}));
vitest_1.vi.mock('../../utils/validation', () => ({
    validateComfyUIWorkflow: vitest_1.vi.fn()
}));
vitest_1.vi.mock('../../utils/encoding', () => ({
    extractUTF16TextFromWebP: vitest_1.vi.fn(),
    isA1111Parameters: vitest_1.vi.fn()
}));
vitest_1.vi.mock('../../utils/parameters', () => ({
    parseA1111Parameters: vitest_1.vi.fn()
}));
const sharp_1 = __importDefault(require("sharp"));
const validation_1 = require("../../utils/validation");
const encoding_1 = require("../../utils/encoding");
const parameters_1 = require("../../utils/parameters");
(0, vitest_1.describe)('extractFromWebP', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should extract ComfyUI workflow from WebP EXIF data', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockExifBuffer = Buffer.from('UNICODE' + JSON.stringify(mockWorkflow));
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(JSON.stringify(mockWorkflow));
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(true);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
        (0, vitest_1.expect)(mockSharpInstance.metadata).toHaveBeenCalled();
        (0, vitest_1.expect)(encoding_1.extractUTF16TextFromWebP).toHaveBeenCalledWith(mockExifBuffer.toString(), 7);
    });
    (0, vitest_1.it)('should extract A1111 parameters from WebP EXIF data', async () => {
        const mockParameters = 'beautiful landscape, masterpiece\nNegative prompt: blur, distorted';
        const mockParsedParams = {
            positive_prompt: 'beautiful landscape, masterpiece',
            negative_prompt: 'blur, distorted'
        };
        const mockExifBuffer = Buffer.from('UNICODE' + mockParameters);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockParameters);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(true);
        vitest_1.vi.mocked(parameters_1.parseA1111Parameters).mockReturnValue(mockParsedParams);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({
            parameters: mockParsedParams,
            raw_parameters: mockParameters
        });
        (0, vitest_1.expect)(encoding_1.isA1111Parameters).toHaveBeenCalledWith(mockParameters);
        (0, vitest_1.expect)(parameters_1.parseA1111Parameters).toHaveBeenCalledWith(mockParameters);
    });
    (0, vitest_1.it)('should handle text containing workflow keywords', async () => {
        const mockText = 'workflow data here';
        const mockExifBuffer = Buffer.from('UNICODE' + mockText);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockText);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ metadata: mockText });
    });
    (0, vitest_1.it)('should handle text containing prompt keywords', async () => {
        const mockText = 'prompt data here';
        const mockExifBuffer = Buffer.from('UNICODE' + mockText);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockText);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ metadata: mockText });
    });
    (0, vitest_1.it)('should store regular text as user comment', async () => {
        const mockText = 'This is a regular comment';
        const mockExifBuffer = Buffer.from('UNICODE' + mockText);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockText);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ user_comment: mockText });
    });
    (0, vitest_1.it)('should handle invalid JSON in workflow/prompt text', async () => {
        const mockText = 'workflow invalid json {';
        const mockExifBuffer = Buffer.from('UNICODE' + mockText);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockText);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ metadata: mockText });
    });
    (0, vitest_1.it)('should handle valid JSON that is not a ComfyUI workflow', async () => {
        const mockText = 'workflow {"not": "comfyui"}';
        const mockExifBuffer = Buffer.from('UNICODE' + mockText);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(mockText);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(false);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ metadata: mockText });
    });
    (0, vitest_1.it)('should return null when no EXIF data is found', async () => {
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: null
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should return null when no UNICODE marker is found', async () => {
        const mockExifBuffer = Buffer.from('No unicode marker here');
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should return null when extractUTF16TextFromWebP returns empty text', async () => {
        const mockExifBuffer = Buffer.from('UNICODE');
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue('');
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should handle Sharp errors gracefully', async () => {
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockRejectedValue(new Error('Sharp failed'))
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.extractFromWebP)('/test/image.webp');
        (0, vitest_1.expect)(result).toBeNull();
    });
});
(0, vitest_1.describe)('extractFromWebPAdvanced', () => {
    (0, vitest_1.it)('should delegate to extractFromWebP', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockExifBuffer = Buffer.from('UNICODE' + JSON.stringify(mockWorkflow));
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractUTF16TextFromWebP).mockReturnValue(JSON.stringify(mockWorkflow));
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(true);
        const result = await (0, webp_1.extractFromWebPAdvanced)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
    });
});
(0, vitest_1.describe)('getWebPMetadataInfo', () => {
    (0, vitest_1.it)('should return metadata information with EXIF', async () => {
        const mockExifBuffer = Buffer.from('test exif data');
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: mockExifBuffer,
                format: 'webp',
                width: 1024,
                height: 768
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.getWebPMetadataInfo)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({
            hasExif: true,
            exifSize: mockExifBuffer.length,
            format: 'webp',
            width: 1024,
            height: 768
        });
    });
    (0, vitest_1.it)('should return metadata information without EXIF', async () => {
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: null,
                format: 'webp',
                width: 512,
                height: 512
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.getWebPMetadataInfo)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({
            hasExif: false,
            exifSize: undefined,
            format: 'webp',
            width: 512,
            height: 512
        });
    });
    (0, vitest_1.it)('should handle missing format information', async () => {
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: null,
                format: undefined,
                width: 256,
                height: 256
            })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, webp_1.getWebPMetadataInfo)('/test/image.webp');
        (0, vitest_1.expect)(result).toEqual({
            hasExif: false,
            exifSize: undefined,
            format: 'webp',
            width: 256,
            height: 256
        });
    });
});
//# sourceMappingURL=webp.test.js.map