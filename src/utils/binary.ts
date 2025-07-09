/**
 * バイナリデータ解析およびPNGチャンク処理ユーティリティ
 */

/**
 * PNGチャンク情報を表す型
 */
export interface PngChunk {
  /** チャンクの長さ */
  length: number;
  /** チャンクタイプ（例: 'tEXt', 'IHDR'） */
  type: string;
  /** チャンクデータ */
  data: Buffer;
  /** チャンクの開始位置 */
  position: number;
}

/**
 * PNGチャンクのタイプを表す定数
 */
export const PNG_CHUNK_TYPES = {
  TEXT: 0x74455874, // 'tEXt'
  ZTXT: 0x7A545874, // 'zTXt'
  ITXT: 0x69545874, // 'iTXt'
  IHDR: 0x49484452, // 'IHDR'
  IDAT: 0x49444154, // 'IDAT'
  IEND: 0x49454E44, // 'IEND'
} as const;

/**
 * PNGファイルからtEXtチャンクを抽出
 * @param buffer - PNGファイルのバッファ
 * @returns 抽出されたtEXtチャンクの配列
 */
export function extractPngTextChunks(buffer: Buffer): PngChunk[] {
  const chunks: PngChunk[] = [];
  let pos = 8; // PNGシグネチャをスキップ
  
  while (pos < buffer.length - 8) {
    const chunkLength = buffer.readUInt32BE(pos);
    const chunkType = buffer.readUInt32BE(pos + 4);
    
    if (chunkType === PNG_CHUNK_TYPES.TEXT) {
      const chunkData = buffer.slice(pos + 8, pos + 8 + chunkLength);
      
      chunks.push({
        length: chunkLength,
        type: 'tEXt',
        data: chunkData,
        position: pos
      });
    }
    
    // 次のチャンクに移動（長さ + タイプ + データ + CRC）
    pos += 8 + chunkLength + 4;
  }
  
  return chunks;
}

/**
 * PNGのtEXtチャンクからキーワードとテキストを抽出
 * @param chunkData - tEXtチャンクのデータ
 * @returns キーワードとテキストのペア、失敗時はnull
 */
export function parseTextChunk(chunkData: Buffer): { keyword: string; text: string } | null {
  // キーワードとテキストを分けるnull終端を探す
  const nullPos = chunkData.indexOf(0);
  if (nullPos <= 0) return null;
  
  const keyword = chunkData.slice(0, nullPos).toString('utf8');
  const text = chunkData.slice(nullPos + 1).toString('utf8');
  
  return { keyword, text };
}

/**
 * バイナリデータからパターンを検索
 * @param buffer - 検索対象のバッファ
 * @param pattern - 検索パターン
 * @param startPos - 検索開始位置
 * @returns パターンが見つかった位置、見つからない場合は-1
 */
export function findPattern(buffer: Buffer, pattern: Buffer, startPos: number = 0): number {
  for (let i = startPos; i <= buffer.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (buffer[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) return i;
  }
  return -1;
}

/**
 * バイナリデータから文字列パターンを検索
 * @param buffer - 検索対象のバッファ
 * @param pattern - 検索する文字列パターン
 * @param encoding - エンコーディング
 * @returns パターンが見つかった位置、見つからない場合は-1
 */
export function findStringPattern(buffer: Buffer, pattern: string, encoding: BufferEncoding = 'utf8'): number {
  const patternBuffer = Buffer.from(pattern, encoding);
  return findPattern(buffer, patternBuffer);
}

/**
 * リトルエンディアンで32ビット整数を読み取り
 * @param buffer - 読み取り対象のバッファ
 * @param offset - 読み取り開始位置
 * @returns 読み取った32ビット整数
 */
export function readUInt32LE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

/**
 * ビッグエンディアンで32ビット整数を読み取り
 * @param buffer - 読み取り対象のバッファ
 * @param offset - 読み取り開始位置
 * @returns 読み取った32ビット整数
 */
export function readUInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

/**
 * バイト順序を検出
 * @param buffer - 検査対象のバッファ
 * @returns 'little' | 'big' | 'unknown'
 */
export function detectByteOrder(buffer: Buffer): 'little' | 'big' | 'unknown' {
  if (buffer.length < 4) return 'unknown';
  
  // 一般的なマジック番号をチェック
  const first32 = buffer.readUInt32BE(0);
  const first32LE = buffer.readUInt32LE(0);
  
  // PNGシグネチャをチェック
  if (first32 === 0x89504E47) return 'big';
  if (first32LE === 0x89504E47) return 'little';
  
  // JPEG SOIマーカーをチェック
  if ((first32 & 0xFFFF0000) === 0xFFD80000) return 'big';
  if ((first32LE & 0xFFFF0000) === 0xFFD80000) return 'little';
  
  return 'unknown';
}

/**
 * EXIFデータからセクションを抽出
 * @param buffer - EXIFデータのバッファ
 * @param sectionType - セクションタイプ
 * @returns 抽出されたセクションデータ、見つからない場合はnull
 */
export function extractExifSection(buffer: Buffer, sectionType: string): Buffer | null {
  const sectionPattern = Buffer.from(sectionType, 'ascii');
  const position = findPattern(buffer, sectionPattern);
  
  if (position === -1) return null;
  
  // セクションの長さを読み取り（通常は次の4バイト）
  if (position + sectionPattern.length + 4 > buffer.length) return null;
  
  const sectionLength = buffer.readUInt32BE(position + sectionPattern.length);
  const sectionStart = position + sectionPattern.length + 4;
  
  if (sectionStart + sectionLength > buffer.length) return null;
  
  return buffer.slice(sectionStart, sectionStart + sectionLength);
}

/**
 * バイナリデータからJSONを検索して解析
 * @param buffer - 検索対象のバッファ
 * @returns 解析されたJSONオブジェクト、見つからない場合はnull
 */
export function findJsonInBinary(buffer: Buffer): any {
  const text = buffer.toString('utf8');
  // より柔軟なJSON検索パターン
  const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  
  if (!jsonMatches) return null;
  
  for (const match of jsonMatches) {
    try {
      return JSON.parse(match);
    } catch {
      // 無効なJSONは無視して次を試す
      continue;
    }
  }
  
  return null;
}

/**
 * EXIFデータを解析
 * @param buffer - EXIFデータのバッファ
 * @returns 解析されたEXIFデータ、失敗時はnull
 */
export function parseExifData(buffer: Buffer): any {
  if (buffer.length === 0) return null;
  
  // Exifヘッダーをチェック
  const exifHeader = buffer.slice(0, 6);
  if (exifHeader.toString('ascii') !== 'Exif\0\0') {
    return null;
  }
  
  // 基本的なEXIF構造を確認
  if (buffer.length < 14) return null;
  
  // TIFFヘッダーをチェック
  const tiffStart = 6;
  const endian = buffer.readUInt16LE(tiffStart);
  
  if (endian !== 0x4949 && endian !== 0x4D4D) {
    return null;
  }
  
  // 最低限の有効なEXIFオブジェクトを返す
  return {
    exif: true,
    endian: endian === 0x4949 ? 'little' : 'big'
  };
}

/**
 * JSONパターンをバイナリデータから抽出
 * @param buffer - 検索対象のバッファ
 * @param encoding - エンコーディング
 * @returns 抽出されたJSON文字列の配列
 */
export function extractJsonPatterns(buffer: Buffer, encoding: BufferEncoding = 'utf8'): string[] {
  const text = buffer.toString(encoding);
  const jsonMatches = text.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
  return jsonMatches || [];
}

/**
 * バイナリデータから構造化データを抽出するためのパーサー
 */
export class BinaryParser {
  public buffer: Buffer;
  public position: number = 0;
  public length: number;
  public isLittleEndian: boolean;
  
  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.length = buffer.length;
    
    // バイト順序を検出
    if (buffer.length >= 2) {
      const first16 = buffer.readUInt16BE(0);
      if (first16 === 0x4949) {
        this.isLittleEndian = true;
      } else if (first16 === 0x4D4D) {
        this.isLittleEndian = false;
      } else {
        this.isLittleEndian = true; // デフォルト
      }
    } else {
      this.isLittleEndian = true;
    }
  }
  
  /**
   * 8ビット符号なし整数を読み取り
   */
  readUInt8(): number {
    if (this.position >= this.buffer.length) {
      throw new Error('Cannot read beyond buffer length');
    }
    const value = this.buffer.readUInt8(this.position);
    this.position += 1;
    return value;
  }
  
  /**
   * 16ビット符号なし整数を読み取り
   */
  readUInt16(): number {
    if (this.position + 2 > this.buffer.length) {
      throw new Error('Cannot read beyond buffer length');
    }
    const value = this.isLittleEndian 
      ? this.buffer.readUInt16LE(this.position)
      : this.buffer.readUInt16BE(this.position);
    this.position += 2;
    return value;
  }
  
  /**
   * 32ビット符号なし整数を読み取り
   */
  readUInt32(): number {
    if (this.position + 4 > this.buffer.length) {
      throw new Error('Cannot read beyond buffer length');
    }
    const value = this.isLittleEndian 
      ? this.buffer.readUInt32LE(this.position)
      : this.buffer.readUInt32BE(this.position);
    this.position += 4;
    return value;
  }
  
  /**
   * 文字列を読み取り
   */
  readString(length?: number): string {
    if (length !== undefined) {
      if (this.position + length > this.buffer.length) {
        throw new Error('Cannot read beyond buffer length');
      }
      const result = this.buffer.slice(this.position, this.position + length).toString('utf8');
      this.position += length;
      return result;
    } else {
      // null終端文字列を読み取り
      const start = this.position;
      while (this.position < this.buffer.length && this.buffer[this.position] !== 0) {
        this.position++;
      }
      const result = this.buffer.slice(start, this.position).toString('utf8');
      if (this.position < this.buffer.length) {
        this.position++; // null文字をスキップ
      }
      return result;
    }
  }
  
  /**
   * 指定したバイト数を読み取り
   */
  readBytes(length: number): Buffer {
    if (this.position + length > this.buffer.length) {
      throw new Error('Cannot read beyond buffer length');
    }
    const result = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }
  
  /**
   * 位置を設定
   */
  seek(position: number): void {
    if (position < 0 || position > this.buffer.length) {
      throw new Error('Seek position out of bounds');
    }
    this.position = position;
  }
  
  /**
   * バッファの一部をスライス
   */
  slice(lengthOrStart?: number, end?: number): Buffer {
    if (end !== undefined) {
      // 2つの引数がある場合は start, end として扱う
      return this.buffer.slice(lengthOrStart || 0, end);
    } else if (lengthOrStart !== undefined) {
      // 1つの引数がある場合は length として扱う
      return this.buffer.slice(this.position, this.position + lengthOrStart);
    } else {
      return this.buffer.slice(this.position);
    }
  }
  
  /**
   * パターンを検索
   */
  findPattern(pattern: Buffer, startPos?: number): number {
    const start = startPos !== undefined ? startPos : 0;
    return findPattern(this.buffer, pattern, start);
  }
  
  /**
   * UTF-16テキストを抽出
   */
  extractUTF16Text(): string | null {
    const unicodePrefix = Buffer.from('UNICODE\0');
    const prefixPos = this.findPattern(unicodePrefix);
    
    if (prefixPos === -1) return null;
    
    const textStart = prefixPos + unicodePrefix.length;
    const textData = this.buffer.slice(textStart);
    
    if (textData.length === 0) return '';
    
    try {
      return textData.toString('utf16le');
    } catch {
      return null;
    }
  }
  
  /**
   * テキストからJSONを抽出
   */
  extractJSONFromText(): any {
    const text = this.buffer.toString('utf8');
    return findJsonInBinary(Buffer.from(text));
  }
  
  /**
   * 残りのバイト数を取得
   */
  remaining(): number {
    return this.buffer.length - this.position;
  }
  
  /**
   * 終端に達したかチェック
   */
  isAtEnd(): boolean {
    return this.position >= this.buffer.length;
  }
}