/**
 * ErrorHandler Tests
 * Basic unit tests for error handling utility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler, AppError } from '../utils/errorHandler';

describe('ErrorHandler', () => {
  beforeEach(() => {
    ErrorHandler.clearErrorLog();
  });

  describe('logError', () => {
    it('should log an error to the error log', () => {
      const error = new Error('Test error');
      ErrorHandler.logError(error, 'test-context');

      const log = ErrorHandler.getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].error.message).toBe('Test error');
      expect(log[0].context).toBe('test-context');
    });

    it('should keep only last 100 errors', () => {
      for (let i = 0; i < 150; i++) {
        ErrorHandler.logError(new Error(`Error ${i}`), 'test');
      }

      const log = ErrorHandler.getErrorLog();
      expect(log.length).toBe(100);
      expect(log[0].error.message).toBe('Error 50'); // First should be 50th error
    });
  });

  describe('handleApiError', () => {
    it('should handle network errors', () => {
      const networkError = { response: undefined };
      const result = ErrorHandler.handleApiError(networkError);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.status).toBe(0);
      expect(result.message).toContain('Network error');
    });

    it('should handle HTTP errors', () => {
      const httpError = {
        response: {
          status: 404,
          data: {
            error: {
              message: 'Not found',
            },
          },
        },
      };
      const result = ErrorHandler.handleApiError(httpError);

      expect(result.status).toBe(404);
      expect(result.code).toBe('HTTP_404');
      expect(result.message).toBe('Not found');
    });

    it('should handle errors without error object', () => {
      const httpError = {
        response: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      };
      const result = ErrorHandler.handleApiError(httpError);

      expect(result.status).toBe(500);
      expect(result.message).toBe('Server error');
    });
  });

  describe('handleAuthError', () => {
    it('should handle 401 errors', () => {
      const authError = {
        response: {
          status: 401,
        },
      };
      const result = ErrorHandler.handleAuthError(authError);

      expect(result.status).toBe(401);
      expect(result.code).toBe('UNAUTHORIZED');
      expect(result.message).toContain('session has expired');
    });

    it('should handle 403 errors', () => {
      const authError = {
        response: {
          status: 403,
        },
      };
      const result = ErrorHandler.handleAuthError(authError);

      expect(result.status).toBe(403);
      expect(result.code).toBe('FORBIDDEN');
      expect(result.message).toContain('permission');
    });
  });

  describe('getUserMessage', () => {
    it('should return user-friendly messages for known error codes', () => {
      const networkError: AppError = {
        message: 'Network error',
        code: 'NETWORK_ERROR',
      };
      const message = ErrorHandler.getUserMessage(networkError);
      expect(message).toContain('Connection problem');
    });

    it('should return error message if no code mapping exists', () => {
      const customError: AppError = {
        message: 'Custom error message',
        code: 'CUSTOM_ERROR',
      };
      const message = ErrorHandler.getUserMessage(customError);
      expect(message).toBe('Custom error message');
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const message = ErrorHandler.getUserMessage(error);
      expect(message).toBe('Test error');
    });
  });

  describe('getErrorLog', () => {
    it('should return a copy of the error log', () => {
      ErrorHandler.logError(new Error('Test'), 'context');
      const log1 = ErrorHandler.getErrorLog();
      const log2 = ErrorHandler.getErrorLog();

      expect(log1).not.toBe(log2); // Should be different objects
      expect(log1.length).toBe(log2.length);
    });
  });

  describe('clearErrorLog', () => {
    it('should clear the error log', () => {
      ErrorHandler.logError(new Error('Test'), 'context');
      expect(ErrorHandler.getErrorLog().length).toBe(1);

      ErrorHandler.clearErrorLog();
      expect(ErrorHandler.getErrorLog().length).toBe(0);
    });
  });
});

