import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body = await req.json();
      const { address, asset, quantity, options } = body;

      // Validate required parameters
      if (!address || !asset || quantity === undefined) {
        return ResponseUtil.error("Missing required parameters", 400);
      }

      const result = await XcpManager.composeFairmint(
        address,
        asset,
        quantity,
        options,
      );

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error composing fairmint transaction:", error);
      return ResponseUtil.handleError(
        error,
        "Failed to compose fairmint transaction",
      );
    }
  },
};
