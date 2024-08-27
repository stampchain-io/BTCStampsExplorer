import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { AddressHandlerContext, PaginatedRequest } from "globals";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req: PaginatedRequest, ctx) {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);

      const body = await StampController.getStampBalancesByAddress(
        address,
        limit,
        page,
      );
      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error in stamp balance handler:", error);
      return ResponseUtil.handleError(error, "Error fetching stamp balance");
    }
  },
};
