import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { validateSortDirection } from "$server/services/validationService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { STAMP_EDITIONS, STAMP_FILETYPES, STAMP_RARITY } from "$globals";

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
      console.log(
        "All URL parameters:",
        Object.fromEntries(url.searchParams.entries()),
      );
      console.log("Rarity parameter:", url.searchParams.get("rarity[sub]"));
      console.log(
        "Filetype parameter:",
        url.searchParams.get("filetypeFilters"),
      );
      console.log("Edition parameter:", url.searchParams.get("editionFilters"));
      const cacheType = getCacheType(url.pathname, routeConfig.isIndex);
      const requestQuery = url.searchParams.get("q");

      console.log(
        "URL parameters:",
        Object.fromEntries(url.searchParams.entries()),
      );
      console.log("Rarity sub value:", url.searchParams.get("rarity[sub]"));

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

        const filetypeFilters =
          url.searchParams.get("filetypeFilters")?.split(",").filter(Boolean) as
            | STAMP_FILETYPES[]
            | undefined || undefined;
        const suffixFilters =
          url.searchParams.get("suffixFilters")?.split(",").filter(Boolean) ||
          undefined;
        const editionFilters =
          url.searchParams.get("editionFilters")?.split(",").filter(Boolean) as
            | STAMP_EDITIONS[]
            | undefined || undefined;

        // Extract rarity filter from URL parameters
        let rarityFilters: STAMP_RARITY | undefined = undefined;
        const raritySub = url.searchParams.get("rarity[sub]");

        console.log("Raw rarity[sub] value:", raritySub);
        console.log("rarity[sub] type:", typeof raritySub);

        if (raritySub) {
          console.log("Found rarity[sub]:", raritySub);
          // If it's one of the preset values, use it directly
          if (["100", "1000", "5000", "10000"].includes(raritySub)) {
            rarityFilters = raritySub as STAMP_RARITY;
            console.log(
              "Matched preset value, setting rarityFilters to:",
              rarityFilters,
            );
          } else {
            console.log("Value not in preset list:", raritySub);
          }
        } else {
          console.log("No rarity[sub] parameter found");
        }

        // Also handle custom range if needed
        const rarityMin = url.searchParams.get("rarity[stampRange][min]");
        const rarityMax = url.searchParams.get("rarity[stampRange][max]");

        console.log("Custom range values - min:", rarityMin, "max:", rarityMax);

        if (rarityMin || rarityMax) {
          rarityFilters = {
            stampRange: {
              min: rarityMin || "",
              max: rarityMax || "",
            },
          };
          console.log("Set custom range rarityFilters:", rarityFilters);
        }

        console.log("Final rarity filters:", rarityFilters);

        // Log the complete options being passed to the controller
        console.log("Complete options for StampController.getStamps:", {
          page,
          limit: effectiveLimit,
          sortBy: sortValidation,
          type: routeConfig.type,
          allColumns: false,
          skipTotalCount: false,
          includeSecondary: true,
          cacheType,
          suffixFilters,
          filetypeFilters,
          editionFilters,
          rarityFilters,
        });

        // For index routes, we only need core columns for better performance
        const result = await StampController.getStamps({
          page,
          limit: effectiveLimit,
          sortBy: sortValidation,
          type: routeConfig.type,
          allColumns: false,
          skipTotalCount: false,
          includeSecondary: true, // Explicitly exclude secondary columns for listings
          cacheType,
          suffixFilters,
          filetypeFilters,
          editionFilters,
          rarityFilters,
        });

        // Log the result count to see if any filtering was applied
        console.log(
          `Result returned ${result.data?.length || 0} stamps out of ${
            result.total || 0
          } total`,
        );

        return ApiResponseUtil.success(result, { routeType: cacheType });
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
            return ApiResponseUtil.notFound("No holders found for this stamp");
          }
          return ApiResponseUtil.success(holders, { routeType: cacheType });
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
            return ApiResponseUtil.notFound(
              "No dispensers found for this stamp",
            );
          }
          return ApiResponseUtil.success(dispensers, { routeType: cacheType });
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
            return ApiResponseUtil.notFound("No sends found for this stamp");
          }
          return ApiResponseUtil.success(sends, { routeType: cacheType });
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
            return ApiResponseUtil.notFound(
              "No dispenses found for this stamp",
            );
          }
          return ApiResponseUtil.success(dispenses, { routeType: cacheType });
        }

        // For individual stamp details, we want both core and secondary columns
        const stampData = await StampController.getStampDetailsById(
          id,
          routeConfig.type,
          cacheType,
          undefined, // Use default cache duration
          true, // Explicitly include secondary columns for details
          requestQuery ? requestQuery.includes("search") : false,
        );

        if (!stampData) {
          return ApiResponseUtil.notFound("Stamp not found");
        }

        return ApiResponseUtil.success(
          {
            last_block: stampData.last_block,
            data: stampData.data,
          },
          { routeType: cacheType },
        );
      }
    } catch (error) {
      console.error("Error in stamp handler:", error);
      const errorMessage = routeConfig.isIndex
        ? `Error fetching paginated ${routeConfig.type}`
        : "Error fetching stamp data";
      return ApiResponseUtil.internalError(error, errorMessage);
    }
  },
});
