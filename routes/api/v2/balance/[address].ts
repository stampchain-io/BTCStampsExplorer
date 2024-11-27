import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
  validateRequiredParams,
} from "$server/services/routeValidationService.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req: Request, ctx): Promise<Response> {
    try {
      const { address } = ctx.params;
      const url = new URL(req.url);

      const paramsValidation = validateRequiredParams({ address });
      if (!paramsValidation.isValid) {
        return paramsValidation.error ??
          new Response("Invalid parameters", { status: 400 });
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

      const [stampsRes, src20Res] = await Promise.all([
        fetch(
          `${url.origin}/api/v2/stamps/balance/${address}?limit=${limit}&page=${page}`,
        ),
        fetch(
          `${url.origin}/api/v2/src20/balance/${address}?limit=${limit}&page=${page}`,
        ),
      ]);

      const [stamps, src20] = await Promise.all([
        stampsRes.json(),
        src20Res.json(),
      ]);

      // Check for empty results
      if (!stamps.data?.length && !src20.data?.length) {
        return checkEmptyResult(null, "balance data") ??
          new Response("No data found", { status: 404 });
      }

      const response = {
        data: {
          stamps: stamps.data,
          src20: src20.data,
        },
        pagination: {
          stamps: {
            page: stamps.page,
            limit: stamps.limit,
            total: stamps.total,
            totalPages: stamps.totalPages,
          },
          src20: {
            page: src20.page,
            limit: src20.limit,
            total: src20.total,
            totalPages: src20.totalPages,
          },
        },
        _info: {
          message: "Consider using dedicated endpoints for better performance",
          stampEndpoint: `/api/v2/stamps/balance/${address}`,
          src20Endpoint: `/api/v2/src20/balance/${address}`,
        },
      };

      // Return with proper caching and informational headers
      return ResponseUtil.success(response, {
        routeType: RouteType.BALANCE,
        headers: {
          "X-Preferred-Endpoints":
            "/api/v2/stamps/balance/[address], /api/v2/src20/balance/[address]",
          "X-Info": "Consider using dedicated endpoints for better performance",
        },
      });
    } catch (error) {
      console.error("Error in balance/[address] handler:", error);
      return ResponseUtil.internalError(error) ??
        new Response("Internal server error", { status: 500 });
    }
  },
};
