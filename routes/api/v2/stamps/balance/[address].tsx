import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { AddressHandlerContext } from "globals";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/routeValidationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req: Request, ctx) {
    try {
      const { address } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ address });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      const body = await StampController.getStampBalancesByAddress(
        address,
        limit || DEFAULT_PAGINATION.limit,
        page || DEFAULT_PAGINATION.page,
      );
      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error in stamp balance handler:", error);
      return ResponseUtil.internalError(error, "Error fetching stamp balance");
    }
  },
};
