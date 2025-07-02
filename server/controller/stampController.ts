import { StampService } from "$server/services/stampService.ts";
import { BIG_LIMIT, CAROUSEL_STAMP_IDS } from "$lib/utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "$globals";
import { Src20Service } from "$server/services/src20/queryService.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { paginate } from "$lib/utils/paginationUtils.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import {
  PaginatedStampBalanceResponseBody,
  ProcessedHolder,
  StampRow,
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  STAMP_FILETYPES,
  STAMP_EDITIONS,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_FILESIZES,
} from "$globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { filterOptions } from "$lib/utils/filterOptions.ts";
import { Dispense, Dispenser } from "$types/index.d.ts";
import { CollectionController } from "./collectionController.ts";
import { Src20Controller } from "./src20Controller.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { StampRepository } from "$server/database/stampRepository.ts";
import { isCpid, getIdentifierType } from "$lib/utils/identifierUtils.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { detectContentType } from "$lib/utils/imageUtils.ts";
import { getMimeType } from "$lib/utils/imageUtils.ts";
import { API_RESPONSE_VERSION } from "$lib/utils/responseUtil.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";
import { decodeBase64 } from "$lib/utils/formatUtils.ts";

interface StampControllerOptions {
  cacheType: RouteType;
}

export class StampController {
  static async getStamps({
    page = 1,
    limit = BIG_LIMIT,
    sortBy = "DESC",
    type = "all",
    filterBy = [] as STAMP_FILTER_TYPES[],
    ident,
    collectionId,
    identifier,
    blockIdentifier,
    cacheDuration,
    noPagination = false,
    allColumns = false,
    includeSecondary = true,
    sortColumn = "tx_index",
    suffix,
    collectionStampLimit = 12,
    groupBy,
    groupBySubquery,
    skipTotalCount = false,
    cacheType = RouteType.STAMP_LIST,
    enrichWithAssetInfo = false,
    isSearchQuery = false,
    url,
    fileType,
    editions,
    range,
    rangeMin,
    rangeMax,
    market,
    dispensers,
    atomics,
    listings,
    listingsMin,
    listingsMax,
    sales,
    salesMin,
    salesMax,
    volume,
    volumeMin,
    volumeMax,
    fileSize,
    fileSizeMin,
    fileSizeMax,
    // Market Data Filters (Task 42)
    minHolderCount,
    maxHolderCount,
    minDistributionScore,
    maxTopHolderPercentage,
    minFloorPriceBTC,
    maxFloorPriceBTC,
    minVolume24h,
    minPriceChange24h,
    minDataQualityScore,
    maxCacheAgeMinutes,
    priceSource,
  }: {
    page?: number;
    limit?: number;
    sortBy?: "ASC" | "DESC";
    /**
     * If suffix and ident are provided, filterBy and type will be ignored
     */
    suffix?: string[];
    ident?: SUBPROTOCOLS[];
    url?: string;
    isSearchQuery?: boolean;
    enrichWithAssetInfo?: boolean;
    skipTotalCount?: boolean;
    collectionId?: string | undefined;
    type?: "all" | "classic" | "cursed" | "posh" | "stamps" | "src20";
    allColumns?: boolean
    identifier?: string | number | (string | number)[];
    noPagination?: boolean
    cacheDuration?: number
    filterBy?: STAMP_FILTER_TYPES[];
    fileType?: STAMP_FILETYPES[];
    editions?: STAMP_EDITIONS[];
    range?: STAMP_RANGES;
    rangeMin?: string;
    rangeMax?: string;
    market?: Extract<STAMP_MARKETPLACE, "listings" | "sales"> | "";
    dispensers?: boolean;
    atomics?: boolean;
    listings?: Extract<STAMP_MARKETPLACE, "all" | "bargain" | "affordable" | "premium" | "custom"> | "";
    listingsMin?: string;
    listingsMax?: string;
    sales?: Extract<STAMP_MARKETPLACE, "recent" | "premium" | "custom" | "volume"> | "";
    salesMin?: string;
    salesMax?: string;
    volume?: "24h" | "7d" | "30d" | "";
    volumeMin?: string;
    volumeMax?: string;
    fileSize?: STAMP_FILESIZES | null;
    fileSizeMin?: string;
    fileSizeMax?: string;
    // Market Data Filters (Task 42)
    minHolderCount?: string;
    maxHolderCount?: string;
    minDistributionScore?: string;
    maxTopHolderPercentage?: string;
    minFloorPriceBTC?: string;
    maxFloorPriceBTC?: string;
    minVolume24h?: string;
    minPriceChange24h?: string;
    minDataQualityScore?: string;
    maxCacheAgeMinutes?: string;
    priceSource?: string;
  } = {}) {
    console.log("stamp controller payload", {
      page,
      limit,
      sortBy,
      type,
      filterBy,
      ident,
      collectionId,
      url,
      fileType,
      editions,
      range,
      rangeMin,
      rangeMax,
      market,
      dispensers,
      atomics,
      listings,
      listingsMin,
      listingsMax,
      sales,
      salesMin,
      salesMax,
      volume,
      volumeMin,
      volumeMax,
      fileSize,
      fileSizeMin,
      fileSizeMax
    });
    
    console.log("About to call repository with range:", range);
    
    const filterByArray = typeof filterBy === "string"
      ? filterBy.split(",").filter(Boolean) as STAMP_FILTER_TYPES[]
      : filterBy;

    // Initialize ident based on type
    let finalIdent: SUBPROTOCOLS[] = ident || [];
    if ((!ident || ident.length === 0) && type) {
      if (type === "classic") {
        finalIdent = ["STAMP"];
      } else if (type === "posh") {
        finalIdent = [];
      } else if (type === "stamps") {
        finalIdent = ["STAMP", "SRC-721"];
      } else if (type === "src20") {
        finalIdent = ["SRC-20"];
      } else if (type === "all") {
        finalIdent = []; // We'll handle 'all' in the repository
      } else {
        finalIdent = [];
      }
    }

    let filterSuffix: STAMP_SUFFIX_FILTERS[] = [];
    if (filterByArray.length > 0) {
      // Extract ident and suffix from filterBy
      const identFromFilter = filterByArray.flatMap((filter) =>
        filterOptions[filter]?.ident || []
      );
      filterSuffix = filterByArray.flatMap((filter) =>
        filterOptions[filter]?.suffixFilters || []
      ) as STAMP_SUFFIX_FILTERS[];

      // Combine ident from type and filterBy, removing duplicates
      if (identFromFilter.length > 0) {
        finalIdent = Array.from(new Set([...finalIdent, ...identFromFilter]));
      }

      // When filterBy is defined, suffix are limited to those in filterOptions
      suffix = filterSuffix;
    } else if (!suffix || suffix.length === 0) {
      // If suffix are not provided, use all possible suffixes
      suffix = []; // No suffix filter applied
    }

    // If range is undefined but url is provided, check for range parameters
    if (!range && url) {
      try {
        const urlObj = new URL(url);
        const rangeMin = urlObj.searchParams.get("range[stampRange][min]");
        const rangeMax = urlObj.searchParams.get("range[stampRange][max]");
        
        if (rangeMin || rangeMax) {
          console.log("Controller detected custom range params:", { rangeMin, rangeMax });
          range = {
            stampRange: {
              min: rangeMin || "",
              max: rangeMax || ""
            }
          };
          console.log("Controller set range:", range);
        }
      } catch (error) {
        console.error("Error parsing URL in controller:", error);
      }
    }

    // Fetch BTC price once for all stamps
    const btcPriceData = await BTCPriceService.getPrice();
    const btcPrice = btcPriceData.price;
    console.log(`[StampController] BTC price: $${btcPrice} from ${btcPriceData.source}`);

    // For collection pages and stamp lists, use market data cache
    const useMarketData = !identifier || Array.isArray(identifier) || collectionId;
    
    // Always include market data when available
    const stampResult = await StampService.getStamps({
      page,
      limit,
      sortBy,
      type,
      ident: finalIdent,
      suffix,
      allColumns,
      includeSecondary,
      collectionId,
      identifier,
      blockIdentifier,
      cacheDuration,
      noPagination,
      sortColumn,
      collectionStampLimit,
      groupBy,
      groupBySubquery,
      skipTotalCount,
      cacheType,
      isSearchQuery,
      filterBy: filterByArray,
      fileType,
      editions,
      range,
      rangeMin,
      rangeMax,
      market,
      dispensers,
      atomics,
      listings,
      listingsMin,
      listingsMax,
      sales,
      salesMin,
      salesMax,
      volume,
      volumeMin,
      volumeMax,
      fileSize,
      fileSizeMin,
      fileSizeMax,
      // Market Data Filters (Task 42)
      minHolderCount,
      maxHolderCount,
      minDistributionScore,
      maxTopHolderPercentage,
      minFloorPriceBTC,
      maxFloorPriceBTC,
      minVolume24h,
      minPriceChange24h,
      minDataQualityScore,
      maxCacheAgeMinutes,
      priceSource,
      includeMarketData: useMarketData,
      btcPriceUSD: btcPrice
    });

    // Process stamps - only fetch additional asset info for single stamp detail pages
    let processedStamps = stampResult.stamps;
    if (enrichWithAssetInfo && identifier && !Array.isArray(identifier)) {
      // Only enrich with asset info for detail pages
      const stamp = stampResult.stamps[0];
      if (stamp && (stamp.ident === "STAMP" || stamp.ident === "SRC-721")) {
        const asset = await XcpManager.getAssetInfo(stamp.cpid);
        processedStamps = [this.enrichStampWithAssetData(stamp, asset)];
      }
    }

    // Get cache status from the first stamp with market data
    let cacheStatus = 'unknown';
    if (useMarketData && processedStamps.length > 0) {
      const firstStampWithData = processedStamps.find(s => s.cacheStatus);
      cacheStatus = firstStampWithData?.cacheStatus || 'unknown';
    }

    // Build response based on query type
    const baseResponse = {
      data: identifier && !Array.isArray(identifier) 
        ? { stamp: processedStamps[0] }  // Single stamp response
        : processedStamps,               // Multiple stamps response
      last_block: stampResult.last_block,
      metadata: {
        btcPrice: btcPrice,
        cacheStatus: cacheStatus,
        source: btcPriceData.source
      }
    };

    // Add pagination data for index/collection routes
    if (!identifier || Array.isArray(identifier)) {
      return {
        ...baseResponse,
        page: stampResult.page,
        limit: stampResult.page_size,
        totalPages: stampResult.pages,
        total: skipTotalCount ? undefined : stampResult.total,
      };
    }

    return baseResponse;
  }

  // This becomes a wrapper around getStamps for backward compatibility
  static async getStampDetailsById(
    id: string, 
    stampType: STAMP_TYPES = "all",
    cacheType: RouteType = RouteType.STAMP_DETAIL,
    cacheDuration?: number | "never",
    includeSecondary: boolean = true,
    isSearchQuery: boolean = false
  ) {
    return this.getStamps({
      identifier: id,
      type: stampType,
      cacheType,
      cacheDuration,
      allColumns: false,
      noPagination: true,
      skipTotalCount: true,
      enrichWithAssetInfo: true,
      includeSecondary,
      isSearchQuery
    });
  }

  private static enrichStampWithAssetData(stamp: StampRow, asset: any) {
    return {
      ...stamp,
      divisible: asset?.divisible ?? stamp.divisible,
      locked: asset?.locked ?? stamp.locked,
      supply: asset?.supply ?? stamp.supply,
    };
  }

  private static processHolders(holders: HolderRow[]): ProcessedHolder[] {
    // Calculate total quantity first
    const totalQuantity = holders.reduce((sum, holder) => {
      const quantity = holder.divisible ? holder.quantity / 100000000 : holder.quantity;
      return sum + quantity;
    }, 0);

    // Map holders with percentages
    return holders.map((holder: HolderRow) => {
      const quantity = holder.divisible ? holder.quantity / 100000000 : holder.quantity;
      const percentage = totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;

      return {
        address: holder.address,
        amt: quantity,  // Renamed from quantity to amt to match HoldersGraph interface
        percentage: Number(percentage.toFixed(2))  // Round to 2 decimal places
      };
    });
  }

  private static calculateFloorPrice(openDispensers: Dispenser[]): number | "priceless" {
    if (openDispensers.length === 0) return "priceless";
    
    const lowestBtcRate = Math.min(
      ...openDispensers.map(dispenser => 
        Number(formatSatoshisToBTC(dispenser.satoshirate, { includeSymbol: false }))
      )
    );
    
    return lowestBtcRate !== Infinity ? lowestBtcRate : "priceless";
  }

  private static calculateRecentSalePrice(dispensers: Dispenser[]): number | "priceless" {
    if (dispensers.length === 0) return "priceless";

    // Look at both open and closed dispensers to find the most recent
    const closedDispensers = dispensers.filter(d => d.give_remaining === 0);
    const openDispensers = dispensers.filter(d => d.give_remaining > 0);

    // Get most recent from each category
    const mostRecentClosed = closedDispensers.length > 0 
      ? closedDispensers.reduce((prev, current) => 
          (prev.block_index > current.block_index) ? prev : current
        )
      : null;

    const mostRecentOpen = openDispensers.length > 0
      ? openDispensers.reduce((prev, current) => 
          (prev.block_index > current.block_index) ? prev : current
        )
      : null;

    // Compare block indices to find the most recent overall
    const mostRecent = !mostRecentClosed ? mostRecentOpen :
                      !mostRecentOpen ? mostRecentClosed :
                      mostRecentClosed.block_index > mostRecentOpen.block_index 
                        ? mostRecentClosed 
                        : mostRecentOpen;

    return mostRecent ? 
      Number(formatSatoshisToBTC(mostRecent.satoshirate, { includeSymbol: false })) 
      : "priceless";
  }

  static async getRecentSales(page?: number, limit?: number) {
    try {
      const { recentSales, total } = await StampService.getRecentSales(
        page,
        limit,
      );
      const lastBlock = await BlockService.getLastBlock();
      const totalPages = limit ? Math.ceil(total / limit) : 1;

      return {
        page: page || 1,
        limit: limit || total,
        totalPages,
        total,
        last_block: lastBlock,
        data: recentSales,
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error in getRecentSales",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
    sortBy: "ASC" | "DESC" = "DESC"
  ): Promise<PaginatedStampBalanceResponseBody> {
    try {
      const { balances: xcpBalances, total: xcpTotal } = await XcpManager.getAllXcpBalancesByAddress(
        address,
        false
      );
      
      console.log(`[StampController] Got ${xcpBalances.length} XCP balances out of ${xcpTotal} total`);

      // Get paginated stamps and total count
      const [{ stamps, total }, lastBlock] = await Promise.all([
        StampService.getStampBalancesByAddress(
          address, 
          limit, 
          page, 
          xcpBalances,
          sortBy
        ),
        BlockService.getLastBlock(),
      ]);

      console.log(`[StampController] Got ${stamps.length} stamps for page ${page}, total stamps: ${total}`);

      return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        last_block: lastBlock,
        data: stamps,
      };
    } catch (error) {
      console.error("Error in getStampBalancesByAddress:", error);
      throw error;
    }
  }

  static async getMultipleStampCategories(categories: {
    idents: SUBPROTOCOLS[];
    limit: number;
    type: STAMP_TYPES;
    sortBy?: "ASC" | "DESC";
  }[]) {
    const results = await Promise.all(
      categories.map(async (category) => {
        const serviceResult = await StampService.getStamps({
          page: 1,
          limit: category.limit,
          sortBy: category.sortBy || "ASC",
          type: category.type,
          ident: category.idents,
          noPagination: false,
          skipTotalCount: true,
          includeSecondary: false
        });

        return {
          types: category.idents,
          stamps: serviceResult?.stamps ?? [],
          total: serviceResult?.total ?? 0,
        };
      }),
    );

    return results;
  }

  static async getHomePageData() {
    try {
      // Critical above-the-fold content first
      const [carouselData, mainCategories, collections] = await Promise.all([
        this.getStamps({
          identifier: CAROUSEL_STAMP_IDS,
          allColumns: false,
          noPagination: true,
          skipTotalCount: true,
          includeSecondary: false,
          type: "all"
        }),
        this.getMultipleStampCategories([
          { idents: ["STAMP", "SRC-721"], limit: 8, type: "stamps", sortBy: "DESC" },
          { idents: ["SRC-721"], limit: 12, type: "stamps", sortBy: "DESC"  },
          { idents: ["STAMP"], limit: 24, type: "stamps", sortBy: "DESC" }, // Art stamps with DESC order
        ]),
        CollectionController.getCollectionStamps({
          limit: 4,
          page: 1,
          sortBy: "DESC"
        })
      ]);

      // Get posh stamps
      const poshCollection = await CollectionService.getCollectionByName("posh");
      let poshStamps = [];
      if (poshCollection) {
        const poshResult = await this.getStamps({
          collectionId: poshCollection.collection_id,
          page: 1,
          limit: 16,
          sortBy: "DESC",
          skipTotalCount: true,
        });
        poshStamps = poshResult.data;
      }
      // Get stamp URLs for collections more efficiently
      const collectionData = collections?.data ? await (async () => {
        // Get all collection IDs
        const collectionIds = collections.data.map(item => item.collection_id);
        
        // Fetch first stamp for each collection in a single request if possible
        const firstStamps = await Promise.all(
          collectionIds.map(async (collectionId) => {
            const result = await this.getStamps({
              collectionId,
              limit: 1,
              sortBy: "DESC",
              skipTotalCount: true,
              includeMarketData: false // Just need the image URL
            });
            return result.data?.[0];
          })
        );
        
        // Map collection data with images
        return collections.data.map((item, index) => ({
          ...item,
          img: firstStamps[index]?.stamp_url || null
        }));
      })() : [];

      return {
        carouselStamps: carouselData.data ?? [],
        stamps_src721: mainCategories[1]?.stamps ?? [],
        stamps_art: mainCategories[2]?.stamps ?? [], // Now at index 2
        stamps_posh: poshStamps,
        collectionData: collectionData ?? [],
      };

    } catch (error) {
      logger.error("stamps", {
        message: "Error in getHomePageData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getCollectionPageData(params) {
    try {
      const {sortBy} = params
      
      // Fetch BTC price once
      const btcPriceData = await BTCPriceService.getPrice();
      const btcPrice = btcPriceData.price;
      
      const [
        stampCategories,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { idents: ["SRC-721"], limit: 16, sortBy: sortBy },
        ]),
      ]);
      // Fetch the "posh" collection to get its collection_id
      const poshCollection = await CollectionService.getCollectionByName(
        "posh",
      );
      let stamps_posh = [];
      if (poshCollection) {
        const poshCollectionId = poshCollection.collection_id;
        // Fetch stamps from the "posh" collection with cached market data
        const poshStampsResult = await this.getStamps({
          collectionId: poshCollectionId,
          page: 1,
          limit: 24,
          sortBy: sortBy,
          includeMarketData: true, // Use cached market data
          btcPriceUSD: btcPrice
        });
        stamps_posh = poshStampsResult.data;
      } else {
        logger.warn("stamps", {
          message: "Posh collection not found"
        });
      }
      return {
        stamps_src721: stampCategories[0].stamps,
        stamps_posh,
        metadata: {
          btcPrice: btcPrice,
          source: btcPriceData.source
        }
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error in getCollectionPageData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static getIdent(type: string) {
    switch (type) {
      case "src721":
        return ["SRC-721"];
      case "classic":
        return ["STAMP"];
      case "src20":
        return ["SRC-20"];
      default:
        return ["STAMP", "SRC-721"];
    }
  }

  private static async proxyContentRouteToStampsRoute(
    identifier: string,
    stamp_url: string,
    baseUrl?: string,
    contentType: string = 'application/octet-stream'
  ) {
    const proxyPath = `${baseUrl}/stamps/${identifier}`;
    
    try {
      const response = await fetch(proxyPath);
      
      return new Response(response.body, {
        headers: normalizeHeaders({
          ...Object.fromEntries(response.headers),
          "Content-Type": contentType,
          "X-API-Version": API_RESPONSE_VERSION,
          "Vary": "Accept-Encoding, X-API-Version, Origin",
        }),
      });
    } catch (error) {
      logger.error("content", {
        message: "Error fetching from CDN",
        error: error instanceof Error ? error.message : String(error),
        path: proxyPath,
        identifier,
        contentType
      });
      return WebResponseUtil.stampNotFound();
    }
  }

  static async getStampFile(
    identifier: string,
    routeType: RouteType,
    baseUrl?: string,
    isFullPath = false
  ) {
    try {
      // If full path, go directly to proxy
      if (isFullPath) {
        return await this.handleFullPathStamp(identifier, baseUrl);
      }

      const result = await StampService.getStampFile(identifier);
      if (!result) return WebResponseUtil.stampNotFound();

      return await this.handleStampContent(result, identifier);
    } catch (error) {
      logger.error("stamps", {
        message: "Error in getStampFile",
        identifier,
        error: error instanceof Error ? error.message : String(error)
      });
      return WebResponseUtil.stampNotFound();
    }
  }

  private static async handleFullPathStamp(identifier: string, baseUrl?: string) {
    const [, extension] = identifier.split(".");
    const contentType = getMimeType(extension);
    
    return this.proxyContentRouteToStampsRoute(
      identifier,
      `${baseUrl}/stamps/${identifier}`,
      baseUrl,
      contentType
    );
  }

  private static async handleStampContent(result: any, identifier: string) {
    const contentInfo = detectContentType(
      result.body,
      undefined,
      result.headers["Content-Type"] as string | undefined
    );

    const needsDecoding = 
      contentInfo.mimeType.includes('javascript') || 
      contentInfo.mimeType.includes('text/') ||
      contentInfo.mimeType.includes('application/json') ||
      contentInfo.mimeType.includes('xml');

    if (needsDecoding) {
      return this.handleTextContent(result, contentInfo, identifier);
    }

    return this.handleBinaryContent(result, contentInfo);
  }

  private static async handleTextContent(result: any, contentInfo: any, identifier: string) {
    try {
      const decodedContent = await decodeBase64(result.body);

      return WebResponseUtil.stampResponse(decodedContent, contentInfo.mimeType, {
        binary: false,
        headers: normalizeHeaders({
          "CF-No-Transform": contentInfo.mimeType.includes('javascript') || 
                            contentInfo.mimeType.includes('text/html'),
          "X-API-Version": API_RESPONSE_VERSION,
          ...(result.headers || {}),
        })
      });
    } catch (error) {
      logger.error("content", {
        message: "Error decoding text content",
        error: error instanceof Error ? error.message : String(error),
        identifier,
      });
      return ResponseUtil.internalError(error);
    }
  }

  private static handleBinaryContent(result: any, contentInfo: any) {
    return WebResponseUtil.stampResponse(result.body, contentInfo.mimeType, {
      binary: true,
      headers: normalizeHeaders({
        "X-API-Version": API_RESPONSE_VERSION,
        ...(result.headers || {}),
      })
    });
  }

  static async getCreatorNameByAddress(address: string): Promise<Response> {
    try {
      const name = await StampService.getCreatorNameByAddress(address);
      return WebResponseUtil.jsonResponse({ name });
    } catch (error) {
      console.error("Error in getCreatorNameByAddress:", error);
      return WebResponseUtil.internalError(error, "Error getting creator name");
    }
  }

  static async updateCreatorName(address: string, newName: string): Promise<Response> {
    try {
      const success = await StampService.updateCreatorName(address, newName);
      return WebResponseUtil.jsonResponse({ success });
    } catch (error) {
      console.error("Error in updateCreatorName:", error);
      return WebResponseUtil.internalError(error, "Error updating creator name");
    }
  }

  static async getDispensersWithStampsByAddress(
    address: string, 
    page: number = 1,
    limit: number = 50,
    options = {}
  ) {
    try {
      // Add logging
      console.log("[StampController] Getting dispensers with params:", {
        address,
        page,
        limit,
        options
      });

      const dispensersData = await XcpManager.getDispensersByAddress(address, {
        verbose: true,
        page,
        limit,
        ...options
      });

      // Add detailed logging for dispenser data
      console.log("[StampController] Dispenser data details:", {
        total: dispensersData.total,
        dispensersCount: dispensersData.dispensers.length,
        page,
        limit,
        hasDispensers: dispensersData.dispensers.length > 0,
        firstDispenser: dispensersData.dispensers[0]?.cpid,
        lastDispenser: dispensersData.dispensers[dispensersData.dispensers.length - 1]?.cpid
      });

      if (!dispensersData.dispensers.length) {
        return {
          dispensers: [],
          total: 0
        };
      }

      // Get unique CPIDs from dispensers
      const uniqueCpids = [...new Set(dispensersData.dispensers.map(d => d.cpid))];

      // Fetch stamps data for all CPIDs
      const stampsData = await this.getStamps({
        identifier: uniqueCpids,
        allColumns: false,
        noPagination: true
      });

      // Create a map of stamps by CPID for faster lookup
      const stampsByCpid = new Map(
        stampsData.data?.map(stamp => [stamp.cpid, stamp]) || []
      );

      // Merge stamp data into dispensers
      const dispensersWithStamps = dispensersData.dispensers.map(dispenser => ({
        ...dispenser,
        stamp: stampsByCpid.get(dispenser.cpid) || null
      }));

      return {
        dispensers: dispensersWithStamps,
        total: dispensersData.total
      };
    } catch (error) {
      logger.error("getDispensersWithStampsByAddress", {
        message: "Error fetching dispensers with stamps",
        error: error instanceof Error ? error.message : String(error),
        address
      });
      throw error;
    }
  }

  static async resolveToCpid(id: string): Promise<string> {
    if (isCpid(id)) {
      return id;
    }
    const result = await StampService.resolveToCpid(id);
    if (!result?.cpid) {
      throw new Error(`Could not resolve identifier ${id} to a cpid`);
    }
    return result.cpid;
  }

  static async getStampHolders(id: string, page: number = 1, limit: number = 50, cacheType: RouteType) {
    try {
      // If not a CPID, resolve it
      const cpid = isCpid(id) ? id : await this.resolveToCpid(id);
      
      const { holders, total } = await StampService.getStampHolders(
        cpid,
        page, 
        limit, 
        { cacheType }
      );

      return {
        data: this.processHolders(holders),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching stamp holders",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getStampSends(
    id: string, 
    page: number = 1, 
    limit: number = 50,
    cacheType: RouteType
  ) {
    try {
      const cpid = await this.resolveToCpid(id);
      const { sends, total } = await StampService.getStampSends(cpid, page, limit, { cacheType });
      return {
        data: sends,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching stamp sends",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getStampDispensers(
    id: string, 
    page: number, 
    limit: number,
    cacheType: RouteType
  ) {
    try {
      const cpid = await this.resolveToCpid(id);
      const { dispensers, total } = await StampService.getStampDispensers(cpid, page, limit, { cacheType });
      return {
        data: dispensers,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching stamp dispensers",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getAllStampDispensers(
    id: string,
    cacheType: RouteType
  ) {
    try {
      const cpid = await this.resolveToCpid(id);
      const { dispensers, total } = await StampService.getAllStampDispensers(cpid, { cacheType });
      return {
        data: dispensers,
        total
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching all stamp dispensers",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getStampDispenses(
    id: string, 
    page: number = 1, 
    limit: number = 50,
    cacheType: RouteType
  ) {
    try {
      const cpid = await this.resolveToCpid(id);
      const { dispenses, total } = await StampService.getStampDispenses(cpid, page, limit, { cacheType });
      return {
        data: dispenses,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching stamp dispenses",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getStampsCreatedCount(address: string): Promise<number> {
    try {
      // Use a direct count query instead of getStamps
      const result = await StampRepository.getStampsCreatedCount(address);
      return result.total || 0;
    } catch (error) {
      logger.error("stamps", {
        message: "Error getting stamps created count",
        error: error instanceof Error ? error.message : String(error),
        address
      });
      return 0;
    }
  }

  /**
   * Calculate total value of stamps in a wallet using cached market data
   * This is a specialized method for the wallet page that won't affect API endpoints
   */
  static async calculateWalletStampValues(stamps: StampBalance[]): Promise<{
    stampValues: { [cpid: string]: string | number };
    totalValue: number;
  }> {
    try {
      const stampValues: { [cpid: string]: string | number } = {};
      let totalValue = 0;

      // Get BTC price once
      const btcPriceData = await BTCPriceService.getPrice();
      const btcPrice = btcPriceData.price;

      // Get all stamp CPIDs
      const cpids = stamps.map(s => s.cpid);
      
      // Fetch stamps with market data in a single request
      const stampsResult = await StampService.getStamps({
        identifier: cpids,
        allColumns: false,
        noPagination: true,
        skipTotalCount: true,
        includeMarketData: true,
        btcPriceUSD: btcPrice
      });

      // Create a map of stamps by CPID for quick lookup
      const stampsByCpid = new Map(
        stampsResult.stamps.map(stamp => [stamp.cpid, stamp])
      );

      // Calculate values using cached market data
      stamps.forEach((walletStamp) => {
        const stampData = stampsByCpid.get(walletStamp.cpid);
        if (stampData && stampData.marketData) {
          const unitPrice = stampData.marketData.floorPriceBTC || 
                           stampData.marketData.recentSalePriceBTC || 
                           0;
          const totalStampValue = unitPrice * walletStamp.balance;
          stampValues[walletStamp.cpid] = totalStampValue;
          totalValue += totalStampValue;
        } else {
          stampValues[walletStamp.cpid] = 0;
        }
      });

      return { stampValues, totalValue };
    } catch (error) {
      logger.error("calculateWalletStampValues", {
        message: "Error calculating wallet stamp values",
        error: error instanceof Error ? error.message : String(error)
      });
      return { stampValues: {}, totalValue: 0 };
    }
  }

  static async getSpecificStamp(tx_index: string): Promise<{ stamp_url: string, stamp_mimetype: string }> {
    return await StampService.getSpecificStamp(tx_index);
  }
}
