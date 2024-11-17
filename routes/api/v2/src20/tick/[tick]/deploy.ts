import { Src20Controller } from "$server/controller/src20Controller.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { TickHandlerContext } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler = async (
  req: Request,
  ctx: TickHandlerContext,
): Promise<Response> => {
  try {
    const tick = convertEmojiToTick(String(ctx.params.tick));
    const body = await Src20Controller.handleDeploymentRequest(tick, req);
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in deploy handler:", error);
    return ResponseUtil.handleError(error, "Internal server error");
  }
};
