import { HandlerContext } from "$fresh/server.ts";
import {
  connectDb,
  CommonClass,
  summarize_issuances,
} from "$lib/database/index.ts";
import { api_get_stamp } from "$lib/controller/stamp.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { id } = ctx.params;
  try {
    const client = await connectDb();
    const data = await api_get_stamp(id);
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();
    let body = JSON.stringify({
      data: data,
      last_block: last_block.rows[0]["last_block"],
    });
    return new Response(body);
  } catch {
    let body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
