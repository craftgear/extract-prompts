import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractFromJPEG } from './jpeg';

// Mock dependencies
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn()
  }))
}));

vi.mock('exifr', () => ({
  default: {
    parse: vi.fn()
  }
}));

vi.mock('../../utils/validation', () => ({
  validateComfyUIWorkflow: vi.fn()
}));

vi.mock('../../utils/encoding', () => ({
  decodeUTF16FromBytes: vi.fn(),
  extractBytesFromObject: vi.fn(),
  extractJSONFromText: vi.fn(),
  isA1111Parameters: vi.fn()
}));

vi.mock('../../utils/parameters', () => ({
  parseA1111Parameters: vi.fn()
}));

import sharp from 'sharp';
import exifr from 'exifr';
import { validateComfyUIWorkflow } from '../../utils/validation';
import { 
  decodeUTF16FromBytes, 
  extractBytesFromObject, 
  extractJSONFromText, 
  isA1111Parameters 
} from '../../utils/encoding';
import { parseA1111Parameters } from '../../utils/parameters';

describe('extractFromJPEG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  it('should extract ComfyUI workflow from UserComment field', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockExifData = {
      UserComment: JSON.stringify(mockWorkflow)
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(true);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ workflow: mockWorkflow });
    expect(exifr.parse).toHaveBeenCalledWith('/test/image.jpg', expect.any(Object));
  });

  it('should extract A1111 parameters from ImageDescription', async () => {
    const mockParameters = 'beautiful landscape, masterpiece\nSteps: 20, CFG scale: 7.5';
    const mockParsedParams = { positive_prompt: 'beautiful landscape, masterpiece', steps: '20', cfg: '7.5' };
    const mockExifData = {
      ImageDescription: mockParameters
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(false);
    vi.mocked(extractJSONFromText).mockReturnValue([]);
    vi.mocked(isA1111Parameters).mockReturnValue(true);
    vi.mocked(parseA1111Parameters).mockReturnValue(mockParsedParams);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ parameters: mockParsedParams });
    expect(isA1111Parameters).toHaveBeenCalledWith(mockParameters);
    expect(parseA1111Parameters).toHaveBeenCalledWith(mockParameters);
  });

  it('should process UTF-16 encoded UserComment field', async () => {
    const mockUserComment = { 0: 85, 1: 78, 2: 73, 3: 67, 4: 79, 5: 68, 6: 69, 7: 0, 8: 0, 9: 72, 10: 101 };
    const mockDecodedComment = 'beautiful landscape, masterpiece\nSteps: 20';
    const mockParsedParams = { positive_prompt: 'beautiful landscape, masterpiece', steps: '20' };
    const mockExifData = {
      userComment: mockUserComment
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(extractBytesFromObject).mockReturnValue([85, 78, 73, 67, 79, 68, 69, 0, 0, 72, 101]);
    vi.mocked(decodeUTF16FromBytes).mockReturnValue(mockDecodedComment);
    vi.mocked(isA1111Parameters).mockReturnValue(true);
    vi.mocked(parseA1111Parameters).mockReturnValue(mockParsedParams);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(false);
    vi.mocked(extractJSONFromText).mockReturnValue([]);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ 
      parameters: mockParsedParams,
      raw_parameters: mockDecodedComment
    });
    expect(extractBytesFromObject).toHaveBeenCalledWith(mockUserComment);
    expect(decodeUTF16FromBytes).toHaveBeenCalled();
  });

  it('should extract workflow from JSON pattern in text', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockExifData = {
      userComment: 'workflow: ' + JSON.stringify(mockWorkflow)
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(false);
    vi.mocked(extractJSONFromText).mockReturnValue([]);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ metadata: 'workflow: ' + JSON.stringify(mockWorkflow) });
  });

  it('should try multiple EXIF fields for ComfyUI data', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockExifData = {
      Software: 'not json',
      Artist: 'also not json',
      XPComment: JSON.stringify(mockWorkflow)
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    // For failed direct parses, extractJSONFromText is called
    vi.mocked(extractJSONFromText)
      .mockReturnValueOnce([]) // Software - no JSON found
      .mockReturnValueOnce([]); // Artist - no JSON found
    // XPComment direct parse should succeed
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(true);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ workflow: mockWorkflow });
  });

  it('should fallback to Sharp when exifr fails', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({
        exif: Buffer.from(JSON.stringify(mockWorkflow))
      })
    };

    vi.clearAllMocks(); // Clear any previous mock states
    vi.mocked(exifr.parse).mockRejectedValue(new Error('EXIF parsing failed'));
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);
    vi.mocked(extractJSONFromText).mockReturnValue([JSON.stringify(mockWorkflow)]);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(true);

    const result = await extractFromJPEG('/test/image.jpg');

    // Check that Sharp was called as a fallback
    expect(sharp).toHaveBeenCalledWith('/test/image.jpg');
    expect(mockSharpInstance.metadata).toHaveBeenCalled();
    
    // Verify the result
    expect(result).toEqual({ workflow: mockWorkflow });
  });

  it('should handle string UserComment field', async () => {
    const mockWorkflow = { nodes: [], links: [] };
    const mockText = 'workflow: ' + JSON.stringify(mockWorkflow);
    const mockExifData = {
      userComment: mockText
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(validateComfyUIWorkflow).mockReturnValue(false);
    vi.mocked(extractJSONFromText).mockReturnValue([]);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ metadata: mockText });
  });

  it('should store non-JSON user comment as metadata', async () => {
    const mockComment = 'This is a regular comment';
    const mockExifData = {
      userComment: mockComment
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ user_comment: mockComment });
  });

  it('should handle workflow/prompt keywords in user comment', async () => {
    const mockComment = 'workflow data here';
    const mockExifData = {
      userComment: mockComment
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(isA1111Parameters).mockReturnValue(false);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toEqual({ metadata: mockComment });
  });

  it('should return null when no metadata is found', async () => {
    vi.mocked(exifr.parse).mockResolvedValue(null);
    
    const mockSharpInstance = {
      metadata: vi.fn().mockResolvedValue({ exif: null })
    };
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toBeNull();
  });

  it('should return null when both exifr and Sharp fail', async () => {
    vi.mocked(exifr.parse).mockRejectedValue(new Error('EXIF parsing failed'));
    
    const mockSharpInstance = {
      metadata: vi.fn().mockRejectedValue(new Error('Sharp failed'))
    };
    vi.mocked(sharp).mockReturnValue(mockSharpInstance as any);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toBeNull();
  });

  it('should handle empty EXIF data', async () => {
    const mockExifData = {};

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toBeNull();
  });

  it('should skip short byte arrays in UserComment', async () => {
    const mockExifData = {
      userComment: { 0: 1, 1: 2, 2: 3 } // Too short
    };

    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);
    vi.mocked(extractBytesFromObject).mockReturnValue([1, 2, 3]);

    const result = await extractFromJPEG('/test/image.jpg');

    expect(result).toBeNull();
    expect(decodeUTF16FromBytes).not.toHaveBeenCalled();
  });

  it('should use correct exifr options', async () => {
    const mockExifData = {};
    vi.mocked(exifr.parse).mockResolvedValue(mockExifData);

    await extractFromJPEG('/test/image.jpg');

    expect(exifr.parse).toHaveBeenCalledWith('/test/image.jpg', {
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