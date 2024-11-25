import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { AddressHandlerContext } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(_req, ctx) {
    const { deploy_hash } = ctx.params;

    try {
      const result = await Src101Controller.handleSrc101DeployDetailsRequest(
        deploy_hash,
      );

      if (!result || Object.keys(result).length === 0) {
        console.log("Empty result received:", result);
        return ResponseUtil.notFound("No data found");
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error(
        "Error in [deploy_hash]/address/[address_btc] handler:",
        error,
      );
      return ResponseUtil.internalError(
        error,
        "Error processing src101 deploy details request",
      );
    }
  },
};
