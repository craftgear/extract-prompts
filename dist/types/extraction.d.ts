/**
 * 抽出されたデータの共通インターフェース
 */
export interface ExtractedData {
    /** ComfyUIワークフロー */
    workflow?: any;
    /** A1111スタイルのパラメータ */
    parameters?: A1111Parameters;
    /** 生のパラメータ文字列 */
    raw_parameters?: string;
    /** ユーザーコメント */
    user_comment?: string;
    /** その他のメタデータ */
    metadata?: string;
    /** 追加のカスタムフィールド */
    [key: string]: any;
}
/**
 * A1111スタイルのパラメータ
 */
export interface A1111Parameters {
    /** ポジティブプロンプト */
    positive_prompt?: string;
    /** ネガティブプロンプト */
    negative_prompt?: string;
    /** ステップ数 */
    steps?: string;
    /** CFGスケール */
    cfg?: string;
    /** サンプラー */
    sampler?: string;
    /** シード値 */
    seed?: string;
    /** モデル名 */
    model?: string;
}
/**
 * EXIF処理設定
 */
export interface ExifOptions {
    userComment?: boolean;
    exif?: boolean;
    gps?: boolean;
    tiff?: boolean;
    icc?: boolean;
    iptc?: boolean;
    jfif?: boolean;
    ihdr?: boolean;
    reviveValues?: boolean;
    translateKeys?: boolean;
    translateValues?: boolean;
    mergeOutput?: boolean;
}
/**
 * 抽出エラーの基底クラス
 */
export declare class ExtractionError extends Error {
    readonly filePath: string;
    readonly cause?: Error | undefined;
    constructor(message: string, filePath: string, cause?: Error | undefined);
}
/**
 * EXIF処理エラー
 */
export declare class ExifError extends ExtractionError {
    constructor(message: string, filePath: string, cause?: Error);
}
/**
 * フォーマット固有のエラー
 */
export declare class FormatError extends ExtractionError {
    readonly format: string;
    constructor(message: string, filePath: string, format: string, cause?: Error);
}
//# sourceMappingURL=extraction.d.ts.map