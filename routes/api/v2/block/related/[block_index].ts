import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { BlockHandlerContext } from "$globals";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

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
      return ApiResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      return ApiResponseUtil.internalError(
        error,
        `Block: ${blockIdentifier} not found`,
      );
    }
  },
};
