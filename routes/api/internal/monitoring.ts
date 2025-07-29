// routes/api/internal/monitoring.ts
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { cloudWatchMonitoring } from "$server/services/aws/cloudWatchMonitoring.ts";
import { objectPoolManager } from "$server/services/memory/objectPool.ts";
import { memoryMonitor } from "$server/services/monitoring/memoryMonitorService.ts";
import process from "node:process";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export async function handler(req: Request): Promise<Response> {
  // Security check for internal endpoints
  const accessError = InternalRouteGuard.requireAPIKey(req);
  if (accessError) return accessError;

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
      case "database":
        return await handleDatabaseAction(req);
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
 * Handle database connection pool monitoring action
 */
async function handleDatabaseAction(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const subAction = url.searchParams.get("subaction") || "status";

    switch (subAction) {
      case "status":
        return await handleDatabaseStatus();
      case "reset":
        return await handleDatabaseReset();
      default:
        return await handleDatabaseStatus();
    }
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Database monitoring failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Get database connection pool status
 */
function handleDatabaseStatus(): Promise<Response> {
  try {
    const stats = dbManager.getConnectionStats();
    const status = {
      connectionPool: stats,
      health: {
        poolUtilization: stats.totalConnections / stats.maxPoolSize,
        hasAvailableConnections: stats.poolSize > 0 ||
          stats.activeConnections < stats.maxPoolSize,
        isHealthy: stats.totalConnections <= stats.maxPoolSize,
      },
      timestamp: new Date().toISOString(),
    };

    return Promise.resolve(ApiResponseUtil.success(status));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Database status failed",
        error instanceof Error ? error.message : "Unknown error",
      ),
    );
  }
}

/**
 * Reset database connection pool (emergency recovery)
 */
async function handleDatabaseReset(): Promise<Response> {
  try {
    const beforeStats = dbManager.getConnectionStats();
    await dbManager.resetConnectionPool();
    const afterStats = dbManager.getConnectionStats();

    const result = {
      action: "reset",
      before: beforeStats,
      after: afterStats,
      timestamp: new Date().toISOString(),
    };

    logger.warn("api", {
      message: "Database connection pool reset via monitoring endpoint",
      beforeStats,
      afterStats,
    });

    return Promise.resolve(ApiResponseUtil.success(result));
  } catch (error) {
    return Promise.resolve(
      ApiResponseUtil.internalError(
        "Database reset failed",
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
