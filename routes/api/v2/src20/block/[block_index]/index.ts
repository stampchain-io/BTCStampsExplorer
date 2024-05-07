// routes/block/[block_index]/index.ts
import { handleSrc20TransactionsRequest } from "$lib/database/src20Transactions.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  const params = {
    block_index: parseInt(block_index, 10),
  };
  return handleSrc20TransactionsRequest(req, params);
};
