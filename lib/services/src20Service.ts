import { SRC20Repository } from "$lib/database/src20Repository.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { SRC20BalanceRequestParams, SRC20TrxRequestParams } from "globals";
import {
  PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  Src20BalanceResponseBody,
  Src20ResponseBody,
  Src20SnapShotDetail,
  SRC20SnapshotRequestParams,
  Src20SnapshotResponseBody,
} from "globals";
import { BIG_LIMIT } from "utils/constants.ts";
import { formatSRC20Row } from "utils/src20Utils.ts";
import { paginate } from "utils/util.ts";
import { Big } from "$Big";
export class Src20Service {
  static async getTotalCountValidSrc20Tx(params: {
    tick?: string;
    op?: string;
  }): Promise<number> {
    const result = await SRC20Repository.getTotalCountValidSrc20TxFromDb(
      params,
    );
    return result.rows[0].total;
  }

  static async fetchAndFormatSrc20Data(
    params: SRC20TrxRequestParams = {},
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

      const queryParams: SRC20TrxRequestParams = {
        ...sanitizedParams,
        tick: Array.isArray(sanitizedParams.tick)
          ? sanitizedParams.tick[0]
          : sanitizedParams.tick,
        limit: sanitizedParams.limit || BIG_LIMIT,
        page: sanitizedParams.page || 1,
        sort: sanitizedParams.sort || "ASC",
      };

      // Remove the op property if it's undefined
      if (queryParams.op === undefined) {
        delete queryParams.op;
      }

      const [data, totalResult, lastBlock] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(queryParams),
        SRC20Repository.getTotalCountValidSrc20TxFromDb(queryParams),
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
          last_block: lastBlock.last_block,
          data: formattedData[0],
        };
      }

      return {
        ...pagination,
        last_block: lastBlock.last_block,
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
      const params: SRC20TrxRequestParams = {
        tick,
        op: ["DEPLOY", "MINT", "TRANSFER"],
        sort: "DESC",
      };

      const result = await SRC20Repository.getValidSrc20TxFromDb(params);

      const deployment = result.rows.find((row) => row.op === "DEPLOY");
      const mints = result.rows.filter((row) => row.op === "MINT");
      const transfers = result.rows.filter((row) => row.op === "TRANSFER");

      return { deployment, mints, transfers };
    } catch (error) {
      console.error("Error in fetchAllSrc20DataForTick:", error);
      throw error;
    }
  }

  static async fetchSrc20Balance(
    params: SRC20BalanceRequestParams,
  ): Promise<Src20BalanceResponseBody> {
    try {
      const [src20, lastBlock, totalCount] = await Promise.all([
        SRC20Repository.getSrc20BalanceFromDb(params),
        BlockService.getLastBlock(),
        params.includePagination
          ? SRC20Repository.getTotalSrc20BalanceCount(params)
          : Promise.resolve(0),
      ]);

      if (!src20 || (Array.isArray(src20) && src20.length === 0)) {
        throw new Error("SRC20 balance not found");
      }

      const response: Src20BalanceResponseBody = {
        last_block: lastBlock.last_block,
        data: params.address && params.tick ? src20[0] : src20,
      };

      if (params.includePagination) {
        response.pagination = {
          page: params.page || 1,
          limit: params.limit || 10,
          total: totalCount,
          totalPages: Math.ceil(totalCount / (params.limit || 10)),
        };
      }

      return response;
    } catch (error) {
      console.error("Error in fetchSrc20Balance:", error);
      console.error("Params:", params);
      throw error;
    }
  }

  static async fetchAndFormatSrc20Snapshot(
    params: SRC20SnapshotRequestParams,
  ): Promise<Src20SnapshotResponseBody> {
    try {
      const balanceParams: SRC20BalanceRequestParams = {
        tick: params.tick,
        amt: params.amt || 0,
        limit: params.limit,
        page: params.page,
        sort: params.sort || "DESC",
        includePagination: true,
      };

      const [balanceResponse, lastBlock] = await Promise.all([
        this.fetchSrc20Balance(balanceParams),
        BlockService.getLastBlock(),
      ]);

      const snapshotData = balanceResponse.data.map((row) => ({
        tick: row.tick,
        address: row.address,
        balance: row.amt, // Assuming 'amt' is the balance field
      }));

      return {
        page: balanceResponse.pagination?.page || params.page,
        limit: balanceResponse.pagination?.limit || params.limit,
        totalPages: balanceResponse.pagination?.totalPages || 1,
        total: balanceResponse.pagination?.total || snapshotData.length,
        snapshot_block: lastBlock.last_block,
        data: snapshotData,
      };
    } catch (error) {
      console.error("Error in fetchAndFormatSrc20Snapshot:", error);
      throw error;
    }
  }

  static async getSrc20MintProgressByTick(tick: string) {
    return await SRC20Repository.getSrc20MintProgressByTickFromDb(tick);
  }

  private static mapTransactionData(rows: any[]) {
    return rows.map(formatSRC20Row);
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

  private static formatBalanceResponse(
    rows: any[],
    total: number,
    lastBlock: any,
    params: SRC20BalanceRequestParams,
  ): PaginatedSrc20BalanceResponseBody {
    return {
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
      total,
      last_block: lastBlock.last_block,
      data: rows.map((row: { tick: string; address: string; amt: number }) => ({
        tick: row.tick,
        address: row.address,
        balance: row.amt,
      })),
    };
  }

  static async checkMintedOut(tick: string, amount: string) {
    const mint_status = await SRC20Repository.getSrc20MintProgressByTickFromDb(
      tick,
    );
    if (!mint_status) {
      throw new Error("Tick not found");
    }
    const { max_supply, total_minted } = mint_status;
    const isMintedOut = new Big(total_minted).plus(amount).gt(max_supply);
    return { ...mint_status, minted_out: isMintedOut };
  }
}
