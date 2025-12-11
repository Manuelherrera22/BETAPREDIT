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
let useMock = false;
let errorLogged = false;

// Check if Redis should be disabled via environment variable
if (process.env.REDIS_DISABLED === 'true') {
  logger.info('Redis disabled via REDIS_DISABLED, using in-memory cache');
  redisClient = new RedisMock();
  useMock = true;
} else {
  try {
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times: number) => {
        // Stop retrying after 3 attempts
        if (times > 3) {
          if (!useMock && !errorLogged) {
            logger.warn('Redis connection failed after retries, using in-memory cache');
            errorLogged = true;
            useMock = true;
          }
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 1, // Reduce retries
      lazyConnect: true,
      enableOfflineQueue: false, // Don't queue commands when offline
      connectTimeout: 2000, // 2 second timeout
      showFriendlyErrorStack: false, // Reduce error noise
    };

    redisClient = new Redis(redisConfig);
    
    // Set up error handlers
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
      useMock = false;
      errorLogged = false;
    });

    redisClient.on('error', (error: Error) => {
      // Only log error once, not repeatedly
      if (!errorLogged) {
        // Check if it's a connection error (not just a command error)
        if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
          logger.warn('Redis not available, using in-memory cache');
          useMock = true;
          errorLogged = true;
        }
      }
    });

    redisClient.on('close', () => {
      if (!useMock && !errorLogged) {
        logger.debug('Redis connection closed');
      }
    });
  } catch (error) {
    logger.warn('Redis initialization failed, using in-memory cache');
    redisClient = new RedisMock();
    useMock = true;
  }
}

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

