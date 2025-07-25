import { RouteContext } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { memoryMonitor } from "$server/services/monitoring/memoryMonitorService.ts";

/**
 * Memory Health Check Endpoint
 * Container-agnostic memory monitoring for health checks
 * Used by load balancers, orchestrators, and monitoring systems
 */
export const handler = {
  GET(_req: Request, _ctx: RouteContext) {
    try {
      const healthStatus = memoryMonitor.getHealthStatus();
      const memoryStats = memoryMonitor.getMemoryStats();

      // HTTP status based on memory health
      const httpStatus = healthStatus.status === "critical"
        ? 503
        : healthStatus.status === "warning"
        ? 200
        : 200;

      const response = {
        status: healthStatus.status,
        message: healthStatus.message,
        timestamp: new Date().toISOString(),
        uptime: memoryStats.health.uptimeSeconds,
        memory: {
          usage: {
            current: memoryStats.usage.formatted.current,
            peak: memoryStats.usage.formatted.peak,
            percentage: Math.round(
              (memoryStats.usage.current.rss / memoryStats.limits.heapLimit) *
                100,
            ),
          },
          limits: memoryStats.limits.formatted,
          pressure: memoryStats.health.pressure,
          leakDetected: memoryStats.health.leakDetected,
        },
        container: {
          platform: "docker", // Generic container platform
          memoryLimitDetected: memoryStats.limits.heapLimit > 512 * 1024 * 1024,
        },
      };

      return ApiResponseUtil.success(response, {
        status: httpStatus,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Memory-Pressure": memoryStats.health.pressure,
          "X-Memory-Usage-Percent": String(
            Math.round(
              (memoryStats.usage.current.rss / memoryStats.limits.heapLimit) *
                100,
            ),
          ),
        },
      });
    } catch (error) {
      console.error(
        "[MemoryHealthEndpoint] Error getting memory status:",
        error,
      );

      return ApiResponseUtil.internalError(
        error instanceof Error ? error : new Error(String(error)),
        "Unable to get memory status",
        {
          headers: {
            "Cache-Control": "no-cache",
          },
        },
      );
    }
  },
};
