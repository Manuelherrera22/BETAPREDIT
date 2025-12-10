/**
 * Performance Utilities
 * Caching and optimization helpers
 */

import { redisClient } from '../config/redis';
import { logger } from './logger';

const CACHE_TTL = {
  SHORT: 120, // 2 minutes (aumentado de 1)
  MEDIUM: 600, // 10 minutes (aumentado de 5)
  LONG: 7200, // 2 hours (aumentado de 1)
  VERY_LONG: 86400, // 24 hours
  STATIC: 3600, // 1 hour for static data (sports, etc)
};

export class CacheService {
  /**
   * Get cached value
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.warn(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached value
   */
  static async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.warn(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete cached value
   */
  static async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.warn(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Get or set cached value (cache-aside pattern)
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      logger.warn(`Cache invalidate pattern error for ${pattern}:`, error);
    }
  }
}

export { CACHE_TTL };

