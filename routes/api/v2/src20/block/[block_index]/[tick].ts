import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { convertEmojiToTick } from "$lib/utils/util.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { block_index, tick: emojiTick } = ctx.params;
      const tick = convertEmojiToTick(emojiTick);
      const params = {
        block_index: parseInt(block_index, 10),
        tick,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in block/tick handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing block/tick request",
      );
    }
  },
};
