import { serverConfig } from "$server/config/config.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { bigFloatToString } from "$lib/utils/formatUtils.ts";
import { SRC20_BALANCE_TABLE, SRC20_TABLE } from "$lib/utils/constants.ts";
import {
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "$globals";
import { SRC20BalanceRequestParams } from "$lib/types/src20.d.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { emojiToUnicodeEscape, unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";

export class SRC20Repository {
  /**
   * Ensures a tick is in unicode escape format for DB operations
   * Accepts either emoji or unicode escape format and returns unicode escape
   */
  private static ensureUnicodeEscape(tick: string): string {
    if (!tick) return tick;
    // If it starts with \U and has valid format, assume it's already unicode escape
    if (tick.startsWith('\\U') && /^\\U[0-9A-F]{8}$/.test(tick)) {
      return tick;
    }
    return emojiToUnicodeEscape(tick);
  }

  /**
   * Converts DB response ticks to emoji format
   * @param data Object or array containing tick field(s)
   */
  private static convertResponseToEmoji<T extends { tick: string }>(data: T[]): T[] {
    return data.map(item => ({
      ...item,
      tick: unicodeEscapeToEmoji(item.tick)
    }));
  }

  /**
   * Converts a single DB response row to emoji format
   * @param row Object containing tick field
   */
  private static convertSingleResponseToEmoji<T extends { tick: string }>(row: T | null): T | null {
    if (!row) return null;
    return {
      ...row,
      tick: unicodeEscapeToEmoji(row.tick)
    };
  }

  static async getTotalCountValidSrc20TxFromDb(
    params: SRC20TrxRequestParams,
    excludeFullyMinted: boolean = false,
  ) {
    const {
      tick = null,
      op = null,
      block_index = null,
      tx_hash = null,
      address = null,
    } = params;

    const queryParams = [];
    const whereConditions = [];

    if (tick !== null) {
      if (Array.isArray(tick)) {
        whereConditions.push(
          `tick IN (${tick.map(() => "?").join(", ")})`,
        );
        queryParams.push(...tick.map(t => this.ensureUnicodeEscape(t)));
      } else {
        whereConditions.push(`tick = ?`);
        queryParams.push(this.ensureUnicodeEscape(tick));
      }
    }

    if (op !== null) {
      if (Array.isArray(op)) {
        whereConditions.push(`op IN (${op.map(() => "?").join(", ")})`);
        queryParams.push(...op.map(o => this.ensureUnicodeEscape(o)));
      } else {
        whereConditions.push(`op = ?`);
        queryParams.push(this.ensureUnicodeEscape(op));
      }
    }

    if (block_index !== null) {
      whereConditions.push(`block_index = ?`);
      queryParams.push(block_index);
    }

    if (address !== null) {
      whereConditions.push(`address = ?`);
      queryParams.push(address);
    }

    if (tx_hash !== null) {
      whereConditions.push(`tx_hash = ?`);
      queryParams.push(tx_hash);
    }

    // Additional condition to exclude fully minted tokens
    if (excludeFullyMinted) {
      whereConditions.push(
        `(SELECT COALESCE(SUM(amt), 0) FROM ${SRC20_BALANCE_TABLE} WHERE tick = src20.tick) < src20.max`,
      );
    }

    let sqlQuery = `
          SELECT COUNT(*) AS total
          FROM ${SRC20_TABLE} src20
      `;

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ` + whereConditions.join(" AND ");
    }

    return await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    );
  }

  static async getValidSrc20TxFromDb(
    params: SRC20TrxRequestParams,
    excludeFullyMinted: boolean = false,
  ) {
    const {
      block_index,
      tick,
      op,
      limit = 50, // Default limit
      page = 1, // Default page
      sortBy = "ASC",
      filterBy,
      tx_hash,
      address,
    } = params;

    const queryParams = [];
    const whereClauses = [];

    if (block_index !== undefined) {
      whereClauses.push(`src20.block_index = ?`);
      queryParams.push(block_index);
    }

    if (tick !== undefined) {
      if (Array.isArray(tick)) {
        whereClauses.push(`src20.tick IN (${tick.map(() => "?").join(", ")})`);
        queryParams.push(...tick.map(t => this.ensureUnicodeEscape(t)));
      } else {
        whereClauses.push(`src20.tick = ?`);
        queryParams.push(this.ensureUnicodeEscape(tick));
      }
    }

    if (op !== undefined) {
      if (Array.isArray(op)) {
        whereClauses.push(`src20.op IN (${op.map(() => "?").join(", ")})`);
        queryParams.push(...op.map(o => this.ensureUnicodeEscape(o)));
      } else {
        whereClauses.push(`src20.op = ?`);
        queryParams.push(this.ensureUnicodeEscape(op));
      }
    }

    if (tx_hash !== undefined) {
      whereClauses.push(`src20.tx_hash = ?`);
      queryParams.push(tx_hash);
    }

    if (address !== undefined) {
      whereClauses.push(`(src20.creator = ? OR src20.destination = ?)`);
      queryParams.push(address, address);
    }

    if (excludeFullyMinted) {
      whereClauses.push(
        `(SELECT COALESCE(SUM(amt), 0) FROM ${SRC20_BALANCE_TABLE} WHERE tick = src20.tick) < src20.max`,
      );
    }

    // Enforce limit and pagination
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Number(limit)
      : 50; // Default limit if invalid
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0
      ? Math.max(1, Number(page))
      : 1;
    const offset = safeLimit * (safePage - 1);

    const validOrder = ["ASC", "DESC"].includes(sortBy.toUpperCase())
      ? sortBy.toUpperCase()
      : "ASC";

    const rowNumberInit = offset;
    const limitOffsetClause = `LIMIT ? OFFSET ?`;
    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    queryParams.push(safeLimit, offset);

    try {
      const query = `
        WITH base_query AS (
          SELECT 
            (@row_number:=@row_number + 1) AS row_num,
            src20.tx_hash,
            src20.block_index,
            src20.p,
            src20.op,
            src20.tick,
            src20.creator,
            src20.amt,
            src20.deci,
            src20.lim,
            src20.max,
            src20.destination,
            src20.block_time,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
          FROM ${SRC20_TABLE} src20
          LEFT JOIN creator creator_info ON src20.creator = creator_info.address
          LEFT JOIN creator destination_info ON src20.destination = destination_info.address
          CROSS JOIN (SELECT @row_number := ?) AS init
          ${whereClause}
          ORDER BY src20.block_index ${validOrder}
        ),
        holders AS (
          SELECT 
            tick,
            COUNT(DISTINCT address) as holders
          FROM ${SRC20_BALANCE_TABLE}
          WHERE amt > 0
          GROUP BY tick
        ),
        mint_progress AS (
          SELECT
            dep.tick,
            dep.max,
            COALESCE((
                SELECT SUM(amt) FROM balances WHERE tick = dep.tick
            ), 0) AS total_minted,
            ROUND(
                COALESCE((
                    SELECT SUM(amt) FROM balances WHERE tick = dep.tick
                ), 0) / dep.max * 100, 2
            ) AS progress
          FROM SRC20Valid dep
          WHERE dep.op = 'DEPLOY'
        )
        SELECT 
          b.row_num,
          b.tx_hash,
          b.block_index,
          b.p,
          b.op,
          b.tick,
          b.creator,
          b.amt,
          b.deci,
          b.lim,
          b.max,
          b.destination,
          b.block_time,
          b.creator_name,
          b.destination_name,
          h.holders,
          mp.progress
        FROM base_query b
        LEFT JOIN holders h ON h.tick = b.tick
        LEFT JOIN mint_progress mp ON mp.tick = b.tick
        ${limitOffsetClause}
      `;

      const fullQueryParams = [rowNumberInit, ...queryParams];

      const results = await dbManager.executeQueryWithCache(
        query,
        fullQueryParams,
        1000 * 60 * 5, // Cache duration
      );

      // Convert response ticks to emoji format
      return {
        ...results,
        rows: this.convertResponseToEmoji(results.rows)
      };
    } catch (error) {
      console.error("Error in getValidSrc20TxFromDb:", error);
      throw error;
    }
  }

  static async getSrc20BalanceFromDb(
    params: Partial<SRC20BalanceRequestParams & SRC20SnapshotRequestParams>,
  ) {
    const {
      address,
      tick,
      limit,
      page,
      sortBy = "DESC",
      sortField = "amt",
    } = params;
    const queryParams = [];
    const whereClauses = [];
    whereClauses.push(`amt > 0`);

    if (address) {
      whereClauses.push(`address = ?`);
      queryParams.push(address);
    }

    if (tick) {
      if (Array.isArray(tick)) {
        const tickPlaceholders = tick.map(() => "?").join(", ");
        whereClauses.push(
          `tick IN (${tickPlaceholders})`,
        );
        queryParams.push(...tick.map(t => this.ensureUnicodeEscape(t)));
      } else {
        whereClauses.push(`tick = ?`);
        queryParams.push(this.ensureUnicodeEscape(tick));
      }
    }

    // Assign default values and validate limit and page
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Number(limit)
      : 50; // Default limit
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0
      ? Math.max(1, Number(page))
      : 1;
    const offset = safeLimit * (safePage - 1);

    const limitOffsetClause = "LIMIT ? OFFSET ?";
    queryParams.push(safeLimit, offset);

    const validOrder = ["ASC", "DESC"].includes(sortBy.toUpperCase())
      ? sortBy.toUpperCase()
      : "DESC";

    const validSortField = ["amt", "last_update"].includes(sortField)
      ? sortField
      : "amt";

    const sqlQuery = `
      SELECT address, p, tick, amt, block_time, last_update
      FROM ${SRC20_BALANCE_TABLE}
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY ${validSortField} ${validOrder}
      ${limitOffsetClause}
    `;

    const results = await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration
    );

    // Retrieve transaction hashes for the ticks
    const ticksToQuery = results.rows
      ? results.rows.map((result: { tick: string }) => result.tick)
      : [];
    const tx_hashes_response = await SRC20Repository.getValidSrc20TxFromDb(
      {
        tick: ticksToQuery.length > 0 ? ticksToQuery : undefined,
        op: "DEPLOY",
      },
    );
    const tx_hashes_map = tx_hashes_response.rows.reduce(
      (map: Record<string, string>, row: { tick: string; tx_hash: string }) => {
        map[row.tick] = row.tx_hash;
        return map;
      },
      {},
    );

    // Add transaction hash and deploy image URL to each result
    const resultsWithDeployImg = results.rows.map((
      result: { tick: string },
    ) => ({
      ...result,
      deploy_tx: tx_hashes_map[result.tick],
      deploy_img: `${serverConfig.IMAGES_SRC_PATH}/${
        tx_hashes_map[result.tick]
      }.svg`,
    }));

    return resultsWithDeployImg;
  }

  static async getTotalSrc20BalanceCount(
    params: Partial<SRC20BalanceRequestParams & SRC20SnapshotRequestParams>,
  ): Promise<number> {
    const { address, tick, amt = 0 } = params;
    const queryParams = [];
    const whereConditions = [];

    if (address) {
      whereConditions.push(`address = ?`);
      queryParams.push(address);
    }

    if (tick) {
      if (Array.isArray(tick)) {
        const tickPlaceholders = tick.map(() => "?").join(", ");
        whereConditions.push(
          `tick IN (${tickPlaceholders})`,
        );
        queryParams.push(...tick.map(t => this.ensureUnicodeEscape(t)));
      } else {
        whereConditions.push(`tick = ?`);
        queryParams.push(this.ensureUnicodeEscape(tick));
      }
    }

    // Always include amt condition, as in the original method
    whereConditions.push(`amt > ?`);
    queryParams.push(amt);

    const sqlQuery = `
          SELECT COUNT(*) AS total
          FROM ${SRC20_BALANCE_TABLE}
          ${
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""
    }
        `;

    const result = await dbManager.executeQueryWithCache(
      sqlQuery,
      queryParams,
      1000 * 60 * 2, // Cache duration: 2 minutes
    );

    return result.rows[0].total;
  }

  static async fetchSrc20MintProgress(tick: string) {
    const unicodeTick = this.ensureUnicodeEscape(tick);
    const query = `
      SELECT 
        dep.max,
        dep.deci,
        dep.lim,
        dep.tx_hash,
        dep.tick,
        COALESCE(stats.total_minted, 0) as total_minted,
        COALESCE(stats.holders_count, 0) as holders_count,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = dep.tick AND op = 'MINT') AS total_mints
      FROM ${SRC20_TABLE} AS dep
      LEFT JOIN src20_token_stats stats ON stats.tick = dep.tick
      WHERE 
        dep.tick = ? AND
        dep.op = 'DEPLOY'
      LIMIT 1;
    `;

    const data = await dbManager.executeQueryWithCache(
      query,
      [unicodeTick],
      1000 * 60 * 2,
    );

    if (data.rows.length === 0) {
      return null;
    }

    const row = data.rows[0];
    const max_supply = new BigFloat(row["max"]);
    const limit = new BigFloat(row["lim"]);
    const decimals = parseInt(row["deci"]);
    const total_mints = parseInt(row["total_mints"] ?? 0);
    const total_minted = new BigFloat(row["total_minted"] ?? 0);
    const progress = bigFloatToString(total_minted.div(max_supply).mul(100), 3);

    return this.convertSingleResponseToEmoji({
      max_supply: max_supply.toString(),
      total_minted: total_minted.toString(),
      limit: limit.toString(),
      total_mints: total_mints,
      progress,
      decimals,
      holders: row["holders_count"],
      tx_hash: row["tx_hash"],
      tick: row["tick"],
    });
  }

  static async fetchTrendingActiveMintingTokens(
    transactionCount: number = 1000,
  ) {
    const query = `
      WITH latest_mint_transactions AS (
        SELECT tx_index, tick
        FROM ${SRC20_TABLE}
        WHERE op = 'MINT'
        ORDER BY tx_index DESC
        LIMIT ?
      ),
      mint_counts AS (
        SELECT tick, COUNT(*) as mint_count,
               (COUNT(*) * 100.0 / ?) as top_mints_percentage
        FROM latest_mint_transactions
        GROUP BY tick
      )
      SELECT
        'data' as type,
        mc.tick,
        mc.mint_count,
        mc.top_mints_percentage,
        src20_deploy.tx_hash,
        src20_deploy.block_index,
        src20_deploy.p,
        src20_deploy.op,
        src20_deploy.creator,
        src20_deploy.amt,
        src20_deploy.deci,
        src20_deploy.lim,
        src20_deploy.max,
        src20_deploy.destination,
        src20_deploy.block_time,
        creator_info.creator as creator_name,
        COALESCE(stats.holders_count, 0) as holders,
        COALESCE(stats.total_minted, 0) as total_minted
      FROM mint_counts mc
      JOIN ${SRC20_TABLE} src20_deploy ON mc.tick = src20_deploy.tick AND src20_deploy.op = 'DEPLOY'
      LEFT JOIN creator creator_info ON src20_deploy.creator = creator_info.address
      LEFT JOIN src20_token_stats stats ON stats.tick = mc.tick
      WHERE COALESCE(stats.total_minted, 0) < src20_deploy.max
      ORDER BY mc.mint_count DESC;
    `;
    const queryParams = [
      transactionCount, // Number of recent mint transactions to consider
      transactionCount, // For top_mints_percentage calculation
    ];
    const results = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 10, // Cache duration
    );
    
    return {
      rows: this.convertResponseToEmoji(results.rows),
      total: results.rows.length
    };
  }

  static async getDeploymentAndCountsForTick(tick: string) {
    const unicodeTick = this.ensureUnicodeEscape(tick);
    const query = `
      SELECT 
        dep.*,
        creator_info.creator AS creator_name,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'MINT') AS total_mints,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'TRANSFER') AS total_transfers
      FROM ${SRC20_TABLE} dep
      LEFT JOIN 
        creator creator_info ON dep.destination = creator_info.address
      WHERE dep.tick = ? AND dep.op = 'DEPLOY'
      LIMIT 1
    `;
    const params = [unicodeTick, unicodeTick, unicodeTick];
    const result = await dbManager.executeQueryWithCache(
      query,
      params,
      1000 * 60 * 10,
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      deployment: this.convertSingleResponseToEmoji({
        tick: row.tick,
        tx_hash: row.tx_hash,
        block_index: row.block_index,
        p: row.p,
        op: row.op,
        creator: row.creator,
        creator_name: row.creator_name,
        amt: row.amt,
        deci: row.deci,
        lim: row.lim,
        max: row.max,
        destination: row.destination,
        block_time: row.block_time,
      }),
      total_mints: row.total_mints,
      total_transfers: row.total_transfers,
    };
  }

  static async getCountsForTick(tick: string) {
    const unicodeTick = this.ensureUnicodeEscape(tick);
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'MINT') AS total_mints,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'TRANSFER') AS total_transfers
    `;
    const params = [unicodeTick, unicodeTick];
    const result = await dbManager.executeQueryWithCache(
      query,
      params,
      1000 * 60 * 2, // Cache duration
    );

    if (!result.rows || result.rows.length === 0) {
      return { total_mints: 0, total_transfers: 0 };
    }

    return {
      total_mints: result.rows[0].total_mints,
      total_transfers: result.rows[0].total_transfers,
    };
  }

  static async searchValidSrc20TxFromDb(query: string) {
    const sanitizedQuery = query.replace(/[^\w-]/g, "");

    const sqlQuery = `
    SELECT DISTINCT
        tick,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = dep.tick AND op = 'MINT') AS total_mints,
        (SELECT COALESCE(SUM(amt), 0) FROM ${SRC20_BALANCE_TABLE} WHERE tick = dep.tick) AS total_minted,
        dep.max AS max_supply,
        dep.lim AS lim,
        dep.deci AS decimals
    FROM ${SRC20_TABLE} dep
    WHERE
        (tick LIKE ? OR
        tx_hash LIKE ? OR
        creator LIKE ? OR
        destination LIKE ?)
        AND dep.max IS NOT NULL
    ORDER BY
        CASE
            WHEN tick LIKE ? THEN 0
            ELSE 1
        END,
        tick
    LIMIT 10;
    `;

    const searchParam = `%${sanitizedQuery}%`;
    const startSearchParam = `${sanitizedQuery}%`;
    const queryParams = [searchParam, searchParam, searchParam, searchParam, startSearchParam];

    try {
      const result = await dbManager.executeQueryWithCache(
        sqlQuery,
        queryParams,
        1000 * 60 * 2 // Cache duration: 2 minutes
      );

      return this.convertResponseToEmoji(result.rows.map((row: any) => {
        const maxSupply = new BigFloat(row?.max_supply || "1");
        const totalMinted = new BigFloat(row.total_minted || "0");
        const progress = bigFloatToString(totalMinted.div(maxSupply).mul(100), 3);
        const progressNum = parseFloat(progress);

        return {
          tick: row.tick,
          progress: progressNum,
          total_minted: row.total_minted,
          max_supply: row.max_supply
        };
      }).filter(Boolean)); // Remove null entries
    } catch (error) {
      console.error("Error executing query:", error);
      return [];
    }
  }

  static async checkSrc20Deployments(): Promise<{ isValid: boolean; count: number }> {
    try {
      const result = await this.getTotalCountValidSrc20TxFromDb({
        op: "DEPLOY"
      });
      
      // If we can't get a count or it's 0, that indicates a database problem
      if (!result?.rows?.[0]?.total) {
        throw new Error("No SRC-20 deployments found in database");
      }
      const count = result.rows[0].total;
      return {
        isValid: true,
        count
      };
    } catch (error) {
      console.error("SRC20 deployment check failed:", error);
      return {
        isValid: false,
        count: 0
      };
    }
  }
}
