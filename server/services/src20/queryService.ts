import {
    MarketListingAggregated,
    PaginatedSrc20ResponseBody,
    Src20BalanceResponseBody,
    Src20ResponseBody,
    SRC20Row,
    Src20SnapShotDetail,
    SRC20SnapshotRequestParams,
    SRC20TrxRequestParams,
} from "$globals";
import { SRC20BalanceRequestParams } from "$lib/types/src20.d.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import { paginate } from "$lib/utils/paginationUtils.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { BlockService } from "$server/services/blockService.ts";
import { Big } from "big";
import { SRC20UtilityService } from "./utilityService.ts";

// Define missing types
interface PerformanceMetrics {
  duration: number;
  cacheHit: boolean;
  dataSize: number;
}

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
    return (result as any).rows[0].total;
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
    _excludeFullyMinted: boolean = false,
    _onlyFullyMinted: boolean = false,
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
          : null,
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
          : (sanitizedParams.tick || null),
        op: sanitizedParams.op || null,
        tx_hash: sanitizedParams.tx_hash || null,
        limit,
        page,
        sortBy: sanitizedParams.sortBy || "ASC",
      };

      // Remove the op property if it's null
      if (queryParams.op === null) {
        delete queryParams.op;
      }

      const [data, totalResult, lastBlock] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(queryParams, _excludeFullyMinted),
        SRC20Repository.getTotalCountValidSrc20TxFromDb(
          queryParams,
          _excludeFullyMinted,
        ),
        BlockService.getLastBlock(),
      ]);

      const total = (totalResult as any).rows[0].total;

      // Only map and format if we have data
      if (!(data as any).rows || (data as any).rows.length === 0) {
        return {
          data: [],
          page,
          totalPages: 0,
          limit,
          last_block: lastBlock,
        } as PaginatedSrc20ResponseBody;
              }

      const mappedData = this.mapTransactionData((data as any).rows);
      const formattedData = this.formatTransactionData(
        mappedData,
        queryParams,
      );

      if (params.singleResult) {
        if (Array.isArray(formattedData) && formattedData.length > 0) {
          return {
            last_block: lastBlock,
            data: formattedData[0],
          };
        } else if (!Array.isArray(formattedData)) {
          return {
            last_block: lastBlock,
            data: formattedData,
          };
        }
      }

      const pagination = paginate(total, page, limit);

      return {
        ...pagination,
        last_block: lastBlock,
        data: Array.isArray(formattedData) ? formattedData : [formattedData],
      };
    } catch (error: any) {
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
    } catch (error: any) {
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
        return params.address && params.tick ?
          { last_block: 0, data: [] } as any : // Fixed: Use any to avoid type conversion issues
          { last_block: 0, data: [] } as any; // Fixed: Use any to avoid type conversion issues
      }

      return params.address && params.tick ? src20[0] : src20;
    } catch (error: any) {
      console.error("Error in fetchSrc20Balance:", error);
      console.error("Params:", params);
      // Return an empty response for any other errors as well
      return params.address && params.tick ?
        { last_block: 0, data: [] } as any : // Fixed: Use any to avoid type conversion issues
        { last_block: 0, data: [] } as any; // Fixed: Use any to avoid type conversion issues
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

      const snapshotData = (balanceResponse as any).map((row: any) => ({ // Fixed: Type assertion for balanceResponse
        tick: row.tick,
        address: row.address,
        balance: stripTrailingZeros(row.amt.toString()),
      }));

      return snapshotData;
    } catch (error: any) {
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
        (params.block_index === null || params.block_index === undefined)
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Error in fetchTrendingActiveMintingTokens:", error);
      throw error;
    }
  }

  static async searchSrc20Data(query: string) {
    try {
      // Input validation and sanitization
      if (!query || typeof query !== 'string') {
        return [];
      }

      const sanitizedQuery = query.trim().replace(/[^\w-]/g, "");
      if (!sanitizedQuery) {
        return [];
      }

      // Fetch raw data from repository
      const rawResults = await SRC20Repository.searchValidSrc20TxFromDb(sanitizedQuery);

      // Early return for empty results
      if (!rawResults || rawResults.length === 0) {
        return [];
      }

      // Map and format the data using existing utility methods
      const mappedData = this.mapTransactionData(rawResults);

      // Return formatted results
      return Array.isArray(mappedData) ? mappedData : [mappedData];
    } catch (error: any) {
      console.error("Error in searchSrc20Data:", error);
      // Return empty array on error rather than throwing to prevent API failures
      return [];
    }
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
            ? params.tick.map((t) => t && typeof t === 'string' ? t.replace(/[^\w-]/g, "") : t).filter(Boolean)
            : typeof params.tick === 'string' ? params.tick.replace(/[^\w-]/g, "") : params.tick)
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
        minHolder: typeof (params as any).minHolder === 'number' ? Math.max(0, (params as any).minHolder) : undefined,
        maxHolder: typeof (params as any).maxHolder === 'number' ? Math.max(0, (params as any).maxHolder) : undefined,
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
          : null,
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
        tick: sanitizedParams.tick || null,
        op: sanitizedParams.op || null,
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

      const total = (totalResult as any).rows[0].total;
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
        } as any;
      }

      // Map and format base data
      const mappedData = this.mapTransactionData(data.rows);
      let formattedData = this.formatTransactionData(
        mappedData,
        queryParams
      );

      // Apply date range filtering if specified
      if (sanitizedParams.dateFrom || sanitizedParams.dateTo) {
        formattedData = Array.isArray(formattedData) ? formattedData : [formattedData];
        formattedData = formattedData.filter((item: any) => {
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
            includeMarketData: options.includeMarketData || false,
            enrichWithProgress: options.enrichWithProgress || false,
            batchSize: options.batchSize || 50,
            prefetchedMarketData: options.prefetchedMarketData || []
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

          formattedData = formattedData.filter((item: any) => {
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
          formattedData = formattedData.filter((item: any) => {
            if (sanitizedParams.minSupply !== undefined && item.max < sanitizedParams.minSupply) return false;
            if (sanitizedParams.maxSupply !== undefined && item.max > sanitizedParams.maxSupply) return false;
            return true
          })
        }

        if (sanitizedParams.minHolder !== undefined ||
          sanitizedParams.maxHolder !== undefined)
        {
          formattedData = formattedData.filter((item: any) => {
            if (sanitizedParams.minHolder !== undefined && item.holders < sanitizedParams.minHolder) return false;
            if (sanitizedParams.maxHolder !== undefined && item.holders > sanitizedParams.maxHolder) return false;
            return true
          })
        }

        if (sanitizedParams.minProgress !== undefined ||
          sanitizedParams.maxProgress !== undefined)
        {
          formattedData = formattedData.filter((item: any) => {
            if (sanitizedParams.minProgress !== undefined && item.progress < sanitizedParams.minProgress) return false;
            if (sanitizedParams.maxProgress !== undefined && item.progress > sanitizedParams.maxProgress) return false;
            return true
          })
        }

        if (sanitizedParams.minTxCount !== undefined ||
          sanitizedParams.maxTxCount !== undefined)
        {
          formattedData = formattedData.filter((item: any) => {
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
        const singleResponse = {
          last_block: lastBlock,
          data: formattedData[0],
        };
        // Add performance metrics as additional property
        (singleResponse as any).performance = metrics;
        return singleResponse;
      }

      // Return paginated response
      const pagination = paginate(total, page, limit);
      metrics.duration = performance.now() - startTime;

      const response = {
        ...pagination,
        last_block: lastBlock,
        data: Array.isArray(formattedData) ? formattedData : [formattedData],
      };
      // Add performance metrics as additional property
      (response as any).performance = metrics;
      return response;
    } catch (error: any) {
      console.error("Error in fetchAndFormatSrc20DataV2:", error);
      metrics.duration = performance.now() - startTime;

      if (error.message.includes("Stamps Down")) {
        const stampsDownError = new Error("Stamps Down...");
        (stampsDownError as any).performance = metrics;
        throw stampsDownError;
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
            ? (options.prefetchedMarketData && options.prefetchedMarketData.length > 0)
              ? options.prefetchedMarketData
              : this.fetchMarketDataFromCache(ticks) // Use cached data instead of external API
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
            marketData
              .map(item => [item.tick?.toUpperCase(), item] as [string | undefined, any])
              .filter(([key]) => key) as [string, any][] // Filter out null/undefined keys and assert type
          );
          batch.forEach((row, index) => {
            const tickForLookup = row.tick?.toUpperCase();
            if (tickForLookup) {
              const market = marketMap.get(tickForLookup);
              if (market) {
                (enriched[i + index] as any).market_data = market;
                (enriched[i + index] as any).holders = row.holders || (market as any).holder_count || 0;
              } else {
                // Optional: Log if a tick is not found in the market map, can be noisy
                console.log(`[enrichData] Market data not found for tick: '${row.tick}' (lookup key: '${tickForLookup}')`);
              }
            } else {
              console.warn(`[enrichData] Invalid tick value (null/undefined) for row at index ${i + index}`);
            }
          });
        }

        // Enrich mint progress
        if (mintProgress) {
          batch.forEach((row, index) => {
            const progress = mintProgress[index];
            if (progress) {
              (enriched[i + index] as any).mint_progress = {
                progress: row.progress || progress.progress || "0",
                current: (progress as any).total_minted || 0,
                max: (progress as any).max_supply || 0
              };
            }
          });
        }
      }

      return Array.isArray(data) ? enriched : enriched[0];
    } catch (error: any) {
      console.error("Error in enrichData:", error);
      // On error, return original data without enrichment
      return data;
    }
  }

  /**
   * Fetch market data from the cached src20_market_data table for specific ticks
   * This is much more efficient than calling external APIs
   */
  private static async fetchMarketDataFromCache(ticks: string[]): Promise<MarketListingAggregated[]> {
    try {
      console.log(`[fetchMarketDataFromCache] Fetching market data for ${ticks.length} ticks from cache`);

      // Fetch market data for each tick from the cache
      const marketDataPromises = ticks.map(tick =>
        MarketDataRepository.getSRC20MarketData(tick).catch(() => null)
      );

      const marketDataResults = await Promise.all(marketDataPromises);

      // Convert to MarketListingAggregated format for compatibility
      const marketListingData: MarketListingAggregated[] = [];

      marketDataResults.forEach((marketData) => {
        if (marketData) {
          marketListingData.push({
            tick: marketData.tick,
            floor_unit_price: marketData.floorPriceBTC || 0,
            mcap: marketData.marketCapBTC || 0,
            volume24: marketData.volume24hBTC || 0,
            stamp_url: null, // Not available in SRC20MarketData
            tx_hash: "", // Not available in SRC20MarketData
            holder_count: marketData.holderCount || 0,
            market_data: {
              stampscan: {
                price: marketData.marketCapBTC || 0,
                volume24: marketData.volume24hBTC || 0
              },
              openstamp: {
                price: marketData.marketCapBTC || 0,
                volume24: marketData.volume24hBTC || 0
              }
            }
          });
        }
      });

      console.log(`[fetchMarketDataFromCache] Retrieved ${marketListingData.length} market data entries from cache`);
      return marketListingData;
    } catch (error) {
      console.error("[fetchMarketDataFromCache] Error fetching market data from cache:", error);
      return []; // Return empty array on error
    }
  }
}
