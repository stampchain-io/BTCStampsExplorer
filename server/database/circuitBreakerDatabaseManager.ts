/**
 * Circuit Breaker Database Manager Wrapper
 *
 * Wraps the existing DatabaseManager with circuit breaker protection
 * to prevent cascading failures during database outages.
 */

import { createDatabaseCircuitBreaker, type CircuitBreaker } from "$/server/utils/circuitBreaker.ts";
import { dbManager } from "./databaseManager.ts";

class CircuitBreakerDatabaseManager {
  private circuitBreaker: CircuitBreaker;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = Deno.env.get("DENO_ENV") === "development";
    this.circuitBreaker = createDatabaseCircuitBreaker('DatabaseOperations', this.isDevelopment);
  }

  /**
   * Execute a query with circuit breaker protection
   */
  async executeQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<{ rows?: T[]; affectedRows?: number }> {
    return this.circuitBreaker.execute(async () => {
      return dbManager.executeQuery(query, params);
    });
  }

  /**
   * Execute a query with caching and circuit breaker protection
   */
  async executeQueryWithCache<T = any>(
    query: string,
    params: any[] = [],
    cacheDuration: number | "never" = 300
  ): Promise<{ rows?: T[] }> {
    return this.circuitBreaker.execute(async () => {
      return dbManager.executeQueryWithCache(query, params, cacheDuration);
    });
  }

  /**
   * Get a client connection with circuit breaker protection
   */
  async getClient() {
    return this.circuitBreaker.execute(async () => {
      return dbManager.getClient();
    });
  }

  /**
   * Release a client connection
   */
  releaseClient(client: any): void {
    dbManager.releaseClient(client);
  }

  /**
   * Get circuit breaker metrics for monitoring
   */
  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  /**
   * Get connection pool statistics
   */
  getConnectionStats() {
    return dbManager.getConnectionStats();
  }

  /**
   * Reset circuit breaker (admin function)
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
  }

  /**
   * Check if circuit is open
   */
  isCircuitOpen(): boolean {
    return this.circuitBreaker.isOpen();
  }

  // Delegate other methods to the original dbManager
  invalidateCacheByPattern(pattern: string) {
    return dbManager.invalidateCacheByPattern(pattern);
  }

  invalidateCacheByCategory(category: string) {
    return dbManager.invalidateCacheByCategory(category);
  }

  handleCache<T = any>(
    key: string,
    fetchData: () => Promise<T>,
    cacheDuration: number | "never"
  ) {
    return dbManager.handleCache(key, fetchData, cacheDuration);
  }

  debugCacheStatus() {
    return dbManager.debugCacheStatus();
  }

  async close() {
    return dbManager.close();
  }

  /**
   * Get current circuit breaker state
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset the circuit breaker (for testing/recovery)
   */
  reset() {
    this.circuitBreaker.reset();
  }
}

// Export a singleton instance
export const circuitBreakerDbManager = new CircuitBreakerDatabaseManager();

// Export the wrapped manager as the default
export { circuitBreakerDbManager as dbManager };
