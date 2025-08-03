import type { BlockHandlerContext } from "$types/base.d.ts";
// Unused imports removed: IdentHandlerContext, TickHandlerContext, PaginatedTickResponseBody, SRC20TrxRequestParams
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(_req, ctx) {
    const { block_index, tick } = ctx.params;

    try {
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20Data({
        block_index: Number(block_index),
        tick,
      });
      return ApiResponseUtil.success(result);
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
