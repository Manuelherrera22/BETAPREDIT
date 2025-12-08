import Redis from 'ioredis';
import { logger } from '../utils/logger';

// Simple in-memory Redis mock if Redis is not available
class RedisMock {
  private data: Map<string, { value: string; expires?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const item = this.data.get(key);
    if (!item) return null;
    if (item.expires && item.expires < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.data.set(key, {
      value,
      expires: Date.now() + seconds * 1000,
    });
  }

  async publish(_channel: string, _message: string): Promise<number> {
    return 1;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0');
    const next = current + 1;
    await this.setex(key, 60, next.toString());
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = this.data.get(key);
    if (item) {
      item.expires = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  }

  async quit(): Promise<void> {
    this.data.clear();
  }
}

let redisClient: any;

try {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };

  redisClient = new Redis(redisConfig);
  
  redisClient.on('error', (_error: Error) => {
    logger.warn('Redis not available, using in-memory cache');
    redisClient = new RedisMock();
  });
} catch (error) {
  logger.warn('Redis not available, using in-memory cache');
  redisClient = new RedisMock();
}

redisClient.on('connect', () => {
  logger.info('✅ Redis connected');
});

redisClient.on('error', (error: Error) => {
  logger.error('❌ Redis error:', error);
});

redisClient.on('close', () => {
  logger.warn('Redis connection closed');
});

// Helper functions for common operations
export const redisHelpers = {
  // Generic get method
  async get(key: string): Promise<string | null> {
    try {
      return await redisClient.get(key);
    } catch (error) {
      logger.debug(`Redis get error for key ${key}, returning null`);
      return null;
    }
  },

  // Generic set method with TTL
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await redisClient.setex(key, ttlSeconds, value);
    } catch (error) {
      logger.debug(`Redis set error for key ${key}, ignoring`);
    }
  },

  // Cache odds with TTL
  async cacheOdds(eventId: string, odds: any, ttl: number = 60) {
    const key = `odds:${eventId}`;
    await this.set(key, JSON.stringify(odds), ttl);
  },

  // Get cached odds
  async getCachedOdds(eventId: string) {
    const key = `odds:${eventId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  },

  // Publish odds update
  async publishOddsUpdate(eventId: string, odds: any) {
    try {
      await redisClient.publish(`odds:${eventId}`, JSON.stringify(odds));
    } catch (error) {
      logger.debug('Redis publish error, ignoring');
    }
  },

  // Rate limiting
  async checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
    try {
      const current = await redisClient.incr(key);
      if (current === 1) {
        await redisClient.expire(key, window);
      }
      return current <= limit;
    } catch (error) {
      logger.debug('Redis rate limit error, allowing request');
      return true; // Allow request if Redis fails
    }
  },
};

// Export redisClient
export { redisClient };

