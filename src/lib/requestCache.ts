/**
 * Request cache and deduplication utility
 * Prevents multiple simultaneous requests to the same endpoint
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
  result?: T;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create a cached request
   */
  async get<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: { ttl?: number; force?: boolean } = {}
  ): Promise<T> {
    const { ttl = this.defaultTTL, force = false } = options;
    const now = Date.now();

    console.log('🗄️ RequestCache: Cache lookup', { key, force, ttl });

    // Check if we have a valid cached entry
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (cached && !force) {
      // If the request is still pending, return the same promise
      if (!cached.result) {
        console.log('⏳ RequestCache: Returning pending request', { key });
        return cached.promise;
      }
      
      // If the cache is still valid, return the cached result
      if (now - cached.timestamp < ttl) {
        console.log('💾 RequestCache: Cache hit - returning cached result', { 
          key, 
          age: now - cached.timestamp, 
          ttl 
        });
        return Promise.resolve(cached.result);
      } else {
        console.log('⏰ RequestCache: Cache expired', { 
          key, 
          age: now - cached.timestamp, 
          ttl 
        });
      }
    } else if (force) {
      console.log('🔄 RequestCache: Force refresh requested', { key });
    } else {
      console.log('🚫 RequestCache: No cache entry found', { key });
    }

    // Create a new request
    console.log('🌐 RequestCache: Creating new request', { key });
    const promise = requestFn().then(result => {
      console.log('✅ RequestCache: Request successful, caching result', { key });
      // Update the cache entry with the result
      const entry = this.cache.get(key) as CacheEntry<T>;
      if (entry) {
        entry.result = result;
        entry.timestamp = now;
      }
      return result;
    }).catch(error => {
      console.error('❌ RequestCache: Request failed, removing from cache', { key, error });
      // Remove failed requests from cache
      this.cache.delete(key);
      throw error;
    });

    // Store the promise in cache
    this.cache.set(key, {
      promise,
      timestamp: now,
    });

    return promise;
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    console.log('🗑️ RequestCache: Invalidating cache entry', { key });
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    console.log('🗑️ RequestCache: Invalidating cache pattern', { pattern: pattern.toString() });
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    console.log('🗑️ RequestCache: Found keys to delete', { keys: keysToDelete, count: keysToDelete.length });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.result && now - entry.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    return {
      total: entries.length,
      pending: entries.filter(([, entry]) => !entry.result).length,
      cached: entries.filter(([, entry]) => !!entry.result).length,
    };
  }
}

// Global request cache instance
export const requestCache = new RequestCache();

// Cleanup expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
  }, 60 * 1000); // Cleanup every minute
}
