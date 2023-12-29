import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_balance_by_tick } from "$lib/controller/wallet.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { address, tick } = ctx.params;
  try {
    const src20 = await api_get_src20_balance_by_tick(address, tick);
    const body = JSON.stringify({
      data: src20,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
