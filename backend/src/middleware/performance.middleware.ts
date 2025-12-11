/**
 * Performance Middleware
 * Tracks performance metrics for requests
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface PerformanceMetrics {
  startTime: number;
  method: string;
  path: string;
  query?: string;
  bodySize?: number;
}

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const metrics: PerformanceMetrics = {
    startTime: Date.now(),
    method: req.method,
    path: req.path,
    query: req.url,
    bodySize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : undefined,
  };

  // Track response
  res.on('finish', () => {
    const duration = Date.now() - metrics.startTime;
    const status = res.statusCode;

    // Log slow requests (>1 second)
    if (duration > 1000) {
      logger.warn('Slow request detected:', {
        method: metrics.method,
        path: metrics.path,
        duration: `${duration}ms`,
        status,
        bodySize: metrics.bodySize,
      });
    }

    // Log very slow requests (>5 seconds)
    if (duration > 5000) {
      logger.error('Very slow request detected:', {
        method: metrics.method,
        path: metrics.path,
        duration: `${duration}ms`,
        status,
        bodySize: metrics.bodySize,
      });
    }
  });

  next();
}

