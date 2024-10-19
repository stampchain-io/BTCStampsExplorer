import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    try {
      const fairminters = await XcpManager.getFairminters();
      return ResponseUtil.success(fairminters);
    } catch (error) {
      console.error("Error fetching fairminters:", error);
      return ResponseUtil.handleError(error, "Failed to fetch fairminters");
    }
  },
};
