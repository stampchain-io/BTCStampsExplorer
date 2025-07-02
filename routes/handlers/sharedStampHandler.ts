import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { validateSortDirection } from "$server/services/validationService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import {
  STAMP_EDITIONS,
  STAMP_FILESIZES,
  STAMP_FILETYPES,
  STAMP_MARKETPLACE,
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
        url.searchParams.get("filetype"),
      );
      console.log("Edition parameter:", url.searchParams.get("editions"));
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
        const fileType = url.searchParams.get("filetype")?.split(",")
          .filter(Boolean) as STAMP_FILETYPES[] | undefined;
        const editions = url.searchParams.get("editions")?.split(",")
          .filter(Boolean) as STAMP_EDITIONS[] | undefined;

        // Extract new marketplace filters
        const market = url.searchParams.get("market") as
          | Extract<STAMP_MARKETPLACE, "listings" | "sales">
          | "" || "";
        const dispensers = url.searchParams.get("dispensers") === "true";
        const atomics = url.searchParams.get("atomics") === "true";
        const listings = url.searchParams.get("listings") as
          | Extract<
            STAMP_MARKETPLACE,
            "all" | "bargain" | "affordable" | "premium" | "custom"
          >
          | "" || "";
        const listingsMin = url.searchParams.get("listingsMin") || undefined;
        const listingsMax = url.searchParams.get("listingsMax") || undefined;
        const sales = url.searchParams.get("sales") as
          | Extract<
            STAMP_MARKETPLACE,
            "recent" | "premium" | "custom" | "volume"
          >
          | "" || "";
        const salesMin = url.searchParams.get("salesMin") || undefined;
        const salesMax = url.searchParams.get("salesMax") || undefined;
        const volume =
          url.searchParams.get("volume") as "24h" | "7d" | "30d" | "" || "";
        const volumeMin = url.searchParams.get("volumeMin") || undefined;
        const volumeMax = url.searchParams.get("volumeMax") || undefined;

        // Extract file size filters
        const fileSize =
          url.searchParams.get("fileSize") as STAMP_FILESIZES | null || null;
        const fileSizeMin = url.searchParams.get("fileSizeMin") || undefined;
        const fileSizeMax = url.searchParams.get("fileSizeMax") || undefined;

        // Extract range filters
        const rangePreset = url.searchParams.get("rangePreset") || "";
        const rangeMin = url.searchParams.get("rangeMin") || "";
        const rangeMax = url.searchParams.get("rangeMax") || "";

        let range: STAMP_RANGES | undefined = undefined;

        // Set range based on preset or custom values
        if (
          rangePreset &&
          ["100", "1000", "5000", "10000"].includes(rangePreset as any)
        ) {
          range = rangePreset as STAMP_RANGES;
        } else if (rangeMin || rangeMax) {
          range = "custom";
        }

        // Extract market data filters (Task 42)
        const minHolderCount = url.searchParams.get("minHolderCount") ||
          undefined;
        const maxHolderCount = url.searchParams.get("maxHolderCount") ||
          undefined;
        const minDistributionScore =
          url.searchParams.get("minDistributionScore") || undefined;
        const maxTopHolderPercentage =
          url.searchParams.get("maxTopHolderPercentage") || undefined;
        const minFloorPriceBTC = url.searchParams.get("minFloorPriceBTC") ||
          undefined;
        const maxFloorPriceBTC = url.searchParams.get("maxFloorPriceBTC") ||
          undefined;
        const minVolume24h = url.searchParams.get("minVolume24h") || undefined;
        const minPriceChange24h = url.searchParams.get("minPriceChange24h") ||
          undefined;
        const minDataQualityScore =
          url.searchParams.get("minDataQualityScore") || undefined;
        const maxCacheAgeMinutes = url.searchParams.get("maxCacheAgeMinutes") ||
          undefined;
        const priceSource = url.searchParams.get("priceSource") || undefined;

        // Important part: Pass the min/max values directly to the controller
        const result = await StampController.getStamps({
          page,
          limit: effectiveLimit,
          sortBy: sortValidation,
          type: routeConfig.type,
          allColumns: false,
          skipTotalCount: false,
          ...(fileType && { fileType }),
          ...(editions && { editions }),
          ...(market && { market }),
          ...(dispensers !== undefined && { dispensers }),
          ...(atomics !== undefined && { atomics }),
          ...(listings && { listings }),
          ...(listingsMin && { listingsMin }),
          ...(listingsMax && { listingsMax }),
          ...(sales && { sales }),
          ...(salesMin && { salesMin }),
          ...(salesMax && { salesMax }),
          ...(volume && { volume }),
          ...(volumeMin && { volumeMin }),
          ...(volumeMax && { volumeMax }),
          ...(fileSize !== null && { fileSize }),
          ...(fileSizeMin && { fileSizeMin }),
          ...(fileSizeMax && { fileSizeMax }),
          ...(range && { range }),
          ...(rangeMin && { rangeMin }),
          ...(rangeMax && { rangeMax }),
          // Market data filters (Task 42)
          ...(minHolderCount && { minHolderCount }),
          ...(maxHolderCount && { maxHolderCount }),
          ...(minDistributionScore && { minDistributionScore }),
          ...(maxTopHolderPercentage && { maxTopHolderPercentage }),
          ...(minFloorPriceBTC && { minFloorPriceBTC }),
          ...(maxFloorPriceBTC && { maxFloorPriceBTC }),
          ...(minVolume24h && { minVolume24h }),
          ...(minPriceChange24h && { minPriceChange24h }),
          ...(minDataQualityScore && { minDataQualityScore }),
          ...(maxCacheAgeMinutes && { maxCacheAgeMinutes }),
          ...(priceSource && { priceSource }),
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
        : `Error fetching stamp details for ID ${ctx.params.id}`;
      return ApiResponseUtil.success({ error: errorMessage }, { status: 500 });
    }
  },
});
