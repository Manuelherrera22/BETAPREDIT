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
  static async logError(error: Error | AppError, context?: string) {
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

    // Send to Sentry if available
    if (import.meta.env.PROD) {
      try {
        const { Sentry } = await import('../config/sentry');
        if (Sentry && Sentry.captureException) {
          Sentry.captureException(error instanceof Error ? error : new Error(error.message), {
            tags: {
              context: context || 'unknown',
              code: errorData.code,
            },
            extra: {
              error: errorData,
              timestamp: logEntry.timestamp,
            },
          });
        }
      } catch (err) {
        // Sentry not available, continue silently
        if (import.meta.env.DEV) {
          console.warn('Sentry not available:', err);
        }
      }
    }
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
  static getUserMessage(error: AppError | Error | any, context?: { action?: string; resource?: string }): string {
    // Import and use the improved error messages utility
    try {
      const { getUserFriendlyMessage } = require('./errorMessages');
      return getUserFriendlyMessage(error, context);
    } catch {
      // Fallback to basic messages if module not available
      if (error instanceof Error) {
        return error.message;
      }

      if (error.message) {
        return error.message;
      }

      // Map common error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        NETWORK_ERROR: 'Problema de conexión. Por favor, verifica tu internet e intenta de nuevo.',
        UNAUTHORIZED: 'Por favor, inicia sesión para continuar.',
        FORBIDDEN: 'No tienes permiso para realizar esta acción.',
        NOT_FOUND: 'No se encontró el recurso solicitado.',
        VALIDATION_ERROR: 'Por favor, verifica los datos ingresados e intenta de nuevo.',
        SERVER_ERROR: 'Error del servidor. Por favor, intenta más tarde.',
      };

      return errorMessages[error.code || ''] || error.message || 'Ocurrió un error inesperado';
    }
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

