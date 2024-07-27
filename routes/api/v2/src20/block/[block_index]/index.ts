// routes/block/[block_index]/index.ts
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  const params = {
    block_index: parseInt(block_index, 10),
  };
  return Src20Controller.handleSrc20TransactionsRequest(req, params);
};
