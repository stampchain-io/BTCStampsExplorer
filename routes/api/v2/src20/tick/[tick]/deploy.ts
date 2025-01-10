import { Src20Controller } from "$server/controller/src20Controller.ts";
import { TickHandlerContext } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler = async (
  req: Request,
  ctx: TickHandlerContext,
): Promise<Response> => {
  try {
    const tick = String(ctx.params.tick);
    const body = await Src20Controller.handleDeploymentRequest(tick, req);
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in deploy handler:", error);
    return ResponseUtil.internalError(error, "Internal server error");
  }
};
