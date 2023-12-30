import { HandlerContext } from "$fresh/server.ts";
import {
  connectDb,
  handleQueryWithClient,
  get_last_block_with_client,
  get_total_stamps_with_client,
  get_stamps_by_page_with_client,
} from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";


export const handler = async (req: Request, _ctx: HandlerContext): Response => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const data = await get_stamps_by_page_with_client(client, limit, page);
    const total = (await get_total_stamps_with_client(client)).rows[0]["total"];
    const last_block = await get_last_block_with_client(client);
    client.close();

    const pagination = paginate(total, page, limit);

    let body = JSON.stringify({
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows,
    });
    return new Response(body);
  } catch {
    let body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
 