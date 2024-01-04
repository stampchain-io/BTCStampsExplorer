import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";

export const handler = async (req: Request, _ctx: HandlerContext): Response => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const data = await Src20Class.get_valid_src20_tx_by_op_with_client(
      client,
      "DEPLOY",
      limit,
      page,
    );
    const total = await Src20Class.get_total_valid_src20_tx_by_op_with_client(
      client,
      "DEPLOY",
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();

    const pagination = paginate(total, page, limit);

    const body = JSON.stringify({
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows,
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
