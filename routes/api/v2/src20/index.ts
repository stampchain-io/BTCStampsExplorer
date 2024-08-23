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

      // Since result is already a Response, we can return it directly
      return result;
    } catch (error) {
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
