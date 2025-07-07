/**
 * Error handling system
 * Definitions for various errors that occur during ComfyUI workflow extraction
 */

/**
 * Base error class - foundation for all extraction errors
 */
export class ExtractionError extends Error {
  public readonly code: string;
  public readonly filePath?: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    filePath?: string,
    context?: Record<string, any>
  ) {
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
  toJSON(): Record<string, any> {
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

/**
 * Error for unsupported file formats
 */
export class UnsupportedFormatError extends ExtractionError {
  public readonly extension: string;
  public readonly supportedFormats: string[];

  constructor(
    filePath: string,
    extension: string,
    supportedFormats: string[] = ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'mov']
  ) {
    const message = `Unsupported file format: ${extension}. Supported formats: ${supportedFormats.join(', ')}`;
    super(message, 'UNSUPPORTED_FORMAT', filePath, { extension, supportedFormats });
    
    this.name = 'UnsupportedFormatError';
    this.extension = extension;
    this.supportedFormats = supportedFormats;
    
    Object.setPrototypeOf(this, UnsupportedFormatError.prototype);
  }
}

/**
 * メタデータが見つからないエラー
 */
export class MetadataNotFoundError extends ExtractionError {
  public readonly searchedFields: string[];
  public readonly fileType: string;

  constructor(
    filePath: string,
    fileType: string,
    searchedFields: string[] = []
  ) {
    const message = `No workflow metadata found in ${fileType} file: ${filePath}`;
    super(message, 'METADATA_NOT_FOUND', filePath, { fileType, searchedFields });
    
    this.name = 'MetadataNotFoundError';
    this.searchedFields = searchedFields;
    this.fileType = fileType;
    
    Object.setPrototypeOf(this, MetadataNotFoundError.prototype);
  }
}

/**
 * データパースエラー
 */
export class ParseError extends ExtractionError {
  public readonly originalError: Error;
  public readonly rawData: string;
  public readonly parseType: string;

  constructor(
    message: string,
    originalError: Error,
    rawData: string,
    parseType: string = 'JSON',
    filePath?: string
  ) {
    super(
      `${parseType} parse error: ${message}`,
      'PARSE_ERROR',
      filePath,
      { originalError: originalError.message, rawData: rawData.slice(0, 200), parseType }
    );
    
    this.name = 'ParseError';
    this.originalError = originalError;
    this.rawData = rawData;
    this.parseType = parseType;
    
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * ファイルシステムアクセスエラー
 */
export class FileAccessError extends ExtractionError {
  public readonly operation: string;
  public readonly systemError: Error;
  public readonly fileStats?: any;

  constructor(
    filePath: string,
    operation: string,
    systemError: Error,
    fileStats?: any
  ) {
    const message = `File access error during ${operation}: ${systemError.message}`;
    super(message, 'FILE_ACCESS_ERROR', filePath, { operation, systemError: systemError.message, fileStats });
    
    this.name = 'FileAccessError';
    this.operation = operation;
    this.systemError = systemError;
    this.fileStats = fileStats;
    
    Object.setPrototypeOf(this, FileAccessError.prototype);
  }
}

/**
 * 外部コマンド実行エラー（ffprobe等）
 */
export class ExternalCommandError extends ExtractionError {
  public readonly command: string;
  public readonly args: string[];
  public readonly exitCode: number | null;
  public readonly stderr: string;

  constructor(
    command: string,
    args: string[],
    exitCode: number | null,
    stderr: string,
    filePath?: string
  ) {
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

/**
 * バリデーションエラー
 */
export class ValidationError extends ExtractionError {
  public readonly validationType: string;
  public readonly validationDetails: Record<string, any>;

  constructor(
    message: string,
    validationType: string,
    validationDetails: Record<string, any> = {},
    filePath?: string
  ) {
    super(
      `Validation error (${validationType}): ${message}`,
      'VALIDATION_ERROR',
      filePath,
      { validationType, validationDetails }
    );
    
    this.name = 'ValidationError';
    this.validationType = validationType;
    this.validationDetails = validationDetails;
    
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * エラーが特定の型かどうかを判定するヘルパー関数
 */
export function isExtractionError(error: any): error is ExtractionError {
  return error instanceof ExtractionError;
}

export function isUnsupportedFormatError(error: any): error is UnsupportedFormatError {
  return error instanceof UnsupportedFormatError;
}

export function isMetadataNotFoundError(error: any): error is MetadataNotFoundError {
  return error instanceof MetadataNotFoundError;
}

export function isParseError(error: any): error is ParseError {
  return error instanceof ParseError;
}

export function isFileAccessError(error: any): error is FileAccessError {
  return error instanceof FileAccessError;
}

export function isExternalCommandError(error: any): error is ExternalCommandError {
  return error instanceof ExternalCommandError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * エラーの重要度を判定
 */
export function getErrorSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
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
export function formatErrorMessage(error: Error): string {
  if (isExtractionError(error)) {
    if (error.filePath) {
      return `${error.message} (${error.filePath})`;
    }
    return error.message;
  }
  
  return error.message;
}