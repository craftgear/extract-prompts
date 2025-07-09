import { describe, it, expect } from 'vitest';
import {
  extractPngTextChunks,
  findJsonInBinary,
  parseExifData,
  BinaryParser,
  PNG_CHUNK_TYPES,
  type PngChunk
} from './binary';

describe('PNG_CHUNK_TYPES', () => {
  it('should have correct chunk type constants', () => {
    expect(PNG_CHUNK_TYPES.TEXT).toBe(0x74455874); // 'tEXt'
    expect(PNG_CHUNK_TYPES.ZTXT).toBe(0x7A545874); // 'zTXt'
    expect(PNG_CHUNK_TYPES.ITXT).toBe(0x69545874); // 'iTXt'
    expect(PNG_CHUNK_TYPES.IHDR).toBe(0x49484452); // 'IHDR'
    expect(PNG_CHUNK_TYPES.IDAT).toBe(0x49444154); // 'IDAT'
    expect(PNG_CHUNK_TYPES.IEND).toBe(0x49454E44); // 'IEND'
  });
});

describe('extractPngTextChunks', () => {
  it('should extract tEXt chunks from PNG buffer', () => {
    // Create a minimal PNG buffer with PNG signature and a tEXt chunk
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // tEXt chunk: length(4) + type(4) + data + crc(4)
    const chunkLength = Buffer.alloc(4);
    chunkLength.writeUInt32BE(12, 0); // 12 bytes of data
    
    const chunkType = Buffer.alloc(4);
    chunkType.writeUInt32BE(PNG_CHUNK_TYPES.TEXT, 0);
    
    const chunkData = Buffer.from('keyword\0valu');
    const chunkCrc = Buffer.alloc(4); // Dummy CRC
    
    const pngBuffer = Buffer.concat([
      pngSignature,
      chunkLength,
      chunkType,
      chunkData,
      chunkCrc
    ]);

    const chunks = extractPngTextChunks(pngBuffer);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].length).toBe(12);
    expect(chunks[0].type).toBe('tEXt');
    expect(chunks[0].data.toString()).toBe('keyword\0valu');
    expect(chunks[0].position).toBe(8);
  });

  it('should return empty array for PNG without tEXt chunks', () => {
    // PNG with only signature and IHDR
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    const chunkLength = Buffer.alloc(4);
    chunkLength.writeUInt32BE(13, 0);
    
    const chunkType = Buffer.alloc(4);
    chunkType.writeUInt32BE(PNG_CHUNK_TYPES.IHDR, 0); // Not a tEXt chunk
    
    const chunkData = Buffer.alloc(13);
    const chunkCrc = Buffer.alloc(4);
    
    const pngBuffer = Buffer.concat([
      pngSignature,
      chunkLength,
      chunkType,
      chunkData,
      chunkCrc
    ]);

    const chunks = extractPngTextChunks(pngBuffer);
    expect(chunks).toHaveLength(0);
  });

  it('should handle corrupted PNG buffer gracefully', () => {
    const invalidBuffer = Buffer.from('not a png file');
    const chunks = extractPngTextChunks(invalidBuffer);
    expect(chunks).toHaveLength(0);
  });

  it('should extract multiple tEXt chunks', () => {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // First tEXt chunk
    const chunk1Length = Buffer.alloc(4);
    chunk1Length.writeUInt32BE(9, 0);
    const chunk1Type = Buffer.alloc(4);
    chunk1Type.writeUInt32BE(PNG_CHUNK_TYPES.TEXT, 0);
    const chunk1Data = Buffer.from('key1\0val1');
    const chunk1Crc = Buffer.alloc(4);
    
    // Second tEXt chunk  
    const chunk2Length = Buffer.alloc(4);
    chunk2Length.writeUInt32BE(9, 0);
    const chunk2Type = Buffer.alloc(4);
    chunk2Type.writeUInt32BE(PNG_CHUNK_TYPES.TEXT, 0);
    const chunk2Data = Buffer.from('key2\0val2');
    const chunk2Crc = Buffer.alloc(4);

    const pngBuffer = Buffer.concat([
      pngSignature,
      chunk1Length, chunk1Type, chunk1Data, chunk1Crc,
      chunk2Length, chunk2Type, chunk2Data, chunk2Crc
    ]);

    const chunks = extractPngTextChunks(pngBuffer);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].data.toString()).toBe('key1\0val1');
    expect(chunks[1].data.toString()).toBe('key2\0val2');
  });
});

describe('findJsonInBinary', () => {
  it('should find JSON object in binary data', () => {
    const jsonObject = { test: 'value', number: 42 };
    const jsonString = JSON.stringify(jsonObject);
    const buffer = Buffer.concat([
      Buffer.from('prefix data'),
      Buffer.from(jsonString, 'utf8'),
      Buffer.from('suffix data')
    ]);

    const result = findJsonInBinary(buffer);
    expect(result).toEqual(jsonObject);
  });

  it('should find ComfyUI workflow in binary data', () => {
    const workflow = {
      nodes: [
        { id: 1, type: 'CheckpointLoaderSimple' },
        { id: 2, type: 'CLIPTextEncode' }
      ],
      links: []
    };
    const buffer = Buffer.from(JSON.stringify(workflow), 'utf8');

    const result = findJsonInBinary(buffer);
    expect(result).toEqual(workflow);
  });

  it('should return null for binary data without JSON', () => {
    const buffer = Buffer.from('no json here just plain text');
    const result = findJsonInBinary(buffer);
    expect(result).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    const buffer = Buffer.from('{ "invalid": json, }');
    const result = findJsonInBinary(buffer);
    expect(result).toBeNull();
  });

  it('should handle binary data with multiple JSON-like patterns', () => {
    const validJson = { valid: 'json' };
    const buffer = Buffer.concat([
      Buffer.from('{ invalid json'),
      Buffer.from(JSON.stringify(validJson)),
      Buffer.from('{ another invalid }')
    ]);

    const result = findJsonInBinary(buffer);
    expect(result).toEqual(validJson);
  });

  it('should handle empty buffer', () => {
    const buffer = Buffer.alloc(0);
    const result = findJsonInBinary(buffer);
    expect(result).toBeNull();
  });
});

describe('parseExifData', () => {
  it('should parse basic EXIF data', () => {
    // Create minimal EXIF buffer with Exif header
    const exifHeader = Buffer.from('Exif\0\0');
    const tiffHeader = Buffer.from([
      0x49, 0x49, // Little endian
      0x2A, 0x00, // TIFF magic number
      0x08, 0x00, 0x00, 0x00 // Offset to first IFD
    ]);
    
    // Minimal IFD with 0 entries
    const ifdData = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    
    const exifBuffer = Buffer.concat([exifHeader, tiffHeader, ifdData]);

    const result = parseExifData(exifBuffer);
    expect(result).toBeTypeOf('object');
  });

  it('should return null for invalid EXIF data', () => {
    const invalidBuffer = Buffer.from('not exif data');
    const result = parseExifData(invalidBuffer);
    expect(result).toBeNull();
  });

  it('should return null for empty buffer', () => {
    const emptyBuffer = Buffer.alloc(0);
    const result = parseExifData(emptyBuffer);
    expect(result).toBeNull();
  });

  it('should return null for buffer without Exif header', () => {
    const buffer = Buffer.from('some data without exif header');
    const result = parseExifData(buffer);
    expect(result).toBeNull();
  });
});

describe('BinaryParser', () => {
  describe('constructor and basic properties', () => {
    it('should create parser with correct initial state', () => {
      const buffer = Buffer.from([1, 2, 3, 4]);
      const parser = new BinaryParser(buffer);

      expect(parser.buffer).toBe(buffer);
      expect(parser.position).toBe(0);
      expect(parser.length).toBe(4);
    });

    it('should detect little endian byte order', () => {
      // Little endian marker: 0x4949
      const buffer = Buffer.from([0x49, 0x49, 0x2A, 0x00]);
      const parser = new BinaryParser(buffer);

      expect(parser.isLittleEndian).toBe(true);
    });

    it('should detect big endian byte order', () => {
      // Big endian marker: 0x4D4D
      const buffer = Buffer.from([0x4D, 0x4D, 0x00, 0x2A]);
      const parser = new BinaryParser(buffer);

      expect(parser.isLittleEndian).toBe(false);
    });

    it('should default to little endian for unknown byte order', () => {
      const buffer = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      const parser = new BinaryParser(buffer);

      expect(parser.isLittleEndian).toBe(true);
    });
  });

  describe('readUInt8', () => {
    it('should read 8-bit unsigned integer', () => {
      const buffer = Buffer.from([0xFF, 0x00, 0x80]);
      const parser = new BinaryParser(buffer);

      expect(parser.readUInt8()).toBe(255);
      expect(parser.position).toBe(1);
      expect(parser.readUInt8()).toBe(0);
      expect(parser.position).toBe(2);
      expect(parser.readUInt8()).toBe(128);
      expect(parser.position).toBe(3);
    });

    it('should throw error when reading beyond buffer', () => {
      const buffer = Buffer.from([1]);
      const parser = new BinaryParser(buffer);

      parser.readUInt8(); // Valid read
      expect(() => parser.readUInt8()).toThrow();
    });
  });

  describe('readUInt16', () => {
    it('should read 16-bit unsigned integer in little endian', () => {
      const buffer = Buffer.from([0x49, 0x49, 0x34, 0x12]); // Little endian
      const parser = new BinaryParser(buffer);

      parser.seek(2); // Skip endian marker
      expect(parser.readUInt16()).toBe(0x1234);
      expect(parser.position).toBe(4);
    });

    it('should read 16-bit unsigned integer in big endian', () => {
      const buffer = Buffer.from([0x4D, 0x4D, 0x12, 0x34]); // Big endian
      const parser = new BinaryParser(buffer);

      parser.seek(2); // Skip endian marker  
      expect(parser.readUInt16()).toBe(0x1234);
      expect(parser.position).toBe(4);
    });
  });

  describe('readUInt32', () => {
    it('should read 32-bit unsigned integer in little endian', () => {
      const buffer = Buffer.from([0x49, 0x49, 0x78, 0x56, 0x34, 0x12]); // Little endian
      const parser = new BinaryParser(buffer);

      parser.seek(2);
      expect(parser.readUInt32()).toBe(0x12345678);
      expect(parser.position).toBe(6);
    });

    it('should read 32-bit unsigned integer in big endian', () => {
      const buffer = Buffer.from([0x4D, 0x4D, 0x12, 0x34, 0x56, 0x78]); // Big endian
      const parser = new BinaryParser(buffer);

      parser.seek(2);
      expect(parser.readUInt32()).toBe(0x12345678);
      expect(parser.position).toBe(6);
    });
  });

  describe('readString', () => {
    it('should read null-terminated string', () => {
      const buffer = Buffer.from('hello\0world\0');
      const parser = new BinaryParser(buffer);

      expect(parser.readString()).toBe('hello');
      expect(parser.position).toBe(6);
      expect(parser.readString()).toBe('world');
      expect(parser.position).toBe(12);
    });

    it('should read string of specified length', () => {
      const buffer = Buffer.from('hello world');
      const parser = new BinaryParser(buffer);

      expect(parser.readString(5)).toBe('hello');
      expect(parser.position).toBe(5);
    });

    it('should handle string without null terminator', () => {
      const buffer = Buffer.from('hello');
      const parser = new BinaryParser(buffer);

      expect(parser.readString()).toBe('hello');
      expect(parser.position).toBe(5);
    });
  });

  describe('readBytes', () => {
    it('should read specified number of bytes', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      const parser = new BinaryParser(buffer);

      const bytes = parser.readBytes(3);
      expect(bytes).toEqual(Buffer.from([1, 2, 3]));
      expect(parser.position).toBe(3);
    });

    it('should throw error when reading beyond buffer', () => {
      const buffer = Buffer.from([1, 2]);
      const parser = new BinaryParser(buffer);

      expect(() => parser.readBytes(5)).toThrow();
    });
  });

  describe('seek and position management', () => {
    it('should seek to specified position', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      const parser = new BinaryParser(buffer);

      parser.seek(3);
      expect(parser.position).toBe(3);
      expect(parser.readUInt8()).toBe(4);
    });

    it('should throw error when seeking beyond buffer', () => {
      const buffer = Buffer.from([1, 2, 3]);
      const parser = new BinaryParser(buffer);

      expect(() => parser.seek(5)).toThrow();
    });

    it('should report if at end of buffer', () => {
      const buffer = Buffer.from([1, 2]);
      const parser = new BinaryParser(buffer);

      expect(parser.isAtEnd()).toBe(false);
      parser.seek(2);
      expect(parser.isAtEnd()).toBe(true);
    });

    it('should report remaining bytes', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      const parser = new BinaryParser(buffer);

      expect(parser.remaining()).toBe(5);
      parser.seek(2);
      expect(parser.remaining()).toBe(3);
    });
  });

  describe('slice', () => {
    it('should slice buffer from current position', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      const parser = new BinaryParser(buffer);

      parser.seek(1);
      const slice = parser.slice(3);
      expect(slice).toEqual(Buffer.from([2, 3, 4]));
      expect(parser.position).toBe(1); // Position should not change
    });

    it('should slice buffer with specified start and end', () => {
      const buffer = Buffer.from([1, 2, 3, 4, 5]);
      const parser = new BinaryParser(buffer);

      const slice = parser.slice(1, 4);
      expect(slice).toEqual(Buffer.from([2, 3, 4]));
      expect(parser.position).toBe(0); // Position should not change
    });
  });

  describe('findPattern', () => {
    it('should find pattern in buffer', () => {
      const buffer = Buffer.from('hello world test');
      const parser = new BinaryParser(buffer);
      const pattern = Buffer.from('world');

      const position = parser.findPattern(pattern);
      expect(position).toBe(6);
    });

    it('should return -1 for pattern not found', () => {
      const buffer = Buffer.from('hello world');
      const parser = new BinaryParser(buffer);
      const pattern = Buffer.from('test');

      const position = parser.findPattern(pattern);
      expect(position).toBe(-1);
    });

    it('should find pattern from specified start position', () => {
      const buffer = Buffer.from('test hello test world');
      const parser = new BinaryParser(buffer);
      const pattern = Buffer.from('test');

      const position = parser.findPattern(pattern, 5);
      expect(position).toBe(11);
    });
  });

  describe('extractUTF16Text', () => {
    it('should extract UTF-16 text with UNICODE prefix', () => {
      const unicodePrefix = Buffer.from('UNICODE\0');
      const utf16Text = Buffer.from('hello', 'utf16le');
      const buffer = Buffer.concat([unicodePrefix, utf16Text]);
      const parser = new BinaryParser(buffer);

      const text = parser.extractUTF16Text();
      expect(text).toBe('hello');
    });

    it('should return null for buffer without UNICODE prefix', () => {
      const buffer = Buffer.from('not unicode text');
      const parser = new BinaryParser(buffer);

      const text = parser.extractUTF16Text();
      expect(text).toBeNull();
    });

    it('should handle empty UTF-16 text', () => {
      const unicodePrefix = Buffer.from('UNICODE\0');
      const buffer = Buffer.concat([unicodePrefix, Buffer.alloc(0)]);
      const parser = new BinaryParser(buffer);

      const text = parser.extractUTF16Text();
      expect(text).toBe('');
    });
  });

  describe('extractJSONFromText', () => {
    it('should extract JSON object from text', () => {
      const json = { test: 'value', number: 42 };
      const text = `prefix ${JSON.stringify(json)} suffix`;
      const buffer = Buffer.from(text);
      const parser = new BinaryParser(buffer);

      const result = parser.extractJSONFromText();
      expect(result).toEqual(json);
    });

    it('should return null for text without JSON', () => {
      const buffer = Buffer.from('no json here');
      const parser = new BinaryParser(buffer);

      const result = parser.extractJSONFromText();
      expect(result).toBeNull();
    });

    it('should return null for malformed JSON', () => {
      const buffer = Buffer.from('{ invalid: json }');
      const parser = new BinaryParser(buffer);

      const result = parser.extractJSONFromText();
      expect(result).toBeNull();
    });

    it('should find first valid JSON in text with multiple patterns', () => {
      const validJson = { valid: true };
      const text = `{ invalid } ${JSON.stringify(validJson)} { also invalid }`;
      const buffer = Buffer.from(text);
      const parser = new BinaryParser(buffer);

      const result = parser.extractJSONFromText();
      expect(result).toEqual(validJson);
    });
  });
});