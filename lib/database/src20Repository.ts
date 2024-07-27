import { handleSqlQueryWithCache } from "utils/cache.ts";
import { Client } from "$mysql/mod.ts";
import { conf } from "utils/config.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { bigFloatToString } from "utils/util.ts";
import {
  BIG_LIMIT,
  SRC20_BALANCE_TABLE,
  SRC20_TABLE,
} from "utils/constants.ts";
import {
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "globals";

export class SRC20Repository {
  static async getTotalCountValidSrc20TxFromDb(
    client: Client,
    params: SRC20TrxRequestParams,
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
      whereConditions.push(`tick COLLATE utf8mb4_0900_as_ci = ?`);
      queryParams.push(tick);
    }

    if (op !== null) {
      whereConditions.push(`op = ?`);
      queryParams.push(op);
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

    let sqlQuery = `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
    `;

    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ` + whereConditions.join(" AND ");
    }

    return await handleSqlQueryWithCache(
      client,
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    );
  }

  static async getValidSrc20TxFromDb(
    client: Client,
    params: SRC20TrxRequestParams,
  ) {
    const {
      block_index,
      tick,
      op,
      limit = BIG_LIMIT,
      page = 1,
      sort = "ASC",
      tx_hash,
      address,
    } = params;

    const queryParams = [];
    const whereConditions = [];

    if (block_index !== undefined) {
      whereConditions.push(`src20.block_index = ?`);
      queryParams.push(block_index);
    }

    if (tick !== undefined) {
      if (Array.isArray(tick)) {
        const tickPlaceholders = tick.map(() => "?").join(", ");
        whereConditions.push(
          `src20.tick COLLATE utf8mb4_0900_as_ci IN (${tickPlaceholders})`,
        );
        queryParams.push(...tick);
      } else {
        whereConditions.push(`src20.tick COLLATE utf8mb4_0900_as_ci = ?`);
        queryParams.push(tick);
      }
    }

    if (op !== undefined) {
      whereConditions.push(`src20.op = ?`);
      queryParams.push(op);
    }

    if (tx_hash !== undefined) {
      whereConditions.push(`src20.tx_hash = ?`);
      queryParams.push(tx_hash);
    }

    if (address !== undefined) {
      whereConditions.push(`(src20.creator = ? OR src20.destination = ?)`);
      queryParams.push(address, address);
    }
    const safePage = Math.max(1, Number(page));
    const safeLimit = Number(limit) || BIG_LIMIT;
    const offset = safeLimit * (safePage - 1);

    const validOrder = ["ASC", "DESC"].includes(sort.toUpperCase())
      ? sort.toUpperCase()
      : "ASC";

    const sqlQuery = `
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
      ${
      whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : ""
    }
      ORDER BY 
        src20.tx_index ${validOrder}
      LIMIT ? OFFSET ?;
    `;

    queryParams.unshift(offset);

    queryParams.push(safeLimit, offset);

    return await handleSqlQueryWithCache(
      client,
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    );
  }

  static async getSrc20BalanceFromDb(
    client: Client,
    params: Partial<SRC20BalanceRequestParams & SRC20SnapshotRequestParams>,
  ) {
    const { address, tick, amt, limit, page, sort: sortBy = "ASC" } = params;
    const queryParams = [];
    const whereClauses = [];

    if (address) {
      whereClauses.push(`address = ?`);
      queryParams.push(address);
    }

    if (tick) {
      if (Array.isArray(tick)) {
        const tickPlaceholders = tick.map(() => "?").join(", ");
        whereClauses.push(
          `tick COLLATE utf8mb4_0900_as_ci IN (${tickPlaceholders})`,
        );
        queryParams.push(...tick);
      } else {
        whereClauses.push(`tick COLLATE utf8mb4_0900_as_ci = ?`);
        queryParams.push(tick);
      }
    }

    if (amt && amt > 0) {
      whereClauses.push(`amt > ?`);
      queryParams.push(amt);
    }

    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    if (limit) {
      queryParams.push(limit, offset);
    }

    const validOrder = ["ASC", "DESC"].includes(sortBy.toUpperCase())
      ? sortBy.toUpperCase()
      : "ASC";

    const sqlQuery = `
      SELECT address, p, tick, amt, block_time, last_update
      FROM ${SRC20_BALANCE_TABLE}
      ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""}
      ORDER BY last_update ${validOrder}
      ${limit ? `LIMIT ? OFFSET ?` : ""}
    `;

    const results = await handleSqlQueryWithCache(
      client,
      sqlQuery,
      queryParams,
      0, //1000 * 60 * 2, // Cache duration
    );

    // Retrieve transaction hashes for the ticks
    const ticksToQuery = results.rows
      ? results.rows.map((result: { tick: string }) => result.tick)
      : [];
    const tx_hashes_response = await SRC20Repository.getValidSrc20TxFromDb(
      client,
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
      deploy_img: `${conf.IMAGES_SRC_PATH}/${tx_hashes_map[result.tick]}.svg`,
    }));

    return resultsWithDeployImg;
  }

  static async getTotalSrc20HoldersByTick(
    client: Client,
    tick: string | null = null,
    amt = 0,
  ) {
    const queryParams = [];
    const whereConditions = [];

    if (tick !== null) {
      whereConditions.push(`tick COLLATE utf8mb4_0900_as_ci = ?`);
      queryParams.push(tick);
    }

    // Always include amt condition
    whereConditions.push(`amt > ?`);
    queryParams.push(amt);

    let sqlQuery = `
      SELECT COUNT(*) AS total
      FROM ${SRC20_BALANCE_TABLE}
    `;

    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ` + whereConditions.join(" AND ");
    }

    return await handleSqlQueryWithCache(
      client,
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    );
  }

  static async getSrc20MintProgressByTickFromDb(
    client: Client,
    tick: string,
  ) {
    const query = `
        SELECT 
            src.max,
            src.deci,
            src.lim,
            COUNT(CASE WHEN src.op = 'MINT' THEN 1 ELSE NULL END) as total_mints,
            SUM(CASE WHEN balance.tick COLLATE utf8mb4_0900_as_ci = '${tick}' THEN balance.amt ELSE 0 END) as total_minted
        FROM ${SRC20_TABLE} as src
            LEFT JOIN ${SRC20_BALANCE_TABLE} as balance ON src.tick = balance.tick
        WHERE 
            src.tick COLLATE utf8mb4_0900_as_ci = '${tick}'
            AND src.op = 'DEPLOY'
        GROUP BY 
            src.max, src.deci, src.lim;
    `;

    const data = await handleSqlQueryWithCache(client, query, [tick, tick], 0);

    if (data.rows.length === 0) {
      return null;
    }

    const row = data.rows[0];
    const max_supply = new BigFloat(row["max"]);
    const limit = new BigFloat(row["lim"]);
    const decimals = parseInt(row["deci"]);
    const total_mints = parseInt(row["total_mints"]);
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
}
