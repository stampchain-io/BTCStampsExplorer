/**
 * Circuit Breaker Service for Database Operations
 *
 * Implements circuit breaker pattern to prevent cascading failures
 * when database operations timeout or fail repeatedly in ECS environment
 *
 * This service now uses the consolidated circuit breaker from utils
 */

import {
    CircuitBreaker,
    CircuitBreakerMetrics,
    createApiCircuitBreaker
} from "$/server/utils/circuitBreaker.ts";

// Re-export types for backward compatibility
export { CircuitBreakerError, type CircuitBreakerMetrics } from "$/server/utils/circuitBreaker.ts";

// Legacy interface for backward compatibility
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
  timeoutDuration: number;
  name?: string;
}

// Global circuit breaker instances for different operations
export class CircuitBreakerService {
  private static breakers = new Map<string, CircuitBreaker>();

  public static getTrendingBreaker(): CircuitBreaker {
    if (!this.breakers.has('trending')) {
      this.breakers.set('trending', createApiCircuitBreaker('TrendingEndpoint', 12000));
    }
    return this.breakers.get('trending')!;
  }

  public static getMarketCapBreaker(): CircuitBreaker {
    if (!this.breakers.has('marketCap')) {
      this.breakers.set('marketCap', createApiCircuitBreaker('MarketCapEndpoint', 8000));
    }
    return this.breakers.get('marketCap')!;
  }

  public static getBreaker(name: string, config?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      // Convert legacy config to new format if provided
      const timeoutDuration = config?.timeoutDuration || 10000;
      this.breakers.set(name, createApiCircuitBreaker(config?.name || name, timeoutDuration));
    }
    return this.breakers.get(name)!;
  }

  public static getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }

    return metrics;
  }

  public static resetAllBreakers(): void {
    for (const [name, breaker] of this.breakers) {
      breaker.reset();
      console.log(`[CircuitBreakerService] Reset breaker: ${name}`);
    }
  }
}

// Fallback data for trending endpoints (unchanged)
export const TRENDING_FALLBACK_DATA = {
  data: [],
  total: 0,
  page: 1,
  totalPages: 0,
  limit: 50,
  last_block: 0,
  isFromFallback: true,
  fallbackReason: 'Circuit breaker activated due to repeated failures',
};

export const MARKET_CAP_FALLBACK_DATA = {
  data: [],
  total: 0,
  page: 1,
  totalPages: 0,
  limit: 50,
  last_block: 0,
  isFromFallback: true,
  fallbackReason: 'Circuit breaker activated due to repeated failures',
};
