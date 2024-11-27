import { Handlers } from "$fresh/server.ts";
import { set_precision } from "bigfloat/mod.ts";

import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

import { Src20Controller } from "$server/controller/src20Controller.ts";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      if (!tick) {
        return ctx.renderNotFound();
      }

      tick = convertEmojiToTick(tick);
      set_precision(-4);
      const body = await Src20Controller.handleTickPageRequest(tick);

      if (!body || body.error) {
        return ctx.renderNotFound();
      }

      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error in SRC20 tick page:", error);
      return ResponseUtil.internalError(error, "Error processing request");
    }
  },
};
