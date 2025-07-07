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
  private buffer: Buffer;
  private position: number = 0;
  
  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }
  
  /**
   * 現在位置を取得
   */
  getPosition(): number {
    return this.position;
  }
  
  /**
   * 位置を設定
   */
  setPosition(position: number): void {
    this.position = Math.max(0, Math.min(position, this.buffer.length));
  }
  
  /**
   * 指定したバイト数を読み取り
   */
  readBytes(length: number): Buffer {
    const result = this.buffer.slice(this.position, this.position + length);
    this.position += length;
    return result;
  }
  
  /**
   * 32ビット整数を読み取り（ビッグエンディアン）
   */
  readUInt32BE(): number {
    const value = this.buffer.readUInt32BE(this.position);
    this.position += 4;
    return value;
  }
  
  /**
   * 32ビット整数を読み取り（リトルエンディアン）
   */
  readUInt32LE(): number {
    const value = this.buffer.readUInt32LE(this.position);
    this.position += 4;
    return value;
  }
  
  /**
   * 文字列を読み取り
   */
  readString(length: number, encoding: BufferEncoding = 'utf8'): string {
    const result = this.buffer.slice(this.position, this.position + length).toString(encoding);
    this.position += length;
    return result;
  }
  
  /**
   * null終端文字列を読み取り
   */
  readNullTerminatedString(encoding: BufferEncoding = 'utf8'): string {
    const start = this.position;
    while (this.position < this.buffer.length && this.buffer[this.position] !== 0) {
      this.position++;
    }
    const result = this.buffer.slice(start, this.position).toString(encoding);
    this.position++; // null文字をスキップ
    return result;
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