/**
 * Circuit Breaker Service for Database Operations
 *
 * Implements circuit breaker pattern to prevent cascading failures
 * when database operations timeout or fail repeatedly in ECS environment
 */

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
  timeoutDuration: number;
  name?: string;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  requestCount: number;
  averageResponseTime: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly circuitState: string,
    public readonly metrics: CircuitBreakerMetrics
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private requestCount = 0;
  private totalResponseTime = 0;
  private readonly name: string;

  constructor(private readonly options: CircuitBreakerOptions) {
    this.name = options.name || 'UnnamedCircuit';
  }

  public async execute<T>(
    operation: () => Promise<T>,
    fallbackData?: T
  ): Promise<T> {
    const startTime = Date.now();

    if (this.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - (this.lastFailureTime || 0);

      if (timeSinceLastFailure < this.options.resetTimeout) {
        console.log(`[CircuitBreaker:${this.name}] Circuit is OPEN, using fallback data`);

        if (fallbackData !== undefined) {
          return fallbackData;
        }

        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.name}`,
          this.state,
          this.getMetrics()
        );
      }

      // Try to transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN state`);
    }

    try {
      const result = await this.executeWithTimeout(operation);

      const responseTime = Date.now() - startTime;
      this.onSuccess(responseTime);

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.onFailure(error, responseTime);

      if (fallbackData !== undefined) {
        console.log(`[CircuitBreaker:${this.name}] Operation failed, using fallback data`);
        return fallbackData;
      }

      throw error;
    }
  }

  private executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.options.timeoutDuration}ms`));
      }, this.options.timeoutDuration);

      operation()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(responseTime: number): void {
    this.successes++;
    this.requestCount++;
    this.totalResponseTime += responseTime;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] Success in HALF_OPEN, transitioning to CLOSED`);
      this.state = 'CLOSED';
      this.failures = 0; // Reset failure count
    }

    console.log(`[CircuitBreaker:${this.name}] Success - Response time: ${responseTime}ms, State: ${this.state}`);
  }

  private onFailure(error: any, responseTime: number): void {
    this.failures++;
    this.requestCount++;
    this.totalResponseTime += responseTime;
    this.lastFailureTime = Date.now();

    console.error(`[CircuitBreaker:${this.name}] Failure - ${error.message}, Response time: ${responseTime}ms`);

    if (this.state === 'HALF_OPEN') {
      console.log(`[CircuitBreaker:${this.name}] Failure in HALF_OPEN, transitioning to OPEN`);
      this.state = 'OPEN';
    } else if (this.failures >= this.options.failureThreshold) {
      console.log(`[CircuitBreaker:${this.name}] Failure threshold reached (${this.failures}), transitioning to OPEN`);
      this.state = 'OPEN';
    }
  }

  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      requestCount: this.requestCount,
      averageResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
    };
  }

  public reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.requestCount = 0;
    this.totalResponseTime = 0;
    console.log(`[CircuitBreaker:${this.name}] Circuit breaker reset`);
  }

  public forceOpen(): void {
    this.state = 'OPEN';
    console.log(`[CircuitBreaker:${this.name}] Circuit breaker forced OPEN`);
  }

  public forceClose(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    console.log(`[CircuitBreaker:${this.name}] Circuit breaker forced CLOSED`);
  }
}

// Global circuit breaker instances for different operations
export class CircuitBreakerService {
  private static breakers = new Map<string, CircuitBreaker>();

  // ECS-optimized circuit breaker configurations
  private static readonly ECS_CONFIG: CircuitBreakerOptions = {
    failureThreshold: 3,        // Open after 3 failures
    resetTimeout: 30000,        // Try again after 30 seconds
    monitoringWindow: 60000,    // Monitor over 1 minute
    timeoutDuration: 10000,     // 10 second timeout for ECS
  };

  private static readonly TRENDING_CONFIG: CircuitBreakerOptions = {
    ...CircuitBreakerService.ECS_CONFIG,
    timeoutDuration: 12000,     // Slightly longer for complex trending queries
    name: 'TrendingEndpoint',
  };

  private static readonly MARKET_CAP_CONFIG: CircuitBreakerOptions = {
    ...CircuitBreakerService.ECS_CONFIG,
    timeoutDuration: 8000,      // Market cap queries should be faster
    name: 'MarketCapEndpoint',
  };

  public static getTrendingBreaker(): CircuitBreaker {
    if (!this.breakers.has('trending')) {
      this.breakers.set('trending', new CircuitBreaker(this.TRENDING_CONFIG));
    }
    return this.breakers.get('trending')!;
  }

  public static getMarketCapBreaker(): CircuitBreaker {
    if (!this.breakers.has('marketCap')) {
      this.breakers.set('marketCap', new CircuitBreaker(this.MARKET_CAP_CONFIG));
    }
    return this.breakers.get('marketCap')!;
  }

  public static getBreaker(name: string, config?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(config || this.ECS_CONFIG));
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
