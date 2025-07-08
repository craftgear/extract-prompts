"use strict";
/**
 * ファイル形式検出およびフォーマット処理ユーティリティ
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.A1111_PARAMETER_PATTERNS = exports.METADATA_KEYWORDS = exports.FILE_SIGNATURES = exports.EXTENSION_TO_MIME = exports.MIME_TYPE_MAPPING = exports.SUPPORTED_VIDEO_FORMATS = exports.SUPPORTED_IMAGE_FORMATS = void 0;
exports.getFileExtension = getFileExtension;
exports.getFormatType = getFormatType;
exports.isImageFormat = isImageFormat;
exports.isVideoFormat = isVideoFormat;
exports.isPngFormat = isPngFormat;
exports.isJpegFormat = isJpegFormat;
exports.isWebpFormat = isWebpFormat;
exports.detectFormatFromSignature = detectFormatFromSignature;
exports.getMimeType = getMimeType;
exports.containsA1111Parameters = containsA1111Parameters;
exports.containsComfyUIWorkflow = containsComfyUIWorkflow;
exports.isMetadataKeyword = isMetadataKeyword;
exports.validateFormat = validateFormat;
exports.isSupportedFormat = isSupportedFormat;
exports.normalizeExifFieldName = normalizeExifFieldName;
/**
 * サポートされる画像形式
 */
exports.SUPPORTED_IMAGE_FORMATS = {
    PNG: 'png',
    JPEG: 'jpeg',
    JPG: 'jpg',
    WEBP: 'webp',
};
/**
 * サポートされる動画形式
 */
exports.SUPPORTED_VIDEO_FORMATS = {
    MP4: 'mp4',
    WEBM: 'webm',
    AVI: 'avi',
    MOV: 'mov',
};
/**
 * MIMEタイプマッピング
 */
exports.MIME_TYPE_MAPPING = {
    'image/png': exports.SUPPORTED_IMAGE_FORMATS.PNG,
    'image/jpeg': exports.SUPPORTED_IMAGE_FORMATS.JPEG,
    'image/jpg': exports.SUPPORTED_IMAGE_FORMATS.JPG,
    'image/webp': exports.SUPPORTED_IMAGE_FORMATS.WEBP,
    'video/mp4': exports.SUPPORTED_VIDEO_FORMATS.MP4,
    'video/webm': exports.SUPPORTED_VIDEO_FORMATS.WEBM,
    'video/avi': exports.SUPPORTED_VIDEO_FORMATS.AVI,
    'video/quicktime': exports.SUPPORTED_VIDEO_FORMATS.MOV,
};
/**
 * ファイル拡張子からMIMEタイプを取得
 */
exports.EXTENSION_TO_MIME = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.avi': 'video/avi',
    '.mov': 'video/quicktime',
};
/**
 * ファイルシグネチャ（マジック番号）
 */
exports.FILE_SIGNATURES = {
    PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    JPEG: [0xFF, 0xD8, 0xFF],
    WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF (WebPの場合、続いてWEBPが来る)
    MP4: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
    WEBM: [0x1A, 0x45, 0xDF, 0xA3], // EBML
};
/**
 * ComfyUIやA1111のメタデータを含む可能性のあるキーワード
 */
exports.METADATA_KEYWORDS = [
    'parameters',
    'workflow',
    'prompt',
    'comfyui',
    'ComfyUI',
    'negative_prompt',
    'positive_prompt',
    'steps',
    'cfg_scale',
    'sampler',
    'seed',
    'model',
];
/**
 * A1111パラメータのパターン
 */
exports.A1111_PARAMETER_PATTERNS = {
    steps: /Steps:\s*(\d+)/i,
    cfg: /CFG scale:\s*([\d.]+)/i,
    sampler: /Sampler:\s*([^,\n]+)/i,
    seed: /Seed:\s*(\d+)/i,
    model: /Model:\s*([^,\n]+)/i,
    size: /Size:\s*(\d+x\d+)/i,
    hash: /Model hash:\s*([a-fA-F0-9]+)/i,
    denoise: /Denoising strength:\s*([\d.]+)/i,
};
/**
 * ファイル拡張子を取得
 * @param filePath - ファイルパス
 * @returns ファイル拡張子（ドット付き、小文字）
 */
function getFileExtension(filePath) {
    const lastDotIndex = filePath.lastIndexOf('.');
    if (lastDotIndex === -1)
        return '';
    return filePath.substring(lastDotIndex).toLowerCase();
}
/**
 * ファイル拡張子から形式タイプを判定
 * @param filePath - ファイルパス
 * @returns 形式タイプ（'image' | 'video' | 'unknown'）
 */
function getFormatType(filePath) {
    const extension = getFileExtension(filePath);
    if (Object.values(exports.SUPPORTED_IMAGE_FORMATS).some(format => extension === `.${format}`)) {
        return 'image';
    }
    if (Object.values(exports.SUPPORTED_VIDEO_FORMATS).some(format => extension === `.${format}`)) {
        return 'video';
    }
    return 'unknown';
}
/**
 * 画像形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns 画像形式の場合true
 */
function isImageFormat(filePath) {
    const extension = getFileExtension(filePath);
    return Object.keys(exports.EXTENSION_TO_MIME).includes(extension) &&
        exports.EXTENSION_TO_MIME[extension].startsWith('image/');
}
/**
 * 動画形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns 動画形式の場合true
 */
function isVideoFormat(filePath) {
    const extension = getFileExtension(filePath);
    return Object.keys(exports.EXTENSION_TO_MIME).includes(extension) &&
        exports.EXTENSION_TO_MIME[extension].startsWith('video/');
}
/**
 * PNG形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns PNG形式の場合true
 */
function isPngFormat(filePath) {
    return getFileExtension(filePath) === '.png';
}
/**
 * JPEG形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns JPEG形式の場合true
 */
function isJpegFormat(filePath) {
    const extension = getFileExtension(filePath);
    return extension === '.jpg' || extension === '.jpeg';
}
/**
 * WebP形式かどうかを判定
 * @param filePath - ファイルパス
 * @returns WebP形式の場合true
 */
function isWebpFormat(filePath) {
    return getFileExtension(filePath) === '.webp';
}
/**
 * ファイルシグネチャから形式を検出
 * @param buffer - ファイルの最初の部分のバッファ
 * @returns 検出された形式、不明な場合は'unknown'
 */
function detectFormatFromSignature(buffer) {
    if (buffer.length < 4)
        return 'unknown';
    // PNG
    if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from(exports.FILE_SIGNATURES.PNG))) {
        return 'PNG';
    }
    // JPEG
    if (buffer.length >= 3 && buffer.slice(0, 3).equals(Buffer.from(exports.FILE_SIGNATURES.JPEG))) {
        return 'JPEG';
    }
    // WebP (RIFFヘッダー + WEBP)
    if (buffer.length >= 12 &&
        buffer.slice(0, 4).equals(Buffer.from(exports.FILE_SIGNATURES.WEBP)) &&
        buffer.slice(8, 12).equals(Buffer.from('WEBP'))) {
        return 'WEBP';
    }
    // MP4
    if (buffer.length >= 8 && buffer.slice(4, 8).equals(Buffer.from('ftyp'))) {
        return 'MP4';
    }
    // WebM
    if (buffer.length >= 4 && buffer.slice(0, 4).equals(Buffer.from(exports.FILE_SIGNATURES.WEBM))) {
        return 'WEBM';
    }
    return 'unknown';
}
/**
 * MIMEタイプを取得
 * @param filePath - ファイルパス
 * @returns MIMEタイプ、不明な場合は'application/octet-stream'
 */
function getMimeType(filePath) {
    const extension = getFileExtension(filePath);
    return exports.EXTENSION_TO_MIME[extension] || 'application/octet-stream';
}
/**
 * A1111スタイルのパラメータが含まれているかチェック
 * @param text - チェック対象のテキスト
 * @returns A1111パラメータが含まれている場合true
 */
function containsA1111Parameters(text) {
    return text.includes('Steps:') || text.includes('CFG scale:') || text.includes('Sampler:');
}
/**
 * ComfyUIワークフローが含まれているかチェック
 * @param text - チェック対象のテキスト
 * @returns ComfyUIワークフローが含まれている場合true
 */
function containsComfyUIWorkflow(text) {
    return text.includes('workflow') || text.includes('ComfyUI') || text.includes('comfyui');
}
/**
 * メタデータキーワードが含まれているかチェック
 * @param keyword - チェック対象のキーワード
 * @returns メタデータキーワードの場合true
 */
function isMetadataKeyword(keyword) {
    return exports.METADATA_KEYWORDS.includes(keyword);
}
/**
 * フォーマット固有の検証
 * @param filePath - ファイルパス
 * @param buffer - ファイルバッファ（オプション）
 * @returns 検証結果
 */
function validateFormat(filePath, buffer) {
    const expectedFormat = getFileExtension(filePath).substring(1).toUpperCase();
    let detectedFormat = 'unknown';
    let isValid = false;
    if (buffer) {
        const detected = detectFormatFromSignature(buffer);
        if (detected !== 'unknown') {
            detectedFormat = detected;
            isValid = true;
        }
    }
    else {
        // 拡張子ベースの検証
        isValid = isImageFormat(filePath) || isVideoFormat(filePath);
        detectedFormat = expectedFormat;
    }
    const mismatch = isValid && detectedFormat !== expectedFormat;
    return {
        isValid,
        detectedFormat,
        expectedFormat,
        mismatch
    };
}
/**
 * サポートされているフォーマットかチェック
 * @param filePath - ファイルパス
 * @returns サポートされている場合true
 */
function isSupportedFormat(filePath) {
    return isImageFormat(filePath) || isVideoFormat(filePath);
}
/**
 * EXIFフィールド名の正規化
 * @param fieldName - フィールド名
 * @returns 正規化されたフィールド名
 */
function normalizeExifFieldName(fieldName) {
    // 一般的なEXIFフィールド名の正規化
    const normalizedMap = {
        'usercomment': 'UserComment',
        'imagedescription': 'ImageDescription',
        'xpcomment': 'XPComment',
        'xpkeywords': 'XPKeywords',
        'software': 'Software',
        'artist': 'Artist',
        'copyright': 'Copyright',
        'comment': 'Comment',
    };
    return normalizedMap[fieldName.toLowerCase()] || fieldName;
}
//# sourceMappingURL=formats.js.map