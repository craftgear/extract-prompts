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
export declare const PNG_CHUNK_TYPES: {
    readonly TEXT: 1950701684;
    readonly ZTXT: 2052348020;
    readonly ITXT: 1767135348;
    readonly IHDR: 1229472850;
    readonly IDAT: 1229209940;
    readonly IEND: 1229278788;
};
/**
 * PNGファイルからtEXtチャンクを抽出
 * @param buffer - PNGファイルのバッファ
 * @returns 抽出されたtEXtチャンクの配列
 */
export declare function extractPngTextChunks(buffer: Buffer): PngChunk[];
/**
 * PNGのtEXtチャンクからキーワードとテキストを抽出
 * @param chunkData - tEXtチャンクのデータ
 * @returns キーワードとテキストのペア、失敗時はnull
 */
export declare function parseTextChunk(chunkData: Buffer): {
    keyword: string;
    text: string;
} | null;
/**
 * バイナリデータからパターンを検索
 * @param buffer - 検索対象のバッファ
 * @param pattern - 検索パターン
 * @param startPos - 検索開始位置
 * @returns パターンが見つかった位置、見つからない場合は-1
 */
export declare function findPattern(buffer: Buffer, pattern: Buffer, startPos?: number): number;
/**
 * バイナリデータから文字列パターンを検索
 * @param buffer - 検索対象のバッファ
 * @param pattern - 検索する文字列パターン
 * @param encoding - エンコーディング
 * @returns パターンが見つかった位置、見つからない場合は-1
 */
export declare function findStringPattern(buffer: Buffer, pattern: string, encoding?: BufferEncoding): number;
/**
 * リトルエンディアンで32ビット整数を読み取り
 * @param buffer - 読み取り対象のバッファ
 * @param offset - 読み取り開始位置
 * @returns 読み取った32ビット整数
 */
export declare function readUInt32LE(buffer: Buffer, offset: number): number;
/**
 * ビッグエンディアンで32ビット整数を読み取り
 * @param buffer - 読み取り対象のバッファ
 * @param offset - 読み取り開始位置
 * @returns 読み取った32ビット整数
 */
export declare function readUInt32BE(buffer: Buffer, offset: number): number;
/**
 * バイト順序を検出
 * @param buffer - 検査対象のバッファ
 * @returns 'little' | 'big' | 'unknown'
 */
export declare function detectByteOrder(buffer: Buffer): 'little' | 'big' | 'unknown';
/**
 * EXIFデータからセクションを抽出
 * @param buffer - EXIFデータのバッファ
 * @param sectionType - セクションタイプ
 * @returns 抽出されたセクションデータ、見つからない場合はnull
 */
export declare function extractExifSection(buffer: Buffer, sectionType: string): Buffer | null;
/**
 * JSONパターンをバイナリデータから抽出
 * @param buffer - 検索対象のバッファ
 * @param encoding - エンコーディング
 * @returns 抽出されたJSON文字列の配列
 */
export declare function extractJsonPatterns(buffer: Buffer, encoding?: BufferEncoding): string[];
/**
 * バイナリデータから構造化データを抽出するためのパーサー
 */
export declare class BinaryParser {
    private buffer;
    private position;
    constructor(buffer: Buffer);
    /**
     * 現在位置を取得
     */
    getPosition(): number;
    /**
     * 位置を設定
     */
    setPosition(position: number): void;
    /**
     * 指定したバイト数を読み取り
     */
    readBytes(length: number): Buffer;
    /**
     * 32ビット整数を読み取り（ビッグエンディアン）
     */
    readUInt32BE(): number;
    /**
     * 32ビット整数を読み取り（リトルエンディアン）
     */
    readUInt32LE(): number;
    /**
     * 文字列を読み取り
     */
    readString(length: number, encoding?: BufferEncoding): string;
    /**
     * null終端文字列を読み取り
     */
    readNullTerminatedString(encoding?: BufferEncoding): string;
    /**
     * 残りのバイト数を取得
     */
    remaining(): number;
    /**
     * 終端に達したかチェック
     */
    isAtEnd(): boolean;
}
//# sourceMappingURL=binary.d.ts.map