import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  checkEmptyResult,
  validateRequiredParams,
  validateSortParam,
} from "$server/services/routeValidationService.ts";
import { SRC20TrxRequestParams } from "globals";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { tx_hash } = ctx.params;

      // Validate required parameters
      const paramsValidation = validateRequiredParams({ tx_hash });
      if (!paramsValidation.isValid) {
        return paramsValidation.error!;
      }

      const url = new URL(req.url);

      // Validate sort parameter
      const sortValidation = validateSortParam(url);
      if (!sortValidation.isValid) {
        return sortValidation.error!;
      }

      const params: SRC20TrxRequestParams = {
        tx_hash,
        sortBy: sortValidation.data,
        noPagination: true,
        singleResult: true,
      };

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        params,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "transaction data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing SRC20 tx request",
      );
    }
  },
};
