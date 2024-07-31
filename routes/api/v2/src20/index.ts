import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        {},
      );
      return ResponseUtil.success(result);
    } catch (_error) {
      return ResponseUtil.error("Error processing request", 500);
    }
  },
};
