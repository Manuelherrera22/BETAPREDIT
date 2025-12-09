/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  private static errorLog: Array<{
    timestamp: string;
    error: AppError;
    context?: string;
    stack?: string;
  }> = [];

  /**
   * Log error for tracking
   */
  static logError(error: Error | AppError, context?: string) {
    const errorData: AppError = {
      message: error.message,
      code: (error as any).code,
      status: (error as any).status,
      details: (error as any).details,
    };

    const logEntry = {
      timestamp: new Date().toISOString(),
      error: errorData,
      context,
      stack: error instanceof Error ? error.stack : undefined,
    };

    // Add to log
    this.errorLog.push(logEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error(`[ErrorHandler] ${context || 'Unknown'}:`, errorData);
      if (error instanceof Error && error.stack) {
        console.error('Stack:', error.stack);
      }
    }

    // TODO: Send to error tracking service (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //   this.sendToErrorTracking(logEntry);
    // }
  }

  /**
   * Handle API errors consistently
   */
  static handleApiError(error: any, defaultMessage = 'An error occurred'): AppError {
    // Network error
    if (!error.response) {
      const networkError: AppError = {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
      this.logError(networkError, 'API Request');
      return networkError;
    }

    // HTTP error response
    const status = error.response?.status;
    const data = error.response?.data;

    const apiError: AppError = {
      message: data?.error?.message || data?.message || defaultMessage,
      code: data?.error?.code || `HTTP_${status}`,
      status,
      details: data?.error?.details || data,
    };

    this.logError(apiError, 'API Response');
    return apiError;
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(error: any): AppError {
    const status = error.response?.status;

    if (status === 401) {
      return {
        message: 'Your session has expired. Please log in again.',
        code: 'UNAUTHORIZED',
        status: 401,
      };
    }

    if (status === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN',
        status: 403,
      };
    }

    return this.handleApiError(error, 'Authentication failed');
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError | Error | any): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (error.message) {
      return error.message;
    }

    // Map common error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR: 'Connection problem. Please check your internet and try again.',
      UNAUTHORIZED: 'Please log in to continue.',
      FORBIDDEN: 'You do not have permission for this action.',
      NOT_FOUND: 'The requested resource was not found.',
      VALIDATION_ERROR: 'Please check your input and try again.',
      SERVER_ERROR: 'Server error. Please try again later.',
    };

    return errorMessages[error.code || ''] || error.message || 'An unexpected error occurred';
  }

  /**
   * Get error log (for debugging)
   */
  static getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  static clearErrorLog() {
    this.errorLog = [];
  }
}

