import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getBTCBalanceInfo } from "$lib/utils/data/processing/balanceUtils.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { isValidBitcoinAddress } from "$lib/utils/scriptTypeUtils.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/validation/routeValidationService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req: Request, ctx): Promise<Response> {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);

      const paramsValidation = validateRequiredParams({ address });
      if (!paramsValidation.isValid) {
        return paramsValidation.error ??
          ApiResponseUtil.badRequest("Invalid parameters");
      }

      // Check for XSS attempts
      const xssPattern = /<script|javascript:|on\w+=/i;
      if (xssPattern.test(address)) {
        return ApiResponseUtil.badRequest(
          "Invalid input detected",
          { routeType: RouteType.BALANCE },
        );
      }

      // Validate Bitcoin address format
      if (!isValidBitcoinAddress(address)) {
        return ApiResponseUtil.badRequest(
          `Invalid Bitcoin address format: ${address}`,
          { routeType: RouteType.BALANCE },
        );
      }

      // Get pagination params
      const pagination = getPaginationParams(url);
      if (pagination instanceof Response) {
        return pagination;
      }

      const {
        limit = DEFAULT_PAGINATION.limit,
        page = DEFAULT_PAGINATION.page,
      } = pagination;

      // Call controllers directly instead of making HTTP requests to avoid DNS issues
      const [stamps, src20, btcInfo] = await Promise.all([
        StampController.getStampBalancesByAddress(address, limit, page),
        Src20Controller.handleSrc20BalanceRequest({
          address,
          limit,
          page,
          includePagination: true,
        }),
        getBTCBalanceInfo(address),
      ]);

      // Check for empty results
      if (!stamps.data?.length && !src20.data?.length) {
        return checkEmptyResult(null, "balance data") ??
          ApiResponseUtil.notFound("No balance data found for this address");
      }

      // Calculate combined totals
      const totalItems = ((stamps as any).total || 0) +
        ((src20 as any).total || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Format response to match old schema
      const response = {
        page: page,
        limit: limit,
        totalPages: totalPages,
        total: totalItems,
        last_block: Math.max(stamps.last_block || 0, src20.last_block || 0),
        btc: {
          address: address,
          balance: btcInfo?.balance ?? 0,
          txCount: btcInfo?.txCount ?? 0,
          unconfirmedBalance: btcInfo?.unconfirmedBalance ?? 0,
          unconfirmedTxCount: btcInfo?.unconfirmedTxCount ?? 0,
        },
        data: {
          stamps: stamps.data || [],
          src20: src20.data || [],
        },
      };

      // Return with proper caching and informational headers
      return ApiResponseUtil.success(response, {
        routeType: RouteType.BALANCE,
        headers: {
          "X-Preferred-Endpoints":
            "/api/v2/stamps/balance/[address], /api/v2/src20/balance/[address]",
          "X-Info":
            "Consider using dedicated endpoints for better performance and pagination control",
        },
      });
    } catch (error) {
      console.error("Error in balance/[address] handler:", error);
      return ApiResponseUtil.internalError(
        error instanceof Error ? error : new Error(String(error)),
        "Failed to fetch balance data",
      );
    }
  },
};
