// routes/block/[block_index]/[tick].ts
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { FreshContext } from "$fresh/server.ts";
import { convertEmojiToTick } from "$lib/utils/util.ts"; // Adjust import path as necessary

export const handler = (
  req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { block_index, tick: emojiTick } = ctx.params;
  const tick = convertEmojiToTick(emojiTick); // Convert emoji to tick here
  const params = {
    block_index: parseInt(block_index, 10),
    tick,
  };
  return Src20Controller.handleSrc20TransactionsRequest(req, params);
};
