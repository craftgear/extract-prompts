import { RawExtractionResult } from '../../types';
/**
 * PNG text chunk interface
 */
interface PngTextChunk {
    keyword: string;
    text: string;
}
/**
 * Validates PNG file signature
 * @param buffer - PNG file buffer
 * @returns true if valid PNG signature
 */
export declare function validatePngSignature(buffer: Buffer): boolean;
/**
 * Parses PNG text chunks from buffer
 * @param buffer - PNG file buffer
 * @returns Array of parsed text chunks
 */
export declare function parsePngTextChunks(buffer: Buffer): PngTextChunk[];
/**
 * Finds a specific text chunk by keyword
 * @param chunks - Array of text chunks
 * @param keyword - Keyword to search for
 * @returns Text content or null if not found
 */
export declare function findTextChunk(chunks: PngTextChunk[], keyword: string): string | null;
/**
 * Extracts metadata from PNG file
 * @param filePath - Path to PNG file
 * @returns Extracted data or null if nothing found
 */
export declare function extractFromPNG(filePath: string): Promise<RawExtractionResult | null>;
export {};
//# sourceMappingURL=png.d.ts.map