import { StampService } from "$server/services/stampService.ts";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "globals";
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
} from "globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { decodeBase64 } from "@std/encoding";
import { filterOptions } from "$lib/utils/filterOptions.ts";
import { Dispense, Dispenser } from "$types/index.d.ts";
import { CollectionController } from "./collectionController.ts";
import { Src20Controller } from "./src20Controller.ts";
import { CAROUSEL_STAMP_IDS } from "$lib/utils/constants.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { logger } from "$lib/utils/logger.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { StampRepository } from "$server/database/stampRepository.ts";
import { isCpid } from "$lib/utils/identifierUtils.ts";

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
    sortColumn = "tx_index",
    suffixFilters,
    collectionStampLimit = 12,
    groupBy,
    groupBySubquery,
    skipTotalCount = false,
    cacheType = RouteType.STAMP_LIST,
    enrichWithAssetInfo = false
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
    cacheDuration?: number | "never"
  ) {
    return this.getStamps({
      identifier: id,
      type: stampType,
      cacheType,
      cacheDuration,
      allColumns: false,
      noPagination: true,
      skipTotalCount: true,
      enrichWithAssetInfo: true // Enable asset info enrichment
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
  ): Promise<PaginatedStampBalanceResponseBody> {
    try {
      const { balances: xcpBalances, total: xcpTotal } = await XcpManager.getAllXcpBalancesByAddress(
        address,
        false
      );
      
      console.log(`[StampController] Got ${xcpBalances.length} XCP balances out of ${xcpTotal} total`);

      // Get all stamps first
      const [{ stamps }, lastBlock] = await Promise.all([
        StampService.getStampBalancesByAddress(address, xcpTotal, 1, xcpBalances),
        BlockService.getLastBlock(),
      ]);

      // Apply standard pagination
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, stamps.length);
      const paginatedStamps = stamps.slice(startIndex, endIndex);

      console.log(`[StampController] Got ${stamps.length} total stamps, showing ${paginatedStamps.length} for page ${page}`);

      const pagination = paginate(stamps.length, page, limit);

      return {
        ...pagination,
        last_block: lastBlock,
        data: paginatedStamps,
      };
    } catch (error) {
      console.error("Error in getStampBalancesByAddress:", error);
      throw error;
    }
  }

  static async getMultipleStampCategories(
    categories: {
      idents: SUBPROTOCOLS[];
      limit: number;
    }[],
  ) {
    const results = await Promise.all(
      categories.map(async (category) => {
        const serviceResult = await StampService.getStamps({
          page: 1,
          limit: category.limit,
          sortBy: "DESC",
          type: "all",
          ident: category.idents,
          noPagination: false,
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
      

      const [
        stampCategories,
        src20Result,
        trendingSrc20s,
        collectionData,
        carouselStamps,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { idents: ["STAMP", "SRC-721"], limit: 20 },
          { idents: ["SRC-721"], limit: 12 },
          { idents: ["STAMP"], limit: 20 },
        ]),
        Src20Controller.fetchSrc20DetailsWithHolders(null, {
          op: "DEPLOY",
          page: 1,
          limit: 5,
          sortBy: "ASC",
        }),
        Src20Controller.fetchTrendingTokens(null, 5, 1, 1000),
        CollectionController.getCollectionStamps({
          limit: 4,
          page: 1,
          creator: "",
        }),
        this.getStamps({
          identifier: CAROUSEL_STAMP_IDS,
          allColumns: false,
          noPagination: true,
          cacheDuration: 1000 * 60 * 20,
        }),
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
          limit: 16, // Limit to 8 stamps
          sortBy: "DESC", // Adjust sort order if needed
        });

        stamps_posh = poshStampsResult.data; // Extract the stamps array
      } else {
        logger.warn("stamps", {
          message: "Posh collection not found"
        });
      }

      return {
        stamps_src721: stampCategories[1].stamps,
        stamps_art: stampCategories[2].stamps,
        stamps_posh,
        src20s: src20Result.data,
        trendingSrc20s: trendingSrc20s.data,
        collectionData: collectionData.data,
        carouselStamps: carouselStamps.data,
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
          { idents: ["SRC-721"], limit: 12 },
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

  static async getStampFile(id: string, params: string): Promise<Response> {
    try {
      const result = await StampService.getStampFile(id);

      if (!result || result.type === "notFound") {
        return this.redirectToNotAvailable();
      }

      switch (result.type) {
        case "redirect":
          return new Response("", {
            status: 301,
            headers: {
              Location: `/content/${result.fileName}${
                params ? `?${params}` : ""
              }`,
            },
          });
        case "base64":
          return new Response(decodeBase64(result.base64), {
            headers: {
              "Content-Type": result.mimeType || "application/octet-stream",
            },
          });
        default:
          return this.redirectToNotAvailable();
      }
    } catch (error) {
      logger.error("stamps", {
        message: "Error in StampController.getStampFile",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private static redirectToNotAvailable(): Response {
    return new Response(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    try {
      return await StampService.getCreatorNameByAddress(address);
    } catch (error) {
      logger.error("stamps", {
        message: "Error in getCreatorNameByAddress",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    try {
      return await StampService.updateCreatorName(address, newName);
    } catch (error) {
      logger.error("stamps", {
        message: "Error in updateCreatorName",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  static async getDispensersWithStampsByAddress(
    address: string, 
    page: number = 1,
    limit: number = 50,
    options = {}
  ) {
    try {
      // First get dispensers with pagination
      const dispensersData = await XcpManager.getDispensersByAddress(address, {
        verbose: true,
        page,
        limit,
        ...options
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

  static async getStampHolders(
    id: string, 
    page: number = 1, 
    limit: number = 50,
    cacheType: RouteType
  ) {
    try {
      const cpid = await this.resolveToCpid(id);
      const { holders, total } = await StampService.getStampHolders(cpid, page, limit, { cacheType });
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
}
