import { HandlerContext } from "$fresh/server.ts";
import { api_get_stamp_balance } from "$lib/controller/wallet.ts";


export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { address } = ctx.params;
  try {
    const stamps = await api_get_stamp_balance(address);
    const body = JSON.stringify({
      data: stamps,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
