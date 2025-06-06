import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { BlockHandlerContext } from "$globals";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const sharedBlockWithStampsHandler: Handlers<BlockHandlerContext> = {
  async GET(_req, ctx) {
    const { block_index } = ctx.params;
    const type = ctx.url.pathname.includes("/stamps/") ? "stamps" : "cursed";

    try {
      const response = await BlockController.getSharedBlockWithStamps(
        block_index,
        type,
      );
      return ApiResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      return ApiResponseUtil.internalError(
        error,
        `Block: ${block_index} not found`,
      );
    }
  },
};
