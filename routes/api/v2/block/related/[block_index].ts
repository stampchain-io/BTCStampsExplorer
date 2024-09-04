import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$lib/controller/blockController.ts";
import { BlockHandlerContext, ErrorResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    const blockIdentifier = ctx.params.block_index;
    const isStamps = req.url.includes("/stamps/");
    const type = isStamps ? "stamps" : "cursed";

    try {
      const response = await BlockController.getRelatedBlockInfoResponse(
        blockIdentifier,
        type,
      );
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      return ResponseUtil.handleError(
        error,
        `Block: ${blockIdentifier} not found`,
        404,
      );
    }
  },
};
