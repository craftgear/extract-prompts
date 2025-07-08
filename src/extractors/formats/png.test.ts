import { describe, it, expect, vi } from 'vitest';
import { 
  extractFromPNG, 
  validatePngSignature, 
  parsePngTextChunks, 
  findTextChunk 
} from './png.js';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  readFile: vi.fn()
}));

describe('PNG Extractor', () => {
  describe('validatePngSignature', () => {
    it('should validate correct PNG signature', () => {
      const validPngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const buffer = Buffer.concat([validPngSignature, Buffer.from('test data')]);
      
      expect(validatePngSignature(buffer)).toBe(true);
    });

    it('should reject invalid PNG signature', () => {
      const invalidSignature = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      
      expect(validatePngSignature(invalidSignature)).toBe(false);
    });

    it('should reject buffer too short for signature', () => {
      const shortBuffer = Buffer.from([0x89, 0x50]);
      
      expect(validatePngSignature(shortBuffer)).toBe(false);
    });
  });

  describe('findTextChunk', () => {
    it('should find existing chunk by keyword', () => {
      const chunks = [
        { keyword: 'parameters', text: 'test parameters' },
        { keyword: 'workflow', text: 'test workflow' }
      ];
      
      expect(findTextChunk(chunks, 'parameters')).toBe('test parameters');
      expect(findTextChunk(chunks, 'workflow')).toBe('test workflow');
    });

    it('should return null for non-existing chunk', () => {
      const chunks = [
        { keyword: 'parameters', text: 'test parameters' }
      ];
      
      expect(findTextChunk(chunks, 'nonexistent')).toBeNull();
    });
  });

  describe('extractFromPNG', () => {
    it('should return null for non-existent files', async () => {
      const fs = await import('fs/promises');
      const mockReadFile = fs.readFile as any;
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const result = await extractFromPNG('nonexistent.png');
      expect(result).toBeNull();
    });

    it('should extract A1111 parameters from PNG text chunks', async () => {
      const fs = await import('fs/promises');
      const mockReadFile = fs.readFile as any;
      
      // Create a minimal PNG buffer with tEXt chunk containing A1111 parameters
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const parametersText = 'beautiful landscape\\nNegative prompt: ugly\\nSteps: 30, CFG scale: 7.5';
      const keyword = 'parameters';
      const textData = Buffer.concat([
        Buffer.from(keyword, 'utf8'),
        Buffer.from([0]), // null terminator
        Buffer.from(parametersText, 'utf8')
      ]);
      
      // Create tEXt chunk: length + type + data + crc
      const chunkLength = Buffer.alloc(4);
      chunkLength.writeUInt32BE(textData.length, 0);
      const chunkType = Buffer.from([0x74, 0x45, 0x58, 0x74]); // 'tEXt'
      const chunkCrc = Buffer.alloc(4); // dummy CRC
      
      const pngBuffer = Buffer.concat([
        pngSignature,
        chunkLength,
        chunkType,
        textData,
        chunkCrc
      ]);
      
      mockReadFile.mockResolvedValue(pngBuffer);

      const result = await extractFromPNG('test.png');
      
      expect(result).toBeDefined();
      expect(result?.parameters).toBeDefined();
      expect(result?.raw_parameters).toBe(parametersText);
    });

    it('should extract ComfyUI workflow from PNG text chunks', async () => {
      const fs = await import('fs/promises');
      const mockReadFile = fs.readFile as any;
      
      // Create a minimal PNG buffer with tEXt chunk containing ComfyUI workflow
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const workflowJson = JSON.stringify({
        '1': { class_type: 'CheckpointLoaderSimple', inputs: {} },
        '2': { class_type: 'CLIPTextEncode', inputs: { text: 'test prompt' } }
      });
      const keyword = 'workflow';
      const textData = Buffer.concat([
        Buffer.from(keyword, 'utf8'),
        Buffer.from([0]), // null terminator
        Buffer.from(workflowJson, 'utf8')
      ]);
      
      // Create tEXt chunk: length + type + data + crc
      const chunkLength = Buffer.alloc(4);
      chunkLength.writeUInt32BE(textData.length, 0);
      const chunkType = Buffer.from([0x74, 0x45, 0x58, 0x74]); // 'tEXt'
      const chunkCrc = Buffer.alloc(4); // dummy CRC
      
      const pngBuffer = Buffer.concat([
        pngSignature,
        chunkLength,
        chunkType,
        textData,
        chunkCrc
      ]);
      
      mockReadFile.mockResolvedValue(pngBuffer);

      const result = await extractFromPNG('test.png');
      
      expect(result).toBeDefined();
      expect(result?.workflow).toBeDefined();
      expect((result?.workflow as any)['1']).toBeDefined();
      expect((result?.workflow as any)['1'].class_type).toBe('CheckpointLoaderSimple');
    });

    it('should return null when no relevant text chunks are found', async () => {
      const fs = await import('fs/promises');
      const mockReadFile = fs.readFile as any;
      
      // Create a minimal PNG buffer with no tEXt chunks
      const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      
      mockReadFile.mockResolvedValue(pngSignature);

      const result = await extractFromPNG('test.png');
      
      expect(result).toBeNull();
    });

    it('should handle invalid PNG signature', async () => {
      const fs = await import('fs/promises');
      const mockReadFile = fs.readFile as any;
      
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07]);
      mockReadFile.mockResolvedValue(invalidBuffer);

      await expect(extractFromPNG('invalid.png')).rejects.toThrow('PNG extraction failed');
    });
  });
});