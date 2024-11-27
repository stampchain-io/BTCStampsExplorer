import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { BitcoinNotificationService } from "$server/services/notification/bitcoinNotificationService.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";

export const handler: Handlers = {
  async POST(req) {
    // Check API key for webhook
    const apiKeyError = await InternalRouteGuard.requireAPIKey(req);
    if (apiKeyError) return apiKeyError;

    try {
      const data = await req.json();
      console.log("Received Bitcoin notification:", data);

      await BitcoinNotificationService.handleNotification(data);

      return ResponseUtil.success({ status: "OK" }, {
        forceNoCache: true,
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Failed to process Bitcoin notification",
      );
    }
  },
};
