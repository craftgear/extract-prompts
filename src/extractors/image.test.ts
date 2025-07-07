import { describe, it, expect, vi } from 'vitest';
import { extractFromImage } from './image';
import sharp from 'sharp';

// Mock sharp
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn()
  }))
}));

describe('extractFromImage', () => {
  it('should return null for files without metadata', async () => {
    const result = await extractFromImage('test.png');
    expect(result).toBeNull();
  });

  it('should throw error for unsupported formats', async () => {
    const mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ exif: Buffer.from('test') })
    });

    await expect(extractFromImage('test.gif')).rejects.toThrow('Unsupported file format: gif. Supported formats: png, jpg, jpeg, webp');
  });

  it('should handle PNG files', async () => {
    const mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ 
        exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
      })
    });

    const result = await extractFromImage('test.png');
    expect(result).toBeDefined();
  });

  it('should handle JPEG files', async () => {
    const mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ 
        exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
      })
    });

    const result = await extractFromImage('test.jpg');
    expect(result).toBeDefined();
  });

  it('should handle JPEG files with jpeg extension', async () => {
    const mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ 
        exif: Buffer.from(JSON.stringify({ '1': { class_type: 'TestNode' } }))
      })
    });

    const result = await extractFromImage('test.jpeg');
    expect(result).toBeDefined();
  });

  it('should return null when no valid workflow is found', async () => {
    const mockSharp = sharp as any;
    mockSharp.mockReturnValue({
      metadata: vi.fn().mockResolvedValue({ 
        exif: Buffer.from('invalid json data')
      })
    });

    const result = await extractFromImage('test.png');
    expect(result).toBeNull();
  });
});