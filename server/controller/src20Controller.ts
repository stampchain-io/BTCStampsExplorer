import { SRC20Service } from "$server/services/src20/index.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import {
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "$globals";
import { SRC20BalanceRequestParams } from "$lib/types/src20.d.ts";
import { StampService } from "$server/services/stampService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { MarketListingAggregated } from "$types/index.d.ts";
import { MarketDataRepository } from "$server/database/marketDataRepository.ts";
import type { SRC20MarketData } from "$lib/types/marketData.d.ts";
import { WalletData } from "$lib/types/index.d.ts";
import { formatAmount } from "$lib/utils/formatUtils.ts";

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
      return result.rows[0].total;
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
    req: Request,
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
      let processedData = rawData.length > 1 ? [...rawData]: rawData;

      if (balanceParams.includeMintData) {
        const ticks = processedData.map(row => row.tick).filter(Boolean);
        if (ticks.length > 0) {
          const mintProgressData = await Promise.all(
            ticks.map(tick => 
              SRC20Service.QueryService.fetchSrc20MintProgress(tick)
            )
          );
          
          // Create a map of tick to mint progress for efficient lookup
          const mintProgressMap = new Map(
            mintProgressData.map((progress, index) => [ticks[index], progress])
          );

          // Enrich data with mint progress
          processedData = processedData.map(row => ({
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
      this.getTotalCountValidSrc20Tx({ tick: params.tick, op: params.op }),
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

  static async handleDeploymentRequest(tick: string, req: Request) {
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
      if (!deploymentData.data || deploymentData.data.length === 0) {
        return {
          last_block: lastBlockData.last_block,
          mint_status: null,
          data: null,
        };
      }

      return {
        last_block: lastBlockData.last_block,
        mint_status: mintStatusData,
        data: deploymentData.data[0],
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
          ? balanceResponse.data.map((row) => {
            const amt = formatAmount(row.amt || "0");
            const totalMinted = formatAmount(
              mintProgressResponse?.total_minted || "1",
            );
            const percentage = this.calculatePercentage(amt, totalMinted);
            return { ...row, amt, percentage };
          })
          : [],
        mint_status: {
          ...mintProgressResponse,
          max_supply: mintProgressResponse?.max_supply?.toString() || "0",
          total_minted: mintProgressResponse?.total_minted?.toString() || "0",
          limit: mintProgressResponse?.limit?.toString() || "0",
        },
        total_transactions: totalCount,
        marketInfo: marketInfoForTick,
      };
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
    try {
      // First fetch market data from cache to get top ticks by market cap
      const cachedMarketData = await MarketDataRepository.getAllSRC20MarketData(1000);
      
      console.log(`Cached market data count: ${cachedMarketData.length}`);
      if (cachedMarketData.length > 0) {
        console.log("Sample cached data:", cachedMarketData[0]);
      }
      
      // Convert to MarketListingAggregated format for compatibility
      const convertedMarketData = cachedMarketData.map(data => 
        this.convertToMarketListingFormat(data)
      );
      
      if (convertedMarketData.length > 0) {
        console.log("Sample converted data:", convertedMarketData[0]);
      }
      
      // Market data is already sorted by market cap, just get the ticks
      const sortedTicks = cachedMarketData.map(item => item.tick);

      // When sorting by HOLDERS or other fields, we need to get ALL fully minted tokens
      // not just the ones in the market data cache
      let ticksToFetch = sortedTicks;
      
      // If we have no cached market data, fall back to external API
      let marketDataToUse = convertedMarketData;
      if (cachedMarketData.length === 0) {
        console.log("No cached market data found, falling back to external API");
        marketDataToUse = undefined; // This will trigger fetchMarketListingSummary in enrichData
      }
      
      if (sortBy !== "TRENDING" && sortBy !== "VOLUME") {
        // For non-market-based sorts, fetch all fully minted tokens
        const allFullyMintedResult = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
          {
            limit: 10000,
            page: 1,
            op: "DEPLOY",
            sortBy: "DESC"
          },
          {
            onlyFullyMinted: true,
            includeMarketData: false,
            enrichWithProgress: false
          }
        );
        
        if (allFullyMintedResult.data && Array.isArray(allFullyMintedResult.data)) {
          ticksToFetch = allFullyMintedResult.data.map(item => item.tick);
        }
      }

      if (ticksToFetch.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          totalPages: 0,
          limit,
          last_block: await BlockService.getLastBlock()
        };
      }

      // Fetch ALL SRC20 data first (without pagination) to sort properly
      const allDataResult = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        {
          tick: ticksToFetch,
          limit: 10000, // Get all data for proper sorting
          page: 1,
          op: "DEPLOY",
          sortBy: "DESC"
        },
        {
          onlyFullyMinted: true,
          includeMarketData: true,
          enrichWithProgress: true,
          prefetchedMarketData: marketDataToUse
        }
      );

      // Transform data to ensure market fields are properly exposed for the UI
      let allData: any[] = [];
      if (allDataResult.data && Array.isArray(allDataResult.data)) {
        allData = allDataResult.data.map(item => ({
          ...item,
          floor_unit_price: item.market_data?.floor_unit_price || 0,
          market_cap: item.market_data?.mcap || 0,
          mcap: item.market_data?.mcap || 0,
          volume24: item.market_data?.volume24 || 0,
          change24: item.market_data?.change24 || 0, // Use the change24 from market data
          holders: item.holders || item.market_data?.holder_count || 0
        }));

        // Apply server-side sorting based on sortBy parameter
        if (sortBy === "HOLDERS") {
          allData.sort((a, b) => {
            const aHolders = Number(a.holders) || 0;
            const bHolders = Number(b.holders) || 0;
            return sortDirection === "asc" ? aHolders - bHolders : bHolders - aHolders;
          });
        } else if (sortBy === "DEPLOY") {
          allData.sort((a, b) => {
            const aTime = new Date(a.block_time).getTime();
            const bTime = new Date(b.block_time).getTime();
            return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
          });
        } else if (sortBy === "VOLUME") {
          allData.sort((a, b) => {
            const aVolume = a.volume24 || 0;
            const bVolume = b.volume24 || 0;
            return sortDirection === "asc" ? aVolume - bVolume : bVolume - aVolume;
          });
        }
        // Default "TRENDING" is already sorted by market cap
      }

      // Now paginate the sorted data
      const startIndex = (page - 1) * limit;
      const paginatedData = allData.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(allData.length / limit);

      return {
        data: paginatedData,
        total: allData.length,
        page,
        totalPages,
        limit,
        last_block: await BlockService.getLastBlock()
      };
    } catch (error) {
      console.error("Error in fetchFullyMintedByMarketCapV2:", error);
      throw error;
    }
  }


  static async fetchTrendingActiveMintingTokensV2(
    limit: number,
    page: number,
    transactionCount: number,
    sortBy: string = "TRENDING",
    sortDirection: string = "desc",
  ) {

    try {
      // Get ALL trending data first for proper sorting
      const allTrendingData = await SRC20Service.QueryService.fetchTrendingActiveMintingTokens(
        10000, // Get all data
        1,
        transactionCount,
      );

      // Get cached market data for minting tokens as well
      const cachedMarketData = await MarketDataRepository.getAllSRC20MarketData(1000);
      const convertedMarketData = cachedMarketData.length > 0 
        ? cachedMarketData.map(data => this.convertToMarketListingFormat(data))
        : undefined;

      // Use V2 endpoint for enriched data with market info
      const enrichedData = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        {
          tick: allTrendingData.data.map(row => row.tick),
          includeMarketData: true,
          enrichWithProgress: true,
        },
        {
          excludeFullyMinted: true,
          includeMarketData: true,
          enrichWithProgress: true,
          batchSize: 50,
          prefetchedMarketData: convertedMarketData
        }
      );

      // Merge trending data with enriched data
      let allEnrichedResult = allTrendingData.data.map(row => {
        const enrichedItem = Array.isArray(enrichedData.data) 
          ? enrichedData.data.find(item => item.tick === row.tick)
          : enrichedData.data;
        
        return {
          ...row,
          ...enrichedItem,
          holders: enrichedItem?.holders || 0,
          mcap: enrichedItem?.market_data?.mcap || 0,
          market_cap: enrichedItem?.market_data?.mcap || 0, // Add market_cap for display
          floor_unit_price: enrichedItem?.market_data?.floor_unit_price || 0,
          volume24: enrichedItem?.market_data?.volume24 || 0, // Add volume24
          change24: enrichedItem?.market_data?.change24 || 0, // Use the change24 from market data
          progress: enrichedItem?.mint_progress?.progress || null,
          mint_count: row.mint_count,
          top_mints_percentage: row.top_mints_percentage
            ? Number(row.top_mints_percentage)
            : 0,
          total_minted: enrichedItem?.mint_progress?.total_minted || "0",
          max_supply: enrichedItem?.mint_progress?.max_supply || "0",
        };
      });

      // Apply server-side sorting
      if (sortBy === "HOLDERS") {
        allEnrichedResult.sort((a, b) => {
          const aHolders = Number(a.holders) || 0;
          const bHolders = Number(b.holders) || 0;
          return sortDirection === "asc" ? aHolders - bHolders : bHolders - aHolders;
        });
      } else if (sortBy === "DEPLOY") {
        allEnrichedResult.sort((a, b) => {
          const aTime = new Date(a.block_time).getTime();
          const bTime = new Date(b.block_time).getTime();
          return sortDirection === "asc" ? aTime - bTime : bTime - aTime;
        });
      } else if (sortBy === "VOLUME") {
        allEnrichedResult.sort((a, b) => {
          const aVolume = a.volume24 || 0;
          const bVolume = b.volume24 || 0;
          return sortDirection === "asc" ? aVolume - bVolume : bVolume - aVolume;
        });
      }
      // Default "TRENDING" keeps the original trending order

      // Now paginate the sorted data
      const startIndex = (page - 1) * limit;
      const paginatedData = allEnrichedResult.slice(startIndex, startIndex + limit);
      const totalPages = Math.ceil(allEnrichedResult.length / limit);

      return {
        data: paginatedData,
        total: allEnrichedResult.length,
        page,
        totalPages,
        limit
      };
    } catch (error) {
      console.error("Error in fetchTrendingActiveMintingTokensV2:", error);
      throw error;
    }
  }
}
