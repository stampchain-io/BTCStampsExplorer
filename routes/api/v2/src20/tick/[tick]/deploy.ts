import { HandlerContext } from "$fresh/server.ts";
import { connectDb, Src20Class } from "$lib/database/index.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { tick } = ctx.params;
  try {
    const client = await connectDb();
    const deployment = await Src20Class
      .get_valid_src20_deploy_by_tick_with_client(
        client,
        tick,
      );
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
      );
    const body = JSON.stringify({
      data: {
        ...deployment.rows[0],
        mint_status,
      },
    });
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
