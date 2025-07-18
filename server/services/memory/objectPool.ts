/**
 * Object Pool Service for Memory Optimization
 * Reduces memory allocation overhead by reusing objects
 * Particularly useful for blockchain data processing and API responses
 */

export interface PoolableObject {
  reset?(): void;  // Optional method to reset object state
}

export interface PoolConfig {
  maxSize: number;      // Maximum objects to keep in pool
  createFn: () => any;  // Factory function to create new objects
  resetFn?: (obj: any) => void;  // Optional reset function
  validateFn?: (obj: any) => boolean;  // Optional validation function
}

export interface PoolMetrics {
  totalCreated: number;
  totalBorrowed: number;
  totalReturned: number;
  currentPoolSize: number;
  maxPoolSize: number;
  hitRate: number;  // Percentage of requests served from pool
  memoryEstimate: number;  // Rough memory usage estimate
}

/**
 * Generic Object Pool Implementation
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly maxSize: number;
  private readonly createFn: () => T;
  private readonly resetFn?: (obj: T) => void;
  private readonly validateFn?: (obj: T) => boolean;

  // Metrics
  private totalCreated = 0;
  private totalBorrowed = 0;
  private totalReturned = 0;
  private totalHits = 0;

  constructor(config: PoolConfig) {
    this.maxSize = config.maxSize;
    this.createFn = config.createFn;
    if (config.resetFn) {
      this.resetFn = config.resetFn;
    }
    if (config.validateFn) {
      this.validateFn = config.validateFn;
    }
  }

  /**
   * Borrow an object from the pool
   */
  borrow(): T {
    this.totalBorrowed++;

    if (this.pool.length > 0) {
      const obj = this.pool.pop()!;

      // Validate object if validator provided
      if (this.validateFn && !this.validateFn(obj)) {
        // Object is invalid, create a new one
        this.totalCreated++;
        return this.createFn();
      }

      this.totalHits++;
      return obj;
    }

    // No objects in pool, create new one
    this.totalCreated++;
    return this.createFn();
  }

  /**
   * Return an object to the pool
   */
  return(obj: T): void {
    if (!obj) return;

    this.totalReturned++;

    // Don't exceed max pool size
    if (this.pool.length >= this.maxSize) {
      return;
    }

    // Reset object state if reset function provided
    if (this.resetFn) {
      this.resetFn(obj);
    } else if (typeof (obj as any).reset === "function") {
      (obj as any).reset();
    }

    // Add back to pool
    this.pool.push(obj);
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    const hitRate = this.totalBorrowed > 0
      ? (this.totalHits / this.totalBorrowed) * 100
      : 0;

    return {
      totalCreated: this.totalCreated,
      totalBorrowed: this.totalBorrowed,
      totalReturned: this.totalReturned,
      currentPoolSize: this.pool.length,
      maxPoolSize: this.maxSize,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryEstimate: this.pool.length * 1024 // Rough estimate
    };
  }

  /**
   * Clear the pool and reset metrics
   */
  clear(): void {
    this.pool.length = 0;
    this.totalCreated = 0;
    this.totalBorrowed = 0;
    this.totalReturned = 0;
    this.totalHits = 0;
  }

  /**
   * Pre-warm the pool with objects
   */
  warmUp(count: number): void {
    for (let i = 0; i < Math.min(count, this.maxSize); i++) {
      const obj = this.createFn();
      this.totalCreated++;
      this.pool.push(obj);
    }
  }
}

/**
 * Global Object Pool Manager
 * Manages multiple pools for different object types
 */
export class ObjectPoolManager {
  private static instance: ObjectPoolManager;
  private pools = new Map<string, ObjectPool<any>>();

  private constructor() {}

  static getInstance(): ObjectPoolManager {
    if (!ObjectPoolManager.instance) {
      ObjectPoolManager.instance = new ObjectPoolManager();
    }
    return ObjectPoolManager.instance;
  }

  /**
   * Register a new object pool
   */
  registerPool<T>(name: string, config: PoolConfig): ObjectPool<T> {
    const pool = new ObjectPool<T>(config);
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Get a registered pool
   */
  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * Get metrics for all pools
   */
  getAllMetrics(): Record<string, PoolMetrics> {
    const metrics: Record<string, PoolMetrics> = {};
    for (const [name, pool] of this.pools.entries()) {
      metrics[name] = pool.getMetrics();
    }
    return metrics;
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    for (const pool of this.pools.values()) {
      pool.clear();
    }
  }

  /**
   * Get total memory estimate across all pools
   */
  getTotalMemoryEstimate(): number {
    let total = 0;
    for (const pool of this.pools.values()) {
      total += pool.getMetrics().memoryEstimate;
    }
    return total;
  }
}

// Export singleton instance
export const objectPoolManager = ObjectPoolManager.getInstance();
