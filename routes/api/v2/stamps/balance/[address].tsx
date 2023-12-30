import { HandlerContext } from "$fresh/server.ts";
import { api_get_stamp_balance } from "$lib/controller/wallet.ts";
import { connectDb, CommonClass, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";


export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { address } = ctx.params;
  // try {
  //   const stamps = await api_get_stamp_balance(address);
  //   const body = JSON.stringify({
  //     data: stamps,
  //   });
  //   return new Response(body);
  // } catch {
  //   const body = JSON.stringify({ error: `Error: Internal server error` });
  //   return new Response(body);
  // }
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    
    const data = await api_get_stamp_balance(address, limit, page);
    const client = await connectDb();
    const total = (await StampsClass.get_total_stamp_balance_with_client(client, address)).rows[0]["total"] || 0;
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();

    const pagination = paginate(total, page, limit);

    let body = JSON.stringify({
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data,
    });
    return new Response(body);
  } catch {
    let body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
 