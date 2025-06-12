import { Handlers } from "$fresh/server.ts";
import { BackgroundFeeService } from "$server/services/fee/backgroundFeeService.ts";

export const handler: Handlers = {
  GET() {
    try {
      const status = BackgroundFeeService.getStatus();

      return Response.json({
        success: true,
        data: {
          isRunning: status.isRunning,
          retryCount: status.retryCount,
          cacheInfo: status.cacheInfo,
          uptime: status.intervalId ? "Active" : "Inactive",
        },
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
      const body = await req.json();
      const action = body.action;

      if (action === "force-warm") {
        const baseUrl = body.baseUrl || "https://stampchain.io";
        await BackgroundFeeService.forceWarm(baseUrl);

        return Response.json({
          success: true,
          message: "Cache warming forced successfully",
          timestamp: Date.now(),
        });
      }

      return Response.json({
        success: false,
        error: "Invalid action. Supported actions: force-warm",
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
