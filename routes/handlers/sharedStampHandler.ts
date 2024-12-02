import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { validateSortDirection } from "$server/services/validationService.ts";

type StampHandlerConfig = {
  type: "stamps" | "cursed";
  isIndex: boolean;
};

/**
 * Determines the appropriate cache RouteType based on the path and options
 */
function getCacheType(path: string, isIndex: boolean): RouteType {
  // Index route gets long cache
  if (isIndex) {
    return RouteType.STAMP_LIST;
  }

  // Check path for specific routes
  if (path.includes("/dispenses")) {
    return RouteType.STAMP_DISPENSE;
  }
  if (path.includes("/dispensers")) {
    return RouteType.STAMP_DISPENSER;
  }
  if (path.includes("/sends")) {
    return RouteType.STAMP_SEND;
  }
  if (path.includes("/holders")) {
    return RouteType.BALANCE; // Holders are like balances
  }

  // Individual stamp details get short cache
  return RouteType.STAMP_DETAIL;
}

function getSortParameter(url: URL): string | null {
  // Check for both sort and sort_order parameters
  const sort = url.searchParams.get("sort");
  const sortOrder = url.searchParams.get("sort_order");

  // Prefer 'sort' if both are present, otherwise use whichever exists
  return sort ?? sortOrder ?? null;
}

export const createStampHandler = (
  routeConfig: StampHandlerConfig,
): Handlers => ({
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const cacheType = getCacheType(url.pathname, routeConfig.isIndex);

      if (routeConfig.isIndex) {
        const pagination = getPaginationParams(url);

        // Check if pagination validation failed
        if (pagination instanceof Response) {
          return pagination;
        }

        const { limit, page } = pagination;
        const maxLimit = 100;
        const effectiveLimit = Math.min(limit ?? maxLimit, maxLimit);

        // Get and validate sort parameter using new helper
        const sortParam = getSortParameter(url);
        const sortValidation = validateSortDirection(sortParam);
        if (sortValidation instanceof Response) {
          return sortValidation;
        }

        // For index routes, we only need core columns for better performance
        const result = await StampController.getStamps({
          page,
          limit: effectiveLimit,
          sortBy: sortValidation,
          type: routeConfig.type,
          allColumns: false,
          skipTotalCount: false,
          includeSecondary: false, // Explicitly exclude secondary columns for listings
          cacheType,
        });

        return ResponseUtil.success(result, { routeType: cacheType });
      } else {
        const { id } = ctx.params;
        const path = new URL(req.url).pathname;

        if (path.includes("/holders")) {
          const url = new URL(req.url);
          const pagination = getPaginationParams(url);

          if (pagination instanceof Response) {
            return pagination;
          }

          const { limit, page } = pagination;
          const sortParam = getSortParameter(url);
          const sortValidation = validateSortDirection(sortParam);
          if (sortValidation instanceof Response) {
            return sortValidation;
          }

          const holders = await StampController.getStampHolders(
            id,
            page || 1,
            limit || 50,
            cacheType,
          );

          if (!holders || !holders.data?.length) {
            return ResponseUtil.notFound("No holders found for this stamp");
          }
          return ResponseUtil.success(holders, { routeType: cacheType });
        }

        if (path.includes("/dispensers")) {
          const url = new URL(req.url);
          const pagination = getPaginationParams(url);

          if (pagination instanceof Response) {
            return pagination;
          }

          const { limit, page } = pagination;
          const dispensers = await StampController.getStampDispensers(
            id,
            page || 1,
            limit || 50,
            cacheType,
          );

          if (!dispensers || !dispensers.data?.length) {
            return ResponseUtil.notFound("No dispensers found for this stamp");
          }
          return ResponseUtil.success(dispensers, { routeType: cacheType });
        }

        if (path.includes("/sends")) {
          const url = new URL(req.url);
          const pagination = getPaginationParams(url);

          if (pagination instanceof Response) {
            return pagination;
          }

          const { limit, page } = pagination;
          const sends = await StampController.getStampSends(
            id,
            page,
            limit,
            cacheType,
          );

          if (!sends || !sends.data?.length) {
            return ResponseUtil.notFound("No sends found for this stamp");
          }
          return ResponseUtil.success(sends, { routeType: cacheType });
        }

        if (path.includes("/dispenses")) {
          const url = new URL(req.url);
          const pagination = getPaginationParams(url);

          if (pagination instanceof Response) {
            return pagination;
          }

          const { limit, page } = pagination;
          const dispenses = await StampController.getStampDispenses(
            id,
            page || 1,
            limit || 50,
            cacheType,
          );

          if (!dispenses || !dispenses.data?.length) {
            return ResponseUtil.notFound("No dispenses found for this stamp");
          }
          return ResponseUtil.success(dispenses, { routeType: cacheType });
        }

        // For individual stamp details, we want both core and secondary columns
        const stampData = await StampController.getStampDetailsById(
          id,
          routeConfig.type,
          cacheType,
          undefined, // Use default cache duration
          true, // Explicitly include secondary columns for details
        );

        if (!stampData) {
          return ResponseUtil.notFound("Stamp not found");
        }

        return ResponseUtil.success({
          last_block: stampData.last_block,
          data: stampData.data,
        }, { routeType: cacheType });
      }
    } catch (error) {
      const errorMessage = routeConfig.isIndex
        ? `Error fetching paginated ${routeConfig.type}`
        : "Error fetching stamp data";
      return ResponseUtil.internalError(error, errorMessage);
    }
  },
});
