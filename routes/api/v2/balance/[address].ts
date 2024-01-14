import { HandlerContext } from "$fresh/server.ts";
import { api_get_balance } from "$lib/controller/wallet.ts";


export const handler = async (_req: Request, ctx: HandlerContext): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const balance = await api_get_balance(address);
    const body = {
      data: balance,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
