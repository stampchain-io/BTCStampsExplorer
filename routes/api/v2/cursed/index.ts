import { HandlerContext } from "$fresh/server.ts";
import { connectDb, CommonClass, CursedClass } from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampResponseBody,
} from "globals";
import { paginate } from "../../../../lib/utils/util.ts";


export const handler = async (req: PaginatedRequest, _ctx: HandlerContext): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 0;
    const client = await connectDb();
    const data = await CursedClass.get_cursed_by_page_with_client(client, limit, page);
    const last_block = await CommonClass.get_last_block_with_client(client);
    const total = await CursedClass.get_total_cursed_with_client(client);
    client.close();
    const pagination = paginate(total, page, limit);

    const body: PaginatedStampResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows,
    };
    return new Response(body);
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
