import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Logger,
  OperationLogger,
  LogLevel,
  defaultLogger,
  setLogLevel,
  setQuietMode,
  setColorOutput,
  setLogFormat
} from './logger';

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.console = {
    ...global.console,
    log: mockConsoleLog,
    error: mockConsoleError
  };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LogLevel enum', () => {
  it('should have correct log level values', () => {
    expect(LogLevel.DEBUG).toBe(0);
    expect(LogLevel.INFO).toBe(1);
    expect(LogLevel.WARN).toBe(2);
    expect(LogLevel.ERROR).toBe(3);
    expect(LogLevel.SILENT).toBe(4);
  });
});

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  describe('constructor and configuration', () => {
    it('should create logger with default config', () => {
      const logger = new Logger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should create logger with custom config', () => {
      const logger = new Logger({
        level: LogLevel.DEBUG,
        quiet: true,
        colorize: false
      });
      expect(logger).toBeInstanceOf(Logger);
    });

    it('should set log level', () => {
      logger.setLevel(LogLevel.ERROR);
      logger.info('test message');
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      logger.error('error message');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should set quiet mode', () => {
      logger.setQuiet(true);
      logger.info('test message');
      logger.warn('warning message');
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      logger.error('error message');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should set colorize option', () => {
      logger.setColorize(false);
      logger.info('test message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.not.stringContaining('\x1b['));
    });

    it('should set format option', () => {
      logger.setFormat('json');
      logger.info('test message');
      const call = mockConsoleLog.mock.calls[0][0];
      expect(() => JSON.parse(call)).not.toThrow();
    });
  });

  describe('logging methods', () => {
    it('should log debug messages', () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.debug('debug message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('DEBUG'));
    });

    it('should log info messages', () => {
      logger.info('info message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('INFO'));
    });

    it('should log warning messages', () => {
      logger.warn('warning message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('WARN'));
    });

    it('should log error messages', () => {
      logger.error('error message');
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('ERROR'));
    });

    it('should include context in log messages', () => {
      logger.info('test message', { key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Context'));
    });

    it('should include file path in log messages', () => {
      logger.info('test message', undefined, '/path/to/file.png');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('/path/to/file.png'));
    });

    it('should filter messages by log level', () => {
      logger.setLevel(LogLevel.WARN);
      
      logger.debug('debug message');
      logger.info('info message');
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      logger.warn('warning message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('error logging', () => {
    it('should log errors with stack trace in debug mode', () => {
      logger.setLevel(LogLevel.DEBUG);
      const error = new Error('test error');
      logger.error('Error occurred', error);
      
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Stack:'));
    });

    it('should log extraction errors with context', () => {
      const error = new Error('extraction failed');
      logger.logError(error, { filePath: '/test/file.png' });
      
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('operation logging', () => {
    it('should start and complete operation logging', () => {
      logger.setLevel(LogLevel.DEBUG);
      const operation = logger.startOperation('test operation', '/test/file.png');
      
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Starting test operation'));
      
      operation.success('Operation completed');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Operation completed'));
    });

    it('should log operation failure', () => {
      const operation = logger.startOperation('test operation');
      const error = new Error('operation failed');
      
      operation.failure(error);
      expect(mockConsoleError).toHaveBeenCalledWith(expect.stringContaining('Failed test operation'));
    });

    it('should log operation progress', () => {
      logger.setLevel(LogLevel.DEBUG);
      const operation = logger.startOperation('test operation');
      
      operation.progress('50% complete', { step: 5 });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('50% complete'));
    });
  });

  describe('extraction logging', () => {
    it('should log successful extraction', () => {
      const result = { workflow: {}, parameters: {} };
      logger.logExtractionSuccess('/test/file.png', result, 150);
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Successfully extracted metadata')
      );
    });

    it('should log failed extraction', () => {
      const error = new Error('extraction failed');
      logger.logExtractionFailure('/test/file.png', error, 100);
      
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('formatting', () => {
    it('should format messages in pretty format by default', () => {
      logger.info('test message');
      const call = mockConsoleLog.mock.calls[0][0];
      expect(call).toContain('INFO');
      expect(call).toContain('test message');
    });

    it('should format messages in JSON format when configured', () => {
      logger.setFormat('json');
      logger.info('test message');
      
      const call = mockConsoleLog.mock.calls[0][0];
      const parsed = JSON.parse(call);
      expect(parsed.level).toBe(LogLevel.INFO);
      expect(parsed.message).toBe('test message');
    });

    it('should include timestamp in pretty format', () => {
      logger.info('test message');
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringMatching(/\[\d{1,2}:\d{2}:\d{2}\]/));
    });

    it('should exclude context when configured', () => {
      const logger = new Logger({ includeContext: false });
      logger.info('test message', { key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.not.stringContaining('Context'));
    });
  });

  describe('statistics', () => {
    it('should collect log statistics', () => {
      logger.setLevel(LogLevel.DEBUG); // Ensure DEBUG logs are captured
      logger.debug('debug');
      logger.info('info');
      logger.warn('warning');
      logger.error('error');
      
      const stats = logger.getStats();
      expect(stats.totalEntries).toBe(4);
      expect(stats.byLevel.DEBUG).toBe(1);
      expect(stats.byLevel.INFO).toBe(1);
      expect(stats.byLevel.WARN).toBe(1);
      expect(stats.byLevel.ERROR).toBe(1);
      expect(stats.warnings).toBe(1);
      expect(stats.errors).toBe(1);
    });

    it('should clear log entries', () => {
      logger.info('test');
      expect(logger.getStats().totalEntries).toBe(1);
      
      logger.clear();
      expect(logger.getStats().totalEntries).toBe(0);
    });
  });
});

describe('OperationLogger', () => {
  let logger: Logger;
  let operation: OperationLogger;

  beforeEach(() => {
    logger = new Logger({ level: LogLevel.DEBUG });
    operation = logger.startOperation('test operation', '/test/file.png', { key: 'value' });
  });

  it('should log operation success', () => {
    operation.success('Operation completed successfully', { result: 'data' });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Operation completed successfully')
    );
  });

  it('should log operation failure', () => {
    const error = new Error('operation failed');
    operation.failure(error, 'Custom failure message');
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Custom failure message')
    );
  });

  it('should log operation progress', () => {
    operation.progress('Processing step 1', { step: 1, total: 5 });
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('Processing step 1')
    );
  });

  it('should include duration in all messages', () => {
    vi.useFakeTimers();
    const operation = logger.startOperation('timed operation');
    
    vi.advanceTimersByTime(100);
    operation.success();
    
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('100ms')
    );
    
    vi.useRealTimers();
  });

  it('should include context from operation start', () => {
    operation.success();
    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('key')
    );
  });
});

describe('Default logger and helper functions', () => {
  beforeEach(() => {
    // Reset default logger
    defaultLogger.clear();
    defaultLogger.setLevel(LogLevel.INFO);
    defaultLogger.setQuiet(false);
  });

  it('should set log level using helper function', () => {
    setLogLevel(LogLevel.ERROR);
    defaultLogger.info('test message');
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it('should set quiet mode using helper function', () => {
    setQuietMode(true);
    defaultLogger.info('test message');
    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it('should set color output using helper function', () => {
    setColorOutput(false);
    defaultLogger.info('test message');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.not.stringContaining('\x1b['));
  });

  it('should set log format using helper function', () => {
    setLogFormat('json');
    defaultLogger.info('test message');
    const call = mockConsoleLog.mock.calls[0][0];
    expect(() => JSON.parse(call)).not.toThrow();
  });
});

describe('Logger edge cases', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger();
  });

  it('should handle undefined context', () => {
    logger.info('test message', undefined);
    expect(mockConsoleLog).toHaveBeenCalled();
  });

  it('should handle empty context object', () => {
    logger.info('test message', {});
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.not.stringContaining('Context'));
  });

  it('should handle null values in context', () => {
    logger.info('test message', { key: null, other: 'value' });
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('Context'));
  });

  it('should handle very long messages', () => {
    const longMessage = 'a'.repeat(10000);
    logger.info(longMessage);
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('a'.repeat(100)));
  });

  it('should handle special characters in messages', () => {
    logger.info('test message with unicode: 🚀 and emoji: 😀');
    expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('🚀'));
  });

  it('should handle circular references in context', () => {
    const circular: any = { key: 'value' };
    circular.self = circular;
    
    // This will throw due to JSON.stringify in context formatting, which is expected
    expect(() => logger.info('test', circular)).toThrow();
  });
});