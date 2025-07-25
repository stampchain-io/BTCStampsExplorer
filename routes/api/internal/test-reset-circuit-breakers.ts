import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { CircuitBreakerService } from "$server/services/infrastructure/circuitBreaker.ts";

export const handler: Handlers = {
  POST(_req) {
    try {
      // Reset all circuit breakers
      CircuitBreakerService.resetAllBreakers();

      return ApiResponseUtil.success({
        message: "All circuit breakers reset successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Failed to reset circuit breakers",
      );
    }
  },

  GET(_req) {
    try {
      // Get all circuit breaker metrics
      const metrics = CircuitBreakerService.getAllMetrics();

      return ApiResponseUtil.success({
        circuitBreakers: metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Failed to get circuit breaker metrics",
      );
    }
  },
};
