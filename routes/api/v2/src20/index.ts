import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { convertToEmoji, paginate } from "utils/util.ts";

export const handler = async (req: Request, _ctx: HandlerContext): Response => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const data = await Src20Class.get_valid_src20_tx_with_client(
      client,
      limit,
      page,
    );
    const total = await Src20Class.get_total_valid_src20_tx_with_client(
      client,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();

    const pagination = paginate(total.rows[0].total, page, limit);
    const body = JSON.stringify({
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows.map((row) => {
        console.log(row.tick, convertToEmoji(row.tick));
        return {
          ...row,
          tick: convertToEmoji(row.tick),
          max: row.max ? new BigFloat(row.max).toString() : null,
          lim: row.lim ? new BigFloat(row.lim).toString() : null,
          amt: row.amt ? new BigFloat(row.amt).toString() : null,
        };
      }),
    });
    return new Response(body);
  } catch (error) {
    console.error(error);
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
