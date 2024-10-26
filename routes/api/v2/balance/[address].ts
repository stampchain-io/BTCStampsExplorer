import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { AddressHandlerContext, PaginatedBalanceResponseBody } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const result = await Src20Controller.handleWalletBalanceRequest(
        address,
        limit,
        page,
      );

      const responseBody: PaginatedBalanceResponseBody = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
        last_block: result.last_block,
        btc: result.btc,
        data: result.data,
      };

      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error in balance/[address] handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing balance request",
      );
    }
  },
};
