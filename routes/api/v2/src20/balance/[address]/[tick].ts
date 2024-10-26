import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { convertEmojiToTick } from "$lib/utils/util.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { address, tick } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;

      const balanceParams = {
        address,
        tick: convertEmojiToTick(String(tick)),
        includePagination: params.get("includePagination") === "true", // or however you determine this
        limit: Number(params.get("limit")) || undefined,
        page: Number(params.get("page")) || undefined,
        amt: Number(params.get("amt")) || undefined,
        sortBy: params.get("sort") || undefined,
      };

      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
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
        "Error processing SRC20 balance request",
      );
    }
  },
};
