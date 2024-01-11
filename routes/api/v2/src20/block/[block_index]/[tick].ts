import { HandlerContext } from "$fresh/server.ts";
import { connectDb, Src20Class } from "$lib/database/index.ts";
import { paginate } from "utils/util.ts";

export const handler = async (req: Request, ctx: HandlerContext): Response => {
  const { block_index, tick } = ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const valid_src20_txs_in_block = await Src20Class
      .get_valid_src20_tx_from_block_by_tick_with_client(
        client,
        block_index,
        tick,
        limit,
        page,
      );
    const total = await Src20Class
      .get_total_valid_src20_tx_from_block_by_tick_with_client(
        client,
        block_index,
        tick,
      );
    const pagination = paginate(total.rows[0]["total"], page, limit);
    const body = JSON.stringify({
      ...pagination,
      data: valid_src20_txs_in_block.rows,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
