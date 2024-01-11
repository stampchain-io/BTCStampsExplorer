import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { paginate } from "utils/util.ts";

export const handler = async (req: Request, ctx: HandlerContext): Response => {
  const { tick } = ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const deployment = await Src20Class
      .get_valid_src20_tx_by_tick_with_client(
        client,
        tick,
        limit,
        page,
      );
    const total = await Src20Class.get_total_valid_src20_tx_by_tick_with_client(
      client,
      tick,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const pagination = paginate(total.rows[0]["total"], page, limit);
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
        tick,
      );
    const body = JSON.stringify({
      data: deployment.rows,
      mint_status: mint_status,
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
    });
    return new Response(body);
  } catch (error) {
    console.log(error);
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
