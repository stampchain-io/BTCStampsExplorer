import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { jsonStringifyBigInt } from "utils/util.ts";
import { convertEmojiToTick, convertToEmoji } from "utils/util.ts";

export const handler = async (_req: Request, ctx: HandlerContext): Response => {
  const { tick: tick_before_conversion } = ctx.params;
  try {
    const tick = convertEmojiToTick(tick_before_conversion);
    const client = await connectDb();
    const deployment = await Src20Class
      .get_valid_src20_deploy_by_tick_with_client(
        client,
        tick,
      );
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
        tick,
      );
    const last_block = await CommonClass.get_last_block_with_client(client);

    const body = jsonStringifyBigInt({
      data: {
        ...deployment.rows[0],
        tick: convertToEmoji(deployment.rows[0].tick),
        mint_status: {
          ...mint_status,
          max_supply: mint_status.max_supply.toString(),
          total_minted: mint_status.total_minted.toString(),
          limit: mint_status.limit.toString(),
        },
        last_block: last_block.rows[0]["last_block"],
      },
    });
    return new Response(body);
  } catch (error) {
    console.error(error);
    const body = JSON.stringify({ error: `Error: Internal server error` });
    return new Response(body);
  }
};
