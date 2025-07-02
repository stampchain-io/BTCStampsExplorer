import { StampRepository } from "$server/database/index.ts";
import { BlockService } from "$server/services/blockService.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  SUBPROTOCOLS,
  STAMP_FILETYPES,
  STAMP_EDITIONS,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_FILESIZES,
} from "$globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import { DispenserFilter } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import { getMimeType, detectContentType } from "$lib/utils/imageUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import type { StampWithMarketData, StampMarketData } from "$lib/types/marketData.d.ts";

interface StampServiceOptions {
  cacheType: RouteType;
}

interface StampFileResult {
  status: number;
  body: string;
  stamp_url: string;
  tx_hash: string;
  headers: {
    "Content-Type": string;
    [key: string]: string;
  };
}

export class StampService {
  static async getStampDetailsById(
    id: string | number,
    stampType: STAMP_TYPES = "all",
    cacheType?: RouteType,
    cacheDuration?: number | "never",
    includeSecondary: boolean = true
  ) {
    try {
      // Get stamp details using getStamps with proper caching
      const stampResult = await this.getStamps({
        identifier: id,
        allColumns: false,
        noPagination: true,
        type: stampType,
        skipTotalCount: true,
        cacheType,
        cacheDuration,
        includeSecondary
      });

      if (!stampResult) {
        throw new Error(`Error: Stamp ${id} not found`);
      }

      const stamp = this.extractStamp(stampResult);

      // For non-STAMP/SRC-721, return basic info
      if (stamp.ident !== "STAMP" && stamp.ident !== "SRC-721") {
        return {
          stamp,
          last_block: stampResult.last_block,
        };
      }

      // Get asset details from XCP with same cache parameters
      const { duration } = getCacheConfig(cacheType || RouteType.STAMP_DETAIL);
      const asset = await XcpManager.getAssetInfo(stamp.cpid, duration);

      return {
        stamp,
        asset,
        last_block: stampResult.last_block,
      };
    } catch (error) {
      console.error("Error in getStampDetailsById:", error);
      return null;
    }
  }

  private static extractStamp(stampResult: any) {
    console.log(
      "Extracting stamp from result:",
      JSON.stringify(stampResult, null, 2),
    );

    // Access 'stampResult.stamps' instead of 'stampResult.rows'
    if (Array.isArray(stampResult.stamps)) {
      if (stampResult.stamps.length === 0) {
        console.error("Stamp not found: empty stamps array");
        throw new Error(`Error: Stamp not found`);
      }
      return stampResult.stamps[0];
    } 
    // Handle single stamp result
    else if (stampResult.stamp) {
      return stampResult.stamp;
    } 
    // Handle direct result
    else {
      return stampResult;
    }
  }

  static async getStamps(options: {
    page?: number;
    limit?: number;
    sortBy?: "ASC" | "DESC";
    type?: STAMP_TYPES;
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[];
    identifier?: string | number | (string | number)[];
    blockIdentifier?: number | string;
    allColumns?: boolean;
    includeSecondary?: boolean;
    noPagination?: boolean;
    cacheDuration?: number | "never";
    collectionId?: string | string[];
    sortColumn?: string;
    groupBy?: string;
    groupBySubquery?: boolean;
    skipTotalCount?: boolean;
    cacheType?: RouteType;
    creatorAddress?: string;
    filterBy?: STAMP_FILTER_TYPES[];
    suffix?: STAMP_SUFFIX_FILTERS[];
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
    url?: string;
    includeMarketData?: boolean;
    btcPriceUSD?: number;
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
  }) {
    // Extract range parameters from URL if not already set
    let range = options.range;
    
    if (!range && options.url) {
      try {
        const url = new URL(options.url);
        const rangeMin = url.searchParams.get("range[stampRange][min]");
        const rangeMax = url.searchParams.get("range[stampRange][max]");
        
        if (rangeMin || rangeMax) {
          console.log("Service extracting range params:", { rangeMin, rangeMax });
          range = {
            stampRange: {
              min: rangeMin || "",
              max: rangeMax || ""
            }
          };
          console.log("Service created range:", range);
        }
      } catch (error) {
        console.error("Error extracting range from URL:", error);
      }
    }

    const queryOptions = {
      ...options,
      // Add collection query defaults if needed
      ...(options.collectionId && (!options.groupBy || !options.groupBySubquery) ? {
        groupBy: "collection_id",
        groupBySubquery: true
      } : {}),
    };

    if (options.url) {
      const url = new URL(options.url);
      console.log("All URL params in service:", Object.fromEntries(url.searchParams.entries()));
      console.log("Range params:", {
        min: url.searchParams.get("range[stampRange][min]"),
        max: url.searchParams.get("range[stampRange][max]")
      });
    }

    console.log("About to call repository with range:", range);

    const [result, lastBlock] = await Promise.all([
      StampRepository.getStamps({
        ...queryOptions,
        includeSecondary: options.includeSecondary,
        cacheType: options.cacheType,
        cacheDuration: options.cacheDuration,
        fileType: options.fileType,
        editions: options.editions,
        range: range,
        rangeMin: options.rangeMin,
        rangeMax: options.rangeMax,
        market: options.market,
        dispensers: options.dispensers,
        atomics: options.atomics,
        listings: options.listings,
        listingsMin: options.listingsMin,
        listingsMax: options.listingsMax,
        sales: options.sales,
        salesMin: options.salesMin,
        salesMax: options.salesMax,
        volume: options.volume,
        volumeMin: options.volumeMin,
        volumeMax: options.volumeMax,
        fileSize: options.fileSize,
        fileSizeMin: options.fileSizeMin,
        fileSizeMax: options.fileSizeMax,
        // Pass filters object with market data filters (Task 42)
        filters: {
          minHolderCount: options.minHolderCount,
          maxHolderCount: options.maxHolderCount,
          minDistributionScore: options.minDistributionScore,
          maxTopHolderPercentage: options.maxTopHolderPercentage,
          minFloorPriceBTC: options.minFloorPriceBTC,
          maxFloorPriceBTC: options.maxFloorPriceBTC,
          minVolume24h: options.minVolume24h,
          minPriceChange24h: options.minPriceChange24h,
          minDataQualityScore: options.minDataQualityScore,
          maxCacheAgeMinutes: options.maxCacheAgeMinutes,
          priceSource: options.priceSource,
        },
      }),
      BlockService.getLastBlock(),
    ]);

    if (!result) {
      throw new Error("NO STAMPS FOUND");
    }

    // Get initial results - marketplace filtering is now handled in the repository
    const initialResult = result;

    // Enrich with market data if requested and we have stamps
    let processedStamps = initialResult.stamps;
    if (options.includeMarketData && processedStamps.length > 0) {
      // Get market data for all stamps in a single query
      const cpids = processedStamps.map(stamp => stamp.cpid).filter(Boolean);
      const marketDataMap = await MarketDataRepository.getBulkStampMarketData(cpids);
      
      // Enrich each stamp with its market data
      processedStamps = processedStamps.map(stamp => {
        if (!stamp.cpid || (stamp.ident !== "STAMP" && stamp.ident !== "SRC-721")) {
          return stamp;
        }
        
        const marketData = marketDataMap.get(stamp.cpid) || null;
        return this.enrichStampWithMarketData(stamp, marketData, options.btcPriceUSD || 0);
      });
    }

    // Build base response
    const response = {
      stamps: processedStamps,
      last_block: lastBlock,
    };

    // Add pagination info for collection queries and index routes
    if ((options.collectionId && options.groupBy === "collection_id") || !options.skipTotalCount) {
      return {
        ...response,
        page: initialResult.page,
        page_size: initialResult.page_size,
        pages: initialResult.pages,
        total: initialResult.total,
      };
    }

    return response;
  }

  static async getStampFile(id: string): Promise<StampFileResult | null> {
    const result = await StampRepository.getStampFile(id);
    if (!result) return null;

    await logger.debug("content" as LogNamespace, {
      message: "StampService processing file",
      id,
      originalUrl: result.stamp_url,
      mimeType: result.stamp_mimetype,
    });

    return {
      status: 200,
      body: result.stamp_base64,
      stamp_url: result.stamp_url,
      tx_hash: result.tx_hash,
      headers: {
        "Content-Type": result.stamp_mimetype
      }
    };
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
    xcpBalances: XcpBalance[],
    sortBy: "ASC" | "DESC" = "DESC"
  ) {
    try {
      // Get stamps and total count in parallel using the passed XCP balances
      const [stamps, totalResult] = await Promise.all([
        StampRepository.getStampBalancesByAddress(address, limit, page, xcpBalances, sortBy),
        StampRepository.getCountStampBalancesByAddressFromDb(address, xcpBalances)
      ]);

      const total = totalResult.rows[0]?.total || 0;

      return { stamps, total };
    } catch (error) {
      console.error("Error in getStampBalancesByAddress:", error);
      return { stamps: [], total: 0 };
    }
  }

  static async getAllCPIDs() {
    return await StampRepository.getALLCPIDs();
  }

  static mapDispensesWithRates(dispenses, dispensers) {
    const dispenserRates = new Map(
      dispensers.map((d) => [d.tx_hash, d.satoshirate]),
    );
    return dispenses.map((dispense) => ({
      ...dispense,
      satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
    }));
  }

  static async getRecentSales(page?: number, limit?: number) {
    // Fetch dispense events and extract unique asset values
    const dispenseEvents = await XcpManager.fetchDispenseEvents(500);
    const uniqueAssets = [...new Set(dispenseEvents.map((event) => event.params.asset))];

    const stampDetails = await this.getStamps({
      identifier: uniqueAssets,
      allColumns: false,
      noPagination: true,
      type: "all",
      skipTotalCount: true,
      creatorAddress: undefined
    });

    const stampDetailsMap = new Map(
      stampDetails.stamps.map((stamp) => [stamp.cpid, stamp])
    );

    const allRecentSales = dispenseEvents
      .map((event) => {
        const stamp = stampDetailsMap.get(event.params.asset);
        if (!stamp) return null;
        return {
          ...stamp,
          sale_data: {
            btc_amount: Number(formatBTCAmount(event.params.btc_amount, { 
              includeSymbol: false 
            })),
            block_index: event.block_index,
            tx_hash: event.tx_hash,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sale_data.block_index - a.sale_data.block_index);

    const total = allRecentSales.length;

    if (page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSales = allRecentSales.slice(startIndex, endIndex);
      return { recentSales: paginatedSales, total };
    }

    return { recentSales: allRecentSales, total };
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    return await StampRepository.getCreatorNameByAddress(address);
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    return await StampRepository.updateCreatorName(address, newName);
  }

  static async getStampHolders(
    cpid: string, 
    page: number, 
    limit: number,
    options: StampServiceOptions
  ) {
    const { duration } = getCacheConfig(options.cacheType);
    return await XcpManager.getAllXcpHoldersByCpid(cpid, page, limit, duration);
  }

  static async getStampSends(
    cpid: string, 
    page: number, 
    limit: number,
    options: StampServiceOptions
  ) {
    const { duration } = getCacheConfig(options.cacheType);
    return await XcpManager.getXcpSendsByCPID(cpid, page, limit, duration);
  }

  static async getStampDispensers(
    cpid: string, 
    page?: number, 
    limit?: number,
    options: StampServiceOptions
  ) {
    const { duration } = getCacheConfig(options.cacheType);
    if (page !== undefined && limit !== undefined) {
      return await DispenserManager.getDispensersByCpid(cpid, page, limit, duration);
    }
    return await DispenserManager.getDispensersByCpid(cpid);
  }

  static async getStampDispenses(
    cpid: string, 
    page: number, 
    limit: number,
    options: StampServiceOptions
  ) {
    const { duration } = getCacheConfig(options.cacheType);
    return await DispenserManager.getDispensesByCpid(cpid, page, limit, duration);
  }

  // New lightweight method to just get cpid
  static async resolveToCpid(id: string) {
    try {
      const result = await StampRepository.getStamps({
        identifier: id,
        allColumns: false,
        noPagination: true,
        skipTotalCount: true,
        // Only select minimal required fields
        selectColumns: ['cpid', 'ident'],
        // Important: Don't filter by type to allow cursed stamps
        type: "all"  
      });

      if (!result?.stamps?.[0]) {
        throw new Error(`Error: Stamp ${id} not found`);
      }

      return result.stamps[0];
    } catch (error) {
      console.error(`Error resolving CPID for ${id}:`, error);
      throw error;
    }
  }

  static async countTotalStamps(): Promise<{ isValid: boolean; count: number }> {
    return await StampRepository.countTotalStamps();
  }

  static async getSpecificStamp(tx_index: string): Promise<{ stamp_url: string, stamp_mimetype: string }> {
    return await StampRepository.getSpecificStamp(tx_index);
  }

  /**
   * Enrich a stamp with market data
   * @param stamp - The stamp to enrich
   * @param marketData - The market data to add
   * @param btcPriceUSD - Current BTC price in USD
   * @returns Stamp enriched with market data
   */
  private static enrichStampWithMarketData(
    stamp: any,
    marketData: StampMarketData | null,
    btcPriceUSD: number
  ): any {
    // If no market data, return stamp with default values
    if (!marketData) {
      return {
        ...stamp,
        floorPrice: "priceless",
        floorPriceUSD: null,
        marketData: null,
        cacheStatus: undefined,
        marketDataMessage: "No market data available for this stamp"
      };
    }

    // Determine floor price
    let floorPrice: number | "priceless" = "priceless";
    if (marketData.floorPriceBTC !== null && marketData.floorPriceBTC > 0) {
      floorPrice = marketData.floorPriceBTC;
    } else if (marketData.recentSalePriceBTC !== null && marketData.recentSalePriceBTC > 0) {
      // Fallback to recent sale price if no floor price
      floorPrice = marketData.recentSalePriceBTC;
    }

    return {
      ...stamp,
      floorPrice,
      floorPriceUSD: typeof floorPrice === 'number' ? floorPrice * btcPriceUSD : null,
      marketCapUSD: typeof stamp.marketCap === 'number' ? stamp.marketCap * btcPriceUSD : null,
      marketData: {
        ...marketData,
        // Add USD conversions
        floorPriceUSD: marketData.floorPriceBTC ? marketData.floorPriceBTC * btcPriceUSD : null,
        recentSalePriceUSD: marketData.recentSalePriceBTC ? marketData.recentSalePriceBTC * btcPriceUSD : null,
        volume24hUSD: marketData.volume24hBTC ? marketData.volume24hBTC * btcPriceUSD : null,
        volume7dUSD: marketData.volume7dBTC ? marketData.volume7dBTC * btcPriceUSD : null,
        volume30dUSD: marketData.volume30dBTC ? marketData.volume30dBTC * btcPriceUSD : null,
      },
      // Add cache status
      cacheStatus: marketData.lastUpdated ? 
        this.getCacheStatus(marketData.lastUpdated) : undefined,
      dispenserInfo: {
        openCount: marketData.openDispensersCount || 0,
        closedCount: marketData.closedDispensersCount || 0,
        totalCount: marketData.totalDispensersCount || 0
      }
    };
  }

  /**
   * Get cache status based on last update time
   */
  private static getCacheStatus(lastUpdated: Date): string {
    const ageMinutes = (Date.now() - lastUpdated.getTime()) / (1000 * 60);
    if (ageMinutes < 5) return 'fresh';
    if (ageMinutes < 30) return 'recent';
    if (ageMinutes < 60) return 'stale';
    return 'outdated';
  }

  /**
   * Get stamps with market data using efficient JOIN queries
   */
  static async getStampsWithMarketData(options: {
    collectionId?: string;
    offset?: number;
    limit?: number;
    filters?: any;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    btcPriceUSD: number;
  }): Promise<any[]> {
    // Use the repository method that includes JOIN with market data
    const stampsWithMarketData = await MarketDataRepository.getStampsWithMarketData({
      collectionId: options.collectionId,
      offset: options.offset,
      limit: options.limit,
      filters: options.filters,
      sortBy: options.sortBy,
      sortOrder: options.sortOrder
    });

    // Enrich each stamp with USD calculations and cache status
    return stampsWithMarketData.map(stampData => {
      const { marketData, cacheStatus, cacheAgeMinutes, ...stamp } = stampData;
      return this.enrichStampWithMarketData(stamp, marketData, options.btcPriceUSD);
    });
  }
}
