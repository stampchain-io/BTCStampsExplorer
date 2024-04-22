// routes/block/[block_index]/[tx_hash].ts
import { handleSrc20TransactionsRequest } from "$lib/database/src20Transactions.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { tx_hash } = ctx.params;
  const params = {
    tx_hash,
  };
  return handleSrc20TransactionsRequest(req, params);
};
