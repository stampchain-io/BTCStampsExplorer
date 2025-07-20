// routes/api/internal/monitoring.ts
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { cloudWatchMonitoring } from "$server/services/aws/cloudWatchMonitoring.ts";
import { objectPoolManager } from "$server/services/memory/objectPool.ts";
import { memoryMonitor } from "$server/services/monitoring/memoryMonitorService.ts";
import process from "node:process";

export async function handler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "health";

    logger.info("api", { message: "Internal monitoring request", action });

    switch (action) {
      case "memory":
        return await handleMemoryAction();
      case "cloudwatch":
        return await handleCloudWatchAction();
      case "ecs":
        return await handleECSAction();
      case "pools":
        return await handlePoolsAction();
      case "business":
        return await handleBusinessMetricsAction();
      case "health":
      default:
        return await handleHealthAction();
    }
  } catch (error) {
    logger.error("api", {
      message: "Internal monitoring error",
      error: String(error),
    });
    return ApiResponseUtil.internalError(
      "Internal monitoring failed",
      String(error),
    );
  }
}

/**
 * Handle health check action
 */
function handleHealthAction(): Promise<Response> {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      node_version: process.version,
      environment: Deno.env.get("DENO_ENV") || "development",
    };

    return Promise.resolve(ApiResponseUtil.success(health));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Health check failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Handle memory monitoring action
 */
function handleMemoryAction(): Promise<Response> {
  try {
    const memoryStats = memoryMonitor.getMemoryStats();
    return Promise.resolve(ApiResponseUtil.success(memoryStats));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Memory monitoring failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Handle CloudWatch monitoring action
 */
function handleCloudWatchAction(): Promise<Response> {
  try {
    const monitoringStatus = cloudWatchMonitoring.getMonitoringStatus();
    return Promise.resolve(ApiResponseUtil.success(monitoringStatus));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "CloudWatch monitoring failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Handle ECS-specific monitoring action
 */
function handleECSAction(): Promise<Response> {
  try {
    const ecsStatus = {
      detected: cloudWatchMonitoring.getMonitoringStatus().ecsDetected,
      environment: cloudWatchMonitoring.getMonitoringStatus().awsEnvironment,
      timestamp: new Date().toISOString(),
    };
    return Promise.resolve(ApiResponseUtil.success(ecsStatus));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "ECS status failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Handle object pools monitoring action
 */
function handlePoolsAction(): Promise<Response> {
  try {
    const poolStats = objectPoolManager.getAllMetrics();
    return Promise.resolve(ApiResponseUtil.success(poolStats));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Pool stats failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Handle business metrics action
 */
function handleBusinessMetricsAction(): Promise<Response> {
  try {
    const businessMetrics = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      // Add business metrics here
    };
    return Promise.resolve(ApiResponseUtil.success(businessMetrics));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Business metrics failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}
