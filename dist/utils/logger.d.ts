/**
 * 構造化ログシステム
 * 抽出処理のログ記録とデバッグ情報の管理
 */
/**
 * ログレベル
 */
export declare enum LogLevel {
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
 * ロガークラス
 */
export declare class Logger {
    private config;
    private entries;
    constructor(config?: Partial<LoggerConfig>);
    /**
     * ログレベルを設定
     */
    setLevel(level: LogLevel): void;
    /**
     * quietモードを設定
     */
    setQuiet(quiet: boolean): void;
    /**
     * カラー表示を設定
     */
    setColorize(colorize: boolean): void;
    /**
     * フォーマットを設定
     */
    setFormat(format: 'pretty' | 'json'): void;
    /**
     * DEBUGレベルのログ
     */
    debug(message: string, context?: Record<string, any>, filePath?: string): void;
    /**
     * INFOレベルのログ
     */
    info(message: string, context?: Record<string, any>, filePath?: string): void;
    /**
     * WARNレベルのログ
     */
    warn(message: string, context?: Record<string, any>, filePath?: string): void;
    /**
     * ERRORレベルのログ
     */
    error(message: string, error?: Error, context?: Record<string, any>, filePath?: string): void;
    /**
     * エラーオブジェクトから直接ログを記録
     */
    logError(error: Error, context?: Record<string, any>): void;
    /**
     * 操作の開始をログに記録
     */
    startOperation(operation: string, filePath?: string, context?: Record<string, any>): OperationLogger;
    /**
     * 成功した抽出処理をログに記録
     */
    logExtractionSuccess(filePath: string, result: any, duration: number): void;
    /**
     * 失敗した抽出処理をログに記録
     */
    logExtractionFailure(filePath: string, error: Error, duration: number): void;
    /**
     * 基本的なログ記録メソッド
     */
    private log;
    /**
     * ログエントリを出力
     */
    private output;
    /**
     * ログエントリをフォーマット
     */
    private formatEntry;
    /**
     * 読みやすい形式でフォーマット
     */
    private formatPretty;
    /**
     * 統計情報を取得
     */
    getStats(): {
        totalEntries: number;
        byLevel: Record<string, number>;
        errors: number;
        warnings: number;
    };
    /**
     * ログエントリをクリア
     */
    clear(): void;
}
/**
 * 操作ログを管理するクラス
 */
export declare class OperationLogger {
    private logger;
    private operation;
    private startTime;
    private filePath?;
    private context?;
    constructor(logger: Logger, operation: string, startTime: number, filePath?: string | undefined, context?: Record<string, any> | undefined);
    /**
     * 操作成功を記録
     */
    success(message?: string, result?: any): void;
    /**
     * 操作失敗を記録
     */
    failure(error: Error, message?: string): void;
    /**
     * 進捗を記録
     */
    progress(message: string, context?: Record<string, any>): void;
}
/**
 * デフォルトロガーインスタンス
 */
export declare const defaultLogger: Logger;
/**
 * ログレベル設定のヘルパー関数
 */
export declare function setLogLevel(level: LogLevel): void;
export declare function setQuietMode(quiet: boolean): void;
export declare function setColorOutput(colorize: boolean): void;
export declare function setLogFormat(format: 'pretty' | 'json'): void;
//# sourceMappingURL=logger.d.ts.map