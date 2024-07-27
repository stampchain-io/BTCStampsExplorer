// routes/api/v2/src20/tx/[tx_hash].ts
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";
import { SRC20TrxRequestParams } from "globals";

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { tx_hash } = ctx.params;
  const url = new URL(req.url);

  const params: SRC20TrxRequestParams = {
    tx_hash,
    limit: Number(url.searchParams.get("limit")) || undefined,
    page: Number(url.searchParams.get("page")) || undefined,
    sort: url.searchParams.get("sort") || undefined,
    noPagination: true,
    singleResult: true,
  };

  return Src20Controller.handleSrc20TransactionsRequest(req, params);
};
