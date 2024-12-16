import { StampRepository } from "$server/database/index.ts";
import { BlockService } from "$server/services/blockService.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  SUBPROTOCOLS,
} from "$globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import { DispenserFilter } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import { getMimeType, detectContentType } from "$lib/utils/imageUtils.ts";
import { logger } from "$lib/utils/logger.ts";

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
    filterBy?: STAMP_FILTER_TYPES[];
    suffixFilters?: STAMP_SUFFIX_FILTERS[];
    groupBy?: string;
    groupBySubquery?: boolean;
    skipTotalCount?: boolean;
    cacheType?: RouteType;
    creatorAddress?: string;
  }) {
    // Create a new options object instead of modifying the input
    const queryOptions = {
      ...options,
      // Add collection query defaults if needed
      ...(options.collectionId && (!options.groupBy || !options.groupBySubquery) ? {
        groupBy: "collection_id",
        groupBySubquery: true
      } : {})
    };

    const [result, lastBlock] = await Promise.all([
      StampRepository.getStamps({
        ...queryOptions,
        includeSecondary: options.includeSecondary,
        cacheType: options.cacheType,
        cacheDuration: options.cacheDuration
      }),
      BlockService.getLastBlock(),
    ]);

    if (!result) {
      throw new Error("No stamps found");
    }

    // Build base response
    const response = {
      stamps: result.stamps,
      last_block: lastBlock,
    };

    // Add pagination info for collection queries and index routes
    if ((options.collectionId && options.groupBy === "collection_id") || !options.skipTotalCount) {
      return {
        ...response,
        page: result.page,
        page_size: result.page_size,
        pages: result.pages,
        total: result.total,
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
    xcpBalances: XcpBalance[]
  ) {
    try {
      // Get stamps and total count in parallel using the passed XCP balances
      const [stamps, totalResult] = await Promise.all([
        StampRepository.getStampBalancesByAddress(address, limit, page, xcpBalances),
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

  static async countTotalStamps(): Promise<boolean> {
    return await StampRepository.countTotalStamps();
  }
}
