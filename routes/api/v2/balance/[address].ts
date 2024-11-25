import { Handlers } from "$fresh/server.ts";
import { WalletController } from "$server/controller/walletController.ts";
import {
  AddressHandlerContext,
  PaginatedBalanceResponseBody,
  StampBalance,
} from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/routeValidationService.ts";
import { RouteType } from "$server/services/cacheService.ts";

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

      const result = await WalletController.handleWalletBalanceRequest(
        address,
        limit || DEFAULT_PAGINATION.limit,
        page || DEFAULT_PAGINATION.page,
      );

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "wallet balance data");
      if (emptyCheck) {
        return emptyCheck;
      }

      const responseBody: PaginatedBalanceResponseBody = {
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
        total: result.pagination.total,
        last_block: result.last_block,
        btc: result.btc,
        data: {
          stamps: result.data.stamps.map((stamp: StampBalance) => ({
            ...stamp,
            block_index: stamp.block_index || 0,
            keyburn: stamp.keyburn || 0,
            block_time: stamp.block_time || 0,
            ident: stamp.ident || "STAMP",
          })),
          src20: result.data.src20 || [],
        },
      };

      // Return with short cache duration for balances
      return ResponseUtil.success(responseBody, {
        routeType: RouteType.BALANCE,
      });
    } catch (error) {
      console.error("Error in balance/[address] handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing balance request",
      );
    }
  },
};
