/**
 * UTF-16 to UTF-8 conversion and UNICODE prefix handling utilities
 */

/**
 * Convert UTF-16 byte array to UTF-8 string
 * @param bytes - UTF-16 byte array
 * @param skipUnicodePrefix - Whether to skip UNICODE prefix
 * @returns Converted UTF-8 string
 */
export function convertUtf16ToUtf8(bytes: number[], skipUnicodePrefix: boolean = true): string {
  if (bytes.length === 0) return '';
  
  let startIndex = 0;
  
  // Skip UNICODE prefix and first null byte
  if (skipUnicodePrefix && bytes.length > 9) {
    startIndex = 9;
  }
  
  // Extract only actual character bytes from UTF-16 little endian (even indices)
  const textBytes = bytes.slice(startIndex);
  const cleanBytes = textBytes.filter((_, i) => i % 2 === 0);
  
  return Buffer.from(cleanBytes).toString('utf8');
}

/**
 * Detect UNICODE prefix in string and extract subsequent text
 * @param text - String to examine
 * @returns Text after UNICODE prefix, or null if not found
 */
export function extractTextAfterUnicodePrefix(text: string): string | null {
  const unicodeIndex = text.indexOf('UNICODE');
  if (unicodeIndex === -1) return null;
  
  // Extract text after UNICODE marker
  const textStart = unicodeIndex + 8; // Skip 'UNICODE\0'
  return text.substring(textStart);
}

/**
 * Extract text from UTF-16LE format data
 * @param data - UTF-16LE format string data
 * @returns Extracted text
 */
export function extractTextFromUtf16Le(data: string): string {
  const chars: string[] = [];
  
  for (let i = 1; i < data.length; i += 2) {
    const char = data[i];
    if (char !== '\0' && char.charCodeAt(0) !== 0) {
      chars.push(char);
    }
  }
  
  return chars.join('');
}

/**
 * Decode text from UserComment field
 * @param userComment - UserComment field value (object or string)
 * @returns Decoded text
 */
export function decodeUserComment(userComment: unknown): string {
  if (!userComment) return '';
  
  if (typeof userComment === 'string') {
    return userComment;
  }
  
  if (typeof userComment === 'object' && userComment !== null) {
    // When stored as byte array (UTF-16)
    const bytes = Object.values(userComment) as number[];
    if (bytes.length > 9) {
      return convertUtf16ToUtf8(bytes, true);
    }
  }
  
  return '';
}

/**
 * Detect character encoding
 * @param buffer - Buffer to examine
 * @returns Detected encoding
 */
export function detectEncoding(buffer: Buffer): 'utf8' | 'utf16le' | 'utf16be' | 'ascii' | 'unknown' {
  if (buffer.length < 2) return 'unknown';
  
  // Check BOM
  if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return 'utf16le';
  }
  
  if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    return 'utf16be';
  }
  
  // Check UTF-8 BOM
  if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    return 'utf8';
  }
  
  // Check if non-ASCII characters are present
  let hasHighBits = false;
  for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
    if (buffer[i] > 127) {
      hasHighBits = true;
      break;
    }
  }
  
  if (!hasHighBits) {
    return 'ascii';
  }
  
  return 'utf8'; // Default to UTF-8
}

/**
 * Filter byte array to remove unnecessary bytes
 * @param bytes - Original byte array
 * @param removeNulls - Whether to remove null bytes
 * @returns Filtered byte array
 */
export function filterBytes(bytes: number[], removeNulls: boolean = true): number[] {
  return bytes.filter(byte => {
    // Remove null bytes
    if (removeNulls && byte === 0) return false;
    
    // Remove control characters (keep only printable characters)
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) return false;
    
    return true;
  });
}

/**
 * Normalize text encoding
 * @param text - Text to normalize
 * @returns Normalized text
 */
export function normalizeTextEncoding(text: string): string {
  // Remove control characters
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// Legacy function compatibility
/**
 * Extract text from UTF-16 encoded byte array (Legacy compatibility)
 * @param bytes Byte array
 * @param skipBytes Number of bytes to skip (default: 9, for UNICODE prefix)
 * @returns Decoded text
 */
export function decodeUTF16FromBytes(bytes: number[], skipBytes: number = 9): string {
  return convertUtf16ToUtf8(bytes, skipBytes > 0);
}

/**
 * UTF-16 text extraction for WebP (UNICODE prefix handling) (Legacy compatibility)
 * @param data Text data
 * @param unicodeMarker UNICODE marker position
 * @returns Extracted text
 */
export function extractUTF16TextFromWebP(data: string, unicodeMarker: number): string {
  const textStart = unicodeMarker + 8; // Skip 'UNICODE\0'
  const textData = data.substring(textStart);
  return extractTextFromUtf16Le(textData);
}

/**
 * Extract byte array from object (Legacy compatibility)
 * @param obj Object
 * @returns Byte array
 */
export function extractBytesFromObject(obj: any): number[] {
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj) as number[];
  }
  return [];
}

/**
 * Extract JSON format data from text (Legacy compatibility)
 * @param text Text
 * @returns JSON format matching results
 */
export function extractJSONFromText(text: string): string[] {
  const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  return jsonMatches || [];
}

/**
 * Determine if text contains A1111 style parameters (Legacy compatibility)
 * @param text Text
 * @returns Whether text contains A1111 style parameters
 */
export function isA1111Parameters(text: string): boolean {
  return text.includes('Steps:') || text.includes('CFG scale:');
}