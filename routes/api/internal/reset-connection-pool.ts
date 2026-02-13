import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { serverConfig } from "$server/config/config.ts";

/**
 * Emergency endpoint to reset the database connection pool
 * This should only be used when the connection pool is in an inconsistent state
 */
export const handler: Handlers = {
  async POST(req) {
    try {
      // Security check for internal endpoints
      const originError = await InternalRouteGuard.requireAPIKey(
        req,
      );
      if (originError) {
        logger.warn("database", {
          message: "Origin validation failed for connection pool reset",
          origin: new URL(req.url).origin,
        });
        return originError;
      }

      // Additional security: require a secret token
      const token = req.headers.get("x-reset-token");
      const expectedToken = serverConfig.CONNECTION_POOL_RESET_TOKEN;

      if (!expectedToken || token !== expectedToken) {
        return ApiResponseUtil.forbidden("Invalid reset token");
      }

      // Database manager instance is already imported

      // Get current stats before reset
      const beforeStats = dbManager.getConnectionStats();
      logger.warn("database", {
        message: "Connection pool reset initiated",
        beforeStats,
      });

      // Reset the connection pool
      await dbManager.resetConnectionPool();

      // Get stats after reset
      const afterStats = dbManager.getConnectionStats();

      logger.info("database", {
        message: "Connection pool reset completed",
        beforeStats,
        afterStats,
      });

      return ApiResponseUtil.success({
        message: "Connection pool reset successfully",
        before: beforeStats,
        after: afterStats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("database", {
        message: "Error resetting connection pool",
        error: error instanceof Error ? error.message : String(error),
      });

      return ApiResponseUtil.internalError(
        error,
        "Failed to reset connection pool",
      );
    }
  },

  // GET endpoint to check connection pool status
  async GET(req) {
    try {
      // Security check for internal endpoints
      const originError = await InternalRouteGuard.requireAPIKey(
        req,
      );
      if (originError) {
        return originError;
      }

      const stats = dbManager.getConnectionStats();

      // Calculate pool health
      const poolUtilization = stats.totalConnections > 0
        ? (stats.activeConnections / stats.maxPoolSize) * 100
        : 0;

      const health = {
        healthy: poolUtilization < 80,
        warning: poolUtilization >= 80 && poolUtilization < 95,
        critical: poolUtilization >= 95,
      };

      return ApiResponseUtil.success({
        stats,
        poolUtilization: `${poolUtilization.toFixed(1)}%`,
        health,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return ApiResponseUtil.internalError(
        error,
        "Failed to get connection pool status",
      );
    }
  },
};
