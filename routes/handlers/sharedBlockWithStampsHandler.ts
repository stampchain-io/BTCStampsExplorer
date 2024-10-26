import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { BlockHandlerContext } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const sharedBlockWithStampsHandler: Handlers<BlockHandlerContext> = {
  async GET(_req, ctx) {
    const { block_index } = ctx.params;
    const type = ctx.url.pathname.includes("/stamps/") ? "stamps" : "cursed";

    try {
      const response = await BlockController.getSharedBlockWithStamps(
        block_index,
        type,
      );
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      return ResponseUtil.handleError(
        error,
        `Block: ${block_index} not found`,
        404,
      );
    }
  },
};
