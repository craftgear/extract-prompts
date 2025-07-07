import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFromWebP, extractFromWebPAdvanced, getWebPMetadataInfo } from './webp';

// Mock dependencies
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn()
  }))
}));

vi.mock('../../utils/validation', () => ({
  validateComfyUIWorkflow: vi.fn()
}));

vi.mock('../../utils/encoding', () => ({
  extractUTF16TextFromWebP: vi.fn(),
  isA1111Parameters: vi.fn()
}));

vi.mock('../../utils/parameters', () => ({
  parseA1111Parameters: vi.fn()
}));

import sharp from 'sharp';
import { validateComfyUIWorkflow } from '../../utils/validation';
import { extractUTF16TextFromWebP, isA1111Parameters } from '../../utils/encoding';
import { parseA1111Parameters } from '../../utils/parameters';

describe('extractFromWebP', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should extract ComfyUI workflow from WebP EXIF data', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockExifBuffer = Buffer.from('UNICODE' + JSON.stringify(mockWorkflow));
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(JSON.stringify(mockWorkflow));
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(true);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ workflow: mockWorkflow });
    expect(mockSharpInstance.metadata).toHaveBeenCalled();
    expect(extractUTF16TextFromWebP).toHaveBeenCalledWith(mockExifBuffer.toString(), 7);
  });

  it('should extract A1111 parameters from WebP EXIF data', async () => {
    const mockParameters = 'beautiful landscape, masterpiece\nNegative prompt: blur, distorted';
    const mockParsedParams = { 
      positive_prompt: 'beautiful landscape, masterpiece',
      negative_prompt: 'blur, distorted'
    };
    const mockExifBuffer = Buffer.from('UNICODE' + mockParameters);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockParameters);
    vi.mocked(isA1111Parameters).mockReturnValue(true);
    vi.mocked(parseA1111Parameters).mockReturnValue(mockParsedParams);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ 
      parameters: mockParsedParams,
      raw_parameters: mockParameters
    });
    expect(isA1111Parameters).toHaveBeenCalledWith(mockParameters);
    expect(parseA1111Parameters).toHaveBeenCalledWith(mockParameters);
  });

  it('should handle text containing workflow keywords', async () => {
    const mockText = 'workflow data here';
    const mockExifBuffer = Buffer.from('UNICODE' + mockText);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockText);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ metadata: mockText });
  });

  it('should handle text containing prompt keywords', async () => {
    const mockText = 'prompt data here';
    const mockExifBuffer = Buffer.from('UNICODE' + mockText);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockText);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ metadata: mockText });
  });

  it('should store regular text as user comment', async () => {
    const mockText = 'This is a regular comment';
    const mockExifBuffer = Buffer.from('UNICODE' + mockText);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockText);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ user_comment: mockText });
  });

  it('should handle invalid JSON in workflow/prompt text', async () => {
    const mockText = 'workflow invalid json {';
    const mockExifBuffer = Buffer.from('UNICODE' + mockText);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockText);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ metadata: mockText });
  });

  it('should handle valid JSON that is not a ComfyUI workflow', async () => {
    const mockText = 'workflow {"not": "comfyui"}';
    const mockExifBuffer = Buffer.from('UNICODE' + mockText);
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(mockText);
    vi.mocked(isA1111Parameters).mockReturnValue(false);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(false);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toEqual({ metadata: mockText });
  });

  it('should return null when no EXIF data is found', async () => {
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: null
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toBeNull();
  });

  it('should return null when no UNICODE marker is found', async () => {
    const mockExifBuffer = Buffer.from('No unicode marker here');
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toBeNull();
  });

  it('should return null when extractUTF16TextFromWebP returns empty text', async () => {
    const mockExifBuffer = Buffer.from('UNICODE');
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue('');

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toBeNull();
  });

  it('should handle Sharp errors gracefully', async () => {
    const mockSharpInstance = {
      metadata: vi.fn().mockRejectedValue(new Error('Sharp failed'))
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await extractFromWebP('/test/image.webp');

    expect(result).toBeNull();
  });
});

describe('extractFromWebPAdvanced', () => {
  it('should delegate to extractFromWebP', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockExifBuffer = Buffer.from('UNICODE' + JSON.stringify(mockWorkflow));
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractUTF16TextFromWebP).mockReturnValue(JSON.stringify(mockWorkflow));
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(true);

    const result = await extractFromWebPAdvanced('/test/image.webp');

    expect(result).toEqual({ workflow: mockWorkflow });
  });
});

describe('getWebPMetadataInfo', () => {
  it('should return metadata information with EXIF', async () => {
    const mockExifBuffer = Buffer.from('test exif data');
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: mockExifBuffer,
        format: 'webp',
        width: 1024,
        height: 768
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await getWebPMetadataInfo('/test/image.webp');

    expect(result).toEqual({
      hasExif: true,
      exifSize: mockExifBuffer.length,
      format: 'webp',
      width: 1024,
      height: 768
    });
  });

  it('should return metadata information without EXIF', async () => {
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: null,
        format: 'webp',
        width: 512,
        height: 512
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await getWebPMetadataInfo('/test/image.webp');

    expect(result).toEqual({
      hasExif: false,
      exifSize: undefined,
      format: 'webp',
      width: 512,
      height: 512
    });
  });

  it('should handle missing format information', async () => {
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: null,
        format: undefined,
        width: 256,
        height: 256
      })
    };

    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await getWebPMetadataInfo('/test/image.webp');

    expect(result).toEqual({
      hasExif: false,
      exifSize: undefined,
      format: 'webp',
      width: 256,
      height: 256
    });
  });
});