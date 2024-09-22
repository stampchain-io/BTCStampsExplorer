import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { AddressHandlerContext } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      const { deploy_hash, index } = ctx.params;
      var url = new URL(req.url);
      const params = url.searchParams;

      const queryParams = {
        deploy_hash,
        tokenid: null,
        index : index,
        limit: Number(params.get("limit")) || 1000,
        page: Number(params.get("page")) || 1,
        sort: params.get("sort") || "ASC",
      };
      const result = await Src101Controller.handleSrc101OwnerRequest(
        queryParams
      );

      if (!result || Object.keys(result).length === 0) {
        console.log("Empty result received:", result);
        return ResponseUtil.error("No data found", 404);
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in [deploy_hash]/address/[address_btc] handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing src101 owner request",
      );
    }
  }
}