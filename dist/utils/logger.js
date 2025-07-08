"use strict";
/**
 * 構造化ログシステム
 * 抽出処理のログ記録とデバッグ情報の管理
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.OperationLogger = exports.Logger = exports.LogLevel = void 0;
exports.setLogLevel = setLogLevel;
exports.setQuietMode = setQuietMode;
exports.setColorOutput = setColorOutput;
exports.setLogFormat = setLogFormat;
const index_1 = require("../errors/index");
/**
 * ログレベル
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 4] = "SILENT";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * デフォルトログ設定
 */
const DEFAULT_CONFIG = {
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
    DEBUG: '\x1b[36m', // cyan
    INFO: '\x1b[32m', // green
    WARN: '\x1b[33m', // yellow
    ERROR: '\x1b[31m', // red
    RESET: '\x1b[0m' // reset
};
/**
 * ロガークラス
 */
class Logger {
    constructor(config = {}) {
        this.entries = [];
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * ログレベルを設定
     */
    setLevel(level) {
        this.config.level = level;
    }
    /**
     * quietモードを設定
     */
    setQuiet(quiet) {
        this.config.quiet = quiet;
        if (quiet) {
            this.config.level = LogLevel.ERROR;
        }
    }
    /**
     * カラー表示を設定
     */
    setColorize(colorize) {
        this.config.colorize = colorize;
    }
    /**
     * フォーマットを設定
     */
    setFormat(format) {
        this.config.format = format;
    }
    /**
     * DEBUGレベルのログ
     */
    debug(message, context, filePath) {
        this.log(LogLevel.DEBUG, message, context, undefined, filePath);
    }
    /**
     * INFOレベルのログ
     */
    info(message, context, filePath) {
        this.log(LogLevel.INFO, message, context, undefined, filePath);
    }
    /**
     * WARNレベルのログ
     */
    warn(message, context, filePath) {
        this.log(LogLevel.WARN, message, context, undefined, filePath);
    }
    /**
     * ERRORレベルのログ
     */
    error(message, error, context, filePath) {
        this.log(LogLevel.ERROR, message, context, error, filePath);
    }
    /**
     * エラーオブジェクトから直接ログを記録
     */
    logError(error, context) {
        const filePath = error instanceof index_1.ExtractionError ? error.filePath : undefined;
        const severity = (0, index_1.getErrorSeverity)(error);
        const message = (0, index_1.formatErrorMessage)(error);
        const logLevel = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
        this.log(logLevel, message, context, error, filePath);
    }
    /**
     * 操作の開始をログに記録
     */
    startOperation(operation, filePath, context) {
        const startTime = Date.now();
        this.debug(`Starting ${operation}`, { ...context, filePath }, filePath);
        return new OperationLogger(this, operation, startTime, filePath, context);
    }
    /**
     * 成功した抽出処理をログに記録
     */
    logExtractionSuccess(filePath, result, duration) {
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
    logExtractionFailure(filePath, error, duration) {
        const context = {
            duration: `${duration}ms`,
            errorType: error.constructor.name
        };
        this.logError(error, context);
    }
    /**
     * 基本的なログ記録メソッド
     */
    log(level, message, context, error, filePath, operation, duration) {
        // レベルチェック
        if (level < this.config.level) {
            return;
        }
        // quietモードでエラー以外は出力しない
        if (this.config.quiet && level < LogLevel.ERROR) {
            return;
        }
        const entry = {
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
    output(entry) {
        const formatted = this.formatEntry(entry);
        if (entry.level >= LogLevel.ERROR) {
            console.error(formatted);
        }
        else {
            console.log(formatted);
        }
    }
    /**
     * ログエントリをフォーマット
     */
    formatEntry(entry) {
        if (this.config.format === 'json') {
            return JSON.stringify(entry);
        }
        return this.formatPretty(entry);
    }
    /**
     * 読みやすい形式でフォーマット
     */
    formatPretty(entry) {
        const levelName = LogLevel[entry.level];
        const color = this.config.colorize ? COLORS[levelName] : '';
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
            if (entry.error instanceof index_1.ExtractionError) {
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
    getStats() {
        const stats = {
            totalEntries: this.entries.length,
            byLevel: {},
            errors: 0,
            warnings: 0
        };
        for (const entry of this.entries) {
            const levelName = LogLevel[entry.level];
            stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
            if (entry.level === LogLevel.ERROR) {
                stats.errors++;
            }
            else if (entry.level === LogLevel.WARN) {
                stats.warnings++;
            }
        }
        return stats;
    }
    /**
     * ログエントリをクリア
     */
    clear() {
        this.entries = [];
    }
}
exports.Logger = Logger;
/**
 * 操作ログを管理するクラス
 */
class OperationLogger {
    constructor(logger, operation, startTime, filePath, context) {
        this.logger = logger;
        this.operation = operation;
        this.startTime = startTime;
        this.filePath = filePath;
        this.context = context;
    }
    /**
     * 操作成功を記録
     */
    success(message, result) {
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
    failure(error, message) {
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
    progress(message, context) {
        const duration = Date.now() - this.startTime;
        const progressContext = {
            ...this.context,
            ...context,
            elapsed: `${duration}ms`
        };
        this.logger.debug(`${this.operation}: ${message}`, progressContext, this.filePath);
    }
}
exports.OperationLogger = OperationLogger;
/**
 * デフォルトロガーインスタンス
 */
exports.defaultLogger = new Logger();
/**
 * ログレベル設定のヘルパー関数
 */
function setLogLevel(level) {
    exports.defaultLogger.setLevel(level);
}
function setQuietMode(quiet) {
    exports.defaultLogger.setQuiet(quiet);
}
function setColorOutput(colorize) {
    exports.defaultLogger.setColorize(colorize);
}
function setLogFormat(format) {
    exports.defaultLogger.setFormat(format);
}
//# sourceMappingURL=logger.js.map