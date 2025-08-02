import type { SUBPROTOCOLS } from "$types/base.d.ts";
import type {
  ColumnDefinition,
  FeeAlert,
  InputData,
  MockResponse,
  NamespaceImport,
  ProtocolComplianceLevel,
  ToolEstimationParams,
  XcpBalance,
} from "$types/toolEndpointAdapter.ts";
import { Handlers } from "$fresh/server.ts";
import { BackgroundFeeService } from "$server/services/fee/backgroundFeeService.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

export const handler: Handlers = {
  GET(req) {
    try {
      // Security check for internal endpoints
      const originError = InternalApiFrontendGuard.requireInternalAccess(req);
      if (originError) return originError;
      const status = BackgroundFeeService.getStatus();

      // Enhanced status with separate services information
      const enhancedStatus = {
        services: {
          fees: {
            isRunning: status.isRunning,
            intervalId: status.intervalId,
            retryCount: status.retryCount,
            cacheInfo: status.feeCacheInfo,
            uptime: status.intervalId ? "Active" : "Inactive",
          },
          btcPrice: {
            isRunning: status.isRunning,
            intervalId: status.priceIntervalId,
            retryCount: status.priceRetryCount,
            cacheInfo: status.priceCacheInfo,
            uptime: status.priceIntervalId ? "Active" : "Inactive",
          },
        },
        overall: {
          isRunning: status.isRunning,
          bothServicesActive: status.intervalId !== null &&
            status.priceIntervalId !== null,
        },
        timestamp: new Date().toISOString(),
      };

      return Response.json({
        success: true,
        data: enhancedStatus,
        timestamp: Date.now(),
      });
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
      // Security check for internal endpoints
      const originError = InternalApiFrontendGuard.requireInternalAccess(req);
      if (originError) return originError;

      const body = await req.json();
      const action = body.action;

      if (action === "force-warm") {
        await BackgroundFeeService.forceWarm();

        return Response.json({
          success: true,
          message:
            "Cache warming forced successfully for both fees and BTC price",
          timestamp: Date.now(),
        });
      }

      if (action === "force-warm-price") {
        await BackgroundFeeService.forceWarmPrice();

        return Response.json({
          success: true,
          message: "BTC price cache force-warmed successfully",
          timestamp: Date.now(),
        });
      }

      if (action === "force-warm-fee") {
        await BackgroundFeeService.forceWarmFee();

        return Response.json({
          success: true,
          message: "Fee cache force-warmed successfully",
          timestamp: Date.now(),
        });
      }

      return Response.json({
        success: false,
        error:
          "Invalid action. Supported actions: force-warm, force-warm-price, force-warm-fee",
        timestamp: Date.now(),
      }, { status: 400 });
    } catch (error) {
      return Response.json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
      }, { status: 500 });
    }
  },
};
