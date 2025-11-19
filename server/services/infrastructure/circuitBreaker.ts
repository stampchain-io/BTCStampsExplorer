/**
 * Circuit Breaker Service for Database Operations
 *
 * This service now uses the consolidated circuit breaker from utils
 * while maintaining backward compatibility with existing code.
 */

import {
    CircuitBreaker,
    createDatabaseCircuitBreaker
} from "$/server/utils/circuitBreaker.ts";

// Re-export types for backward compatibility
export { CircuitBreakerError } from "$/server/utils/circuitBreaker.ts";

// Legacy interface for backward compatibility
export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
  timeoutDuration: number;
  name?: string;
}

// Legacy metrics interface for backward compatibility
export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  requestCount: number;
  averageResponseTime: number;
}

// Global circuit breaker instances for different operations
export class CircuitBreakerService {
  private static breakers = new Map<string, CircuitBreaker>();

  public static getTrendingBreaker(): CircuitBreaker {
    if (!this.breakers.has('trending')) {
      this.breakers.set('trending', createDatabaseCircuitBreaker('TrendingEndpoint'));
    }
    return this.breakers.get('trending')!;
  }

  public static getMarketCapBreaker(): CircuitBreaker {
    if (!this.breakers.has('marketCap')) {
      this.breakers.set('marketCap', createDatabaseCircuitBreaker('MarketCapEndpoint'));
    }
    return this.breakers.get('marketCap')!;
  }

  public static getBreaker(name: string, _config?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, createDatabaseCircuitBreaker(name));
    }
    return this.breakers.get(name)!;
  }

  public static getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};

    for (const [name, breaker] of this.breakers) {
      const utilsMetrics = breaker.getMetrics();

      // Convert to legacy format for backward compatibility
      metrics[name] = {
        state: utilsMetrics.state as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
        failures: utilsMetrics.failureCount,
        successes: utilsMetrics.successCount,
        lastFailureTime: utilsMetrics.lastFailureTime ? new Date(utilsMetrics.lastFailureTime).getTime() : null,
        lastSuccessTime: utilsMetrics.lastSuccessTime ? new Date(utilsMetrics.lastSuccessTime).getTime() : null,
        requestCount: utilsMetrics.requestCount,
        averageResponseTime: utilsMetrics.averageResponseTime,
      };
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

// Fallback data for trending endpoints
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
