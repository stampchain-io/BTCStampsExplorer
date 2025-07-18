/**
 * Circuit Breaker for BTC Price Service APIs
 * Implements the Circuit Breaker pattern to prevent cascading failures
 */

export enum CircuitState {
  CLOSED = "CLOSED",     // Normal operation - requests allowed
  OPEN = "OPEN",         // Circuit is open - requests blocked
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
  PERMANENTLY_OPEN = "PERMANENTLY_OPEN" // Circuit permanently disabled (e.g., 451 errors)
}

export interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;      // Time to wait before trying HALF_OPEN (ms)
  successThreshold: number;     // Successes needed in HALF_OPEN to close
  timeout: number;             // Request timeout (ms)
  monitoringPeriod: number;    // Period to track failures (ms)
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  openedAt: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number = 0;
  private lastSuccessTime: number = 0;
  private openedAt: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;
  private recentFailures: number[] = []; // Timestamps of recent failures
  private permanentDisableReason?: string;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Check if permanently disabled
    if (this.state === CircuitState.PERMANENTLY_OPEN) {
      const error = new Error(`Circuit breaker is PERMANENTLY DISABLED for ${this.name}. Reason: ${this.permanentDisableReason || 'Unknown'}`);
      error.name = "CircuitBreakerPermanentlyOpenError";
      throw error;
    }

    // Check if circuit should be opened based on recent failures
    this.updateStateBasedOnRecentFailures();

    if (this.state === CircuitState.OPEN) {
      // Check if recovery timeout has passed
      if (Date.now() - this.openedAt >= this.config.recoveryTimeout) {
        console.log(`[CircuitBreaker:${this.name}] Moving to HALF_OPEN state for recovery test`);
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
      } else {
        const error = new Error(`Circuit breaker is OPEN for ${this.name}. Will retry in ${Math.ceil((this.config.recoveryTimeout - (Date.now() - this.openedAt)) / 1000)}s`);
        error.name = "CircuitBreakerOpenError";
        throw error;
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

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

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failures = 0;
    this.successes++;
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successes >= this.config.successThreshold) {
        console.log(`[CircuitBreaker:${this.name}] Recovery successful, closing circuit`);
        this.state = CircuitState.CLOSED;
        this.successes = 0;
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.recentFailures.push(Date.now());

    // Clean old failures outside monitoring period
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.recentFailures = this.recentFailures.filter(time => time > cutoff);

    console.warn(`[CircuitBreaker:${this.name}] Failure recorded (${this.failures}/${this.config.failureThreshold}):`,
                 error instanceof Error ? error.message : String(error));

    // Check for permanent failure conditions (e.g., 451 Legal Restriction)
    if (error instanceof Error && error.message.includes("unavailable for legal reasons (451)")) {
      this.permanentlyDisable(error.message);
      return;
    }

    // Check if circuit should open
    if (this.state === CircuitState.CLOSED && this.shouldOpenCircuit()) {
      this.openCircuit();
    } else if (this.state === CircuitState.HALF_OPEN) {
      // Failed during recovery test - go back to OPEN
      console.log(`[CircuitBreaker:${this.name}] Recovery test failed, reopening circuit`);
      this.openCircuit();
    }
  }

  /**
   * Check if circuit should open based on recent failures
   */
  private shouldOpenCircuit(): boolean {
    return this.recentFailures.length >= this.config.failureThreshold;
  }

  /**
   * Update state based on recent failures (cleanup old failures)
   */
  private updateStateBasedOnRecentFailures(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.recentFailures = this.recentFailures.filter(time => time > cutoff);
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = CircuitState.OPEN;
    this.openedAt = Date.now();
    this.successes = 0;
    console.warn(`[CircuitBreaker:${this.name}] Circuit OPENED due to ${this.recentFailures.length} failures in ${this.config.monitoringPeriod}ms`);
  }

  /**
   * Permanently disable the circuit breaker
   */
  private permanentlyDisable(reason: string): void {
    this.state = CircuitState.PERMANENTLY_OPEN;
    this.permanentDisableReason = reason;
    this.openedAt = Date.now();
    console.error(`[CircuitBreaker:${this.name}] Circuit PERMANENTLY DISABLED: ${reason}`);
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      openedAt: this.openedAt,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get health status
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  /**
   * Check if permanently disabled
   */
  isPermanentlyDisabled(): boolean {
    return this.state === CircuitState.PERMANENTLY_OPEN;
  }

  /**
   * Force reset the circuit breaker (for testing/admin purposes)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.recentFailures = [];
    console.log(`[CircuitBreaker:${this.name}] Circuit breaker reset to CLOSED state`);
  }

  /**
   * Get exponential backoff delay for retries
   */
  getBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }
}
