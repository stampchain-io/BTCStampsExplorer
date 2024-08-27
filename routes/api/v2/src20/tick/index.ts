import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { SRC20TrxRequestParams } from "globals";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);

      const params: SRC20TrxRequestParams = {
        op: url.searchParams.get("op") || "DEPLOY",
        sort: url.searchParams.get("sort") || "ASC",
        limit,
        page,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
