/**
 * Frontend Logger
 * Replaces console.log with proper logging that can be disabled in production
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error('[ERROR]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

