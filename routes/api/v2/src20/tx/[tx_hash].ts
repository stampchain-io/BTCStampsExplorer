import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_valid_tx } from "$lib/controller/wallet.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { convertToEmoji } from "utils/util.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { tx_hash } = ctx.params;
  try {
    const tx_info = await api_get_src20_valid_tx(tx_hash);
    const body = JSON.stringify({
      data: {
        ...tx_info,
        amt: tx_info.amt ? new BigFloat(tx_info.amt).toString() : null,
        lim: tx_info.lim ? new BigFloat(tx_info.lim).toString() : null,
        max: tx_info.max ? new BigFloat(tx_info.max).toString() : null,
        tick: convertToEmoji(tx_info.tick),
      },
    });
    return new Response(body);
  } catch (error) {
    console.error(error);
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
