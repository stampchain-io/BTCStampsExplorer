import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { validateSortDirection } from "$server/services/validationService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import {
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_MARKET,
  STAMP_RANGES,
} from "$globals";

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
  const sortBy = url.searchParams.get("sortBy");
  return sortBy;
}

export const createStampHandler = (
  routeConfig: StampHandlerConfig,
): Handlers => ({
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);

      // Log parameters for debugging
      console.log("[Stamp Handler]", {
        url: req.url,
        pathname: url.pathname,
        params: Object.fromEntries(
          [...url.searchParams.entries()].filter(([key]) =>
            key.includes("range") || key === "type"
          ),
        ),
        headers: Object.fromEntries([...req.headers.entries()]),
      });

      console.log(
        "All URL parameters:",
        Object.fromEntries(url.searchParams.entries()),
      );
      console.log("Range parameter:", url.searchParams.get("range[sub]"));
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
      console.log("Range sub value:", url.searchParams.get("range[sub]"));

      // Try different ways to extract the parameter
      console.log(
        "Direct parameter access:",
        url.searchParams.get("range[sub]"),
      );

      // Try using entries to see all parameters
      for (const [key, value] of url.searchParams.entries()) {
        console.log(`Parameter: ${key} = ${value}`);
        // Check if any key contains "range"
        if (key.includes("range")) {
          console.log("Found range-related parameter:", key, value);
        }
      }

      console.log("Full URL being passed:", req.url);

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

        // Extract filters
        const filetypeFilters = url.searchParams.get("filetype")?.split(",")
          .filter(Boolean) as STAMP_FILETYPES[] | undefined;
        const editionFilters = url.searchParams.get("editions")?.split(",")
          .filter(Boolean) as STAMP_EDITIONS[] | undefined;

        // Add market filter extraction
        const marketParam = url.searchParams.get("market");
        const marketFilters = marketParam?.split(",").filter(Boolean) as
          | STAMP_MARKET[]
          | undefined;
        const marketMin = url.searchParams.get("marketMin") || undefined;
        const marketMax = url.searchParams.get("marketMax") || undefined;

        // Extract range filters
        const rangePreset = url.searchParams.get("rangePreset") || "";
        const rangeMin = url.searchParams.get("rangeMin") || "";
        const rangeMax = url.searchParams.get("rangeMax") || "";

        let rangeFilters: STAMP_RANGES | undefined = undefined;

        // Set rangeFilters based on preset or custom values
        if (
          rangePreset &&
          ["100", "1000", "5000", "10000"].includes(rangePreset as any)
        ) {
          rangeFilters = rangePreset as STAMP_RANGES;
        } else if (rangeMin || rangeMax) {
          rangeFilters = "custom";
        }

        // Important part: Pass the min/max values directly to the controller
        const result = await StampController.getStamps({
          page,
          limit: effectiveLimit,
          sortBy: sortValidation,
          type: routeConfig.type,
          allColumns: false,
          skipTotalCount: false,
          includeSecondary: true,
          cacheType,
          filetypeFilters,
          editionFilters,
          marketFilters,
          marketMin,
          marketMax,
          rangeFilters,
          rangeMin,
          rangeMax,
        });

        // Return the normal result
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
        : `Error fetching stamp details for ID ${id}`;
      return ApiResponseUtil.error(errorMessage);
    }
  },
});
