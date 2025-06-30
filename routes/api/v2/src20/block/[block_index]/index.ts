import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { DEFAULT_PAGINATION } from "$server/services/routeValidationService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { block_index } = ctx.params;
      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      const params = {
        block_index: parseInt(block_index, 10),
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in block handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing block request",
      );
    }
  },
};
