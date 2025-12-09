/**
 * API Cache Utility
 * Implements in-memory and localStorage caching for API responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class APICache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly MEMORY_CACHE_MAX_SIZE = 100;
  private readonly STORAGE_PREFIX = 'betapredit_cache_';

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
      return memoryEntry.data as T;
    }
    if (memoryEntry) {
      this.memoryCache.delete(key);
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${this.STORAGE_PREFIX}${key}`);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (Date.now() < entry.expiresAt) {
          // Also store in memory for faster access
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
        }
      }
    } catch (e) {
      // localStorage might be disabled or full
      console.warn('Failed to read from localStorage cache:', e);
    }

    return null;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    const entry: CacheEntry<T> = { data, timestamp: Date.now(), expiresAt };

    // Store in memory
    if (this.memoryCache.size >= this.MEMORY_CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey !== undefined) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, entry);

    // Store in localStorage
    try {
      localStorage.setItem(`${this.STORAGE_PREFIX}${key}`, JSON.stringify(entry));
    } catch (e) {
      // localStorage might be full, just use memory cache
      console.warn('Failed to write to localStorage cache:', e);
    }
  }

  /**
   * Clear cache for a specific key
   */
  clear(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`${this.STORAGE_PREFIX}${key}`);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.memoryCache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Generate cache key from parameters
   */
  static generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    return `${prefix}_${sortedParams}`;
  }
}

export const apiCache = new APICache();
export { APICache };
export default apiCache;

