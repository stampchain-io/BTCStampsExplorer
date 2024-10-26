import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20TrxRequestParams } from "globals";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);

      const params: SRC20TrxRequestParams = {
        sortBy: url.searchParams.get("sort") || "ASC",
        limit,
        page,
      };

      const op = url.searchParams.get("op");
      if (op) {
        params.op = op;
      }

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
