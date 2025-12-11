/**
 * Prometheus Metrics Middleware
 * Tracks HTTP request metrics
 */

import { Request, Response, NextFunction } from 'express';
import { httpRequestDuration, httpRequestTotal, httpRequestErrors } from '../monitoring/prometheus';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const route = req.route?.path || req.path;
  const method = req.method;

  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const status = res.statusCode.toString();

    // Record metrics
    httpRequestDuration.observe({ method, route, status }, duration);
    httpRequestTotal.inc({ method, route, status });

    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      httpRequestErrors.inc({ method, route, status });
    }
  });

  next();
}

