import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { Sentry } from '../config/sentry';

/**
 * Sanitize sensitive data from logs
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'auth'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Si el error ya tiene una respuesta, no hacer nada
  if (res.headersSent) {
    return _next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Sanitize sensitive data from logs
  const sanitizedBody = sanitizeLogData(req.body);
  const sanitizedError = sanitizeLogData(err);

  logger.error('Error:', {
    message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: sanitizedBody,
    errorName: err.name,
    requestId: (req as any).id, // Include request ID for tracking
    errorDetails: sanitizedError,
  });

  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
      },
      extra: {
        statusCode,
        body: req.body,
      },
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.toString(),
      }),
    },
  });
};

