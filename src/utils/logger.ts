/**
 * Centralized Logger Utility
 * 
 * Provides environment-aware logging that only outputs in development mode.
 * Use this instead of console.log/error/warn throughout the application.
 */

const isDevelopment = import.meta.env.DEV;

interface LoggerOptions {
  /** Force logging even in production (use sparingly) */
  force?: boolean;
  /** Optional context/tag for the log message */
  context?: string;
}

/**
 * Development-only logger
 * 
 * @example
 * logger.log('User clicked button', { userId: 123 });
 * logger.error('Failed to fetch data', error);
 * logger.warn('Deprecated function called', { context: 'AuthContext' });
 */
export const logger = {
  /**
   * General log message (only in development)
   */
  log: (message: string, data?: unknown, options?: LoggerOptions): void => {
    if (isDevelopment || options?.force) {
      const prefix = options?.context ? `[${options.context}]` : '';
      if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  },

  /**
   * Warning message (only in development)
   */
  warn: (message: string, data?: unknown, options?: LoggerOptions): void => {
    if (isDevelopment || options?.force) {
      const prefix = options?.context ? `[${options.context}]` : '';
      if (data !== undefined) {
        console.warn(`${prefix} ${message}`, data);
      } else {
        console.warn(`${prefix} ${message}`);
      }
    }
  },

  /**
   * Error message (logs in both dev and production for critical errors)
   * Use sparingly in production - only for truly critical errors
   */
  error: (message: string, error?: unknown, options?: LoggerOptions): void => {
    // Errors are logged in production too, but can be disabled
    if (isDevelopment || options?.force !== false) {
      const prefix = options?.context ? `[${options.context}]` : '';
      if (error !== undefined) {
        console.error(`${prefix} ${message}`, error);
      } else {
        console.error(`${prefix} ${message}`);
      }
    }
  },

  /**
   * Info message (only in development)
   */
  info: (message: string, data?: unknown, options?: LoggerOptions): void => {
    if (isDevelopment || options?.force) {
      const prefix = options?.context ? `[${options.context}]` : '';
      if (data !== undefined) {
        console.info(`${prefix} ${message}`, data);
      } else {
        console.info(`${prefix} ${message}`);
      }
    }
  },

  /**
   * Debug message (only in development)
   */
  debug: (message: string, data?: unknown, options?: LoggerOptions): void => {
    if (isDevelopment || options?.force) {
      const prefix = options?.context ? `[${options.context}]` : '';
      if (data !== undefined) {
        console.debug(`${prefix} ${message}`, data);
      } else {
        console.debug(`${prefix} ${message}`);
      }
    }
  },

  /**
   * Group related logs (only in development)
   */
  group: (label: string, fn: () => void): void => {
    if (isDevelopment) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Time a function execution (only in development)
   */
  time: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    if (isDevelopment) {
      console.time(label);
      try {
        return await fn();
      } finally {
        console.timeEnd(label);
      }
    }
    return fn();
  },

  /**
   * Table logging (only in development)
   */
  table: (data: unknown[], options?: LoggerOptions): void => {
    if (isDevelopment || options?.force) {
      console.table(data);
    }
  },
};

export default logger;
