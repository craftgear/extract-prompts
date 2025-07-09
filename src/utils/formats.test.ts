import { describe, it, expect } from 'vitest';
import {
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS,
  MIME_TYPE_MAPPING,
  EXTENSION_TO_MIME,
  FILE_SIGNATURES,
  METADATA_KEYWORDS,
  A1111_PARAMETER_PATTERNS,
  getFileExtension,
  getFormatType,
  isImageFormat,
  isVideoFormat,
  isPngFormat,
  isJpegFormat,
  isWebpFormat,
  detectFormatFromSignature,
  getMimeType,
  containsA1111Parameters,
  containsComfyUIWorkflow,
  isMetadataKeyword,
  validateFormat,
  isSupportedFormat,
  normalizeExifFieldName
} from './formats';

describe('Constants', () => {
  it('should have correct supported image formats', () => {
    expect(SUPPORTED_IMAGE_FORMATS.PNG).toBe('png');
    expect(SUPPORTED_IMAGE_FORMATS.JPEG).toBe('jpeg');
    expect(SUPPORTED_IMAGE_FORMATS.JPG).toBe('jpg');
    expect(SUPPORTED_IMAGE_FORMATS.WEBP).toBe('webp');
  });

  it('should have correct supported video formats', () => {
    expect(SUPPORTED_VIDEO_FORMATS.MP4).toBe('mp4');
    expect(SUPPORTED_VIDEO_FORMATS.WEBM).toBe('webm');
    expect(SUPPORTED_VIDEO_FORMATS.AVI).toBe('avi');
    expect(SUPPORTED_VIDEO_FORMATS.MOV).toBe('mov');
  });

  it('should have valid MIME type mappings', () => {
    expect(MIME_TYPE_MAPPING['image/png']).toBe('png');
    expect(MIME_TYPE_MAPPING['video/mp4']).toBe('mp4');
    expect(MIME_TYPE_MAPPING['video/quicktime']).toBe('mov');
  });

  it('should have valid extension to MIME mappings', () => {
    expect(EXTENSION_TO_MIME['.png']).toBe('image/png');
    expect(EXTENSION_TO_MIME['.jpg']).toBe('image/jpeg');
    expect(EXTENSION_TO_MIME['.mp4']).toBe('video/mp4');
  });

  it('should have correct file signatures', () => {
    expect(FILE_SIGNATURES.PNG).toEqual([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    expect(FILE_SIGNATURES.JPEG).toEqual([0xFF, 0xD8, 0xFF]);
    expect(FILE_SIGNATURES.WEBP).toEqual([0x52, 0x49, 0x46, 0x46]);
  });

  it('should contain expected metadata keywords', () => {
    expect(METADATA_KEYWORDS).toContain('workflow');
    expect(METADATA_KEYWORDS).toContain('prompt');
    expect(METADATA_KEYWORDS).toContain('ComfyUI');
    expect(METADATA_KEYWORDS).toContain('steps');
  });

  it('should have valid A1111 parameter patterns', () => {
    expect(A1111_PARAMETER_PATTERNS.steps.test('Steps: 20')).toBe(true);
    expect(A1111_PARAMETER_PATTERNS.cfg.test('CFG scale: 7.5')).toBe(true);
    expect(A1111_PARAMETER_PATTERNS.sampler.test('Sampler: DPM++ 2M')).toBe(true);
  });
});

describe('getFileExtension', () => {
  it('should extract file extension correctly', () => {
    expect(getFileExtension('image.png')).toBe('.png');
    expect(getFileExtension('video.mp4')).toBe('.mp4');
    expect(getFileExtension('/path/to/file.JPEG')).toBe('.jpeg');
  });

  it('should handle files without extension', () => {
    expect(getFileExtension('filename')).toBe('');
    expect(getFileExtension('/path/to/filename')).toBe('');
  });

  it('should handle multiple dots', () => {
    expect(getFileExtension('file.backup.png')).toBe('.png');
    expect(getFileExtension('archive.tar.gz')).toBe('.gz');
  });

  it('should handle hidden files', () => {
    expect(getFileExtension('.gitignore')).toBe('.gitignore');
    expect(getFileExtension('.env.local')).toBe('.local');
  });

  it('should return lowercase extension', () => {
    expect(getFileExtension('IMAGE.PNG')).toBe('.png');
    expect(getFileExtension('VIDEO.MP4')).toBe('.mp4');
  });
});

describe('getFormatType', () => {
  it('should detect image formats', () => {
    expect(getFormatType('image.png')).toBe('image');
    expect(getFormatType('photo.jpg')).toBe('image');
    expect(getFormatType('picture.jpeg')).toBe('image');
    expect(getFormatType('graphic.webp')).toBe('image');
  });

  it('should detect video formats', () => {
    expect(getFormatType('video.mp4')).toBe('video');
    expect(getFormatType('movie.webm')).toBe('video');
    expect(getFormatType('clip.mov')).toBe('video');
    expect(getFormatType('film.avi')).toBe('video');
  });

  it('should return unknown for unsupported formats', () => {
    expect(getFormatType('document.txt')).toBe('unknown');
    expect(getFormatType('archive.zip')).toBe('unknown');
    expect(getFormatType('file')).toBe('unknown');
  });

  it('should handle case insensitivity', () => {
    expect(getFormatType('IMAGE.PNG')).toBe('image');
    expect(getFormatType('VIDEO.MP4')).toBe('video');
  });
});

describe('isImageFormat', () => {
  it('should identify image formats', () => {
    expect(isImageFormat('test.png')).toBe(true);
    expect(isImageFormat('test.jpg')).toBe(true);
    expect(isImageFormat('test.jpeg')).toBe(true);
    expect(isImageFormat('test.webp')).toBe(true);
  });

  it('should reject non-image formats', () => {
    expect(isImageFormat('test.mp4')).toBe(false);
    expect(isImageFormat('test.txt')).toBe(false);
    expect(isImageFormat('test')).toBe(false);
  });

  it('should handle case insensitivity', () => {
    expect(isImageFormat('TEST.PNG')).toBe(true);
    expect(isImageFormat('image.JPEG')).toBe(true);
  });
});

describe('isVideoFormat', () => {
  it('should identify video formats', () => {
    expect(isVideoFormat('test.mp4')).toBe(true);
    expect(isVideoFormat('test.webm')).toBe(true);
    expect(isVideoFormat('test.mov')).toBe(true);
    expect(isVideoFormat('test.avi')).toBe(true);
  });

  it('should reject non-video formats', () => {
    expect(isVideoFormat('test.png')).toBe(false);
    expect(isVideoFormat('test.txt')).toBe(false);
    expect(isVideoFormat('test')).toBe(false);
  });

  it('should handle case insensitivity', () => {
    expect(isVideoFormat('TEST.MP4')).toBe(true);
    expect(isVideoFormat('video.WEBM')).toBe(true);
  });
});

describe('isPngFormat', () => {
  it('should identify PNG files', () => {
    expect(isPngFormat('image.png')).toBe(true);
    expect(isPngFormat('IMAGE.PNG')).toBe(true);
  });

  it('should reject non-PNG files', () => {
    expect(isPngFormat('image.jpg')).toBe(false);
    expect(isPngFormat('video.mp4')).toBe(false);
    expect(isPngFormat('file.txt')).toBe(false);
  });
});

describe('isJpegFormat', () => {
  it('should identify JPEG files', () => {
    expect(isJpegFormat('image.jpg')).toBe(true);
    expect(isJpegFormat('image.jpeg')).toBe(true);
    expect(isJpegFormat('IMAGE.JPG')).toBe(true);
  });

  it('should reject non-JPEG files', () => {
    expect(isJpegFormat('image.png')).toBe(false);
    expect(isJpegFormat('video.mp4')).toBe(false);
    expect(isJpegFormat('file.txt')).toBe(false);
  });
});

describe('isWebpFormat', () => {
  it('should identify WebP files', () => {
    expect(isWebpFormat('image.webp')).toBe(true);
    expect(isWebpFormat('IMAGE.WEBP')).toBe(true);
  });

  it('should reject non-WebP files', () => {
    expect(isWebpFormat('image.png')).toBe(false);
    expect(isWebpFormat('video.mp4')).toBe(false);
    expect(isWebpFormat('file.txt')).toBe(false);
  });
});

describe('detectFormatFromSignature', () => {
  it('should detect PNG signature', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00]);
    expect(detectFormatFromSignature(pngBuffer)).toBe('PNG');
  });

  it('should detect JPEG signature', () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
    expect(detectFormatFromSignature(jpegBuffer)).toBe('JPEG');
  });

  it('should detect WebP signature', () => {
    const webpBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
    expect(detectFormatFromSignature(webpBuffer)).toBe('WEBP');
  });

  it('should detect MP4 signature', () => {
    const mp4Buffer = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    expect(detectFormatFromSignature(mp4Buffer)).toBe('MP4');
  });

  it('should detect WebM signature', () => {
    const webmBuffer = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0x00, 0x00]);
    expect(detectFormatFromSignature(webmBuffer)).toBe('WEBM');
  });

  it('should return unknown for short buffers', () => {
    const shortBuffer = Buffer.from([0x89, 0x50]);
    expect(detectFormatFromSignature(shortBuffer)).toBe('unknown');
  });

  it('should return unknown for unrecognized signatures', () => {
    const unknownBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x9A, 0xBC, 0xDE, 0xF0]);
    expect(detectFormatFromSignature(unknownBuffer)).toBe('unknown');
  });
});

describe('getMimeType', () => {
  it('should return correct MIME types for images', () => {
    expect(getMimeType('image.png')).toBe('image/png');
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('picture.jpeg')).toBe('image/jpeg');
    expect(getMimeType('graphic.webp')).toBe('image/webp');
  });

  it('should return correct MIME types for videos', () => {
    expect(getMimeType('video.mp4')).toBe('video/mp4');
    expect(getMimeType('movie.webm')).toBe('video/webm');
    expect(getMimeType('clip.mov')).toBe('video/quicktime');
    expect(getMimeType('film.avi')).toBe('video/avi');
  });

  it('should return default MIME type for unknown extensions', () => {
    expect(getMimeType('file.txt')).toBe('application/octet-stream');
    expect(getMimeType('unknown.xyz')).toBe('application/octet-stream');
    expect(getMimeType('noextension')).toBe('application/octet-stream');
  });
});

describe('containsA1111Parameters', () => {
  it('should detect A1111 parameters', () => {
    expect(containsA1111Parameters('Steps: 20')).toBe(true);
    expect(containsA1111Parameters('CFG scale: 7.5')).toBe(true);
    expect(containsA1111Parameters('Sampler: DPM++ 2M')).toBe(true);
    expect(containsA1111Parameters('prompt\nSteps: 30, CFG scale: 8')).toBe(true);
  });

  it('should not detect A1111 parameters in normal text', () => {
    expect(containsA1111Parameters('just normal text')).toBe(false);
    expect(containsA1111Parameters('{"workflow": {}}')).toBe(false);
    expect(containsA1111Parameters('')).toBe(false);
  });

  it('should handle case sensitivity', () => {
    expect(containsA1111Parameters('steps: 20')).toBe(false); // Should be false as it looks for exact case
    expect(containsA1111Parameters('Steps: 20')).toBe(true);
  });
});

describe('containsComfyUIWorkflow', () => {
  it('should detect ComfyUI workflow indicators', () => {
    expect(containsComfyUIWorkflow('workflow data')).toBe(true);
    expect(containsComfyUIWorkflow('ComfyUI generated')).toBe(true);
    expect(containsComfyUIWorkflow('comfyui workflow')).toBe(true);
    expect(containsComfyUIWorkflow('{"workflow": {}}')).toBe(true);
  });

  it('should not detect ComfyUI in normal text', () => {
    expect(containsComfyUIWorkflow('Steps: 20, CFG scale: 7')).toBe(false);
    expect(containsComfyUIWorkflow('just normal text')).toBe(false);
    expect(containsComfyUIWorkflow('')).toBe(false);
  });
});

describe('isMetadataKeyword', () => {
  it('should identify metadata keywords', () => {
    expect(isMetadataKeyword('workflow')).toBe(true);
    expect(isMetadataKeyword('prompt')).toBe(true);
    expect(isMetadataKeyword('ComfyUI')).toBe(true);
    expect(isMetadataKeyword('steps')).toBe(true);
    expect(isMetadataKeyword('sampler')).toBe(true);
  });

  it('should reject non-metadata keywords', () => {
    expect(isMetadataKeyword('random')).toBe(false);
    expect(isMetadataKeyword('text')).toBe(false);
    expect(isMetadataKeyword('invalid')).toBe(false);
    expect(isMetadataKeyword('')).toBe(false);
  });

  it('should be case sensitive', () => {
    expect(isMetadataKeyword('WORKFLOW')).toBe(false);
    expect(isMetadataKeyword('comfyui')).toBe(true);
    expect(isMetadataKeyword('ComfyUI')).toBe(true);
  });
});

describe('validateFormat', () => {
  it('should validate format with buffer signature', () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const result = validateFormat('image.png', pngBuffer);
    
    expect(result.isValid).toBe(true);
    expect(result.detectedFormat).toBe('PNG');
    expect(result.expectedFormat).toBe('PNG');
    expect(result.mismatch).toBe(false);
  });

  it('should detect format mismatch', () => {
    const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const result = validateFormat('image.png', jpegBuffer);
    
    expect(result.isValid).toBe(true);
    expect(result.detectedFormat).toBe('JPEG');
    expect(result.expectedFormat).toBe('PNG');
    expect(result.mismatch).toBe(true);
  });

  it('should validate without buffer', () => {
    const result = validateFormat('image.png');
    
    expect(result.isValid).toBe(true);
    expect(result.detectedFormat).toBe('PNG');
    expect(result.expectedFormat).toBe('PNG');
    expect(result.mismatch).toBe(false);
  });

  it('should handle unknown formats', () => {
    const unknownBuffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
    const result = validateFormat('file.txt', unknownBuffer);
    
    expect(result.isValid).toBe(false);
    expect(result.detectedFormat).toBe('unknown');
    expect(result.expectedFormat).toBe('TXT');
    expect(result.mismatch).toBe(false);
  });

  it('should handle unsupported file extensions', () => {
    const result = validateFormat('document.txt');
    
    expect(result.isValid).toBe(false);
    expect(result.detectedFormat).toBe('TXT');
    expect(result.expectedFormat).toBe('TXT');
    expect(result.mismatch).toBe(false);
  });
});

describe('isSupportedFormat', () => {
  it('should identify supported image formats', () => {
    expect(isSupportedFormat('image.png')).toBe(true);
    expect(isSupportedFormat('photo.jpg')).toBe(true);
    expect(isSupportedFormat('picture.webp')).toBe(true);
  });

  it('should identify supported video formats', () => {
    expect(isSupportedFormat('video.mp4')).toBe(true);
    expect(isSupportedFormat('movie.webm')).toBe(true);
    expect(isSupportedFormat('clip.mov')).toBe(true);
  });

  it('should reject unsupported formats', () => {
    expect(isSupportedFormat('document.txt')).toBe(false);
    expect(isSupportedFormat('archive.zip')).toBe(false);
    expect(isSupportedFormat('file')).toBe(false);
  });
});

describe('normalizeExifFieldName', () => {
  it('should normalize common EXIF field names', () => {
    expect(normalizeExifFieldName('usercomment')).toBe('UserComment');
    expect(normalizeExifFieldName('USERCOMMENT')).toBe('UserComment');
    expect(normalizeExifFieldName('imagedescription')).toBe('ImageDescription');
    expect(normalizeExifFieldName('software')).toBe('Software');
  });

  it('should preserve unknown field names', () => {
    expect(normalizeExifFieldName('CustomField')).toBe('CustomField');
    expect(normalizeExifFieldName('unknownfield')).toBe('unknownfield');
  });

  it('should handle case variations', () => {
    expect(normalizeExifFieldName('XPCOMMENT')).toBe('XPComment');
    expect(normalizeExifFieldName('xpkeywords')).toBe('XPKeywords');
    expect(normalizeExifFieldName('Artist')).toBe('Artist');
  });

  it('should handle empty string', () => {
    expect(normalizeExifFieldName('')).toBe('');
  });
});

describe('A1111_PARAMETER_PATTERNS', () => {
  it('should match Steps parameter', () => {
    const match = 'Steps: 25'.match(A1111_PARAMETER_PATTERNS.steps);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('25');
  });

  it('should match CFG scale parameter', () => {
    const match = 'CFG scale: 7.5'.match(A1111_PARAMETER_PATTERNS.cfg);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('7.5');
  });

  it('should match Sampler parameter', () => {
    const match = 'Sampler: DPM++ 2M Karras'.match(A1111_PARAMETER_PATTERNS.sampler);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('DPM++ 2M Karras');
  });

  it('should match Seed parameter', () => {
    const match = 'Seed: 1234567890'.match(A1111_PARAMETER_PATTERNS.seed);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('1234567890');
  });

  it('should match Size parameter', () => {
    const match = 'Size: 512x768'.match(A1111_PARAMETER_PATTERNS.size);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('512x768');
  });

  it('should match Model hash parameter', () => {
    const match = 'Model hash: a1b2c3d4e5f6'.match(A1111_PARAMETER_PATTERNS.hash);
    expect(match).toBeTruthy();
    expect(match![1]).toBe('a1b2c3d4e5f6');
  });

  it('should be case insensitive', () => {
    expect('steps: 20'.match(A1111_PARAMETER_PATTERNS.steps)).toBeTruthy();
    expect('cfg scale: 7'.match(A1111_PARAMETER_PATTERNS.cfg)).toBeTruthy();
    expect('SAMPLER: Test'.match(A1111_PARAMETER_PATTERNS.sampler)).toBeTruthy();
  });
});