
import type { SRC20MarketData } from "$lib/types/marketData.d.ts";
import type {SRC20BalanceRequestParams, SRC20TickPageData} from "$lib/types/src20.d.ts";
import { formatAmount } from "$lib/utils/ui/formatting/formatUtils.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import { BlockService } from "$server/services/core/blockService.ts";
import { CircuitBreakerService, TRENDING_FALLBACK_DATA } from "$server/services/infrastructure/circuitBreaker.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { MarketDataEnrichmentService } from "$server/services/src20/marketDataEnrichmentService.ts";
import type { MarketListingAggregated } from "$types/marketData.d.ts";
import type { SRC20SnapshotRequestParams } from "$types/src20.d.ts";

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
    // Convert SRC20MarketData to MarketListingAggregated format

    return {
      tick: data.tick,
      // ✅ v2.3 STANDARDIZED FIELDS
      floor_price_btc: data.floorPriceBTC,
      market_cap_btc: data.marketCapBTC || 0,
      volume_24h_btc: data.volume24hBTC || 0,

      // 🔄 BACKWARD COMPATIBILITY: Legacy field names
      floor_unit_price: data.floorPriceBTC || 0,
      mcap: data.marketCapBTC || 0,
      volume24: data.volume24hBTC || 0,

      stamp_url: null,
      tx_hash: "", // SRC20 tokens don't have tx_hash in market data
      holder_count: data.holderCount || 0,
      change24: data.priceChange24hPercent || 0,
      volume7d: data.volume7dBTC || 0,
      change7d: data.priceChange7dPercent || 0,
      market_data: {
        stampscan: {
          price: (data.floorPriceBTC || 0) / 2, // Split price between sources, handle null
          volume_24h_btc: (data.volume24hBTC || 0) / 2, // Split volume between sources
        },
        openstamp: {
          price: (data.floorPriceBTC || 0) / 2, // Split price between sources, handle null
          volume_24h_btc: (data.volume24hBTC || 0) / 2, // Split volume between sources
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

      // Process data based on pagination requirements
      // For paginated requests: ensure data is array for consistency
      // For single object requests: maintain single object structure per schema
      let processedData: any;
      
      if (balanceParams.includePagination) {
        // Paginated endpoint: data must be array
        processedData = Array.isArray(rawData) ? [...rawData] : (rawData ? [rawData] : []);
      } else {
        // Single object endpoint: data must be object (not array)
        processedData = Array.isArray(rawData) ? rawData[0] || null : rawData;
      }

      // 🚀 CENTRALIZED MARKET DATA ENRICHMENT (v2.3 format)
      // Middleware will transform to v2.2 (remove market_data) if needed
      if (balanceParams.includeMarketData) {
        try {
          if (balanceParams.includePagination) {
            // For paginated endpoints: enrich array directly
            processedData = await MarketDataEnrichmentService.enrichWithMarketData(
              processedData,
              {
                includeExtendedFields: true,
                bulkOptimized: true,
                enableLogging: true
              }
            );
          } else {
            // For single object endpoints: wrap in array for enrichment, then unwrap
            if (processedData) {
              const enrichedArray = await MarketDataEnrichmentService.enrichWithMarketData(
                [processedData],
                {
                  includeExtendedFields: true,
                  bulkOptimized: true,
                  enableLogging: true
                }
              );
              processedData = enrichedArray[0] || processedData;
            }
          }
        } catch (marketDataError) {
          // ✅ Enhanced error handling for market data enrichment failures
          console.warn("Market data enrichment failed for balance request:", {
            error: marketDataError,
            params: {
              address: balanceParams.address,
              tick: balanceParams.tick,
              itemCount: Array.isArray(processedData) ? processedData.length : 1
            }
          });

          // ✅ Graceful degradation: continue with balance data but no market enrichment
          console.info("Balance request continuing without market data enrichment");
        }
      }

      if (balanceParams.includeMintData) {
        if (balanceParams.includePagination && Array.isArray(processedData)) {
          // For paginated endpoints: process array of balances
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
        } else if (!balanceParams.includePagination && processedData && processedData.tick) {
          // For single object endpoints: process single balance
          const mintProgress = await SRC20Service.QueryService.fetchSrc20MintProgress(processedData.tick);
          processedData = {
            ...processedData,
            mint_progress: mintProgress || null
          };
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
      // ✅ Enhanced error handling with specific error categorization
      console.error("Error processing SRC20 balance request:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        params: {
          address: balanceParams.address,
          tick: balanceParams.tick,
          includeMarketData: balanceParams.includeMarketData,
          limit: balanceParams.limit,
          page: balanceParams.page
        }
      });

      // ✅ Attempt to get last block for error response, with fallback
      let lastBlock;
      try {
        lastBlock = await BlockService.getLastBlock();
      } catch (blockError) {
        console.warn("Failed to get last block in error handler:", blockError);
        lastBlock = 0; // Fallback value
      }

      // ✅ Return structured error response with graceful degradation
      return {
        last_block: lastBlock,
        data: balanceParams.address && balanceParams.tick ? {} : [],
        // Note: API middleware will add appropriate error metadata if needed
      };
    }
  }

  static async handleSrc20SnapshotRequest(params: SRC20SnapshotRequestParams) {
    try {
      // Create compatible params for getTotalSrc20BalanceCount (excluding null values)
      const { address, ...baseParams } = params;
      const balanceCountParams = {
        ...baseParams,
        ...(address !== null && address !== undefined && { address }),
      };

      const [snapshotData, lastBlock, total] = await Promise.all([
        SRC20Service.QueryService.fetchSrc20Snapshot(params),
        BlockService.getLastBlock(),
        SRC20Service.QueryService.getTotalSrc20BalanceCount(balanceCountParams),
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
          SRC20Service.QueryService.fetchBasicSrc20Data({
            tick: [tick],
            op: "DEPLOY",
            limit: 1,
            page: 1,
          }),
          SRC20Service.QueryService.fetchSrc20MintProgress(tick).catch(() => null),
          SRC20Service.QueryService.fetchBasicSrc20Data({
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
        SRC20Service.QueryService.getSRC20MarketData(tick),
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
      const ticks = trendingData.data.map((row: any) => row.tick);

      // Fetch market data for these specific ticks only (much more efficient)
      const marketDataMap = await SRC20Service.QueryService.getBulkSRC20MarketData(ticks);

      // Get basic deployment data for trending tokens
      const deploymentData = await SRC20Service.QueryService.fetchEnhancedSrc20Data({
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
      deploymentData.data.forEach((item: any) => {
        deploymentMap.set(item.tick, item);
      });

      // Merge trending data with deployment data and market data
      const baseData = trendingData.data
        .map((trendingItem: any) => {
          const deploymentItem = deploymentMap.get(trendingItem.tick);

          if (!deploymentItem) {
            return null; // Skip if no deployment data
          }

          return {
            ...trendingItem,
            ...deploymentItem,
          };
        })
        .filter((item: any) => item !== null); // Remove null entries

      // 🚀 SERVICE LAYER: Structure data with market data
      const structuredData = SRC20Service.QueryService.structureWithMarketData(baseData, marketDataMap);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedData = structuredData.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(structuredData.length / limit);

      console.log(`[TrendingV2] Returning ${paginatedData.length} items (page ${page}/${totalPages})`);

      return {
        data: paginatedData,
        total: structuredData.length,
        page,
        totalPages,
        limit,
        last_block: await BlockService.getLastBlock(),
      };
    }, fallbackData);
  }
}
