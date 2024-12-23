import { SRC20Service } from "$server/services/src20/index.ts";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import {
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "$globals";
import { SRC20BalanceRequestParams } from "$lib/types/src20.d.ts";
import { StampService } from "$server/services/stampService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { SRC20MarketService } from "$server/services/src20/marketService.ts";
import { MarketListingAggregated } from "$types/index.d.ts";
import { WalletData } from "$lib/types/index.d.ts";
import { formatAmount } from "$lib/utils/formatUtils.ts";

export class Src20Controller {
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

      const [fetchedData, lastBlock] = await Promise.all([
        SRC20Service.QueryService.fetchSrc20Balance(balanceParams),
        BlockService.getLastBlock(),
      ]);

      let restructuredResult: any = {
        last_block: lastBlock,
      };

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

      restructuredResult.data = fetchedData;

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
        marketData,
      ] = await Promise.all([
        this.handleSrc20BalanceRequest(balanceParams),
        SRC20Service.QueryService.fetchSrc20MintProgress(tick), // tick is unicode
        SRC20Service.QueryService.fetchAllSrc20DataForTick(tick),
        SRC20MarketService.fetchMarketListingSummary(),
      ]);

      // Check if deployment is null
      if (!allSrc20DataResponse || !allSrc20DataResponse.deployment) {
        throw new Error(`Deployment data not found for tick: ${tick}`);
      }

      // Extract market info for the current tick
      const marketInfoForTick = marketData.find(
        (item) => item.tick.toUpperCase() === tick.toUpperCase(),
      );

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
    useV2: boolean = false
  ) {
    if (!useV2) {
      return this.fetchFullyMintedByMarketCap(limit, page);
    }

    try {
      // Use V2 endpoint with market data and progress enrichment
      const enrichedData = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        {
          op: "DEPLOY",
          limit: 1000, // Get a large batch to filter
          sortBy: "DESC",
        },
        {
          onlyFullyMinted: true,
          includeMarketData: true,
          enrichWithProgress: true,
          batchSize: 10
        }
      );

      const formattedData = (Array.isArray(enrichedData.data) ? enrichedData.data : [enrichedData.data])
        .filter(row => row && row.mint_progress?.progress === "100")
        .map(row => ({
          ...row,
          holders: row.holders || 0,
          mcap: row.market_data?.mcap || 0,
          floor_unit_price: Number((row.market_data?.floor_unit_price || 0).toFixed(10)),
          progress: row.mint_progress?.progress || "0",
        }))
        .sort((a, b) => (b.mcap || 0) - (a.mcap || 0));

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const resultData = formattedData.slice(startIndex, startIndex + limit);

      return {
        data: resultData,
        total: formattedData.length,
        page,
        totalPages: Math.ceil(formattedData.length / limit),
        limit
      };
    } catch (error) {
      console.error("Error in fetchFullyMintedByMarketCap:", error);
      throw error;
    }
  }

  static async fetchSrc20DetailsWithHolders(
    params: SRC20TrxRequestParams,
    excludeFullyMinted: boolean = false,
    onlyFullyMinted: boolean = false,
  ) {
    try {
      // For fully minted tokens sorted by market cap
      if (onlyFullyMinted) {
        // Get all DEPLOY transactions first
        const allDeployData = await SRC20Service.QueryService.fetchAndFormatSrc20Data(
          {
            ...params,
            limit: 1000, // Get a larger batch to filter from
            page: 1,
            op: "DEPLOY",
          },
          false, // Don't exclude any yet
          false, // Don't filter yet
        );

        if (!allDeployData.data || allDeployData.data.length === 0) {
          return {
            data: [],
            total: 0,
            page: params.page || 1,
            totalPages: 0,
            limit: params.limit || 50,
          };
        }

        // Process in batches for better performance
        const batchSize = 10;
        const rows = Array.isArray(allDeployData.data) ? allDeployData.data : [allDeployData.data];
        const enrichedData = [];
        
        // Get market data once
        const marketData = await SRC20MarketService.fetchMarketListingSummary();
        const marketDataMap = new Map(marketData.map(item => [item.tick, item]));
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          // Get mint progress and balances in parallel for the batch
          const [batchMintProgress, batchBalances] = await Promise.all([
            Promise.all(
              batch
                .filter(Boolean)
                .map(row => SRC20Service.QueryService.fetchSrc20MintProgress(row.tick))
            ),
            Promise.all(
              batch
                .filter(Boolean)
                .map(row => this.handleSrc20BalanceRequest({
                  tick: row.tick,
                  includePagination: true,
                }))
            ),
          ]);

          // Process each item in the batch
          batch.forEach((row, index) => {
            if (!row) return;

            const mintProgress = batchMintProgress[index];
            // Only include if fully minted
            if (!mintProgress || parseFloat(mintProgress.progress) < 100) return;

            const marketInfo = marketDataMap.get(row.tick);
            // Only include if it has market data
            if (!marketInfo) return;

            enrichedData.push({
              ...row,
              holders: batchBalances[index]?.total || 0,
              mcap: marketInfo.mcap,
              floor_unit_price: Number(marketInfo.floor_unit_price.toFixed(10)),
              progress: mintProgress.progress,
            });
          });
        }

        // Sort by market cap
        enrichedData.sort((a, b) => b.mcap - a.mcap);

        // Apply pagination
        const start = ((params.page || 1) - 1) * (params.limit || 50);
        const paginatedData = enrichedData.slice(start, start + (params.limit || 50));

        return {
          data: paginatedData,
          total: enrichedData.length,
          page: params.page || 1,
          totalPages: Math.ceil(enrichedData.length / (params.limit || 50)),
          limit: params.limit || 50,
        };
      }

      // For non-market-cap sorting (regular flow)
      const [resultData, marketData] = await Promise.all([
        SRC20Service.QueryService.fetchAndFormatSrc20Data(params, excludeFullyMinted),
        excludeFullyMinted ? null : SRC20MarketService.fetchMarketListingSummary(),
      ]);

      if (!resultData.data || resultData.data.length === 0) {
        return {
          data: [],
          total: 0,
          page: params.page || 1,
          totalPages: 0,
          limit: params.limit || 50,
        };
      }

      // Create market data map for quick lookups (if we have market data)
      const marketDataMap = marketData 
        ? new Map(marketData.map(item => [item.tick, item]))
        : new Map();

      // Process in batches for better performance
      const batchSize = 10;
      const rows = Array.isArray(resultData.data) ? resultData.data : [resultData.data];
      const enrichedData = [];
      
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        
        // Get mint progress and balances in parallel for the batch
        const [batchMintProgress, batchBalances] = await Promise.all([
          Promise.all(
            batch
              .filter(Boolean)
              .map(row => SRC20Service.QueryService.fetchSrc20MintProgress(row.tick))
          ),
          Promise.all(
            batch
              .filter(Boolean)
              .map(row => this.handleSrc20BalanceRequest({
                tick: row.tick,
                includePagination: true,
              }))
          ),
        ]);

        // Process each item in the batch
        batch.forEach((row, index) => {
          if (!row) return;

          const marketInfo = marketDataMap.get(row.tick) || {
            mcap: 0,
            floor_unit_price: 0,
          };

          enrichedData.push({
            ...row,
            holders: batchBalances[index]?.total || 0,
            mcap: marketInfo.mcap,
            floor_unit_price: Number(marketInfo.floor_unit_price.toFixed(10)),
            progress: batchMintProgress[index]?.progress || "0",
          });
        });
      }

      return {
        data: enrichedData,
        total: resultData.total,
        page: params.page || 1,
        totalPages: Math.ceil(resultData.total / (params.limit || 50)),
        limit: params.limit || 50,
      };
    } catch (error) {
      console.error("Error in fetchSrc20DetailsWithHolders:", error);
      throw error;
    }
  }

  static async fetchTrendingActiveMintingTokensV2(
    limit: number,
    page: number,
    transactionCount: number,
    useV2: boolean = false
  ) {
    if (!useV2) {
      return this.fetchTrendingActiveMintingTokens(limit, page, transactionCount);
    }

    try {
      const trendingData = await SRC20Service.QueryService.fetchTrendingActiveMintingTokens(
        limit,
        page,
        transactionCount,
      );

      // Use V2 endpoint for enriched data with market info
      const enrichedData = await SRC20Service.QueryService.fetchAndFormatSrc20DataV2(
        {
          tick: trendingData.data.map(row => row.tick),
          includeMarketData: true,
          enrichWithProgress: true,
        },
        {
          excludeFullyMinted: true,
          includeMarketData: true,
          enrichWithProgress: true,
          batchSize: 10
        }
      );

      // Merge trending data with enriched data
      const enrichedResult = trendingData.data.map(row => {
        const enrichedItem = Array.isArray(enrichedData.data) 
          ? enrichedData.data.find(item => item.tick === row.tick)
          : enrichedData.data;
        
        return {
          ...row,
          ...enrichedItem,
          holders: enrichedItem?.holders || 0,
          mcap: enrichedItem?.market_data?.mcap || 0,
          floor_unit_price: enrichedItem?.market_data?.floor_unit_price || 0,
          progress: enrichedItem?.mint_progress?.progress || null,
          mint_count: row.mint_count,
          top_mints_percentage: row.top_mints_percentage
            ? Number(row.top_mints_percentage)
            : 0,
          total_minted: enrichedItem?.mint_progress?.total_minted || "0",
          max_supply: enrichedItem?.mint_progress?.max_supply || "0",
        };
      });

      return {
        data: enrichedResult,
        total: trendingData.total,
        page,
        totalPages: Math.ceil(trendingData.total / limit),
        limit
      };
    } catch (error) {
      console.error("Error in fetchTrendingActiveMintingTokensV2:", error);
      throw error;
    }
  }
}
