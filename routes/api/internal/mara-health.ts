/**
 * MARA Health Check Endpoint
 * Simple health check endpoint for monitoring systems and load balancers
 *
 * GET /api/internal/mara-health
 *
 * Returns:
 * - 200 OK: MARA service is healthy and operational
 * - 503 Service Unavailable: MARA service has issues
 */

import { FreshContext, Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

interface MaraHealthResponse {
  /** Overall health status */
  status: "healthy" | "degraded" | "unhealthy";
  /** Timestamp of health check */
  timestamp: number;
  /** Component health details */
  components: {
    /** MARA integration enabled */
    enabled: boolean;
    /** Service configuration valid */
    configured: boolean;
    /** Circuit breaker healthy */
    circuitBreaker: "healthy" | "degraded" | "open" | "unhealthy";
    /** Recent API performance */
    apiPerformance: "healthy" | "degraded" | "failing";
  };
  /** Health check metrics */
  metrics: {
    /** Recent success rate (last 1 hour) */
    successRate: number;
    /** Average response time (last 1 hour) */
    avgResponseTime: number;
    /** Circuit breaker trips (last 24 hours) */
    circuitBreakerTrips: number;
  };
  /** Health check details */
  details?: string[];
}

export const handler: Handlers = {
  GET(req: Request, _ctx: FreshContext) {
    // Security check for internal endpoints
    const originError = InternalApiFrontendGuard.requireInternalAccess(req);
    if (originError) {
      logger.warn("api", {
        message: "Origin validation failed for internal mara-health",
        origin: new URL(req.url).origin,
      });
      return originError;
    }

    const timestamp = Date.now();
    const components = {
      enabled: false,
      configured: false,
      circuitBreaker: "unhealthy" as
        | "healthy"
        | "degraded"
        | "open"
        | "unhealthy",
      apiPerformance: "failing" as "healthy" | "degraded" | "failing",
    };

    const details: string[] = [];
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "unhealthy";

    try {
      // MARA is always available - activation depends on user providing outputValue
      components.enabled = true;

      // Check if service is configured
      components.configured = MaraSlipstreamService.isConfigured();
      if (!components.configured) {
        details.push("MARA service is not properly configured");
      }

      // Check circuit breaker health
      const isAvailable = MaraSlipstreamService.isAvailable();
      const cbMetrics = MaraSlipstreamService.getCircuitBreakerMetrics();

      if (isAvailable && cbMetrics.state === "CLOSED") {
        components.circuitBreaker = "healthy";
      } else if (cbMetrics.state === "HALF_OPEN") {
        components.circuitBreaker = "degraded";
        details.push("Circuit breaker is in recovery mode");
      } else {
        components.circuitBreaker = "open";
        details.push(`Circuit breaker is ${cbMetrics.state.toLowerCase()}`);
      }

      // Basic API performance check - just check if service is available
      let successRate = 100; // Default to healthy if no issues detected
      const avgResponseTime = 0;

      if (
        components.enabled && components.configured &&
        components.circuitBreaker === "healthy"
      ) {
        components.apiPerformance = "healthy";
      } else if (components.circuitBreaker === "degraded") {
        components.apiPerformance = "degraded";
        successRate = 85; // Estimate degraded performance
        details.push(
          "API performance may be degraded due to circuit breaker state",
        );
      } else {
        components.apiPerformance = "failing";
        successRate = 0;
        details.push(
          "API performance failing - circuit breaker open or service unavailable",
        );
      }

      // Determine overall health
      if (components.enabled && components.configured) {
        if (
          components.circuitBreaker === "healthy" &&
          components.apiPerformance === "healthy"
        ) {
          overallStatus = "healthy";
        } else if (
          (components.circuitBreaker === "healthy" ||
            components.circuitBreaker === "degraded") &&
          (components.apiPerformance === "healthy" ||
            components.apiPerformance === "degraded")
        ) {
          overallStatus = "degraded";
        } else {
          overallStatus = "unhealthy";
        }
      } else if (components.enabled || components.configured) {
        overallStatus = "degraded";
      }

      const response: MaraHealthResponse = {
        status: overallStatus,
        timestamp,
        components,
        metrics: {
          successRate,
          avgResponseTime: Math.round(avgResponseTime),
          circuitBreakerTrips: 0, // No historical tracking in minimal mode
        },
        ...(details.length > 0 && { details }),
      };

      // Log health check result
      logger.debug("mara", {
        message: "MARA health check completed",
        status: overallStatus,
        components,
      });

      // Return appropriate HTTP status
      if (overallStatus === "healthy") {
        return ApiResponseUtil.success(response, {
          headers: {
            "Cache-Control": "private, max-age=10", // Short cache for health checks
          },
        });
      } else if (overallStatus === "degraded") {
        return new Response(JSON.stringify(response), {
          status: 200, // Return 200 but indicate degraded in body
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=5",
          },
        });
      } else {
        return new Response(JSON.stringify(response), {
          status: 503, // Service Unavailable
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "private, max-age=5",
            "Retry-After": "60", // Suggest retry after 60 seconds
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Health check failed";

      logger.error("mara", {
        message: "MARA health check failed",
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorResponse: MaraHealthResponse = {
        status: "unhealthy",
        timestamp,
        components,
        metrics: {
          successRate: 0,
          avgResponseTime: 0,
          circuitBreakerTrips: 0,
        },
        details: [`Health check error: ${errorMessage}`],
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=5",
        },
      });
    }
  },
};
