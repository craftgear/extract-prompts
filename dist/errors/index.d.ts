/**
 * Error handling system
 * Definitions for various errors that occur during ComfyUI workflow extraction
 */
/**
 * Base error class - foundation for all extraction errors
 */
export declare class ExtractionError extends Error {
    readonly code: string;
    readonly filePath?: string;
    readonly context?: Record<string, any>;
    readonly timestamp: Date;
    constructor(message: string, code: string, filePath?: string, context?: Record<string, any>);
    /**
     * Returns error as JSON object
     */
    toJSON(): Record<string, any>;
}
/**
 * Error for unsupported file formats
 */
export declare class UnsupportedFormatError extends ExtractionError {
    readonly extension: string;
    readonly supportedFormats: string[];
    constructor(filePath: string, extension: string, supportedFormats?: string[]);
}
/**
 * メタデータが見つからないエラー
 */
export declare class MetadataNotFoundError extends ExtractionError {
    readonly searchedFields: string[];
    readonly fileType: string;
    constructor(filePath: string, fileType: string, searchedFields?: string[]);
}
/**
 * データパースエラー
 */
export declare class ParseError extends ExtractionError {
    readonly originalError: Error;
    readonly rawData: string;
    readonly parseType: string;
    constructor(message: string, originalError: Error, rawData: string, parseType?: string, filePath?: string);
}
/**
 * ファイルシステムアクセスエラー
 */
export declare class FileAccessError extends ExtractionError {
    readonly operation: string;
    readonly systemError: Error;
    readonly fileStats?: any;
    constructor(filePath: string, operation: string, systemError: Error, fileStats?: any);
}
/**
 * 外部コマンド実行エラー（ffprobe等）
 */
export declare class ExternalCommandError extends ExtractionError {
    readonly command: string;
    readonly args: string[];
    readonly exitCode: number | null;
    readonly stderr: string;
    constructor(command: string, args: string[], exitCode: number | null, stderr: string, filePath?: string);
}
/**
 * バリデーションエラー
 */
export declare class ValidationError extends ExtractionError {
    readonly validationType: string;
    readonly validationDetails: Record<string, any>;
    constructor(message: string, validationType: string, validationDetails?: Record<string, any>, filePath?: string);
}
/**
 * エラーが特定の型かどうかを判定するヘルパー関数
 */
export declare function isExtractionError(error: any): error is ExtractionError;
export declare function isUnsupportedFormatError(error: any): error is UnsupportedFormatError;
export declare function isMetadataNotFoundError(error: any): error is MetadataNotFoundError;
export declare function isParseError(error: any): error is ParseError;
export declare function isFileAccessError(error: any): error is FileAccessError;
export declare function isExternalCommandError(error: any): error is ExternalCommandError;
export declare function isValidationError(error: any): error is ValidationError;
/**
 * エラーの重要度を判定
 */
export declare function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical';
/**
 * エラーメッセージを人間が読みやすい形式に変換
 */
export declare function formatErrorMessage(error: Error): string;
//# sourceMappingURL=index.d.ts.map