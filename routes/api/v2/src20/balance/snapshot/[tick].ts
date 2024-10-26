import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { convertEmojiToTick } from "$lib/utils/util.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { tick } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;
      const { limit, page } = getPaginationParams(url);

      const snapshotParams = {
        tick: convertEmojiToTick(String(tick)),
        limit,
        page,
        amt: Number(params.get("amt")) || 0,
        sortBy: params.get("sort") || "DESC",
      };

      const result = await Src20Controller.handleSrc20SnapshotRequest(
        snapshotParams,
      );

      if (!result || Object.keys(result).length === 0) {
        console.log("Empty result received:", result);
        return ResponseUtil.error("No data found", 404);
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing SRC20 snapshot request",
      );
    }
  },
};
