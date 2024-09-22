import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$lib/controller/src101Controller.ts";
import { AddressHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    try {
      var { deploy_hash } = ctx.params;

      const result = await Src101Controller.handleSrc101DeployDetailsRequest(
        deploy_hash
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
        "Error processing src101 deploy details request",
      );
    }
  }
}