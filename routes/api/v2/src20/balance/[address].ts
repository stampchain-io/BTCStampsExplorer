import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;
      const { limit, page } = getPaginationParams(url);

      const balanceParams = {
        address,
        limit,
        page,
        amt: Number(params.get("amt")) || 0,
        sortBy: params.get("sort") || "ASC",
        includePagination: params.get("includePagination") !== "false",
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in balance handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing balance request",
      );
    }
  },
};
