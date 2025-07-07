import { describe, it, expect } from 'vitest';
import {
  ExtractionError,
  UnsupportedFormatError,
  MetadataNotFoundError,
  ParseError,
  FileAccessError,
  ExternalCommandError,
  ValidationError,
  isExtractionError,
  isUnsupportedFormatError,
  isMetadataNotFoundError,
  isParseError,
  isFileAccessError,
  isExternalCommandError,
  isValidationError,
  getErrorSeverity,
  formatErrorMessage
} from './index';

describe('ExtractionError', () => {
  it('should create error with required properties', () => {
    const error = new ExtractionError('Test message', 'TEST_CODE', '/test/file.png', { key: 'value' });
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.filePath).toBe('/test/file.png');
    expect(error.context).toEqual({ key: 'value' });
    expect(error.timestamp).toBeInstanceOf(Date);
    expect(error.name).toBe('ExtractionError');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ExtractionError);
  });

  it('should work without optional parameters', () => {
    const error = new ExtractionError('Test message', 'TEST_CODE');
    
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.filePath).toBeUndefined();
    expect(error.context).toBeUndefined();
  });

  it('should serialize to JSON correctly', () => {
    const error = new ExtractionError('Test message', 'TEST_CODE', '/test/file.png', { key: 'value' });
    const json = error.toJSON();
    
    expect(json.name).toBe('ExtractionError');
    expect(json.message).toBe('Test message');
    expect(json.code).toBe('TEST_CODE');
    expect(json.filePath).toBe('/test/file.png');
    expect(json.context).toEqual({ key: 'value' });
    expect(json.timestamp).toBe(error.timestamp.toISOString());
    expect(json.stack).toBeDefined();
  });
});

describe('UnsupportedFormatError', () => {
  it('should create error with format details', () => {
    const error = new UnsupportedFormatError('/test/file.xyz', 'xyz', ['png', 'jpg']);
    
    expect(error.message).toBe('Unsupported file format: xyz. Supported formats: png, jpg');
    expect(error.code).toBe('UNSUPPORTED_FORMAT');
    expect(error.filePath).toBe('/test/file.xyz');
    expect(error.extension).toBe('xyz');
    expect(error.supportedFormats).toEqual(['png', 'jpg']);
    expect(error.name).toBe('UnsupportedFormatError');
    expect(error).toBeInstanceOf(UnsupportedFormatError);
    expect(error).toBeInstanceOf(ExtractionError);
  });

  it('should use default supported formats', () => {
    const error = new UnsupportedFormatError('/test/file.xyz', 'xyz');
    
    expect(error.supportedFormats).toEqual(['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'mov']);
  });
});

describe('MetadataNotFoundError', () => {
  it('should create error with metadata details', () => {
    const error = new MetadataNotFoundError('/test/file.png', 'image', ['exif', 'comment']);
    
    expect(error.message).toBe('No workflow metadata found in image file: /test/file.png');
    expect(error.code).toBe('METADATA_NOT_FOUND');
    expect(error.filePath).toBe('/test/file.png');
    expect(error.fileType).toBe('image');
    expect(error.searchedFields).toEqual(['exif', 'comment']);
    expect(error.name).toBe('MetadataNotFoundError');
    expect(error).toBeInstanceOf(MetadataNotFoundError);
  });

  it('should work with empty searched fields', () => {
    const error = new MetadataNotFoundError('/test/file.png', 'image');
    
    expect(error.searchedFields).toEqual([]);
  });
});

describe('ParseError', () => {
  it('should create error with parse details', () => {
    const originalError = new Error('Invalid JSON');
    const rawData = '{ invalid json }';
    const error = new ParseError('Failed to parse', originalError, rawData, 'JSON', '/test/file.png');
    
    expect(error.message).toBe('JSON parse error: Failed to parse');
    expect(error.code).toBe('PARSE_ERROR');
    expect(error.filePath).toBe('/test/file.png');
    expect(error.originalError).toBe(originalError);
    expect(error.rawData).toBe(rawData);
    expect(error.parseType).toBe('JSON');
    expect(error.name).toBe('ParseError');
    expect(error).toBeInstanceOf(ParseError);
  });

  it('should use default parse type', () => {
    const originalError = new Error('Invalid data');
    const error = new ParseError('Failed to parse', originalError, 'data');
    
    expect(error.parseType).toBe('JSON');
    expect(error.message).toBe('JSON parse error: Failed to parse');
  });

  it('should truncate long raw data in context', () => {
    const originalError = new Error('Invalid data');
    const longData = 'x'.repeat(300);
    const error = new ParseError('Failed to parse', originalError, longData);
    
    expect(error.context?.rawData).toBe('x'.repeat(200));
  });
});

describe('FileAccessError', () => {
  it('should create error with file access details', () => {
    const systemError = new Error('Permission denied');
    const fileStats = { size: 1024 };
    const error = new FileAccessError('/test/file.png', 'read', systemError, fileStats);
    
    expect(error.message).toBe('File access error during read: Permission denied');
    expect(error.code).toBe('FILE_ACCESS_ERROR');
    expect(error.filePath).toBe('/test/file.png');
    expect(error.operation).toBe('read');
    expect(error.systemError).toBe(systemError);
    expect(error.fileStats).toBe(fileStats);
    expect(error.name).toBe('FileAccessError');
    expect(error).toBeInstanceOf(FileAccessError);
  });

  it('should work without file stats', () => {
    const systemError = new Error('Permission denied');
    const error = new FileAccessError('/test/file.png', 'read', systemError);
    
    expect(error.fileStats).toBeUndefined();
  });
});

describe('ExternalCommandError', () => {
  it('should create error with command details', () => {
    const error = new ExternalCommandError('ffprobe', ['-v', 'quiet'], 1, 'stderr output', '/test/file.mp4');
    
    expect(error.message).toBe('External command failed: ffprobe (exit code: 1)');
    expect(error.code).toBe('EXTERNAL_COMMAND_ERROR');
    expect(error.filePath).toBe('/test/file.mp4');
    expect(error.command).toBe('ffprobe');
    expect(error.args).toEqual(['-v', 'quiet']);
    expect(error.exitCode).toBe(1);
    expect(error.stderr).toBe('stderr output');
    expect(error.name).toBe('ExternalCommandError');
    expect(error).toBeInstanceOf(ExternalCommandError);
  });

  it('should handle null exit code', () => {
    const error = new ExternalCommandError('ffprobe', ['-v', 'quiet'], null, 'stderr output');
    
    expect(error.message).toBe('External command failed: ffprobe (exit code: unknown)');
    expect(error.exitCode).toBeNull();
  });
});

describe('ValidationError', () => {
  it('should create error with validation details', () => {
    const validationDetails = { field: 'required', value: null };
    const error = new ValidationError('Required field missing', 'schema', validationDetails, '/test/file.json');
    
    expect(error.message).toBe('Validation error (schema): Required field missing');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.filePath).toBe('/test/file.json');
    expect(error.validationType).toBe('schema');
    expect(error.validationDetails).toBe(validationDetails);
    expect(error.name).toBe('ValidationError');
    expect(error).toBeInstanceOf(ValidationError);
  });

  it('should work with empty validation details', () => {
    const error = new ValidationError('Validation failed', 'custom');
    
    expect(error.validationDetails).toEqual({});
    expect(error.filePath).toBeUndefined();
  });
});

describe('Type guard functions', () => {
  it('should correctly identify ExtractionError instances', () => {
    const error = new ExtractionError('test', 'TEST');
    const regularError = new Error('test');
    
    expect(isExtractionError(error)).toBe(true);
    expect(isExtractionError(regularError)).toBe(false);
    expect(isExtractionError(null)).toBe(false);
    expect(isExtractionError(undefined)).toBe(false);
  });

  it('should correctly identify UnsupportedFormatError instances', () => {
    const error = new UnsupportedFormatError('/test.xyz', 'xyz');
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isUnsupportedFormatError(error)).toBe(true);
    expect(isUnsupportedFormatError(otherError)).toBe(false);
  });

  it('should correctly identify MetadataNotFoundError instances', () => {
    const error = new MetadataNotFoundError('/test.png', 'image');
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isMetadataNotFoundError(error)).toBe(true);
    expect(isMetadataNotFoundError(otherError)).toBe(false);
  });

  it('should correctly identify ParseError instances', () => {
    const error = new ParseError('test', new Error('original'), 'data');
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isParseError(error)).toBe(true);
    expect(isParseError(otherError)).toBe(false);
  });

  it('should correctly identify FileAccessError instances', () => {
    const error = new FileAccessError('/test.png', 'read', new Error('access'));
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isFileAccessError(error)).toBe(true);
    expect(isFileAccessError(otherError)).toBe(false);
  });

  it('should correctly identify ExternalCommandError instances', () => {
    const error = new ExternalCommandError('cmd', [], 1, 'stderr');
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isExternalCommandError(error)).toBe(true);
    expect(isExternalCommandError(otherError)).toBe(false);
  });

  it('should correctly identify ValidationError instances', () => {
    const error = new ValidationError('test', 'schema');
    const otherError = new ExtractionError('test', 'TEST');
    
    expect(isValidationError(error)).toBe(true);
    expect(isValidationError(otherError)).toBe(false);
  });
});

describe('getErrorSeverity', () => {
  it('should return correct severity for different error types', () => {
    expect(getErrorSeverity(new MetadataNotFoundError('/test.png', 'image'))).toBe('low');
    expect(getErrorSeverity(new UnsupportedFormatError('/test.xyz', 'xyz'))).toBe('medium');
    expect(getErrorSeverity(new ParseError('test', new Error('original'), 'data'))).toBe('medium');
    expect(getErrorSeverity(new ValidationError('test', 'schema'))).toBe('medium');
    expect(getErrorSeverity(new FileAccessError('/test.png', 'read', new Error('access')))).toBe('high');
    expect(getErrorSeverity(new ExternalCommandError('cmd', [], 1, 'stderr'))).toBe('high');
    expect(getErrorSeverity(new Error('generic error'))).toBe('critical');
  });
});

describe('formatErrorMessage', () => {
  it('should format ExtractionError with file path', () => {
    const error = new ExtractionError('Test error', 'TEST', '/test/file.png');
    expect(formatErrorMessage(error)).toBe('Test error (/test/file.png)');
  });

  it('should format ExtractionError without file path', () => {
    const error = new ExtractionError('Test error', 'TEST');
    expect(formatErrorMessage(error)).toBe('Test error');
  });

  it('should format regular Error', () => {
    const error = new Error('Regular error');
    expect(formatErrorMessage(error)).toBe('Regular error');
  });
});