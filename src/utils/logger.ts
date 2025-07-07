/**
 * 構造化ログシステム
 * 抽出処理のログ記録とデバッグ情報の管理
 */

import { ExtractionError, getErrorSeverity, formatErrorMessage } from '../errors/index';

/**
 * ログレベル
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

/**
 * ログエントリの構造
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  filePath?: string;
  operation?: string;
  duration?: number;
}

/**
 * ログ設定
 */
export interface LoggerConfig {
  level: LogLevel;
  quiet: boolean;
  includeTimestamp: boolean;
  includeContext: boolean;
  colorize: boolean;
  format: 'pretty' | 'json';
}

/**
 * デフォルトログ設定
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: LogLevel.INFO,
  quiet: false,
  includeTimestamp: true,
  includeContext: true,
  colorize: true,
  format: 'pretty'
};

/**
 * カラーコード
 */
const COLORS = {
  DEBUG: '\x1b[36m',    // cyan
  INFO: '\x1b[32m',     // green
  WARN: '\x1b[33m',     // yellow
  ERROR: '\x1b[31m',    // red
  RESET: '\x1b[0m'      // reset
};

/**
 * ロガークラス
 */
export class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * ログレベルを設定
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * quietモードを設定
   */
  setQuiet(quiet: boolean): void {
    this.config.quiet = quiet;
    if (quiet) {
      this.config.level = LogLevel.ERROR;
    }
  }

  /**
   * カラー表示を設定
   */
  setColorize(colorize: boolean): void {
    this.config.colorize = colorize;
  }

  /**
   * フォーマットを設定
   */
  setFormat(format: 'pretty' | 'json'): void {
    this.config.format = format;
  }

  /**
   * DEBUGレベルのログ
   */
  debug(message: string, context?: Record<string, any>, filePath?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, filePath);
  }

  /**
   * INFOレベルのログ
   */
  info(message: string, context?: Record<string, any>, filePath?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, filePath);
  }

  /**
   * WARNレベルのログ
   */
  warn(message: string, context?: Record<string, any>, filePath?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, filePath);
  }

  /**
   * ERRORレベルのログ
   */
  error(message: string, error?: Error, context?: Record<string, any>, filePath?: string): void {
    this.log(LogLevel.ERROR, message, context, error, filePath);
  }

  /**
   * エラーオブジェクトから直接ログを記録
   */
  logError(error: Error, context?: Record<string, any>): void {
    const filePath = error instanceof ExtractionError ? error.filePath : undefined;
    const severity = getErrorSeverity(error);
    const message = formatErrorMessage(error);
    
    const logLevel = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(logLevel, message, context, error, filePath);
  }

  /**
   * 操作の開始をログに記録
   */
  startOperation(operation: string, filePath?: string, context?: Record<string, any>): OperationLogger {
    const startTime = Date.now();
    this.debug(`Starting ${operation}`, { ...context, filePath }, filePath);
    
    return new OperationLogger(this, operation, startTime, filePath, context);
  }

  /**
   * 成功した抽出処理をログに記録
   */
  logExtractionSuccess(filePath: string, result: any, duration: number): void {
    const context = {
      hasWorkflow: !!result.workflow,
      hasParameters: !!result.parameters,
      dataSize: JSON.stringify(result).length,
      duration: `${duration}ms`
    };
    
    this.info(`Successfully extracted metadata from ${filePath}`, context, filePath);
  }

  /**
   * 失敗した抽出処理をログに記録
   */
  logExtractionFailure(filePath: string, error: Error, duration: number): void {
    const context = {
      duration: `${duration}ms`,
      errorType: error.constructor.name
    };
    
    this.logError(error, context);
  }

  /**
   * 基本的なログ記録メソッド
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error,
    filePath?: string,
    operation?: string,
    duration?: number
  ): void {
    // レベルチェック
    if (level < this.config.level) {
      return;
    }

    // quietモードでエラー以外は出力しない
    if (this.config.quiet && level < LogLevel.ERROR) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      filePath,
      operation,
      duration
    };

    this.entries.push(entry);
    this.output(entry);
  }

  /**
   * ログエントリを出力
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatEntry(entry);
    
    if (entry.level >= LogLevel.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }

  /**
   * ログエントリをフォーマット
   */
  private formatEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    }

    return this.formatPretty(entry);
  }

  /**
   * 読みやすい形式でフォーマット
   */
  private formatPretty(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const color = this.config.colorize ? COLORS[levelName as keyof typeof COLORS] : '';
    const reset = this.config.colorize ? COLORS.RESET : '';
    
    let output = '';
    
    // タイムスタンプ
    if (this.config.includeTimestamp) {
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      output += `[${timestamp}] `;
    }
    
    // レベル
    output += `${color}${levelName.padEnd(5)}${reset} `;
    
    // メッセージ
    output += entry.message;
    
    // ファイルパス
    if (entry.filePath) {
      output += ` (${entry.filePath})`;
    }
    
    // 実行時間
    if (entry.duration) {
      output += ` [${entry.duration}ms]`;
    }
    
    // コンテキスト情報
    if (this.config.includeContext && entry.context && Object.keys(entry.context).length > 0) {
      output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    // エラー詳細
    if (entry.error && entry.level >= LogLevel.ERROR) {
      if (entry.error instanceof ExtractionError) {
        output += `\n  Error Code: ${entry.error.code}`;
        if (entry.error.context) {
          output += `\n  Error Context: ${JSON.stringify(entry.error.context, null, 2)}`;
        }
      }
      
      if (entry.error.stack && this.config.level <= LogLevel.DEBUG) {
        output += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return output;
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    totalEntries: number;
    byLevel: Record<string, number>;
    errors: number;
    warnings: number;
  } {
    const stats = {
      totalEntries: this.entries.length,
      byLevel: {} as Record<string, number>,
      errors: 0,
      warnings: 0
    };
    
    for (const entry of this.entries) {
      const levelName = LogLevel[entry.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      
      if (entry.level === LogLevel.ERROR) {
        stats.errors++;
      } else if (entry.level === LogLevel.WARN) {
        stats.warnings++;
      }
    }
    
    return stats;
  }

  /**
   * ログエントリをクリア
   */
  clear(): void {
    this.entries = [];
  }
}

/**
 * 操作ログを管理するクラス
 */
export class OperationLogger {
  constructor(
    private logger: Logger,
    private operation: string,
    private startTime: number,
    private filePath?: string,
    private context?: Record<string, any>
  ) {}

  /**
   * 操作成功を記録
   */
  success(message?: string, result?: any): void {
    const duration = Date.now() - this.startTime;
    const finalMessage = message || `Completed ${this.operation}`;
    
    const context = {
      ...this.context,
      duration: `${duration}ms`,
      result: result ? Object.keys(result) : undefined
    };
    
    this.logger.info(finalMessage, context, this.filePath);
  }

  /**
   * 操作失敗を記録
   */
  failure(error: Error, message?: string): void {
    const duration = Date.now() - this.startTime;
    const finalMessage = message || `Failed ${this.operation}`;
    
    const context = {
      ...this.context,
      duration: `${duration}ms`
    };
    
    this.logger.error(finalMessage, error, context, this.filePath);
  }

  /**
   * 進捗を記録
   */
  progress(message: string, context?: Record<string, any>): void {
    const duration = Date.now() - this.startTime;
    const progressContext = {
      ...this.context,
      ...context,
      elapsed: `${duration}ms`
    };
    
    this.logger.debug(`${this.operation}: ${message}`, progressContext, this.filePath);
  }
}

/**
 * デフォルトロガーインスタンス
 */
export const defaultLogger = new Logger();

/**
 * ログレベル設定のヘルパー関数
 */
export function setLogLevel(level: LogLevel): void {
  defaultLogger.setLevel(level);
}

export function setQuietMode(quiet: boolean): void {
  defaultLogger.setQuiet(quiet);
}

export function setColorOutput(colorize: boolean): void {
  defaultLogger.setColorize(colorize);
}

export function setLogFormat(format: 'pretty' | 'json'): void {
  defaultLogger.setFormat(format);
}