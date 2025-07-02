import { Src20Controller } from "$server/controller/src20Controller.ts";
// import { TickHandlerContext } from "$globals"; // Temporarily replaced
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { FreshContext } from "$fresh/server.ts";

// Define params shape explicitly for this route
interface DeployRouteParams {
  tick: string;
}

// If you had custom state for TickHandlerContext, define it here or use a shared state type.
// For now, using `unknown` for state if not specifically needed by this handler.
export const handler = async (
  req: Request,
  ctx: FreshContext<unknown, unknown, DeployRouteParams>, // Using FreshContext with explicit params and unknown state/data
): Promise<Response> => {
  try {
    const tick = decodeURIComponent(ctx.params.tick); // ctx.params.tick is string
    // If 'op' was needed from query params: const op = ctx.url.searchParams.get("op");

    const body = await Src20Controller.handleDeploymentRequest(tick, req);
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in deploy handler:", error);
    return ResponseUtil.internalError(error, "Internal server error");
  }
};
