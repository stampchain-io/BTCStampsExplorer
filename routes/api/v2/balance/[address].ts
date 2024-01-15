import { HandlerContext } from "$fresh/server.ts";
import { api_get_balance } from "$lib/controller/wallet.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedBalanceResponseBody,
} from "globals";

export const handler = async (_req: PaginatedRequest, ctx: AddressHandlerContext): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const body: PaginatedBalanceResponseBody = await api_get_balance(address, limit, page);
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
 