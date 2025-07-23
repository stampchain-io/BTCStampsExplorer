/**
 * Circuit Breaker for BTC Price Service APIs
 *
 * This now uses the consolidated circuit breaker from utils
 * while maintaining backward compatibility with existing code.
 */

import {
    CircuitBreaker,
    CircuitBreakerError,
    CircuitState,
    createPriceServiceCircuitBreaker,
    type CircuitBreakerMetrics
} from "$/server/utils/circuitBreaker.ts";

// Re-export everything for backward compatibility
export {
    CircuitBreaker, CircuitBreakerError, CircuitState, createPriceServiceCircuitBreaker,
    type CircuitBreakerMetrics
};

// Legacy interface for backward compatibility
export interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening
  recoveryTimeout: number;      // Time to wait before trying HALF_OPEN (ms)
  successThreshold: number;     // Successes needed in HALF_OPEN to close
  timeout: number;             // Request timeout (ms)
  monitoringPeriod: number;    // Period to track failures (ms)
}

// Factory function using legacy config format
export function createLegacyPriceCircuitBreaker(
  name: string,
  _config: CircuitBreakerConfig // Prefixed with underscore to indicate intentionally unused
): CircuitBreaker {
  return createPriceServiceCircuitBreaker(name);
}
