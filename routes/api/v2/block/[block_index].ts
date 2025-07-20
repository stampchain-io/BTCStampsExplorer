import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const blockIndex = parseInt(ctx.params.block_index);
      if (isNaN(blockIndex)) {
        return ApiResponseUtil.badRequest(
          "Invalid block index: must be a valid number",
        );
      }

      const block = await BlockController.getBlockInfoResponse(blockIndex);
      if (!block) {
        return ApiResponseUtil.notFound("Block not found");
      }

      return ApiResponseUtil.success({ data: block }, {
        routeType: RouteType.HISTORICAL,
      });
    } catch (error) {
      console.error("Error fetching block:", error);
      return ApiResponseUtil.internalError(error);
    }
  },
};
