// routes/src20/tick
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";

export const handler = (
  req: Request,
  _ctx: FreshContext,
): Promise<Response> => {
  const params = {
    op: "DEPLOY",
  };

  return Src20Controller.handleSrc20TransactionsRequest(req, params);
};
