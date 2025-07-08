"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatError = exports.ExifError = exports.ExtractionError = void 0;
/**
 * 抽出エラーの基底クラス
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
 * EXIF処理エラー
 */
class ExifError extends ExtractionError {
    constructor(message, filePath, cause) {
        super(message, filePath, cause);
        this.name = 'ExifError';
    }
}
exports.ExifError = ExifError;
/**
 * フォーマット固有のエラー
 */
class FormatError extends ExtractionError {
    constructor(message, filePath, format, cause) {
        super(message, filePath, cause);
        this.format = format;
        this.name = 'FormatError';
    }
}
exports.FormatError = FormatError;
//# sourceMappingURL=extraction.js.map