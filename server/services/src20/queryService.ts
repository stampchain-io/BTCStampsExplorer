import { SRC20Repository } from "$server/database/src20Repository.ts";
import { BlockService } from "$server/services/blockService.ts";
import { 
  SRC20BalanceRequestParams, 
  SRC20TrxRequestParams,
  PaginatedSrc20ResponseBody,
  Src20ResponseBody,
  Src20SnapShotDetail,
  SRC20SnapshotRequestParams,
} from "globals";
import { SRC20UtilityService } from "./utilityService.ts";
import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import { paginate } from "$lib/utils/paginationUtils.ts"
import { Big } from "$Big";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";

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

  static async fetchAndFormatSrc20Data(
    params: SRC20TrxRequestParams = {},
    excludeFullyMinted: boolean = false,
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
          excludeFullyMinted, // Passed excludeFullyMinted here
        ),
        BlockService.getLastBlock(),
      ]);

      const total = totalResult.rows[0].total;
      const pagination = paginate(total, queryParams.page, queryParams.limit);

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

  static async getSrc20MintProgressByTick(tick: string) {
    return await SRC20Repository.getSrc20MintProgressByTickFromDb(tick);
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
    const mint_status = await SRC20Repository.getSrc20MintProgressByTickFromDb(
      convertEmojiToTick(tick),
    );
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

  static async fetchTrendingSrc20Data(
    limit: number = 50,
    page: number = 1,
    transactionCount: number = 1000,
  ): Promise<PaginatedSrc20ResponseBody> {
    try {
      const offset = limit * (page - 1);
      const data = await SRC20Repository.getTrendingSrc20TxFromDb(
        limit,
        offset,
        transactionCount,
      );

      const totalResult = await SRC20Repository.getTrendingSrc20TotalCount(
        transactionCount,
      );
      const total = totalResult.rows[0].total;
      const pagination = paginate(total, page, limit);

      const mappedData = this.mapTransactionData(data.rows);
      const formattedData = this.formatTransactionData(mappedData, {});

      return {
        ...pagination,
        last_block: await BlockService.getLastBlock(),
        data: formattedData,
      };
    } catch (error) {
      console.error("Error in fetchTrendingSrc20Data:", error);
      throw error;
    }
  }

  static async searchSrc20Data(query: string) {
    return await SRC20Repository.searchValidSrc20TxFromDb(query);
  }
}
