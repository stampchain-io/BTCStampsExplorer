import { withDatabaseClient } from "./databaseService.ts";
import { SRC20Repository } from "../database/src20Repository.ts";
import { BlockService } from "./blockService.ts";
import { SRC20BalanceRequestParams, SRC20TrxRequestParams } from "globals";
import {
  PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  Src20BalanceResponseBody,
  Src20SnapShotDetail,
  SRC20SnapshotRequestParams,
  Src20SnapshotResponseBody,
} from "globals";
import { convertToEmoji, paginate } from "utils/util.ts";
import { BIG_LIMIT } from "utils/constants.ts";

export class Src20Service {
  static async getSrc20s(page = 1, page_size = BIG_LIMIT) {
    return await withDatabaseClient(async (client) => {
      const [data, total, lastBlock] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(
          client,
          null,
          null,
          "DEPLOY",
          page_size,
          page,
        ),
        SRC20Repository.getTotalCountValidSrc20TxFromDb(client, null, "DEPLOY"),
        BlockService.getLastBlock(),
      ]);

      return {
        src20s: data,
        total: total.rows[0].total,
        pages: Math.ceil(total.rows[0].total / page_size),
        page: page,
        page_size: page_size,
        last_block: lastBlock.last_block,
      };
    });
  }
  static async fetchAndFormatSrc20Transactions(
    params: SRC20TrxRequestParams,
  ): Promise<PaginatedSrc20ResponseBody> {
    return await withDatabaseClient(async (client) => {
      try {
        // Sanitize string parameters
        const sanitizedParams = {
          ...params,
          tick: params.tick ? params.tick.replace(/[^\w-]/g, "") : params.tick,
          op: params.op ? params.op.replace(/[^\w-]/g, "") : params.op,
          tx_hash: params.tx_hash
            ? params.tx_hash.replace(/[^\w-]/g, "")
            : params.tx_hash,
        };

        const [valid_src20_txs_in_block, totalResult, lastBlock] = await Promise
          .all([
            SRC20Repository.getValidSrc20TxFromDb(client, sanitizedParams),
            SRC20Repository.getTotalCountValidSrc20TxFromDb(
              client,
              sanitizedParams,
            ),
            BlockService.getLastBlock(),
          ]);

        const total = totalResult.rows[0]["total"];
        const pagination = paginate(total, params.page, params.limit);

        const mappedData = this.mapTransactionData(
          valid_src20_txs_in_block.rows,
        );

        return {
          ...pagination,
          last_block: lastBlock.last_block,
          data: this.formatTransactionData(mappedData, params),
        };
      } catch (error) {
        console.error("Error in fetchAndFormatSrc20Transactions:", error);
        if (error.message.includes("Stamps Down")) {
          throw new Error("Stamps Down...");
        }
        throw error;
      }
    });
  }

  static async fetchSrc20Data(params: Partial<SRC20TrxRequestParams> = {}) {
    return await withDatabaseClient(async (client) => {
      try {
        const isDeployQuery = !params.op && !params.block_index &&
          !params.tx_hash;
        const queryParams = isDeployQuery
          ? {
            op: "DEPLOY",
            limit: params.limit || BIG_LIMIT,
            page: params.page || 1,
          }
          : params;

        const [data, totalResult, lastBlock] = await Promise.all([
          SRC20Repository.getValidSrc20TxFromDb(client, queryParams),
          SRC20Repository.getTotalCountValidSrc20TxFromDb(client, queryParams),
          BlockService.getLastBlock(),
        ]);

        const total = totalResult.rows[0].total;
        const pagination = paginate(total, queryParams.page, queryParams.limit);

        const mappedData = this.mapTransactionData(data.rows);

        const formattedData = isDeployQuery
          ? { src20s: mappedData }
          : { data: this.formatTransactionData(mappedData, queryParams) };

        return {
          ...pagination,
          ...formattedData,
          last_block: lastBlock.last_block,
        };
      } catch (error) {
        console.error("Error in fetchSrc20Data:", error);
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
    return rows.map((tx: any) => ({
      ...tx,
      tick: convertToEmoji(tx.tick),
      amt: tx.amt ? tx.amt.toString() : null,
      lim: tx.lim ? tx.lim.toString() : null,
      max: tx.max ? tx.max.toString() : null,
    }));
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
