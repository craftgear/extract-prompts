"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jpeg_1 = require("./jpeg");
// Mock dependencies
vitest_1.vi.mock('sharp', () => ({
    default: vitest_1.vi.fn(() => ({
        metadata: vitest_1.vi.fn()
    }))
}));
vitest_1.vi.mock('exifr', () => ({
    default: {
        parse: vitest_1.vi.fn()
    }
}));
vitest_1.vi.mock('../../utils/validation', () => ({
    validateComfyUIWorkflow: vitest_1.vi.fn()
}));
vitest_1.vi.mock('../../utils/encoding', () => ({
    decodeUTF16FromBytes: vitest_1.vi.fn(),
    extractBytesFromObject: vitest_1.vi.fn(),
    extractJSONFromText: vitest_1.vi.fn(),
    isA1111Parameters: vitest_1.vi.fn()
}));
vitest_1.vi.mock('../../utils/parameters', () => ({
    parseA1111Parameters: vitest_1.vi.fn()
}));
const sharp_1 = __importDefault(require("sharp"));
const exifr_1 = __importDefault(require("exifr"));
const validation_1 = require("../../utils/validation");
const encoding_1 = require("../../utils/encoding");
const parameters_1 = require("../../utils/parameters");
(0, vitest_1.describe)('extractFromJPEG', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should extract ComfyUI workflow from UserComment field', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockExifData = {
            UserComment: JSON.stringify(mockWorkflow)
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(true);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
        (0, vitest_1.expect)(exifr_1.default.parse).toHaveBeenCalledWith('/test/image.jpg', vitest_1.expect.any(Object));
    });
    (0, vitest_1.it)('should extract A1111 parameters from ImageDescription', async () => {
        const mockParameters = 'beautiful landscape, masterpiece';
        const mockParsedParams = { positive_prompt: 'beautiful landscape, masterpiece' };
        const mockExifData = {
            ImageDescription: mockParameters
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(false);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(true);
        vitest_1.vi.mocked(parameters_1.parseA1111Parameters).mockReturnValue(mockParsedParams);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ parameters: mockParsedParams });
        (0, vitest_1.expect)(encoding_1.isA1111Parameters).toHaveBeenCalledWith(mockParameters);
        (0, vitest_1.expect)(parameters_1.parseA1111Parameters).toHaveBeenCalledWith(mockParameters);
    });
    (0, vitest_1.it)('should process UTF-16 encoded UserComment field', async () => {
        const mockUserComment = { 0: 85, 1: 78, 2: 73, 3: 67, 4: 79, 5: 68, 6: 69, 7: 0, 8: 0 };
        const mockDecodedComment = 'beautiful landscape, masterpiece';
        const mockParsedParams = { positive_prompt: 'beautiful landscape, masterpiece' };
        const mockExifData = {
            userComment: mockUserComment
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(encoding_1.extractBytesFromObject).mockReturnValue([85, 78, 73, 67, 79, 68, 69, 0, 0]);
        vitest_1.vi.mocked(encoding_1.decodeUTF16FromBytes).mockReturnValue(mockDecodedComment);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(true);
        vitest_1.vi.mocked(parameters_1.parseA1111Parameters).mockReturnValue(mockParsedParams);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({
            parameters: mockParsedParams,
            raw_parameters: mockDecodedComment
        });
        (0, vitest_1.expect)(encoding_1.extractBytesFromObject).toHaveBeenCalledWith(mockUserComment);
        (0, vitest_1.expect)(encoding_1.decodeUTF16FromBytes).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should extract workflow from JSON pattern in text', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockTextWithJSON = `Some text {"nodes":[],"links":[]} more text`;
        const mockExifData = {
            UserComment: mockTextWithJSON
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValueOnce(false).mockReturnValueOnce(true);
        vitest_1.vi.mocked(encoding_1.extractJSONFromText).mockReturnValue([JSON.stringify(mockWorkflow)]);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
        (0, vitest_1.expect)(encoding_1.extractJSONFromText).toHaveBeenCalledWith(mockTextWithJSON);
    });
    (0, vitest_1.it)('should try multiple EXIF fields for ComfyUI data', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockExifData = {
            UserComment: 'not json',
            ImageDescription: 'not json',
            XPComment: JSON.stringify(mockWorkflow)
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValueOnce(false).mockReturnValueOnce(false).mockReturnValueOnce(true);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
    });
    (0, vitest_1.it)('should fallback to Sharp when exifr fails', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({
                exif: Buffer.from(JSON.stringify(mockWorkflow))
            })
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockRejectedValue(new Error('EXIF parsing failed'));
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        vitest_1.vi.mocked(encoding_1.extractJSONFromText).mockReturnValue([JSON.stringify(mockWorkflow)]);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(true);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
        (0, vitest_1.expect)(mockSharpInstance.metadata).toHaveBeenCalled();
    });
    (0, vitest_1.it)('should handle string UserComment field', async () => {
        const mockWorkflow = { nodes: [], links: [] };
        const mockExifData = {
            userComment: JSON.stringify(mockWorkflow)
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(validation_1.validateComfyUIWorkflow).mockReturnValue(true);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ workflow: mockWorkflow });
    });
    (0, vitest_1.it)('should store non-JSON user comment as metadata', async () => {
        const mockComment = 'This is a regular comment';
        const mockExifData = {
            userComment: mockComment
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ user_comment: mockComment });
    });
    (0, vitest_1.it)('should handle workflow/prompt keywords in user comment', async () => {
        const mockComment = 'workflow data here';
        const mockExifData = {
            userComment: mockComment
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(encoding_1.isA1111Parameters).mockReturnValue(false);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toEqual({ metadata: mockComment });
    });
    (0, vitest_1.it)('should return null when no metadata is found', async () => {
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(null);
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockResolvedValue({ exif: null })
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should return null when both exifr and Sharp fail', async () => {
        vitest_1.vi.mocked(exifr_1.default.parse).mockRejectedValue(new Error('EXIF parsing failed'));
        const mockSharpInstance = {
            metadata: vitest_1.vi.fn().mockRejectedValue(new Error('Sharp failed'))
        };
        vitest_1.vi.mocked(sharp_1.default).mockReturnValue(mockSharpInstance);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should handle empty EXIF data', async () => {
        const mockExifData = {};
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toBeNull();
    });
    (0, vitest_1.it)('should skip short byte arrays in UserComment', async () => {
        const mockExifData = {
            userComment: { 0: 1, 1: 2, 2: 3 } // Too short
        };
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        vitest_1.vi.mocked(encoding_1.extractBytesFromObject).mockReturnValue([1, 2, 3]);
        const result = await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(result).toBeNull();
        (0, vitest_1.expect)(encoding_1.decodeUTF16FromBytes).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('should use correct exifr options', async () => {
        const mockExifData = {};
        vitest_1.vi.mocked(exifr_1.default.parse).mockResolvedValue(mockExifData);
        await (0, jpeg_1.extractFromJPEG)('/test/image.jpg');
        (0, vitest_1.expect)(exifr_1.default.parse).toHaveBeenCalledWith('/test/image.jpg', {
            userComment: true,
            exif: true,
            gps: false,
            tiff: true,
            icc: false,
            iptc: false,
            jfif: false,
            ihdr: false,
            reviveValues: false,
            translateKeys: false,
            translateValues: false,
            mergeOutput: false
        });
    });
});
//# sourceMappingURL=jpeg.test.js.map