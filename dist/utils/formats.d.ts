/**
 * ファイル形式検出およびフォーマット処理ユーティリティ
 */
/**
 * サポートされる画像形式
 */
export declare const SUPPORTED_IMAGE_FORMATS: {
    readonly PNG: "png";
    readonly JPEG: "jpeg";
    readonly JPG: "jpg";
    readonly WEBP: "webp";
};
/**
 * サポートされる動画形式
 */
export declare const SUPPORTED_VIDEO_FORMATS: {
    readonly MP4: "mp4";
    readonly WEBM: "webm";
    readonly AVI: "avi";
    readonly MOV: "mov";
};
/**
 * MIMEタイプマッピング
 */
export declare const MIME_TYPE_MAPPING: {
    readonly 'image/png': "png";
    readonly 'image/jpeg': "jpeg";
    readonly 'image/jpg': "jpg";
    readonly 'image/webp': "webp";
    readonly 'video/mp4': "mp4";
    readonly 'video/webm': "webm";
    readonly 'video/avi': "avi";
    readonly 'video/quicktime': "mov";
};
/**
 * ファイル拡張子からMIMEタイプを取得
 */
export declare const EXTENSION_TO_MIME: {
    readonly '.png': "image/png";
    readonly '.jpg': "image/jpeg";
    readonly '.jpeg': "image/jpeg";
    readonly '.webp': "image/webp";
    readonly '.mp4': "video/mp4";
    readonly '.webm': "video/webm";
    readonly '.avi': "video/avi";
    readonly '.mov': "video/quicktime";
};
/**
 * ファイルシグネチャ（マジック番号）
 */
export declare const FILE_SIGNATURES: {
    readonly PNG: readonly [137, 80, 78, 71, 13, 10, 26, 10];
    readonly JPEG: readonly [255, 216, 255];
    readonly WEBP: readonly [82, 73, 70, 70];
    readonly MP4: readonly [0, 0, 0, 24, 102, 116, 121, 112];
    readonly WEBM: readonly [26, 69, 223, 163];
};
/**
 * ComfyUIやA1111のメタデータを含む可能性のあるキーワード
 */
export declare const METADATA_KEYWORDS: readonly ["parameters", "workflow", "prompt", "comfyui", "ComfyUI", "negative_prompt", "positive_prompt", "steps", "cfg_scale", "sampler", "seed", "model"];
/**
 * A1111パラメータのパターン
 */
export declare const A1111_PARAMETER_PATTERNS: {
    readonly steps: RegExp;
    readonly cfg: RegExp;
    readonly sampler: RegExp;
    readonly seed: RegExp;
    readonly model: RegExp;
    readonly size: RegExp;
    readonly hash: RegExp;
    readonly denoise: RegExp;
};
/**
 * ファイル拡張子を取得
 * @param filePath - ファイルパス
 * @returns ファイル拡張子（ドット付き、小文字）
 */
export declare function getFileExtension(filePath: string): string;
/**
 * ファイル拡張子から形式タイプを判定
 * @param filePath - ファイルパス
 * @returns 形式タイプ（'image' | 'video' | 'unknown'）
 */
export declare function getFormatType(filePath: string): 'image' | 'video' | 'unknown';
/**
 * 画像形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns 画像形式の場合true
 */
export declare function isImageFormat(filePath: string): boolean;
/**
 * 動画形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns 動画形式の場合true
 */
export declare function isVideoFormat(filePath: string): boolean;
/**
 * PNG形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns PNG形式の場合true
 */
export declare function isPngFormat(filePath: string): boolean;
/**
 * JPEG形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns JPEG形式の場合true
 */
export declare function isJpegFormat(filePath: string): boolean;
/**
 * WebP形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns WebP形式の場合true
 */
export declare function isWebpFormat(filePath: string): boolean;
/**
 * ファイルシグネチャから形式を検出
 * @param buffer - ファイルの最初の部分のバッファ
 * @returns 検出された形式、不明な場合は'unknown'
 */
export declare function detectFormatFromSignature(buffer: Buffer): keyof typeof FILE_SIGNATURES | 'unknown';
/**
 * MIMEタイプを取得
 * @param filePath - ファイルパス
 * @returns MIMEタイプ、不明な場合は'application/octet-stream'
 */
export declare function getMimeType(filePath: string): string;
/**
 * A1111スタイルのパラメータが含まれているかチェック
 * @param text - チェック対象のテキスト
 * @returns A1111パラメータが含まれている場合true
 */
export declare function containsA1111Parameters(text: string): boolean;
/**
 * ComfyUIワークフローが含まれているかチェック
 * @param text - チェック対象のテキスト
 * @returns ComfyUIワークフローが含まれている場合true
 */
export declare function containsComfyUIWorkflow(text: string): boolean;
/**
 * メタデータキーワードが含まれているかチェック
 * @param keyword - チェック対象のキーワード
 * @returns メタデータキーワードの場合true
 */
export declare function isMetadataKeyword(keyword: string): boolean;
/**
 * フォーマット固有の検証
 * @param filePath - ファイルパス
 * @param buffer - ファイルバッファ（オプション）
 * @returns 検証結果
 */
export declare function validateFormat(filePath: string, buffer?: Buffer): {
    isValid: boolean;
    detectedFormat: string;
    expectedFormat: string;
    mismatch: boolean;
};
/**
 * サポートされているフォーマットかチェック
 * @param filePath - ファイルパス
 * @returns サポートされている場合true
 */
export declare function isSupportedFormat(filePath: string): boolean;
/**
 * EXIFフィールド名の正規化
 * @param fieldName - フィールド名
 * @returns 正規化されたフィールド名
 */
export declare function normalizeExifFieldName(fieldName: string): string;
//# sourceMappingURL=formats.d.ts.map