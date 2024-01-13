import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_balance_by_tick } from "$lib/controller/wallet.ts";
import { convertEmojiToTick } from "utils/util.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { address, tick: tick_before_conversion } = ctx.params;
  try {
    const tick = convertEmojiToTick(tick_before_conversion);
    const src20 = await api_get_src20_balance_by_tick(address, tick);
    const body = JSON.stringify({
      data: src20,
    });
    return new Response(body);
  } catch (error) {
    console.error(error);
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
