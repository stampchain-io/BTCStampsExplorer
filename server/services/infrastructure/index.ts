// Barrel exports for infrastructure services
export * from './cacheService.ts';

// Export only what we need from circuitBreaker to avoid conflicts
export { CircuitBreakerError } from './circuitBreaker.ts';

// Export only what we need from circuitBreakerService to avoid conflicts
export {
  CircuitBreakerService as InfrastructureCircuitBreakerService, MARKET_CAP_FALLBACK_DATA, TRENDING_FALLBACK_DATA
} from './circuitBreakerService.ts';
