/**
 * Cache Service Interface for Dependency Injection
 * Abstracts caching operations for better testability
 */

export interface CacheConfig {
  duration: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  ttl?: number;
}

// Interface for dbManager with proper generic typing
export interface DbManager {
  handleCache<T>(
    key: string,
    factory: () => Promise<T>,
    duration: number
  ): Promise<T>;
  getFromCache<T>(key: string): Promise<T | null>;
}

export interface CacheService {
  /**
   * Get a value from cache or compute it using the factory function
   */
  get<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<T>;

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  /**
   * Get a value from cache without fallback
   */
  getOnly<T>(key: string): Promise<T | null>;

  /**
   * Delete a key from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;

  /**
   * Check if a key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<{
    hits: number;
    misses: number;
    entries: number;
  }>;
}

/**
 * In-memory cache implementation for testing
 */
export class InMemoryCacheService implements CacheService {
  private cache = new Map<string, {
    value: any;
    expiry: number;
    createdAt: number;
  }>();
  
  private stats = {
    hits: 0,
    misses: 0,
  };

  async get<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Check if cache entry exists and is not expired
    if (cached && cached.expiry > now) {
      this.stats.hits++;
      return cached.value as T;
    }

    // Cache miss or expired - compute new value
    this.stats.misses++;
    const value = await factory();
    
    await this.set(key, value, config.duration);
    return value;
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now(),
    });
    // Simulate async operation for consistency
    await Promise.resolve();
  }

  async getOnly<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && cached.expiry > now) {
      this.stats.hits++;
      // Simulate async operation for consistency
      await Promise.resolve();
      return cached.value as T;
    }

    this.stats.misses++;
    // Simulate async operation for consistency
    await Promise.resolve();
    return null;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    // Simulate async operation for consistency
    await Promise.resolve();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    // Simulate async operation for consistency
    await Promise.resolve();
  }

  async exists(key: string): Promise<boolean> {
    const cached = this.cache.get(key);
    // Simulate async operation for consistency
    await Promise.resolve();
    return cached ? cached.expiry > Date.now() : false;
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    entries: number;
  }> {
    // Clean expired entries before reporting
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }

    // Simulate async operation for consistency
    await Promise.resolve();
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
    };
  }
}

/**
 * Redis-based cache adapter (wrapper for existing dbManager)
 */
export class RedisCacheService implements CacheService {
  constructor(private dbManager: DbManager) {}

  async get<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    return await this.dbManager.handleCache<T>(
      key,
      factory,
      config.duration
    );
  }

  async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    // Use dbManager's cache setting capability if available
    // This is a simplified implementation - may need adjustment based on dbManager API
    await this.dbManager.handleCache(
      key,
      () => Promise.resolve(value),
      ttlSeconds
    );
  }

  async getOnly<T>(key: string): Promise<T | null> {
    try {
      // Try to get from cache without factory fallback
      // This might need adjustment based on dbManager's actual API
      return await this.dbManager.getFromCache<T>(key);
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    // Set very short expiry to effectively delete
    await this.dbManager.handleCache(
      key,
      () => Promise.resolve(null),
      1 // 1 second
    );
  }

  async clear(): Promise<void> {
    // Redis-based clearing would need dbManager support
    // This is a placeholder implementation
    await Promise.resolve();
    throw new Error("Clear operation not supported by Redis cache adapter");
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.getOnly(key);
    return value !== null;
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    entries: number;
  }> {
    // Redis stats would need dbManager support
    // This is a placeholder implementation
    await Promise.resolve();
    return {
      hits: 0,
      misses: 0,
      entries: 0,
    };
  }
}