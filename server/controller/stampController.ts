import { StampService } from "$server/services/stampService.ts";
import { BIG_LIMIT, CAROUSEL_STAMP_IDS } from "$lib/utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "$globals";
import { Src20Service } from "$server/services/src20/queryService.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { paginate } from "$lib/utils/paginationUtils.ts";
import {
  PaginatedStampBalanceResponseBody,
  ProcessedHolder,
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampRow,
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
    sortBy = "ASC",
    type = "all",
    filterBy = [],
    ident,
    collectionId,
    identifier,
    blockIdentifier,
    cacheDuration,
    noPagination = false,
    allColumns = false,
    includeSecondary = true,
    sortColumn = "tx_index",
    suffixFilters,
    collectionStampLimit = 12,
    groupBy,
    groupBySubquery,
    skipTotalCount = false,
    cacheType = RouteType.STAMP_LIST,
    enrichWithAssetInfo = false,
    isSearchQuery = false
  } = {}) {
    try {
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

      let filterSuffixFilters: STAMP_SUFFIX_FILTERS[] = [];
      if (filterByArray.length > 0) {
        // Extract ident and suffixFilters from filterBy
        const identFromFilter = filterByArray.flatMap((filter) =>
          filterOptions[filter]?.ident || []
        );
        filterSuffixFilters = filterByArray.flatMap((filter) =>
          filterOptions[filter]?.suffixFilters || []
        ) as STAMP_SUFFIX_FILTERS[];

        // Combine ident from type and filterBy, removing duplicates
        if (identFromFilter.length > 0) {
          finalIdent = Array.from(new Set([...finalIdent, ...identFromFilter]));
        }

        // When filterBy is defined, suffixFilters are limited to those in filterOptions
        suffixFilters = filterSuffixFilters;
      } else if (!suffixFilters || suffixFilters.length === 0) {
        // If suffixFilters are not provided, use all possible suffixes
        suffixFilters = []; // No suffix filter applied
      }

      const stampResult = await StampService.getStamps({
        page,
        limit,
        sortBy,
        type,
        ident: finalIdent,
        suffixFilters,
        allColumns,
        includeSecondary,
        collectionId,
        identifier,
        blockIdentifier,
        cacheDuration,
        noPagination,
        filterBy: filterByArray,
        sortColumn,
        collectionStampLimit,
        groupBy,
        groupBySubquery,
        skipTotalCount,
        cacheType,
        isSearchQuery
      });

      // Process stamps with floor prices and asset info if needed
      const processedStamps = await Promise.all(
        stampResult.stamps.map(async (stamp) => {
          if (stamp.ident !== "STAMP" && stamp.ident !== "SRC-721") {
            return stamp;
          }
          
          // Always fetch open dispensers for floor price
          const openDispensers = await DispenserManager.getDispensersByCpid(stamp.cpid, "open");
          const floorPrice = openDispensers.length > 0 
            ? this.calculateFloorPrice(openDispensers)
            : "priceless";

          // If enrichment is requested and it's a single stamp query
          if (enrichWithAssetInfo && identifier && !Array.isArray(identifier)) {
            const asset = await XcpManager.getAssetInfo(stamp.cpid);
            const enrichedStamp = this.enrichStampWithAssetData(stamp, asset);
            return {
              ...enrichedStamp,
              floorPrice,
            };
          }
          
          return {
            ...stamp,
            floorPrice,
          };
        })
      );

      // Build response based on query type
      const baseResponse = {
        data: identifier && !Array.isArray(identifier) 
          ? { stamp: processedStamps[0] }  // Single stamp response
          : processedStamps,               // Multiple stamps response
        last_block: stampResult.last_block,
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
    } catch (error) {
      logger.error("stamps", {
        message: "Error in StampController.getStamps",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
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
    return holders.map((holder: HolderRow) => ({
      address: holder.address,
      quantity: holder.divisible
        ? holder.quantity / 100000000
        : holder.quantity,
    }));
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
          { idents: ["STAMP"], limit: 20, type: "stamps", sortBy: "DESC" }, // Art stamps with DESC order
        ]),
        CollectionController.getCollectionStamps({
          limit: 4,
          page: 1,
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

      return {
        carouselStamps: carouselData.data ?? [],
        stamps_src721: mainCategories[1]?.stamps ?? [],
        stamps_art: mainCategories[2]?.stamps ?? [], // Now at index 2
        stamps_posh: poshStamps,
        collectionData: collections.data ?? [],
      };

    } catch (error) {
      logger.error("stamps", {
        message: "Error in getHomePageData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getCollectionPageData() {
    try {
      const [
        stampCategories,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { idents: ["SRC-721"], limit: 12, sortBy: "DESC" },
        ]),
      ]);
      // Fetch the "posh" collection to get its collection_id
      const poshCollection = await CollectionService.getCollectionByName(
        "posh",
      );
      let stamps_posh = [];
      if (poshCollection) {
        const poshCollectionId = poshCollection.collection_id;
        // Fetch stamps from the "posh" collection with limit and sortBy
        const poshStampsResult = await this.getStamps({
          collectionId: poshCollectionId,
          page: 1,
          limit: 12, // Limit to 8 stamps
          sortBy: "DESC", // Adjust sort order if needed
        });
        stamps_posh = poshStampsResult.data; // Extract the stamps array
      } else {
        logger.warn("stamps", {
          message: "Posh collection not found"
        });
      }
      return {
        stamps_src721: stampCategories[0].stamps,
        stamps_posh,
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error in getHomePageData",
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
   * Calculate total value of stamps in a wallet
   * This is a specialized method for the wallet page that won't affect API endpoints
   */
  static async calculateWalletStampValues(stamps: StampBalance[]): Promise<{
    stampValues: { [cpid: string]: string | number };
    totalValue: number;
  }> {
    try {
      const stampValues: { [cpid: string]: string | number } = {};
      let totalValue = 0;

      // Process stamps in batches to avoid too many concurrent requests
      const BATCH_SIZE = 10;
      for (let i = 0; i < stamps.length; i += BATCH_SIZE) {
        const batch = stamps.slice(i, i + BATCH_SIZE);
        
        // Process each stamp in the batch concurrently
        const batchResults = await Promise.all(
          batch.map(async (stamp) => {
            try {
              // Get all dispensers for the stamp
              const allDispensersResponse = await DispenserManager.getDispensersByCpid(
                stamp.cpid,
                undefined,
                undefined,
                undefined,
                "all"
              );
              
              // Filter open and closed dispensers
              const openDispensers = allDispensersResponse.dispensers.filter(d => d.give_remaining > 0);
              const closedDispensers = allDispensersResponse.dispensers.filter(d => d.give_remaining === 0);
              
              let unitPrice = 0;
              if (openDispensers.length > 0) {
                // Use floor price if there are open dispensers
                const floorPrice = this.calculateFloorPrice(openDispensers);
                unitPrice = typeof floorPrice === 'number' ? floorPrice : 0;
              } else if (closedDispensers.length > 0) {
                // Use most recent closed dispenser price if no open dispensers
                // Sort by block_index in descending order to get most recent first
                const sortedClosedDispensers = closedDispensers.sort((a, b) => b.block_index - a.block_index);
                unitPrice = sortedClosedDispensers[0].btcrate || 0;
              }

              // Calculate total value for this stamp based on quantity owned
              const totalStampValue = unitPrice * stamp.balance;
              
              return {
                cpid: stamp.cpid,
                value: totalStampValue
              };
            } catch (error) {
              logger.error("calculateWalletStampValues", {
                message: "Error processing individual stamp",
                error: error instanceof Error ? error.message : String(error),
                cpid: stamp.cpid,
                quantity: stamp.balance
              });
              return { cpid: stamp.cpid, value: 0 };
            }
          })
        );

        // Add batch results to totals
        batchResults.forEach(({ cpid, value }) => {
          stampValues[cpid] = value;
          if (typeof value === 'number') {
            totalValue += value;
          }
        });

        // Optional: Add a small delay between batches to prevent rate limiting
        if (i + BATCH_SIZE < stamps.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return { stampValues, totalValue };
    } catch (error) {
      logger.error("calculateWalletStampValues", {
        message: "Error calculating wallet stamp values",
        error: error instanceof Error ? error.message : String(error)
      });
      return { stampValues: {}, totalValue: 0 };
    }
  }
}
