import { serverConfig } from "$server/config/config.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { bigFloatToString } from "utils/util.ts";
import { SRC20_BALANCE_TABLE, SRC20_TABLE } from "utils/constants.ts";
import {
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "globals";
import { dbManager } from "$server/database/db.ts";

export class SRC20Repository {
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
        queryParams.push(...tick);
      } else {
        whereConditions.push(`tick = ?`);
        queryParams.push(tick);
      }
    }

    if (op !== null) {
      if (Array.isArray(op)) {
        whereConditions.push(`op IN (${op.map(() => "?").join(", ")})`);
        queryParams.push(...op);
      } else {
        whereConditions.push(`op = ?`);
        queryParams.push(op);
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
        queryParams.push(...tick);
      } else {
        whereClauses.push(`src20.tick = ?`);
        queryParams.push(tick);
      }
    }

    if (op !== undefined) {
      if (Array.isArray(op)) {
        whereClauses.push(`src20.op IN (${op.map(() => "?").join(", ")})`);
        queryParams.push(...op);
      } else {
        whereClauses.push(`src20.op = ?`);
        queryParams.push(op);
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

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    // Enforce limit and pagination
    const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0
      ? Number(limit)
      : 50; // Default limit if invalid
    const safePage = Number.isFinite(Number(page)) && Number(page) > 0
      ? Math.max(1, Number(page))
      : 1;
    const offset = safeLimit * (safePage - 1);

    const limitOffsetClause = `LIMIT ? OFFSET ?`;
    queryParams.push(safeLimit, offset);

    const validOrder = ["ASC", "DESC"].includes(sortBy.toUpperCase())
      ? sortBy.toUpperCase()
      : "ASC";

    const rowNumberInit = offset;

    const query = `
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
      FROM
        ${SRC20_TABLE} src20
      LEFT JOIN 
        creator creator_info ON src20.creator = creator_info.address
      LEFT JOIN
        creator destination_info ON src20.destination = destination_info.address
      CROSS JOIN
        (SELECT @row_number := ?) AS init
      ${whereClause}
      ORDER BY 
        src20.tx_index ${validOrder}
      ${limitOffsetClause};
    `;

    const fullQueryParams = [rowNumberInit, ...queryParams];

    const results = await dbManager.executeQueryWithCache(
      query,
      fullQueryParams,
      1000 * 60 * 5, // Cache duration
    );

    return results;
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
        queryParams.push(...tick);
      } else {
        whereClauses.push(`tick = ?`);
        queryParams.push(tick);
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
        queryParams.push(...tick);
      } else {
        whereConditions.push(`tick = ?`);
        queryParams.push(tick);
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

  static async getSrc20MintProgressByTickFromDb(
    tick: string,
  ) {
    const query = `
        SELECT 
            dep.max,
            dep.deci,
            dep.lim,
            (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = dep.tick AND op = 'MINT') AS total_mints,
            (SELECT COALESCE(SUM(amt), 0) FROM ${SRC20_BALANCE_TABLE} WHERE tick = dep.tick) AS total_minted
        FROM ${SRC20_TABLE} AS dep
        WHERE 
            dep.tick = ? AND
            dep.op = 'DEPLOY'
        LIMIT 1;
    `;

    const data = await dbManager.executeQueryWithCache(
      query,
      [tick],
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

    const response = {
      max_supply: max_supply.toString(),
      total_minted: total_minted.toString(),
      limit: limit.toString(),
      total_mints: total_mints,
      progress,
      decimals,
    };

    return response;
  }

  static async getTrendingSrc20TxFromDb(
    limit: number,
    offset: number,
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
        SELECT tick, COUNT(*) as mint_count
        FROM latest_mint_transactions
        GROUP BY tick
      ),
      max_supply_data AS (
        SELECT tick, max
        FROM ${SRC20_TABLE}
        WHERE op = 'DEPLOY'
      ),
      total_minted_data AS (
        SELECT tick, SUM(amt) as total_minted
        FROM ${SRC20_BALANCE_TABLE}
        GROUP BY tick
      ),
      mint_status AS (
        SELECT
          msd.tick,
          msd.max,
          COALESCE(tmd.total_minted, 0) as total_minted
        FROM max_supply_data msd
        LEFT JOIN total_minted_data tmd ON msd.tick = tmd.tick
      )
      SELECT
        mc.tick,
        mc.mint_count,
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
        mint_status.total_minted,
        mint_status.max as max_supply,
        creator_info.creator as creator_name
      FROM mint_counts mc
      JOIN ${SRC20_TABLE} src20_deploy ON mc.tick = src20_deploy.tick AND src20_deploy.op = 'DEPLOY'
      JOIN mint_status ON mc.tick = mint_status.tick
      LEFT JOIN creator creator_info ON src20_deploy.creator = creator_info.address
      WHERE mint_status.total_minted < mint_status.max
      ORDER BY mc.mint_count DESC
      LIMIT ? OFFSET ?;
    `;
    const queryParams = [
      transactionCount, // Number of recent mint transactions to consider
      limit,
      offset,
    ];
    const results = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 2, // Cache duration
    );
    return results;
  }

  static async getTrendingSrc20TotalCount(transactionCount: number = 1000) {
    const query = `
      WITH latest_mint_transactions AS (
        SELECT tx_index, tick
        FROM ${SRC20_TABLE}
        WHERE op = 'MINT'
        ORDER BY tx_index DESC
        LIMIT ?
      ),
      mint_counts AS (
        SELECT tick, COUNT(*) as mint_count
        FROM latest_mint_transactions
        GROUP BY tick
      ),
      max_supply_data AS (
        SELECT tick, max
        FROM ${SRC20_TABLE}
        WHERE op = 'DEPLOY'
      ),
      total_minted_data AS (
        SELECT tick, SUM(amt) as total_minted
        FROM ${SRC20_BALANCE_TABLE}
        GROUP BY tick
      ),
      mint_status AS (
        SELECT
          msd.tick,
          msd.max,
          COALESCE(tmd.total_minted, 0) as total_minted
        FROM max_supply_data msd
        LEFT JOIN total_minted_data tmd ON msd.tick = tmd.tick
      )
      SELECT COUNT(*) as total
      FROM mint_counts mc
      JOIN mint_status ON mc.tick = mint_status.tick
      WHERE mint_status.total_minted < mint_status.max;
    `;
    const queryParams = [transactionCount];
    const results = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 2,
    );
    return results;
  }

  static async getCountsForTick(tick: string) {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'MINT') AS total_mints,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'TRANSFER') AS total_transfers
    `;
    const params = [tick, tick];
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

  static async getDeploymentAndCountsForTick(tick: string) {
    const query = `
      SELECT 
        dep.*,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'MINT') AS total_mints,
        (SELECT COUNT(*) FROM ${SRC20_TABLE} WHERE tick = ? AND op = 'TRANSFER') AS total_transfers
      FROM ${SRC20_TABLE} dep
      WHERE dep.tick = ? AND dep.op = 'DEPLOY'
      LIMIT 1
    `;
    const params = [tick, tick, tick];
    const result = await dbManager.executeQueryWithCache(
      query,
      params,
      1000 * 60 * 2, // Cache duration
    );

    if (!result.rows || result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      deployment: {
        // Map deployment fields from row
        tick: row.tick, // Ensure 'tick' is included
        tx_hash: row.tx_hash,
        block_index: row.block_index,
        p: row.p,
        op: row.op,
        creator: row.creator,
        amt: row.amt,
        deci: row.deci,
        lim: row.lim,
        max: row.max,
        destination: row.destination,
        block_time: row.block_time,
        // Include any other fields you need
      },
      total_mints: row.total_mints,
      total_transfers: row.total_transfers,
    };
  }
}
