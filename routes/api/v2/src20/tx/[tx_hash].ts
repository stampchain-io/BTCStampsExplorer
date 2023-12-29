import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_valid_tx } from "$lib/controller/wallet.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { tx_hash } = ctx.params;
  try {
    const tx_info = await api_get_src20_valid_tx(tx_hash);
    const body = JSON.stringify({
      data: tx_info,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
