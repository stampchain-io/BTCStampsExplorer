import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { block_index, tick: rawTick } = ctx.params;
      const params = {
        block_index: parseInt(block_index, 10),
        tick: rawTick,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ApiResponseUtil.success(result);
    } catch (error) {
      console.error("Error in block/tick handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing block/tick request",
      );
    }
  },
};
