import { FreshContext } from "$fresh/server.ts";
import { PaginatedRequest } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export const handler = async (
  req: PaginatedRequest,
  _ctx: FreshContext,
): Promise<Response> => {
  return await Src20Controller.handleSrc20TransactionsRequest(req, {});
};
