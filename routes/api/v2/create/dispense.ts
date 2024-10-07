// routes/api/v2/dispense.ts
import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const requestData = await req.json();
      const {
        address,
        dispenser,
        quantity,
        options,
      } = requestData;

      if (!address || !dispenser || !quantity) {
        return ResponseUtil.error("Missing required parameters.", 400);
      }

      // Call createDispense on the server-side
      const response = await XcpManager.createDispense(
        address,
        dispenser,
        quantity,
        options,
      );

      return ResponseUtil.success(response);
    } catch (error) {
      console.error("Error in /api/v2/create/dispense:", error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
