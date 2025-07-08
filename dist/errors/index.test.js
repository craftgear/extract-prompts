"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const index_1 = require("./index");
(0, vitest_1.describe)('ExtractionError', () => {
    (0, vitest_1.it)('should create error with required properties', () => {
        const error = new index_1.ExtractionError('Test message', 'TEST_CODE', '/test/file.png', { key: 'value' });
        (0, vitest_1.expect)(error.message).toBe('Test message');
        (0, vitest_1.expect)(error.code).toBe('TEST_CODE');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.png');
        (0, vitest_1.expect)(error.context).toEqual({ key: 'value' });
        (0, vitest_1.expect)(error.timestamp).toBeInstanceOf(Date);
        (0, vitest_1.expect)(error.name).toBe('ExtractionError');
        (0, vitest_1.expect)(error).toBeInstanceOf(Error);
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.ExtractionError);
    });
    (0, vitest_1.it)('should work without optional parameters', () => {
        const error = new index_1.ExtractionError('Test message', 'TEST_CODE');
        (0, vitest_1.expect)(error.message).toBe('Test message');
        (0, vitest_1.expect)(error.code).toBe('TEST_CODE');
        (0, vitest_1.expect)(error.filePath).toBeUndefined();
        (0, vitest_1.expect)(error.context).toBeUndefined();
    });
    (0, vitest_1.it)('should serialize to JSON correctly', () => {
        const error = new index_1.ExtractionError('Test message', 'TEST_CODE', '/test/file.png', { key: 'value' });
        const json = error.toJSON();
        (0, vitest_1.expect)(json.name).toBe('ExtractionError');
        (0, vitest_1.expect)(json.message).toBe('Test message');
        (0, vitest_1.expect)(json.code).toBe('TEST_CODE');
        (0, vitest_1.expect)(json.filePath).toBe('/test/file.png');
        (0, vitest_1.expect)(json.context).toEqual({ key: 'value' });
        (0, vitest_1.expect)(json.timestamp).toBe(error.timestamp.toISOString());
        (0, vitest_1.expect)(json.stack).toBeDefined();
    });
});
(0, vitest_1.describe)('UnsupportedFormatError', () => {
    (0, vitest_1.it)('should create error with format details', () => {
        const error = new index_1.UnsupportedFormatError('/test/file.xyz', 'xyz', ['png', 'jpg']);
        (0, vitest_1.expect)(error.message).toBe('Unsupported file format: xyz. Supported formats: png, jpg');
        (0, vitest_1.expect)(error.code).toBe('UNSUPPORTED_FORMAT');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.xyz');
        (0, vitest_1.expect)(error.extension).toBe('xyz');
        (0, vitest_1.expect)(error.supportedFormats).toEqual(['png', 'jpg']);
        (0, vitest_1.expect)(error.name).toBe('UnsupportedFormatError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.UnsupportedFormatError);
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.ExtractionError);
    });
    (0, vitest_1.it)('should use default supported formats', () => {
        const error = new index_1.UnsupportedFormatError('/test/file.xyz', 'xyz');
        (0, vitest_1.expect)(error.supportedFormats).toEqual(['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'mov']);
    });
});
(0, vitest_1.describe)('MetadataNotFoundError', () => {
    (0, vitest_1.it)('should create error with metadata details', () => {
        const error = new index_1.MetadataNotFoundError('/test/file.png', 'image', ['exif', 'comment']);
        (0, vitest_1.expect)(error.message).toBe('No workflow metadata found in image file: /test/file.png');
        (0, vitest_1.expect)(error.code).toBe('METADATA_NOT_FOUND');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.png');
        (0, vitest_1.expect)(error.fileType).toBe('image');
        (0, vitest_1.expect)(error.searchedFields).toEqual(['exif', 'comment']);
        (0, vitest_1.expect)(error.name).toBe('MetadataNotFoundError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.MetadataNotFoundError);
    });
    (0, vitest_1.it)('should work with empty searched fields', () => {
        const error = new index_1.MetadataNotFoundError('/test/file.png', 'image');
        (0, vitest_1.expect)(error.searchedFields).toEqual([]);
    });
});
(0, vitest_1.describe)('ParseError', () => {
    (0, vitest_1.it)('should create error with parse details', () => {
        const originalError = new Error('Invalid JSON');
        const rawData = '{ invalid json }';
        const error = new index_1.ParseError('Failed to parse', originalError, rawData, 'JSON', '/test/file.png');
        (0, vitest_1.expect)(error.message).toBe('JSON parse error: Failed to parse');
        (0, vitest_1.expect)(error.code).toBe('PARSE_ERROR');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.png');
        (0, vitest_1.expect)(error.originalError).toBe(originalError);
        (0, vitest_1.expect)(error.rawData).toBe(rawData);
        (0, vitest_1.expect)(error.parseType).toBe('JSON');
        (0, vitest_1.expect)(error.name).toBe('ParseError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.ParseError);
    });
    (0, vitest_1.it)('should use default parse type', () => {
        const originalError = new Error('Invalid data');
        const error = new index_1.ParseError('Failed to parse', originalError, 'data');
        (0, vitest_1.expect)(error.parseType).toBe('JSON');
        (0, vitest_1.expect)(error.message).toBe('JSON parse error: Failed to parse');
    });
    (0, vitest_1.it)('should truncate long raw data in context', () => {
        const originalError = new Error('Invalid data');
        const longData = 'x'.repeat(300);
        const error = new index_1.ParseError('Failed to parse', originalError, longData);
        (0, vitest_1.expect)(error.context?.rawData).toBe('x'.repeat(200));
    });
});
(0, vitest_1.describe)('FileAccessError', () => {
    (0, vitest_1.it)('should create error with file access details', () => {
        const systemError = new Error('Permission denied');
        const fileStats = { size: 1024 };
        const error = new index_1.FileAccessError('/test/file.png', 'read', systemError, fileStats);
        (0, vitest_1.expect)(error.message).toBe('File access error during read: Permission denied');
        (0, vitest_1.expect)(error.code).toBe('FILE_ACCESS_ERROR');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.png');
        (0, vitest_1.expect)(error.operation).toBe('read');
        (0, vitest_1.expect)(error.systemError).toBe(systemError);
        (0, vitest_1.expect)(error.fileStats).toBe(fileStats);
        (0, vitest_1.expect)(error.name).toBe('FileAccessError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.FileAccessError);
    });
    (0, vitest_1.it)('should work without file stats', () => {
        const systemError = new Error('Permission denied');
        const error = new index_1.FileAccessError('/test/file.png', 'read', systemError);
        (0, vitest_1.expect)(error.fileStats).toBeUndefined();
    });
});
(0, vitest_1.describe)('ExternalCommandError', () => {
    (0, vitest_1.it)('should create error with command details', () => {
        const error = new index_1.ExternalCommandError('ffprobe', ['-v', 'quiet'], 1, 'stderr output', '/test/file.mp4');
        (0, vitest_1.expect)(error.message).toBe('External command failed: ffprobe (exit code: 1)');
        (0, vitest_1.expect)(error.code).toBe('EXTERNAL_COMMAND_ERROR');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.mp4');
        (0, vitest_1.expect)(error.command).toBe('ffprobe');
        (0, vitest_1.expect)(error.args).toEqual(['-v', 'quiet']);
        (0, vitest_1.expect)(error.exitCode).toBe(1);
        (0, vitest_1.expect)(error.stderr).toBe('stderr output');
        (0, vitest_1.expect)(error.name).toBe('ExternalCommandError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.ExternalCommandError);
    });
    (0, vitest_1.it)('should handle null exit code', () => {
        const error = new index_1.ExternalCommandError('ffprobe', ['-v', 'quiet'], null, 'stderr output');
        (0, vitest_1.expect)(error.message).toBe('External command failed: ffprobe (exit code: unknown)');
        (0, vitest_1.expect)(error.exitCode).toBeNull();
    });
});
(0, vitest_1.describe)('ValidationError', () => {
    (0, vitest_1.it)('should create error with validation details', () => {
        const validationDetails = { field: 'required', value: null };
        const error = new index_1.ValidationError('Required field missing', 'schema', validationDetails, '/test/file.json');
        (0, vitest_1.expect)(error.message).toBe('Validation error (schema): Required field missing');
        (0, vitest_1.expect)(error.code).toBe('VALIDATION_ERROR');
        (0, vitest_1.expect)(error.filePath).toBe('/test/file.json');
        (0, vitest_1.expect)(error.validationType).toBe('schema');
        (0, vitest_1.expect)(error.validationDetails).toBe(validationDetails);
        (0, vitest_1.expect)(error.name).toBe('ValidationError');
        (0, vitest_1.expect)(error).toBeInstanceOf(index_1.ValidationError);
    });
    (0, vitest_1.it)('should work with empty validation details', () => {
        const error = new index_1.ValidationError('Validation failed', 'custom');
        (0, vitest_1.expect)(error.validationDetails).toEqual({});
        (0, vitest_1.expect)(error.filePath).toBeUndefined();
    });
});
(0, vitest_1.describe)('Type guard functions', () => {
    (0, vitest_1.it)('should correctly identify ExtractionError instances', () => {
        const error = new index_1.ExtractionError('test', 'TEST');
        const regularError = new Error('test');
        (0, vitest_1.expect)((0, index_1.isExtractionError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isExtractionError)(regularError)).toBe(false);
        (0, vitest_1.expect)((0, index_1.isExtractionError)(null)).toBe(false);
        (0, vitest_1.expect)((0, index_1.isExtractionError)(undefined)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify UnsupportedFormatError instances', () => {
        const error = new index_1.UnsupportedFormatError('/test.xyz', 'xyz');
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isUnsupportedFormatError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isUnsupportedFormatError)(otherError)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify MetadataNotFoundError instances', () => {
        const error = new index_1.MetadataNotFoundError('/test.png', 'image');
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isMetadataNotFoundError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isMetadataNotFoundError)(otherError)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify ParseError instances', () => {
        const error = new index_1.ParseError('test', new Error('original'), 'data');
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isParseError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isParseError)(otherError)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify FileAccessError instances', () => {
        const error = new index_1.FileAccessError('/test.png', 'read', new Error('access'));
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isFileAccessError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isFileAccessError)(otherError)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify ExternalCommandError instances', () => {
        const error = new index_1.ExternalCommandError('cmd', [], 1, 'stderr');
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isExternalCommandError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isExternalCommandError)(otherError)).toBe(false);
    });
    (0, vitest_1.it)('should correctly identify ValidationError instances', () => {
        const error = new index_1.ValidationError('test', 'schema');
        const otherError = new index_1.ExtractionError('test', 'TEST');
        (0, vitest_1.expect)((0, index_1.isValidationError)(error)).toBe(true);
        (0, vitest_1.expect)((0, index_1.isValidationError)(otherError)).toBe(false);
    });
});
(0, vitest_1.describe)('getErrorSeverity', () => {
    (0, vitest_1.it)('should return correct severity for different error types', () => {
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.MetadataNotFoundError('/test.png', 'image'))).toBe('low');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.UnsupportedFormatError('/test.xyz', 'xyz'))).toBe('medium');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.ParseError('test', new Error('original'), 'data'))).toBe('medium');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.ValidationError('test', 'schema'))).toBe('medium');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.FileAccessError('/test.png', 'read', new Error('access')))).toBe('high');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new index_1.ExternalCommandError('cmd', [], 1, 'stderr'))).toBe('high');
        (0, vitest_1.expect)((0, index_1.getErrorSeverity)(new Error('generic error'))).toBe('critical');
    });
});
(0, vitest_1.describe)('formatErrorMessage', () => {
    (0, vitest_1.it)('should format ExtractionError with file path', () => {
        const error = new index_1.ExtractionError('Test error', 'TEST', '/test/file.png');
        (0, vitest_1.expect)((0, index_1.formatErrorMessage)(error)).toBe('Test error (/test/file.png)');
    });
    (0, vitest_1.it)('should format ExtractionError without file path', () => {
        const error = new index_1.ExtractionError('Test error', 'TEST');
        (0, vitest_1.expect)((0, index_1.formatErrorMessage)(error)).toBe('Test error');
    });
    (0, vitest_1.it)('should format regular Error', () => {
        const error = new Error('Regular error');
        (0, vitest_1.expect)((0, index_1.formatErrorMessage)(error)).toBe('Regular error');
    });
});
//# sourceMappingURL=index.test.js.map