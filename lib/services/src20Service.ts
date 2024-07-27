import { withDatabaseClient } from "$lib/services/databaseService.ts";
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
    return await withDatabaseClient(async (client) => {
      const result = await SRC20Repository.getTotalCountValidSrc20TxFromDb(
        client,
        params,
      );
      return result.rows[0].total;
    });
  }

  static async fetchAndFormatSrc20Data(
    params: SRC20TrxRequestParams = {},
  ): Promise<PaginatedSrc20ResponseBody | Src20ResponseBody> {
    return await withDatabaseClient(async (client) => {
      try {
        // Sanitize string parameters
        const sanitizedParams = {
          ...params,
          tick: params.tick
            ? (Array.isArray(params.tick)
              ? params.tick.map((t) => t.replace(/[^\w-]/g, ""))
              : params.tick.replace(/[^\w-]/g, ""))
            : params.tick,
          op: params.op ? params.op.replace(/[^\w-]/g, "") : params.op,
          tx_hash: params.tx_hash
            ? params.tx_hash.replace(/[^\w-]/g, "")
            : params.tx_hash,
        };

        const isDeployQuery = !sanitizedParams.op &&
          !sanitizedParams.block_index && !sanitizedParams.tx_hash;
        const queryParams: SRC20TrxRequestParams = {
          ...sanitizedParams,
          op: isDeployQuery ? "DEPLOY" : sanitizedParams.op,
          tick: Array.isArray(sanitizedParams.tick)
            ? sanitizedParams.tick[0]
            : sanitizedParams.tick,
          limit: sanitizedParams.limit || BIG_LIMIT,
          page: sanitizedParams.page || 1,
          sort: sanitizedParams.sort || "ASC",
        };

        // Ensure we're querying for DEPLOY operations
        if (isDeployQuery || queryParams.op === "DEPLOY") {
          queryParams.op = "DEPLOY";
        }

        const [data, totalResult, lastBlock] = await Promise.all([
          SRC20Repository.getValidSrc20TxFromDb(client, queryParams),
          SRC20Repository.getTotalCountValidSrc20TxFromDb(client, queryParams),
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
    });
  }

  static async fetchAndFormatSrc20Balance(
    params: SRC20BalanceRequestParams,
  ): Promise<Src20BalanceResponseBody> {
    return await withDatabaseClient(async (client) => {
      try {
        const [src20, lastBlock] = await Promise.all([
          SRC20Repository.getSrc20BalanceFromDb(client, params),
          BlockService.getLastBlock(),
        ]);

        if (!src20) {
          throw new Error("SRC20 balance not found");
        }

        return {
          last_block: lastBlock.last_block,
          data: src20,
        };
      } catch (error) {
        console.error("Error in fetchAndFormatSrc20Balance:", error);
        console.error("Params:", params);
        throw error;
      }
    });
  }

  static async fetchAndFormatSrc20Snapshot(
    params: SRC20SnapshotRequestParams,
  ): Promise<Src20SnapshotResponseBody> {
    return await withDatabaseClient(async (client) => {
      const [src20, lastBlock, total] = await Promise.all([
        SRC20Repository.getSrc20BalanceFromDb(client, params),
        BlockService.getLastBlock(),
        SRC20Repository.getTotalSrc20HoldersByTick(
          client,
          params.tick,
          params.amt,
        ),
      ]);

      const data = src20.map((row: Src20SnapShotDetail) => ({
        tick: row.tick,
        address: row.address,
        balance: new Big(row.amt),
      })).sort((a, b) => b.balance.cmp(a.balance));

      return {
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total.rows[0].total / params.limit),
        total: total.rows[0].total,
        snapshot_block: lastBlock.last_block,
        data,
      };
    });
  }

  static async getSrc20MintProgressByTick(tick: string) {
    return await withDatabaseClient(async (client) => {
      return await SRC20Repository.getSrc20MintProgressByTickFromDb(
        client,
        tick,
      );
    });
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
}
