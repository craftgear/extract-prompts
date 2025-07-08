"use strict";
/**
 * Error handling system
 * Definitions for various errors that occur during ComfyUI workflow extraction
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = exports.ExternalCommandError = exports.FileAccessError = exports.ParseError = exports.MetadataNotFoundError = exports.UnsupportedFormatError = exports.ExtractionError = void 0;
exports.isExtractionError = isExtractionError;
exports.isUnsupportedFormatError = isUnsupportedFormatError;
exports.isMetadataNotFoundError = isMetadataNotFoundError;
exports.isParseError = isParseError;
exports.isFileAccessError = isFileAccessError;
exports.isExternalCommandError = isExternalCommandError;
exports.isValidationError = isValidationError;
exports.getErrorSeverity = getErrorSeverity;
exports.formatErrorMessage = formatErrorMessage;
/**
 * Base error class - foundation for all extraction errors
 */
class ExtractionError extends Error {
    constructor(message, code, filePath, context) {
        super(message);
        this.name = 'ExtractionError';
        this.code = code;
        this.filePath = filePath;
        this.context = context;
        this.timestamp = new Date();
        // Properly set prototype chain
        Object.setPrototypeOf(this, ExtractionError.prototype);
    }
    /**
     * Returns error as JSON object
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            filePath: this.filePath,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack
        };
    }
}
exports.ExtractionError = ExtractionError;
/**
 * Error for unsupported file formats
 */
class UnsupportedFormatError extends ExtractionError {
    constructor(filePath, extension, supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'mov']) {
        const message = `Unsupported file format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`;
        super(message, 'UNSUPPORTED_FORMAT', filePath, { extension, supportedFormats });
        this.name = 'UnsupportedFormatError';
        this.extension = extension;
        this.supportedFormats = supportedFormats;
        Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
    }
}
exports.UnsupportedFormatError = UnsupportedFormatError;
/**
 * メタデータが見つからないエラー
 */
class MetadataNotFoundError extends ExtractionError {
    constructor(filePath, fileType, searchedFields = []) {
        const message = `No workflow metadata found in ${fileType} file: ${filePath}`;
        super(message, 'METADATA_NOT_FOUND', filePath, { fileType, searchedFields });
        this.name = 'MetadataNotFoundError';
        this.searchedFields = searchedFields;
        this.fileType = fileType;
        Object.setPrototypeOf(this, MetadataNotFoundError.prototype);
    }
}
exports.MetadataNotFoundError = MetadataNotFoundError;
/**
 * データパースエラー
 */
class ParseError extends ExtractionError {
    constructor(message, originalError, rawData, parseType = 'JSON', filePath) {
        super(`${parseType} parse error: ${message}`, 'PARSE_ERROR', filePath, { originalError: originalError.message, rawData: rawData.slice(0, 200), parseType });
        this.name = 'ParseError';
        this.originalError = originalError;
        this.rawData = rawData;
        this.parseType = parseType;
        Object.setPrototypeOf(this, ParseError.prototype);
    }
}
exports.ParseError = ParseError;
/**
 * ファイルシステムアクセスエラー
 */
class FileAccessError extends ExtractionError {
    constructor(filePath, operation, systemError, fileStats) {
        const message = `File access error during ${operation}: ${systemError.message}`;
        super(message, 'FILE_ACCESS_ERROR', filePath, { operation, systemError: systemError.message, fileStats });
        this.name = 'FileAccessError';
        this.operation = operation;
        this.systemError = systemError;
        this.fileStats = fileStats;
        Object.setPrototypeOf(this, FileAccessError.prototype);
    }
}
exports.FileAccessError = FileAccessError;
/**
 * 外部コマンド実行エラー（ffprobe等）
 */
class ExternalCommandError extends ExtractionError {
    constructor(command, args, exitCode, stderr, filePath) {
        const message = `External command failed: ${command} (exit code: ${exitCode ?? 'unknown'})`;
        super(message, 'EXTERNAL_COMMAND_ERROR', filePath, { command, args, exitCode, stderr });
        this.name = 'ExternalCommandError';
        this.command = command;
        this.args = args;
        this.exitCode = exitCode;
        this.stderr = stderr;
        Object.setPrototypeOf(this, ExternalCommandError.prototype);
    }
}
exports.ExternalCommandError = ExternalCommandError;
/**
 * バリデーションエラー
 */
class ValidationError extends ExtractionError {
    constructor(message, validationType, validationDetails = {}, filePath) {
        super(`Validation error (${validationType}): ${message}`, 'VALIDATION_ERROR', filePath, { validationType, validationDetails });
        this.name = 'ValidationError';
        this.validationType = validationType;
        this.validationDetails = validationDetails;
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
/**
 * エラーが特定の型かどうかを判定するヘルパー関数
 */
function isExtractionError(error) {
    return error instanceof ExtractionError;
}
function isUnsupportedFormatError(error) {
    return error instanceof UnsupportedFormatError;
}
function isMetadataNotFoundError(error) {
    return error instanceof MetadataNotFoundError;
}
function isParseError(error) {
    return error instanceof ParseError;
}
function isFileAccessError(error) {
    return error instanceof FileAccessError;
}
function isExternalCommandError(error) {
    return error instanceof ExternalCommandError;
}
function isValidationError(error) {
    return error instanceof ValidationError;
}
/**
 * エラーの重要度を判定
 */
function getErrorSeverity(error) {
    if (isMetadataNotFoundError(error)) {
        return 'low'; // メタデータが見つからないのは正常なケース
    }
    if (isUnsupportedFormatError(error)) {
        return 'medium'; // サポートされていない形式
    }
    if (isParseError(error)) {
        return 'medium'; // パースエラー
    }
    if (isFileAccessError(error)) {
        return 'high'; // ファイルアクセスエラー
    }
    if (isExternalCommandError(error)) {
        return 'high'; // 外部コマンドエラー
    }
    if (isValidationError(error)) {
        return 'medium'; // バリデーションエラー
    }
    return 'critical'; // その他のエラー
}
/**
 * エラーメッセージを人間が読みやすい形式に変換
 */
function formatErrorMessage(error) {
    if (isExtractionError(error)) {
        if (error.filePath) {
            return `${error.message} (${error.filePath})`;
        }
        return error.message;
    }
    return error.message;
}
//# sourceMappingURL=index.js.map