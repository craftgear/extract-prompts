/**
 * UTF-16 to UTF-8 conversion and UNICODE prefix handling utilities
 */
/**
 * Convert UTF-16 byte array to UTF-8 string
 * @param bytes - UTF-16 byte array
 * @param skipUnicodePrefix - Whether to skip UNICODE prefix
 * @returns Converted UTF-8 string
 */
export declare function convertUtf16ToUtf8(bytes: number[], skipUnicodePrefix?: boolean): string;
/**
 * Detect UNICODE prefix in string and extract subsequent text
 * @param text - String to examine
 * @returns Text after UNICODE prefix, or null if not found
 */
export declare function extractTextAfterUnicodePrefix(text: string): string | null;
/**
 * Extract text from UTF-16LE format data
 * @param data - UTF-16LE format string data
 * @returns Extracted text
 */
export declare function extractTextFromUtf16Le(data: string): string;
/**
 * Decode text from UserComment field
 * @param userComment - UserComment field value (object or string)
 * @returns Decoded text
 */
export declare function decodeUserComment(userComment: unknown): string;
/**
 * Detect character encoding
 * @param buffer - Buffer to examine
 * @returns Detected encoding
 */
export declare function detectEncoding(buffer: Buffer): 'utf8' | 'utf16le' | 'utf16be' | 'ascii' | 'unknown';
/**
 * Filter byte array to remove unnecessary bytes
 * @param bytes - Original byte array
 * @param removeNulls - Whether to remove null bytes
 * @returns Filtered byte array
 */
export declare function filterBytes(bytes: number[], removeNulls?: boolean): number[];
/**
 * Normalize text encoding
 * @param text - Text to normalize
 * @returns Normalized text
 */
export declare function normalizeTextEncoding(text: string): string;
/**
 * Extract text from UTF-16 encoded byte array (Legacy compatibility)
 * @param bytes Byte array
 * @param skipBytes Number of bytes to skip (default: 9, for UNICODE prefix)
 * @returns Decoded text
 */
export declare function decodeUTF16FromBytes(bytes: number[], skipBytes?: number): string;
/**
 * UTF-16 text extraction for WebP (UNICODE prefix handling) (Legacy compatibility)
 * @param data Text data
 * @param unicodeMarker UNICODE marker position
 * @returns Extracted text
 */
export declare function extractUTF16TextFromWebP(data: string, unicodeMarker: number): string;
/**
 * Extract byte array from object (Legacy compatibility)
 * @param obj Object
 * @returns Byte array
 */
export declare function extractBytesFromObject(obj: any): number[];
/**
 * Extract JSON format data from text (Legacy compatibility)
 * @param text Text
 * @returns JSON format matching results
 */
export declare function extractJSONFromText(text: string): string[];
/**
 * Determine if text contains A1111 style parameters (Legacy compatibility)
 * @param text Text
 * @returns Whether text contains A1111 style parameters
 */
export declare function isA1111Parameters(text: string): boolean;
//# sourceMappingURL=encoding.d.ts.map