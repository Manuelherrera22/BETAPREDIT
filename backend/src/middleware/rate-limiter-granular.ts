/**
 * Granular Rate Limiter
 * Different rate limits for different endpoints based on their criticality
 */

import { Request, Response, NextFunction } from 'express';
import { redisHelpers } from '../config/redis';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Rate limit configurations by endpoint pattern
const RATE_LIMITS: Record<string, { requests: number; window: number }> = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': { requests: 5, window: 60 }, // 5 per minute
  '/api/auth/register': { requests: 3, window: 60 }, // 3 per minute
  '/api/auth/refresh': { requests: 10, window: 60 }, // 10 per minute
  
  // Prediction endpoints - moderate limits
  '/api/predictions': { requests: 60, window: 60 }, // 60 per minute
  '/api/predictions/generate': { requests: 5, window: 60 }, // 5 per minute (expensive operation)
  '/api/predictions/train-model': { requests: 1, window: 300 }, // 1 per 5 minutes (very expensive)
  
  // Value bet detection - moderate limits
  '/api/value-bet-detection/scan-all': { requests: 10, window: 60 }, // 10 per minute
  '/api/value-bet-detection/sport': { requests: 30, window: 60 }, // 30 per minute
  
  // Events - higher limits (cached data)
  '/api/events/live': { requests: 120, window: 60 }, // 120 per minute
  '/api/events/upcoming': { requests: 120, window: 60 }, // 120 per minute
  '/api/events/sync': { requests: 5, window: 60 }, // 5 per minute
  
  // Odds - moderate limits
  '/api/odds': { requests: 100, window: 60 }, // 100 per minute
  '/api/odds/compare': { requests: 50, window: 60 }, // 50 per minute
  
  // Arbitrage - moderate limits
  '/api/arbitrage': { requests: 40, window: 60 }, // 40 per minute
  
  // Default for all other endpoints
  default: { requests: 100, window: 60 }, // 100 per minute
};

/**
 * Get rate limit configuration for a specific path
 */
function getRateLimitForPath(path: string): { requests: number; window: number } {
  // Check exact matches first
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (path.startsWith(pattern)) {
      return config;
    }
  }
  
  // Return default
  return RATE_LIMITS.default;
}

/**
 * Granular rate limiter middleware
 * Applies different rate limits based on endpoint
 */
export const granularRateLimiter = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const path = req.path;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const config = getRateLimitForPath(path);
    
    const key = `rate_limit:${path}:${ip}`;
    const allowed = await redisHelpers.checkRateLimit(
      key,
      config.requests,
      config.window
    );
    
    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        path,
        ip,
        limit: config.requests,
        window: config.window,
      });
      
      throw new AppError(
        `Too many requests. Limit: ${config.requests} requests per ${config.window} seconds`,
        429
      );
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiter for specific endpoint pattern
 */
export const createRateLimiter = (requests: number, window: number) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `rate_limit:custom:${ip}`;
      
      const allowed = await redisHelpers.checkRateLimit(key, requests, window);
      
      if (!allowed) {
        throw new AppError(
          `Too many requests. Limit: ${requests} requests per ${window} seconds`,
          429
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

