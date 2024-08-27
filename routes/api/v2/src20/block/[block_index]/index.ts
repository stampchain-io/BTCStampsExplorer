import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { block_index } = ctx.params;
      const params = {
        block_index: parseInt(block_index, 10),
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in block handler:", error);
      return ResponseUtil.handleError(error, "Error processing block request");
    }
  },
};
