// routes/src20/tick
import { handleSrc20TransactionsRequest } from "$lib/database/src20Transactions.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const params = {
    op: "DEPLOY",
  };

  return handleSrc20TransactionsRequest(req, params);
};
