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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFromImage = extractFromImage;
const sharp_1 = __importDefault(require("sharp"));
const exifr_1 = __importDefault(require("exifr"));
const validation_1 = require("../utils/validation");
const a1111_1 = require("../parsers/a1111");
const index_1 = require("../errors/index");
const encoding_1 = require("../utils/encoding");
const binary_1 = require("../utils/binary");
const formats_1 = require("../utils/formats");
async function extractFromImage(filePath) {
    // PNG files store ComfyUI data in tEXt chunks
    if ((0, formats_1.isPngFormat)(filePath)) {
        return extractFromPNG(filePath);
    }
    // JPEG files may have metadata in EXIF
    if ((0, formats_1.isJpegFormat)(filePath)) {
        return extractFromJPEG(filePath);
    }
    // WebP files may have metadata in EXIF
    if ((0, formats_1.isWebpFormat)(filePath)) {
        return extractFromWebP(filePath);
    }
    const ext = filePath.split('.').pop() || 'unknown';
    throw new index_1.UnsupportedFormatError(filePath, ext, ['png', 'jpg', 'jpeg', 'webp']);
}
async function extractFromPNG(filePath) {
    const result = {};
    try {
        // Read data directly from PNG tEXt chunks
        const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        let buffer;
        try {
            buffer = await fs.readFile(filePath);
        }
        catch (error) {
            throw new index_1.FileAccessError(filePath, 'read', error);
        }
        const textChunks = (0, binary_1.extractPngTextChunks)(buffer);
        for (const chunk of textChunks) {
            const parsed = (0, binary_1.parseTextChunk)(chunk.data);
            if (!parsed)
                continue;
            const { keyword, text } = parsed;
            // Check for keywords that may contain ComfyUI or A1111 data
            if ((0, formats_1.isMetadataKeyword)(keyword)) {
                if (keyword === 'parameters') {
                    // Parse A1111 style parameters
                    result.parameters = (0, a1111_1.parseA1111Parameters)(text);
                    result.raw_parameters = text;
                }
                else {
                    // Check if JSON data
                    try {
                        const parsedJson = JSON.parse(text);
                        if ((0, validation_1.validateComfyUIWorkflow)(parsedJson)) {
                            result.workflow = parsedJson;
                        }
                        else {
                            result[keyword] = parsedJson;
                        }
                    }
                    catch (e) {
                        result[keyword] = text;
                    }
                }
            }
        }
    }
    catch (error) {
        // Fallback: use sharp
        try {
            const image = (0, sharp_1.default)(filePath);
            const metadata = await image.metadata();
            if (metadata.exif) {
                const jsonMatches = (0, binary_1.extractJsonPatterns)(metadata.exif);
                for (const match of jsonMatches) {
                    try {
                        const parsed = JSON.parse(match);
                        if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                            result.workflow = parsed;
                            break;
                        }
                    }
                    catch (e) {
                        // Continue to next match
                    }
                }
            }
        }
        catch (fallbackError) {
            // Final fallback
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
async function extractFromJPEG(filePath) {
    const result = {};
    // For WebP files, use sharp directly (exifr doesn't support WebP)
    if ((0, formats_1.isWebpFormat)(filePath)) {
        return extractFromWebP(filePath);
    }
    try {
        // Use exifr to extract comprehensive EXIF data
        const exifData = await exifr_1.default.parse(filePath, {
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
        if (exifData) {
            // Check common EXIF fields where ComfyUI data might be stored
            const fieldsToCheck = [
                'UserComment',
                'ImageDescription',
                'XPComment',
                'XPKeywords',
                'Software',
                'Artist',
                'Copyright',
                'Comment'
            ];
            for (const field of fieldsToCheck) {
                const normalizedField = (0, formats_1.normalizeExifFieldName)(field);
                const value = exifData[normalizedField] || exifData[field];
                if (value && typeof value === 'string') {
                    // Try to parse as JSON directly
                    try {
                        const parsed = JSON.parse(value);
                        if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                            result.workflow = parsed;
                            break;
                        }
                    }
                    catch (e) {
                        // Try to find JSON patterns in the string
                        const jsonMatches = value.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
                        if (jsonMatches) {
                            for (const match of jsonMatches) {
                                try {
                                    const parsed = JSON.parse(match);
                                    if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                                        result.workflow = parsed;
                                        break;
                                    }
                                }
                                catch (e) {
                                    // Continue to next match
                                }
                            }
                            if (result.workflow)
                                break;
                        }
                    }
                }
            }
            // Also check for parameters in specific formats used by various tools
            if (!result.workflow) {
                // Check for A1111-style parameters
                const imageDesc = exifData.ImageDescription || '';
                if ((0, formats_1.containsA1111Parameters)(imageDesc)) {
                    result.parameters = (0, a1111_1.parseA1111Parameters)(imageDesc);
                }
                // Check UTF-16 encoded UserComment field
                const userComment = exifData.userComment || exifData.UserComment;
                if (userComment) {
                    const decodedComment = (0, encoding_1.decodeUserComment)(userComment);
                    if (decodedComment) {
                        // Check A1111 style parameters
                        if ((0, formats_1.containsA1111Parameters)(decodedComment)) {
                            result.parameters = (0, a1111_1.parseA1111Parameters)(decodedComment);
                            result.raw_parameters = decodedComment;
                        }
                        else if (decodedComment.includes('workflow') || decodedComment.includes('prompt')) {
                            try {
                                const parsed = JSON.parse(decodedComment);
                                result.workflow = parsed;
                            }
                            catch (e) {
                                result.metadata = decodedComment;
                            }
                        }
                        else {
                            // Save other metadata as well
                            result.user_comment = decodedComment;
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        // Fallback to sharp metadata extraction
        try {
            const sharpMetadata = await (0, sharp_1.default)(filePath).metadata();
            if (sharpMetadata.exif) {
                const jsonMatches = (0, binary_1.extractJsonPatterns)(sharpMetadata.exif);
                for (const match of jsonMatches) {
                    try {
                        const parsed = JSON.parse(match);
                        if ((0, validation_1.validateComfyUIWorkflow)(parsed)) {
                            result.workflow = parsed;
                            break;
                        }
                    }
                    catch (e) {
                        // Continue
                    }
                }
            }
        }
        catch (fallbackError) {
            // Final fallback
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
async function extractFromWebP(filePath) {
    const result = {};
    try {
        // Use Sharp to extract EXIF data from WebP
        const metadata = await (0, sharp_1.default)(filePath).metadata();
        if (metadata.exif) {
            const exifString = metadata.exif.toString();
            // Look for User Comment field (text after UNICODE prefix)
            const textData = (0, encoding_1.extractTextAfterUnicodePrefix)(exifString);
            if (textData) {
                // Extract text from UTF-16LE format data
                const cleanText = (0, encoding_1.extractTextFromUtf16Le)(textData);
                if (cleanText && (0, formats_1.containsA1111Parameters)(cleanText)) {
                    result.parameters = (0, a1111_1.parseA1111Parameters)(cleanText);
                    result.raw_parameters = cleanText;
                }
                else if (cleanText) {
                    result.user_comment = cleanText;
                }
            }
        }
    }
    catch (error) {
        // Error handling
        console.error('WebP extraction error:', error);
    }
    return Object.keys(result).length > 0 ? result : null;
}
//# sourceMappingURL=image.js.map