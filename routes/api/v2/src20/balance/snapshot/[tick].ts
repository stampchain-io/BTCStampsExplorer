import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { convertEmojiToTick } from "utils/util.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { tick } = ctx.params;
      const url = new URL(req.url);
      const params = url.searchParams;

      const snapshotParams = {
        tick: convertEmojiToTick(String(tick)),
        limit: Number(params.get("limit")) || 1000,
        page: Number(params.get("page")) || 1,
        amt: Number(params.get("amt")) || 0,
        sort: params.get("sort") || "DESC",
      };

      const result = await Src20Controller.handleSrc20SnapshotRequest(
        snapshotParams,
      );

      if (result instanceof Response) {
        const responseData = await result.json();
        if (!responseData || Object.keys(responseData).length === 0) {
          console.log("Empty result received:", responseData);
          return ResponseUtil.error("No data found", 404);
        }
        return result;
      } else {
        console.log("Unexpected result type:", result);
        return ResponseUtil.error("Unexpected response format", 500);
      }
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing SRC20 snapshot request",
      );
    }
  },
};
