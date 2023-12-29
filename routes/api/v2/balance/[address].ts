import { HandlerContext } from "$fresh/server.ts";
import { api_get_balance } from "$lib/controller/wallet.ts";


export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { address } = ctx.params;
  try {
    const balance = await api_get_balance(address);
    const body = JSON.stringify({
      data: balance,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
