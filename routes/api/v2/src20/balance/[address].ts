import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "$globals";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { validateSortDirection } from "$server/services/validationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      // Validate sort parameter
      const sortParam = params.get("sort");
      const sortValidation = validateSortDirection(sortParam);
      if (sortValidation instanceof Response) {
        return sortValidation;
      }

      const balanceParams = {
        address,
        limit: limit || 50,
        page: page || 1,
        amt: Number(params.get("amt")) || 0,
        sortBy: sortValidation,
        includePagination: params.get("includePagination") !== "false",
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in balance handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing balance request",
      );
    }
  },
};
