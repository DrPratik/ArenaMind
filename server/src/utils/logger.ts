/**
 * @module logger
 * @description Structured logging utility for the ArenaMind backend.
 *
 * Provides leveled logging (`info`, `warn`, `error`, `debug`) with
 * JSON-formatted output in production for machine-parseable log
 * aggregation, and human-readable output in development.
 *
 * Usage:
 * ```ts
 * import { logger } from './utils/logger.js';
 * logger.info('Server started', { port: 3001 });
 * logger.error('Database error', { code: err.code });
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? 'info';

/**
 * Format and emit a log entry.
 *
 * In production, outputs JSON for structured log aggregation.
 * In development, outputs a human-readable colored string.
 */
function emit(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[currentLevel]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && Object.keys(data).length > 0 ? { data } : {}),
  };

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
    return;
  }

  // Development: human-readable format
  const colors: Record<LogLevel, string> = {
    debug: '\x1b[36m', // cyan
    info: '\x1b[32m',  // green
    warn: '\x1b[33m',  // yellow
    error: '\x1b[31m', // red
  };
  const reset = '\x1b[0m';
  const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
  const dataStr = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';

  if (level === 'error') {
    console.error(`${prefix} ${message}${dataStr}`);
  } else {
    console.log(`${prefix} ${message}${dataStr}`);
  }
}

/** Structured logger with leveled output. */
export const logger = {
  /** Log a debug message (suppressed in production by default). */
  debug: (message: string, data?: Record<string, unknown>) => emit('debug', message, data),
  /** Log an informational message. */
  info: (message: string, data?: Record<string, unknown>) => emit('info', message, data),
  /** Log a warning. */
  warn: (message: string, data?: Record<string, unknown>) => emit('warn', message, data),
  /** Log an error. */
  error: (message: string, data?: Record<string, unknown>) => emit('error', message, data),
};
