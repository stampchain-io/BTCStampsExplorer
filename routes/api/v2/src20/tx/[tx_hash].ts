import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { SRC20TrxRequestParams } from "globals";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { tx_hash } = ctx.params;
    const url = new URL(req.url);

    const params: SRC20TrxRequestParams = {
      tx_hash,
      limit: undefined,
      page: undefined,
      sortBy: url.searchParams.get("sort") || "ASC",
      noPagination: true,
      singleResult: true,
    };

    try {
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
