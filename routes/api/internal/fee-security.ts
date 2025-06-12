import { Handlers } from "$fresh/server.ts";
import { FeeSecurityService } from "$server/services/fee/feeSecurityService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // CSRF protection for internal endpoints
      const csrfResult = await InternalRouteGuard.requireCSRF(req);
      if (csrfResult) {
        return csrfResult; // Return the error response directly
      }

      const url = new URL(req.url);
      const action = url.searchParams.get("action") || "report";

      switch (action) {
        case "report": {
          const report = FeeSecurityService.getSecurityReport();
          return Response.json({
            success: true,
            data: report,
            timestamp: Date.now(),
          });
        }

        case "summary": {
          const report = FeeSecurityService.getSecurityReport();
          return Response.json({
            success: true,
            data: {
              totalEvents: report.summary.totalEvents,
              eventsByType: report.summary.eventsByType,
              eventsBySeverity: report.summary.eventsBySeverity,
              recentCritical: report.recentEvents
                .filter((e) => e.severity === "critical")
                .slice(-5),
              config: {
                minFeeRate: report.config.minFeeRate,
                maxFeeRate: report.config.maxFeeRate,
                maxCacheAge: report.config.maxCacheAge,
              },
            },
            timestamp: Date.now(),
          });
        }

        case "events": {
          const report = FeeSecurityService.getSecurityReport();
          const severity = url.searchParams.get("severity");
          const type = url.searchParams.get("type");
          const limit = parseInt(url.searchParams.get("limit") || "50");

          let events = report.recentEvents;

          if (severity) {
            events = events.filter((e) => e.severity === severity);
          }

          if (type) {
            events = events.filter((e) => e.type === type);
          }

          // Sort by timestamp (newest first) and limit
          events = events
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);

          return Response.json({
            success: true,
            data: {
              events,
              total: events.length,
              filters: { severity, type, limit },
            },
            timestamp: Date.now(),
          });
        }

        case "config": {
          const report = FeeSecurityService.getSecurityReport();
          return Response.json({
            success: true,
            data: {
              config: report.config,
            },
            timestamp: Date.now(),
          });
        }

        default:
          return Response.json({
            success: false,
            error: "Invalid action. Supported: report, summary, events, config",
            timestamp: Date.now(),
          }, { status: 400 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      }, { status: 500 });
    }
  },

  async POST(req) {
    try {
      // CSRF protection for internal endpoints
      const csrfResult = await InternalRouteGuard.requireCSRF(req);
      if (csrfResult) {
        return csrfResult; // Return the error response directly
      }

      const body = await req.json();
      const action = body.action;

      switch (action) {
        case "update-config": {
          if (!body.config || typeof body.config !== "object") {
            return Response.json({
              success: false,
              error: "Invalid config object",
              timestamp: Date.now(),
            }, { status: 400 });
          }

          FeeSecurityService.updateConfig(body.config);

          return Response.json({
            success: true,
            message: "Security configuration updated",
            timestamp: Date.now(),
          });
        }

        case "clear-events": {
          FeeSecurityService.clearEvents();

          return Response.json({
            success: true,
            message: "Security events cleared",
            timestamp: Date.now(),
          });
        }

        case "test-validation": {
          if (!body.feeData) {
            return Response.json({
              success: false,
              error: "Missing feeData for validation test",
              timestamp: Date.now(),
            }, { status: 400 });
          }

          const validation = FeeSecurityService.validateFeeData(
            body.feeData,
            body.source || "test",
            body.clientInfo,
          );

          return Response.json({
            success: true,
            data: {
              validation,
              testData: body.feeData,
            },
            timestamp: Date.now(),
          });
        }

        case "test-cache-poisoning": {
          if (!body.oldValue || !body.newValue) {
            return Response.json({
              success: false,
              error: "Missing oldValue or newValue for cache poisoning test",
              timestamp: Date.now(),
            }, { status: 400 });
          }

          const suspicious = FeeSecurityService.monitorCachePoisoning(
            body.cacheKey || "test_cache_key",
            body.oldValue,
            body.newValue,
            body.source || "test",
          );

          return Response.json({
            success: true,
            data: {
              suspicious,
              testData: {
                oldValue: body.oldValue,
                newValue: body.newValue,
                cacheKey: body.cacheKey,
                source: body.source,
              },
            },
            timestamp: Date.now(),
          });
        }

        default:
          return Response.json({
            success: false,
            error:
              "Invalid action. Supported: update-config, clear-events, test-validation, test-cache-poisoning",
            timestamp: Date.now(),
          }, { status: 400 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      }, { status: 500 });
    }
  },
};
