import {
  PaginatedSrc20ResponseBody,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "$globals";
import type { SRC20MarketData } from "$lib/types/marketData.d.ts";
import { SRC20BalanceRequestParams, SRC20TickPageData } from "$lib/types/src20.d.ts";
import { formatAmount } from "$lib/utils/formatUtils.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { BlockService } from "$server/services/blockService.ts";
import { CircuitBreakerService, MARKET_CAP_FALLBACK_DATA, TRENDING_FALLBACK_DATA } from "$server/services/circuitBreaker.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { MarketDataEnrichmentService } from "$server/services/src20/marketDataEnrichmentService.ts";
import { MarketListingAggregated } from "$types/index.d.ts";

export class Src20Controller {
  /**
   * Convert SRC20MarketData from cache to MarketListingAggregated format
   * This maintains compatibility with existing API consumers
   */
  private static convertToMarketListingFormat(data: SRC20MarketData): MarketListingAggregated & {
    change24?: number;
    volume7d?: number;
    change7d?: number;
  } {
    // Use floor price or regular price (keep in BTC for the floor_unit_price field)
    const priceInBTC = data.floorPriceBTC || data.priceBTC || 0;
    const priceInSats = priceInBTC * 1e8;

    return {
      tick: data.tick,
      floor_unit_price: priceInBTC, // Keep in BTC as SRC20Card expects
      mcap: data.marketCapBTC,
      volume24: data.volume24hBTC,
      stamp_url: null, // Not available in cache yet
      tx_hash: "", // Not available in cache yet
      holder_count: data.holderCount,
      change24: data.priceChange24hPercent, // Add the 24h change from cache
      volume7d: data.volume7dBTC, // Add the 7d volume from cache
      change7d: data.priceChange7dPercent, // Add the 7d change from cache
      market_data: {
        stampscan: {
          price: priceInSats, // Keep in sats for compatibility
          volume24: data.volume24hBTC / 2, // Split volume between sources
        },
        openstamp: {
          price: priceInSats, // Keep in sats for compatibility
          volume24: data.volume24hBTC / 2, // Split volume between sources
        },
      },
    };
  }
  static async getTotalCountValidSrc20Tx(
    params: { tick?: string; op?: string | string[] },
    excludeFullyMinted = false,
  ): Promise<number> {
    try {
      const result = await SRC20Repository.getTotalCountValidSrc20TxFromDb(
        params,
        excludeFullyMinted,
      );
      return (result as any).rows[0].total;
    } catch (error) {
      console.error("Error getting total valid SRC20 transactions:", error);
      throw error;
    }
  }

  /**
   * @deprecated Use SRC20Service.QueryService.fetchAndFormatSrc20Data directly.
   * This method is kept for backward compatibility with existing API routes.
   */
  static async handleSrc20TransactionsRequest(
    _req: Request,
    params: SRC20TrxRequestParams,
    excludeFullyMinted = false,
  ) {
    try {
      return await SRC20Service.QueryService.fetchAndFormatSrc20Data(
        params,
        excludeFullyMinted,
      );
    } catch (error) {
      console.error("Error processing SRC20 transaction request:", error);
      throw error;
    }
  }

  static async handleSrc20BalanceRequest(
    balanceParams: SRC20BalanceRequestParams,
  ) {
    try {
      // Assign default values if limit and page are undefined or invalid
      const limit = Number(balanceParams.limit) || 50; // Set a default limit, e.g., 50
      const page = Number(balanceParams.page) || 1;

      // Update balanceParams with safe values
      balanceParams.limit = limit;
      balanceParams.page = page;

      const [rawData, lastBlock] = await Promise.all([
        SRC20Service.QueryService.fetchSrc20Balance(balanceParams),
        BlockService.getLastBlock(),
      ]);

      let restructuredResult: any = {
        last_block: lastBlock,
      };

      // Process data with mint progress if requested
      let processedData: any = Array.isArray(rawData) && rawData.length > 1 ? [...rawData]: rawData;

      // 🚀 CENTRALIZED MARKET DATA ENRICHMENT (v2.3 format)
      // Middleware will transform to v2.2 (remove market_data) if needed
      if (balanceParams.includeMarketData) {
        processedData = await MarketDataEnrichmentService.enrichWithMarketData(
          processedData,
          {
            bulkOptimized: true,
            enableLogging: false
          }
        );
      }

      if (balanceParams.includeMintData && Array.isArray(processedData)) {
        const ticks = processedData.map((row: any) => row.tick).filter(Boolean);
        if (ticks.length > 0) {
          const mintProgressData = await Promise.all(
            ticks.map((tick: string) =>
              SRC20Service.QueryService.fetchSrc20MintProgress(tick)
            )
          );

          // Create a map of tick to mint progress for efficient lookup
          const mintProgressMap = new Map(
            mintProgressData.map((progress: any, index: number) => [ticks[index], progress])
          );

          // Enrich data with mint progress
          processedData = processedData.map((row: any) => ({
            ...row,
            mint_progress: mintProgressMap.get(row.tick) || null
          }));
        }
      }

      if (balanceParams.includePagination) {
        const fetchedTotalCount = await SRC20Service.QueryService.getTotalSrc20BalanceCount(
          balanceParams,
        );

        restructuredResult = {
          page,
          limit,
          totalPages: Math.ceil(fetchedTotalCount / limit),
          total: fetchedTotalCount,
          ...restructuredResult,
        };
      }

      restructuredResult.data = processedData;

      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC20 balance request:", error);
      console.error("Params:", JSON.stringify(balanceParams));
      // Return an empty response instead of throwing an error
      return {
        last_block: await BlockService.getLastBlock(),
        data: balanceParams.address && balanceParams.tick ? {} : [],
      };
    }
  }

  static async handleSrc20SnapshotRequest(params: SRC20SnapshotRequestParams) {
    try {
      const [snapshotData, lastBlock, total] = await Promise.all([
        SRC20Service.QueryService.fetchSrc20Snapshot(params),
        BlockService.getLastBlock(),
        SRC20Service.QueryService.getTotalSrc20BalanceCount(params),
      ]);

      const limit = params.limit || snapshotData.length;
      const page = params.page || 1;

      const restructuredResult = {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        total,
        snapshot_block: lastBlock,
        data: snapshotData,
      };

      return restructuredResult;
    } catch (error) {
      console.error("Error processing SRC20 snapshot request:", error);
      throw error;
    }
  }

  static async getTickData(params: {
    tick: string;
    limit: number;
    page: number;
    op?: string | string[];
    sortBy?: string;
  }) {
    const [src20_txs, totalResult, lastBlock, mint_status] = await Promise.all([
      SRC20Service.QueryService.fetchRawSrc20Data(params),
      this.getTotalCountValidSrc20Tx(
        params.op
          ? { tick: params.tick, op: params.op }
          : { tick: params.tick }
      ),
      BlockService.getLastBlock(),
      SRC20Service.QueryService.fetchSrc20MintProgress(params.tick),
    ]);

    const total = totalResult;
    return { src20_txs, total, lastBlock, mint_status };
  }

  static async getUploadData(params: {
    op: string;
    limit: number;
    page: number;
  }) {
    const [data, totalResult, lastBlock] = await Promise.all([
      SRC20Service.QueryService.fetchRawSrc20Data(params),
      this.getTotalCountValidSrc20Tx({ op: params.op }),
      BlockService.getLastBlock(),
    ]);

    const total = totalResult;
    return { data, total, lastBlock };
  }

  static async handleDeploymentRequest(tick: string, _req: Request) {
    try {
      const [deploymentData, mintStatusData, lastBlockData] = await Promise.all(
        [
          SRC20Service.QueryService.fetchAndFormatSrc20Data({
            tick: [tick],
            op: "DEPLOY",
            limit: 1,
            page: 1,
          }),
          SRC20Service.QueryService.fetchSrc20MintProgress(tick).catch(() => null),
          SRC20Service.QueryService.fetchAndFormatSrc20Data({
            limit: 1,
            page: 1,
            sortBy: "DESC",
          }),
        ],
      );

      // If deploymentData is empty, it means the tick doesn't exist
      if (!deploymentData.data || !Array.isArray(deploymentData.data) || deploymentData.data.length === 0) {
        return {
          last_block: lastBlockData.last_block,
          mint_status: null,
          data: null,
        };
      }

      return {
        last_block: lastBlockData.last_block,
        mint_status: mintStatusData,
        data: (deploymentData.data as any[])[0],
      };
    } catch (error) {
      console.error("Error in handleDeploymentRequest:", error);
      throw error;
    }
  }

  static async fetchSrc20TickPageData(tick: string): Promise<SRC20TickPageData> {
    try {
      const balanceParams = {
        tick,
        sortBy: "DESC",
        includePagination: false,
        limit: 1000000
      };

      const [
        balanceResponse,
        mintProgressResponse,
        allSrc20DataResponse,
        cachedMarketData,
      ] = await Promise.all([
        this.handleSrc20BalanceRequest(balanceParams),
        SRC20Service.QueryService.fetchSrc20MintProgress(tick), // tick is unicode
        SRC20Service.QueryService.fetchAllSrc20DataForTick(tick),
        MarketDataRepository.getSRC20MarketData(tick),
      ]);

      // Check if deployment is null
      if (!allSrc20DataResponse || !allSrc20DataResponse.deployment) {
        throw new Error(`Deployment data not found for tick: ${tick}`);
      }

      // Convert cached market data to the expected format
      const marketInfoForTick = cachedMarketData
        ? this.convertToMarketListingFormat(cachedMarketData)
        : undefined;

      const { deployment, total_mints, total_transfers } = allSrc20DataResponse;

      const totalCount = total_transfers + total_mints;

      return {
        last_block: balanceResponse.last_block,
        deployment,
        total_transfers,
        total_mints,
        total_holders: Array.isArray(balanceResponse.data)
          ? balanceResponse.data.length
          : 0,
        holders: Array.isArray(balanceResponse.data)
          ? balanceResponse.data.map((row: any) => {
            const amt = formatAmount(row.amt || "0");
            const totalMinted = formatAmount(
              mintProgressResponse?.total_minted || "1",
            );
            const percentage = this.calculatePercentage(amt, totalMinted);
            return { ...row, amt, percentage };
          })
          : [],
        mint_status: {
          max_supply: mintProgressResponse?.max_supply?.toString() || "0",
          total_minted: mintProgressResponse?.total_minted?.toString() || "0",
          limit: mintProgressResponse?.limit?.toString() || "0",
          total_mints: mintProgressResponse?.total_mints || 0,
          progress: mintProgressResponse?.progress || "0",
          decimals: mintProgressResponse?.decimals || 0,
          tx_hash: mintProgressResponse?.tx_hash || "",
        },
        total_transactions: totalCount,
        marketInfo: marketInfoForTick || undefined,
      } as SRC20TickPageData;
    } catch (error) {
      console.error("Error in fetchSrc20TickPageData:", error);
      throw error;
    }
  }

  private static calculatePercentage(amount: string, total: string): string {
    const amountNum = parseFloat(amount.replace(/,/g, ""));
    const totalNum = parseFloat(total.replace(/,/g, ""));
    if (totalNum === 0) return "0.00";
    const percentage = (amountNum / totalNum) * 100;
    return percentage.toFixed(2);
  }

  static async fetchFullyMintedByMarketCapV2(
    limit: number = 50,
    page: number = 1,
    sortBy: string = "TRENDING",
    sortDirection: string = "desc",
  ): Promise<PaginatedSrc20ResponseBody> {
    const circuitBreaker = CircuitBreakerService.getMarketCapBreaker();

    const fallbackData = {
      ...MARKET_CAP_FALLBACK_DATA,
      page,
      limit,
      last_block: await BlockService.getLastBlock().catch(() => 0),
    } as PaginatedSrc20ResponseBody;

    return circuitBreaker.execute(async () => {
      console.log(`[MarketCapV2] Fetching market data directly from src20_market_data table...`);

      // Use the optimized market data repository method
      const marketDataLimit = Math.min(limit * 3, 150); // Get more data for sorting, but not too much
      const cachedMarketData = await MarketDataRepository.getAllSRC20MarketData(marketDataLimit);

      console.log(`[MarketCapV2] Retrieved ${cachedMarketData.length} market data entries`);

      if (cachedMarketData.length === 0) {
        console.log("[MarketCapV2] No market data found, returning empty result");
        return {
          data: [],
          page,
          totalPages: 0,
          limit,
          last_block: await BlockService.getLastBlock(),
          total: 0,
        } as PaginatedSrc20ResponseBody;
      }

      // Get the ticks from market data (already sorted by market cap)
      const ticks = cachedMarketData.map(data => data.tick);

      // Fetch basic SRC20 deploy data for these ticks only
      const src20Result = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        {
          tick: ticks,
          limit: marketDataLimit,
          page: 1,
          op: "DEPLOY",
          sortBy: "DESC"
        },
        {
          onlyFullyMinted: true,
          includeMarketData: false, // We already have market data
          enrichWithProgress: true,
        }
      );

      if (!src20Result.data || !Array.isArray(src20Result.data)) {
        console.log("[MarketCapV2] No SRC20 deploy data found");
        return {
          data: [],
          page,
          totalPages: 0,
          limit,
          last_block: await BlockService.getLastBlock(),
          total: 0,
        } as PaginatedSrc20ResponseBody;
      }

      // Create a map of tick -> SRC20 data for fast lookup
      const src20DataMap = new Map();
      src20Result.data.forEach(item => {
        src20DataMap.set(item.tick, item);
      });

      // Merge market data with SRC20 deploy data in the correct order
      const baseData = cachedMarketData
        .map(marketData => {
          const src20Data = src20DataMap.get(marketData.tick);
          if (!src20Data) {
            return null; // Skip if no deploy data found
          }

          return {
            ...src20Data,
            holders: marketData.holderCount || src20Data.holders || 0,
          };
        })
        .filter(item => item !== null); // Remove null entries

      // 🚀 CENTRALIZED MARKET DATA ENRICHMENT (v2.3 format)
      // Middleware will transform to v2.2 (remove market_data) if needed
      const mergedData = await MarketDataEnrichmentService.enrichWithMarketData(
        baseData,
        {
          bulkOptimized: true,
          enableLogging: false
        }
      );

      // Apply sorting if needed (market data is already sorted by market cap)
      const sortedData = mergedData;
      if (sortBy === "HOLDERS") {
        sortedData.sort((a: any, b: any) => {
          const aHolders = Number(a.holders) || 0;
          const bHolders = Number(b.holders) || 0;
          return sortDirection === "asc" ? aHolders - bHolders : bHolders - aHolders;
        });
      } else if (sortBy === "VOLUME") {
        sortedData.sort((a: any, b: any) => {
          const aVolume = a.volume24 || 0;
          const bVolume = b.volume24 || 0;
          return sortDirection === "asc" ? aVolume - bVolume : bVolume - aVolume;
        });
      } else if (sortBy === "DEPLOY") {
        sortedData.sort((a: any, b: any) => {
          const aTime = new Date(a.block_time).getTime();
          const bTime = new Date(b.block_time).getTime();
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        });
      }
      // "TRENDING" (default) is already sorted by market cap from the market data query

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedData = sortedData.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(sortedData.length / limit);

      console.log(`[MarketCapV2] Returning ${paginatedData.length} items (page ${page}/${totalPages})`);

      return {
        data: paginatedData,
        page,
        totalPages,
        limit,
        last_block: await BlockService.getLastBlock(),
        total: sortedData.length,
      } as PaginatedSrc20ResponseBody;
    }, fallbackData);
  }


  static async fetchTrendingActiveMintingTokensV2(
    limit: number,
    page: number,
    transactionCount: number,
  ) {
    const circuitBreaker = CircuitBreakerService.getTrendingBreaker();

    const fallbackData = {
      ...TRENDING_FALLBACK_DATA,
      page,
      limit,
      last_block: await BlockService.getLastBlock().catch(() => 0),
    };

    return circuitBreaker.execute(async () => {
      console.log(`[TrendingV2] Fetching trending minting tokens with optimized query...`);

      // Get trending data from the optimized repository query
      const trendingData = await SRC20Service.QueryService.fetchTrendingActiveMintingTokens(
        limit * 2, // Get more data for better results
        page,
        transactionCount,
      );

      if (!trendingData.data || trendingData.data.length === 0) {
        console.log("[TrendingV2] No trending data found");
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
          last_block: await BlockService.getLastBlock(),
        };
      }

      // Get the ticks from trending data
      const ticks = trendingData.data.map(row => row.tick);

      // Fetch market data for these specific ticks only (much more efficient)
      const marketDataPromises = ticks.map(tick =>
        MarketDataRepository.getSRC20MarketData(tick).catch(() => null)
      );
      const marketDataResults = await Promise.all(marketDataPromises);

      // Create a map of tick -> market data for fast lookup
      const marketDataMap = new Map();
      marketDataResults.forEach((marketData, index) => {
        if (marketData) {
          marketDataMap.set(ticks[index], marketData);
        }
      });

      // Get basic deployment data for trending tokens
      const deploymentData = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2({
        tick: ticks,
        op: "DEPLOY",
        limit: ticks.length,
        page: 1,
        sortBy: "DESC"
      }, {
        onlyFullyMinted: false, // Include minting tokens
        includeMarketData: false, // We have market data already
        enrichWithProgress: true,
      });

      if (!deploymentData.data || !Array.isArray(deploymentData.data)) {
        console.log("[TrendingV2] No deployment data found");
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
          last_block: await BlockService.getLastBlock(),
        };
      }

      // Create a map of tick -> deployment data for fast lookup
      const deploymentMap = new Map();
      deploymentData.data.forEach(item => {
        deploymentMap.set(item.tick, item);
      });

      // Merge trending data with deployment data
      const baseData = trendingData.data
        .map(trendingItem => {
          const deploymentItem = deploymentMap.get(trendingItem.tick);

          if (!deploymentItem) {
            return null; // Skip if no deployment data
          }

          return {
            ...trendingItem,
            ...deploymentItem,
          };
        })
        .filter(item => item !== null); // Remove null entries

      // Enrich with market data using centralized service
      const enrichedData = await MarketDataEnrichmentService.enrichWithMarketData(
        baseData,
        { bulkOptimized: true, includeExtendedFields: true }
      );

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedData = enrichedData.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(enrichedData.length / limit);

      console.log(`[TrendingV2] Returning ${paginatedData.length} items (page ${page}/${totalPages})`);

      return {
        data: paginatedData,
        total: enrichedData.length,
        page,
        totalPages,
        limit,
        last_block: await BlockService.getLastBlock(),
      };
    }, fallbackData);
  }
}
