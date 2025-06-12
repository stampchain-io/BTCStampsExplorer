import { Handlers } from "$fresh/server.ts";
import {
  getActiveAlerts,
  getAlertsBySeverity,
  getFeeSourceHealth,
  getMonitoringMetrics,
  logMonitoringSummary,
} from "$lib/utils/monitoring.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "summary";

    try {
      switch (action) {
        case "summary": {
          const health = getFeeSourceHealth();
          const activeAlerts = getActiveAlerts();

          return Response.json({
            health,
            activeAlerts: activeAlerts.length,
            criticalAlerts: getAlertsBySeverity("critical").length,
            highAlerts: getAlertsBySeverity("high").length,
            timestamp: Date.now(),
          });
        }

        case "metrics": {
          const metrics = getMonitoringMetrics();
          return Response.json(metrics);
        }

        case "alerts": {
          const severity = url.searchParams.get("severity");
          const alerts = severity
            ? getAlertsBySeverity(severity as any)
            : getActiveAlerts();

          return Response.json({
            alerts,
            count: alerts.length,
            timestamp: Date.now(),
          });
        }

        case "health": {
          const health = getFeeSourceHealth();
          return Response.json({
            sources: health,
            overall: determineOverallHealth(health),
            timestamp: Date.now(),
          });
        }

        case "log": {
          // Log summary to console (useful for debugging)
          logMonitoringSummary();
          return Response.json({
            message: "Monitoring summary logged to console",
            timestamp: Date.now(),
          });
        }

        default:
          return Response.json(
            {
              error:
                "Invalid action. Use: summary, metrics, alerts, health, or log",
            },
            { status: 400 },
          );
      }
    } catch (error) {
      console.error("[monitoring API] Error:", error);
      return Response.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      );
    }
  },
};

/**
 * Determine overall system health based on individual source health
 */
function determineOverallHealth(health: Record<string, any>): {
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
} {
  const sources = Object.values(health);

  if (sources.length === 0) {
    return {
      status: "unhealthy",
      message: "No fee sources available",
    };
  }

  const healthyCount = sources.filter((s) => s.status === "healthy").length;
  const degradedCount = sources.filter((s) => s.status === "degraded").length;
  const unhealthyCount = sources.filter((s) => s.status === "unhealthy").length;

  if (unhealthyCount === sources.length) {
    return {
      status: "unhealthy",
      message: "All fee sources are unhealthy",
    };
  }

  if (healthyCount === 0) {
    return {
      status: "degraded",
      message: `${degradedCount} degraded, ${unhealthyCount} unhealthy sources`,
    };
  }

  if (unhealthyCount > 0 || degradedCount > 0) {
    return {
      status: "degraded",
      message:
        `${healthyCount} healthy, ${degradedCount} degraded, ${unhealthyCount} unhealthy sources`,
    };
  }

  return {
    status: "healthy",
    message: `All ${healthyCount} sources are healthy`,
  };
}
