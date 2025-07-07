import { validateComfyUIWorkflow } from '../../utils/validation';
import { parseA1111Parameters } from '../../utils/parameters';
import { RawExtractionResult } from '../../types';

/**
 * PNG text chunk interface
 */
interface PngTextChunk {
  keyword: string;
  text: string;
}

/**
 * Extracted data interface
 */
interface ExtractedData {
  workflow?: any;
  parameters?: any;
  raw_parameters?: string;
  metadata?: string;
  [key: string]: any;
}

/**
 * PNG-specific keywords that may contain ComfyUI data
 */
const PNG_KEYWORDS = ['parameters', 'workflow', 'prompt', 'comfyui', 'ComfyUI'] as const;

/**
 * PNG signature (first 8 bytes of PNG files)
 */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

/**
 * tEXt chunk type signature
 */
const TEXT_CHUNK_TYPE = 0x74455874; // 'tEXt'

/**
 * Validates PNG file signature
 * @param buffer - PNG file buffer
 * @returns true if valid PNG signature
 */
export function validatePngSignature(buffer: Buffer): boolean {
  if (buffer.length < PNG_SIGNATURE.length) {
    return false;
  }
  
  return buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);
}

/**
 * Parses PNG text chunks from buffer
 * @param buffer - PNG file buffer
 * @returns Array of parsed text chunks
 */
export function parsePngTextChunks(buffer: Buffer): PngTextChunk[] {
  const chunks: PngTextChunk[] = [];
  
  if (!validatePngSignature(buffer)) {
    throw new Error('Invalid PNG signature');
  }
  
  let pos = PNG_SIGNATURE.length; // Skip PNG signature
  
  while (pos < buffer.length - 8) {
    try {
      // 各チャンクの構造: length(4) + type(4) + data(length) + crc(4)
      const chunkLength = buffer.readUInt32BE(pos);
      const chunkType = buffer.readUInt32BE(pos + 4);
      
      // tEXtチャンクをチェック
      if (chunkType === TEXT_CHUNK_TYPE) {
        const chunkDataEnd = pos + 8 + chunkLength;
        
        // バッファオーバーフローを防ぐ
        if (chunkDataEnd > buffer.length) {
          break;
        }
        
        const chunkData = buffer.subarray(pos + 8, chunkDataEnd);
        
        // キーワードとテキストを分けるnull終端を探す
        const nullPos = chunkData.indexOf(0);
        if (nullPos > 0) {
          const keyword = chunkData.subarray(0, nullPos).toString('utf8');
          const text = chunkData.subarray(nullPos + 1).toString('utf8');
          
          chunks.push({ keyword, text });
        }
      }
      
      // 次のチャンクへ移動 (length + type + data + crc)
      pos += 8 + chunkLength + 4;
    } catch (error) {
      // チャンク解析エラーの場合、次のバイトを試す
      pos++;
    }
  }
  
  return chunks;
}

/**
 * Finds a specific text chunk by keyword
 * @param chunks - Array of text chunks
 * @param keyword - Keyword to search for
 * @returns Text content or null if not found
 */
export function findTextChunk(chunks: PngTextChunk[], keyword: string): string | null {
  const chunk = chunks.find(c => c.keyword === keyword);
  return chunk ? chunk.text : null;
}

/**
 * Extracts metadata from PNG file
 * @param filePath - Path to PNG file
 * @returns Extracted data or null if nothing found
 */
export async function extractFromPNG(filePath: string): Promise<RawExtractionResult | null> {
  try {
    const fs = await import('fs/promises');
    const buffer = await fs.readFile(filePath);
    
    const chunks = parsePngTextChunks(buffer);
    
    if (chunks.length === 0) {
      return null;
    }
    
    const result: any = {};
    
    // 各キーワードに対してデータを処理
    for (const keyword of PNG_KEYWORDS) {
      const text = findTextChunk(chunks, keyword);
      if (!text) continue;
      
      if (keyword === 'parameters') {
        // A1111スタイルのパラメータを解析
        result.parameters = parseA1111Parameters(text);
        result.raw_parameters = text;
      } else {
        // JSONデータかチェック
        try {
          const parsed = JSON.parse(text);
          if (validateComfyUIWorkflow(parsed)) {
            result.workflow = parsed;
          } else {
            result[keyword] = parsed;
          }
        } catch (e) {
          // JSONでない場合はそのまま保存
          result[keyword] = text;
        }
      }
    }
    
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    // ファイル読み込みエラーまたはPNG解析エラー
    if (error instanceof Error) {
      // ENOENT (file not found) エラーの場合は null を返す
      if (error.message.includes('ENOENT') || error.message.includes('no such file')) {
        return null;
      }
      throw new Error(`PNG extraction failed: ${error.message}`);
    }
    throw error;
  }
}