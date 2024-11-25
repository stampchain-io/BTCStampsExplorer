import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { BlockHandlerContext } from "globals";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { block_index } = ctx.params;
      const url = new URL(req.url);
      const type = url.pathname.includes("/cursed/")
        ? "cursed"
        : url.pathname.includes("/stamps/")
        ? "stamps"
        : "all";

      const response = await BlockController.getBlockInfoResponse(
        block_index,
        type,
      );
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in block handler:`, error);
      return ResponseUtil.internalError(
        error,
        "Error processing block request",
      );
    }
  },
};
