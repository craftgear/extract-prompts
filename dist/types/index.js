"use strict";
/**
 * TypeScript type definitions for the prompt extraction project
 * Supports ComfyUI, A1111, and other metadata extraction workflows
 *
 * @fileoverview Complete type definitions for extracted workflow data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsupportedFormatError = exports.ExtractionError = void 0;
exports.isComfyUIWorkflow = isComfyUIWorkflow;
exports.isA1111Parameters = isA1111Parameters;
exports.isValidExtractedData = isValidExtractedData;
/**
 * 抽出処理のエラー
 */
class ExtractionError extends Error {
    constructor(message, filePath, cause) {
        super(message);
        this.filePath = filePath;
        this.cause = cause;
        this.name = 'ExtractionError';
    }
}
exports.ExtractionError = ExtractionError;
/**
 * サポートされていないフォーマットのエラー
 */
class UnsupportedFormatError extends ExtractionError {
    constructor(format, filePath) {
        super(`Unsupported file format: ${format}`, filePath);
        this.name = 'UnsupportedFormatError';
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
// 型ガード関数
/**
 * ComfyUIワークフローかどうかを判定
 */
function isComfyUIWorkflow(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    const keys = Object.keys(data);
    const hasNumericKeys = keys.some(key => /^\d+$/.test(key));
    if (hasNumericKeys) {
        for (const key of keys) {
            if (/^\d+$/.test(key)) {
                const node = data[key];
                if (node && typeof node === 'object' && node.class_type) {
                    return true;
                }
            }
        }
    }
    return !!(data.workflow || data.prompt || data.extra_pnginfo);
}
/**
 * A1111パラメータかどうかを判定
 */
function isA1111Parameters(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    const commonFields = ['positive_prompt', 'negative_prompt', 'steps', 'cfg', 'sampler', 'seed'];
    return commonFields.some(field => field in data);
}
/**
 * 抽出データが有効かどうかを判定
 */
function isValidExtractedData(data) {
    if (!data || typeof data !== 'object') {
        return false;
    }
    return !!(data.workflow || data.parameters || data.metadata || data.user_comment);
}
//# sourceMappingURL=index.js.map