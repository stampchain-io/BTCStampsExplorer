import { SRC20Repository } from "$server/database/src20Repository.ts";
import { BlockService } from "$server/services/blockService.ts";
import { 
  SRC20TrxRequestParams,
  PaginatedSrc20ResponseBody,
  Src20ResponseBody,
  Src20SnapShotDetail,
  SRC20SnapshotRequestParams,
} from "$globals";
import { SRC20BalanceRequestParams } from "$lib/types/src20.d.ts";
import { SRC20UtilityService } from "./utilityService.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import { paginate } from "$lib/utils/paginationUtils.ts"
import { Big } from "big";
import { SRC20MarketService } from "./marketService.ts";

// Change class name from Src20Service to SRC20QueryService
export class SRC20QueryService {
  static async getTotalCountValidSrc20Tx(params: {
    tick?: string | string[];
    op?: string | string[];
  }, excludeFullyMinted = false): Promise<number> {
    const result = await SRC20Repository.getTotalCountValidSrc20TxFromDb(
      params,
      excludeFullyMinted,
    );
    return result.rows[0].total;
  }

  /**
   * Fetches raw SRC20 transaction data directly from the repository
   * without additional formatting or pagination processing.
   * Used when we need the raw DB result structure.
   */
  static async fetchRawSrc20Data(
    params: SRC20TrxRequestParams,
    excludeFullyMinted = false,
  ) {
    return await SRC20Repository.getValidSrc20TxFromDb(params, excludeFullyMinted);
  }

  static async fetchAndFormatSrc20Data(
    params: SRC20TrxRequestParams = {},
    excludeFullyMinted: boolean = false,
    onlyFullyMinted: boolean = false,
  ): Promise<PaginatedSrc20ResponseBody | Src20ResponseBody> {
    try {
      const sanitizedParams = {
        ...params,
        tick: params.tick
          ? (Array.isArray(params.tick)
            ? params.tick.map((t) => t.replace(/[^\w-]/g, ""))
            : params.tick.replace(/[^\w-]/g, ""))
          : params.tick,
        op: Array.isArray(params.op)
          ? params.op.map((o) => o.replace(/[^\w-]/g, ""))
          : params.op
          ? params.op.replace(/[^\w-]/g, "")
          : undefined,
        tx_hash: params.tx_hash
          ? params.tx_hash.replace(/[^\w-]/g, "")
          : params.tx_hash,
      };

      // Ensure limit and page have default numeric values
      const limit = Number.isFinite(Number(sanitizedParams.limit)) &&
          Number(sanitizedParams.limit) > 0
        ? Number(sanitizedParams.limit)
        : 50; // Default limit
      const page = Number.isFinite(Number(sanitizedParams.page)) &&
          Number(sanitizedParams.page) > 0
        ? Math.max(1, Number(sanitizedParams.page))
        : 1;

      const queryParams: SRC20TrxRequestParams = {
        ...sanitizedParams,
        tick: Array.isArray(sanitizedParams.tick)
          ? sanitizedParams.tick[0]
          : sanitizedParams.tick,
        limit,
        page,
        sortBy: sanitizedParams.sortBy || "ASC",
      };

      // Remove the op property if it's undefined
      if (queryParams.op === undefined) {
        delete queryParams.op;
      }

      const [data, totalResult, lastBlock] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(queryParams, excludeFullyMinted),
        SRC20Repository.getTotalCountValidSrc20TxFromDb(
          queryParams,
          excludeFullyMinted,
        ),
        BlockService.getLastBlock(),
      ]);

      const total = totalResult.rows[0].total;

      // Only map and format if we have data
      if (!data.rows || data.rows.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
          last_block: lastBlock,
        };
      }

      const mappedData = this.mapTransactionData(data.rows);
      const formattedData = this.formatTransactionData(
        mappedData,
        queryParams,
      );

      if (
        params.singleResult && Array.isArray(formattedData) &&
        formattedData.length > 0
      ) {
        return {
          last_block: lastBlock,
          data: formattedData[0],
        };
      }

      const pagination = paginate(total, page, limit);

      return {
        ...pagination,
        last_block: lastBlock,
        data: Array.isArray(formattedData) ? formattedData : [formattedData],
      };
    } catch (error) {
      console.error("Error in fetchAndFormatSrc20Data:", error);
      if (error.message.includes("Stamps Down")) {
        throw new Error("Stamps Down...");
      }
      throw error;
    }
  }

  static async fetchAllSrc20DataForTick(tick: string) {
    try {
      const result = await SRC20Repository.getDeploymentAndCountsForTick(tick);

      if (!result) {
        return { deployment: null, total_mints: 0, total_transfers: 0 };
      }

      const { deployment, total_mints, total_transfers } = result;

      return {
        deployment,
        total_mints,
        total_transfers,
      };
    } catch (error) {
      console.error("Error in fetchAllSrc20DataForTick:", error);
      throw error;
    }
  }

  static async fetchSrc20Balance(
    params: SRC20BalanceRequestParams,
  ): Promise<Src20BalanceResponseBody> {
    try {
      // Ensure limit and page have default values if undefined
      const limit =
        Number.isFinite(Number(params.limit)) && Number(params.limit) > 0
          ? Number(params.limit)
          : 50; // Default limit
      const page =
        Number.isFinite(Number(params.page)) && Number(params.page) > 0
          ? Math.max(1, Number(params.page))
          : 1;

      params.limit = limit;
      params.page = page;

      const src20 = await SRC20Repository.getSrc20BalanceFromDb(params);

      if (!src20 || (Array.isArray(src20) && src20.length === 0)) {
        // Return an empty response instead of throwing an error
        return params.address && params.tick ? {} : [];
      }

      return params.address && params.tick ? src20[0] : src20;
    } catch (error) {
      console.error("Error in fetchSrc20Balance:", error);
      console.error("Params:", params);
      // Return an empty response for any other errors as well
      return params.address && params.tick ? {} : [];
    }
  }

  static async fetchSrc20Snapshot(
    params: SRC20SnapshotRequestParams,
  ): Promise<Src20SnapShotDetail[]> {
    try {
      const balanceParams: SRC20BalanceRequestParams = {
        tick: params.tick,
        amt: params.amt || 0,
        limit: params.limit,
        page: params.page,
        sortBy: params.sortBy || "DESC",
      };

      const balanceResponse = await this.fetchSrc20Balance(balanceParams);

      const snapshotData = balanceResponse.map((row) => ({
        tick: row.tick,
        address: row.address,
        balance: stripTrailingZeros(row.amt.toString()),
      }));

      return snapshotData;
    } catch (error) {
      console.error("Error in fetchSrc20Snapshot:", error);
      throw error;
    }
  }

  static async fetchSrc20MintProgress(tick: string) {
    return await SRC20Repository.fetchSrc20MintProgress(tick);
  }

  private static mapTransactionData(rows: any[]) {
    return rows.map(SRC20UtilityService.formatSRC20Row);
  }
  private static formatTransactionData(
    mappedData: any[],
    params: SRC20TrxRequestParams,
  ) {
    return params.tx_hash !== null && mappedData.length === 1 &&
        params.block_index === null
      ? mappedData[0]
      : [mappedData].flat();
  }

  static async checkMintedOut(tick: string, amount: string) {
    const mint_status = await SRC20Repository.fetchSrc20MintProgress(tick);
    if (!mint_status) {
      throw new Error(`Tick ${tick} not found`);
    }
    const { max_supply, total_minted } = mint_status;
    const isMintedOut = new Big(total_minted).plus(amount).gt(max_supply);
    return { ...mint_status, minted_out: isMintedOut };
  }

  static async getTotalSrc20BalanceCount(
    params: Partial<SRC20BalanceRequestParams>,
  ): Promise<number> {
    try {
      return await SRC20Repository.getTotalSrc20BalanceCount(params);
    } catch (error) {
      console.error("Error getting total SRC20 balance count:", error);
      throw error;
    }
  }

  static async fetchTrendingActiveMintingTokens(
    limit: number = 50,
    page: number = 1,
    transactionCount: number = 1000,
  ): Promise<PaginatedSrc20ResponseBody> {
    try {
      // Validate and sanitize input parameters
      const validLimit = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 50;
      const validPage = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
      const validTransactionCount = Number.isFinite(Number(transactionCount)) ? Math.max(1, Number(transactionCount)) : 1000;

      // Get all trending data first
      const data = await SRC20Repository.fetchTrendingActiveMintingTokens(
        validTransactionCount,
      );

      // Map and format all data
      const mappedData = this.mapTransactionData(data.rows);
      const formattedData = this.formatTransactionData(mappedData, {});

      // Apply pagination after formatting
      const startIndex = (validPage - 1) * validLimit;
      const paginatedData = formattedData.slice(startIndex, startIndex + validLimit);
      
      const pagination = paginate(data.total, validPage, validLimit);

      return {
        ...pagination,
        last_block: await BlockService.getLastBlock(),
        data: paginatedData,
      };
    } catch (error) {
      console.error("Error in fetchTrendingActiveMintingTokens:", error);
      throw error;
    }
  }

  static async searchSrc20Data(query: string) {
    return await SRC20Repository.searchValidSrc20TxFromDb(query);
  }

  /**
   * Enhanced version of fetchAndFormatSrc20Data with optional data enrichment
   * and performance monitoring. This version maintains backward compatibility
   * while adding new features.
   */
  static async fetchAndFormatSrc20DataV2(
    params: SRC20TrxRequestParams & {
      dateFrom?: string;  // ISO date string
      dateTo?: string;    // ISO date string
      minPrice?: number;  // Market data filters
      maxPrice?: number;
      minVolume?: number;
      maxVolume?: number;
      minMarketCap?: number;
      maxMarketCap?: number;
      minSupply?: number;
      maxSupply?: number;
      minProgress?: number;
      maxProgress?: number;
      minTxCount?: number;
      maxTxCount?: number;
    } = {},
    options: {
      excludeFullyMinted?: boolean;
      onlyFullyMinted?: boolean;
      includeMarketData?: boolean;
      enrichWithProgress?: boolean;
      batchSize?: number;
      prefetchedMarketData?: MarketListingAggregated[];
    } = {}
  ): Promise<PaginatedSrc20ResponseBody | Src20ResponseBody> {
    const startTime = performance.now();
    const metrics: PerformanceMetrics = {
      duration: 0,
      cacheHit: false,
      dataSize: 0
    };

    try {
      // Sanitize and prepare parameters (reusing existing logic)
      const sanitizedParams = {
        ...params,
        tick: params.tick
          ? (Array.isArray(params.tick)
            ? params.tick.map((t) => t.replace(/[^\w-]/g, ""))
            : params.tick.replace(/[^\w-]/g, ""))
          : params.tick,
        dateFrom: params.dateFrom ? new Date(params.dateFrom).toISOString() : undefined,
        dateTo: params.dateTo ? new Date(params.dateTo).toISOString() : undefined,
        minPrice: typeof params.minPrice === 'number' ? Math.max(0, params.minPrice) : undefined,
        maxPrice: typeof params.maxPrice === 'number' ? Math.max(0, params.maxPrice) : undefined,
        minVolume: typeof params.minVolume === 'number' ? Math.max(0, params.minVolume) : undefined,
        maxVolume: typeof params.maxVolume === 'number' ? Math.max(0, params.maxVolume) : undefined,
        minSupply: typeof params.minSupply === 'number' ? Math.max(0, params.minSupply) : undefined,
        maxSupply: typeof params.maxSupply === 'number' ? Math.max(0, params.maxSupply) : undefined,
        minMarketCap: typeof params.minMarketCap === 'number' ? Math.max(0, params.minMarketCap) : undefined,
        maxMarketCap: typeof params.maxMarketCap === 'number' ? Math.max(0, params.maxMarketCap) : undefined,
        minHolder: typeof params.minHolder === 'number' ? Math.max(0, params.minHolder) : undefined,
        maxHolder: typeof params.maxHolder === 'number' ? Math.max(0, params.maxHolder) : undefined,
          minProgress: typeof params.minProgress === 'number' ? Math.max(0, params.minProgress) : undefined,
        maxProgress: typeof params.maxProgress === 'number' ? Math.max(0, params.maxProgress) : undefined,
          minTxCount: typeof params.minTxCount === 'number' ? Math.max(0, params.minTxCount) : undefined,
        maxTxCount: typeof params.maxTxCount === 'number' ? Math.max(0, params.maxTxCount) : undefined,
        op: Array.isArray(params.op)
          ? params.op.map((o) => o.replace(/[^\w-]/g, ""))
          : params.op
          ? params.op.replace(/[^\w-]/g, "")
          : undefined,
        tx_hash: params.tx_hash
          ? params.tx_hash.replace(/[^\w-]/g, "")
          : params.tx_hash,
      };

      // Ensure limit and page have default numeric values
      const limit = Number.isFinite(Number(sanitizedParams.limit)) &&
          Number(sanitizedParams.limit) > 0
        ? Number(sanitizedParams.limit)
        : 50;
      const page = Number.isFinite(Number(sanitizedParams.page)) &&
          Number(sanitizedParams.page) > 0
        ? Math.max(1, Number(sanitizedParams.page))
        : 1;

      const queryParams: SRC20TrxRequestParams = {
        ...sanitizedParams,
        tick: sanitizedParams.tick,
        limit,
        page,
        sortBy: sanitizedParams.sortBy || "ASC",
      };

      // Remove undefined op property
      if (queryParams.op === undefined) {
        delete queryParams.op;
      }

      // Fetch base data and metadata in parallel
      const [data, totalResult, lastBlock] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(
          queryParams, 
          options.excludeFullyMinted
        ),
        SRC20Repository.getTotalCountValidSrc20TxFromDb(
          queryParams,
          options.excludeFullyMinted
        ),
        BlockService.getLastBlock(),
      ]);

      const total = totalResult.rows[0].total;
      metrics.dataSize = data.rows?.length || 0;

      // Early return for empty data
      if (!data.rows || data.rows.length === 0) {
        metrics.duration = performance.now() - startTime;
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
          last_block: lastBlock,
          performance: metrics
        };
      }

      // Map and format base data
      let mappedData = this.mapTransactionData(data.rows);
      let formattedData = this.formatTransactionData(
        mappedData,
        queryParams
      );

      // Apply date range filtering if specified
      if (sanitizedParams.dateFrom || sanitizedParams.dateTo) {
        formattedData = Array.isArray(formattedData) ? formattedData : [formattedData];
        formattedData = formattedData.filter(item => {
          const itemDate = new Date(item.block_time);
          if (sanitizedParams.dateFrom && itemDate < new Date(sanitizedParams.dateFrom)) return false;
          if (sanitizedParams.dateTo && itemDate > new Date(sanitizedParams.dateTo)) return false;
          return true;
        });
      }

      // Optional data enrichment
      if (options.includeMarketData || options.enrichWithProgress) {
        formattedData = await this.enrichData(
          formattedData,
          {
            includeMarketData: options.includeMarketData,
            enrichWithProgress: options.enrichWithProgress,
            batchSize: options.batchSize || 50,
            prefetchedMarketData: options.prefetchedMarketData
          }
        );

        // Apply market data based filtering if specified
        if (options.includeMarketData && (
          sanitizedParams.minPrice !== undefined || 
          sanitizedParams.maxPrice !== undefined ||
          sanitizedParams.minVolume !== undefined ||
          sanitizedParams.maxVolume !== undefined
        )) {

          formattedData = Array.isArray(formattedData) ? formattedData : [formattedData];

          formattedData = formattedData.filter(item => {
            if (!item.market_data) return false;

            const { floor_price = 0, volume_24h = 0 } = item.market_data;
            
            if (sanitizedParams.minPrice !== undefined && floor_price < sanitizedParams.minPrice) return false;
            if (sanitizedParams.maxPrice !== undefined && floor_price > sanitizedParams.maxPrice) return false;
            if (sanitizedParams.minVolume !== undefined && volume_24h < sanitizedParams.minVolume) return false;
            if (sanitizedParams.maxVolume !== undefined && volume_24h > sanitizedParams.maxVolume) return false;
           
            return true;
          });
        }

        if (sanitizedParams.minSupply !== undefined ||
          sanitizedParams.maxSupply !== undefined)
        {
          formattedData = formattedData.filter(item => {
            if (sanitizedParams.minSupply !== undefined && item.max < sanitizedParams.minSupply) return false;
            if (sanitizedParams.maxSupply !== undefined && item.max > sanitizedParams.maxSupply) return false;
            return true
          })
        }
    
        if (sanitizedParams.minHolder !== undefined ||
          sanitizedParams.maxHolder !== undefined)
        {
          formattedData = formattedData.filter(item => {
            if (sanitizedParams.minHolder !== undefined && item.holders < sanitizedParams.minHolder) return false;
            if (sanitizedParams.maxHolder !== undefined && item.holders > sanitizedParams.maxHolder) return false;
            return true
          })
        }

        if (sanitizedParams.minProgress !== undefined ||
          sanitizedParams.maxProgress !== undefined)
        {
          formattedData = formattedData.filter(item => {
            if (sanitizedParams.minProgress !== undefined && item.progress < sanitizedParams.minProgress) return false;
            if (sanitizedParams.maxProgress !== undefined && item.progress > sanitizedParams.maxProgress) return false;
            return true
          })
        }

        if (sanitizedParams.minTxCount !== undefined ||
          sanitizedParams.maxTxCount !== undefined)
        {
          formattedData = formattedData.filter(item => {
            if (sanitizedParams.minTxCount !== undefined && item.mint_progress?.current < sanitizedParams.minTxCount) return false;
            if (sanitizedParams.maxTxCount !== undefined && item.mint_progress?.current > sanitizedParams.maxTxCount) return false;
            return true
          })
        }
      }
      
      // Handle single result case
      if (
        params.singleResult && 
        Array.isArray(formattedData) && 
        formattedData.length > 0
      ) {
        metrics.duration = performance.now() - startTime;
        return {
          last_block: lastBlock,
          data: formattedData[0],
          performance: metrics
        };
      }

      // Return paginated response
      const pagination = paginate(total, page, limit);
      metrics.duration = performance.now() - startTime;

      return {
        ...pagination,
        last_block: lastBlock,
        data: Array.isArray(formattedData) ? formattedData : [formattedData],
        performance: metrics
      };
    } catch (error) {
      console.error("Error in fetchAndFormatSrc20DataV2:", error);
      metrics.duration = performance.now() - startTime;
      
      if (error.message.includes("Stamps Down")) {
        throw new Error("Stamps Down...");
      }
      
      // Add metrics to error for monitoring
      error.performance = metrics;
      throw error;
    }
  }

  /**
   * Helper function to enrich SRC20 data with market and progress information
   * Handles batching and error recovery
   */
  private static async enrichData(
    data: SRC20Row | SRC20Row[],
    options: {
      includeMarketData?: boolean;
      enrichWithProgress?: boolean;
      batchSize?: number;
      prefetchedMarketData?: MarketListingAggregated[];
    }
  ): Promise<SRC20Row | SRC20Row[]> {
    const rows = Array.isArray(data) ? data : [data];
    const enriched = [...rows];
    const batchSize = options.batchSize || 50;

    try {
      // Process in batches if needed
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const ticks = batch.map(row => row.tick);

        // Fetch market data and mint progress in parallel
        const [marketData, mintProgress] = await Promise.all([
          options.includeMarketData
            ? options.prefetchedMarketData || await SRC20MarketService.fetchMarketListingSummary()
            : null,
          options.enrichWithProgress
            ? Promise.all(ticks.map(tick => 
                this.fetchSrc20MintProgress(tick).catch(() => null)
              ))
            : null
        ]);

        // Enrich market data and holders
        if (marketData) {
          const marketMap = new Map(
            marketData.map(item => [item.tick, item])
          );
          batch.forEach((row, index) => {
            const market = marketMap.get(row.tick);
            if (market) {
              enriched[i + index] = {
                ...row,
                market_data: market,
                holders: row.holders || market.holders || 0
              };
            }
          });
        }

        // Enrich mint progress
        if (mintProgress) {
          batch.forEach((row, index) => {
            const progress = mintProgress[index];
            if (progress) {
              enriched[i + index] = {
                ...enriched[i + index],
                mint_progress: {
                  progress: row.progress || progress.progress || "0",
                  current: progress.total_minted || 0,
                  max: progress.max_supply || 0
                }
              };
            }
          });
        }
      }

      return Array.isArray(data) ? enriched : enriched[0];
    } catch (error) {
      console.error("Error in enrichData:", error);
      // On error, return original data without enrichment
      return data;
    }
  }
}
