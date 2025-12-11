/**
 * Cache Middleware
 * Caches GET requests
 */

import { Request, Response, NextFunction } from 'express';
import { CacheService, CACHE_TTL } from '../utils/performance';

export const cacheMiddleware = (ttl: number = CACHE_TTL.MEDIUM) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (body: any) {
        CacheService.set(cacheKey, body, ttl).catch(() => {
          // Ignore cache errors
        });
        return originalJson(body);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
};



