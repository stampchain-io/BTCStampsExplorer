import { Client } from "$mysql/mod.ts";
import {
  BIG_LIMIT,
  SMALL_LIMIT,
  SRC20_BALANCE_TABLE,
  SRC20_TABLE,
} from "constants";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { conf } from "../../lib/utils/config.ts";

// NOTE: To compare tick use this ones below:
//  tick COLLATE utf8mb4_0900_as_ci = '${tick}'
//  tick = CONVERT('${tick}' USING utf8mb4) COLLATE utf8mb4_0900_as_ci
export class Src20Class {
  static async get_total_valid_src20_tx_with_client(
    client: Client,
    tick: string | null = null,
    op: string | null = null,
    block_index: number | null = null,
    tx_hash: string | null = null,
    address: string | null = null,
  ) {
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

  static async get_valid_src20_tx_with_client(
    client: Client,
    block_index: number | null = null,
    tick: string | string[] | null = null,
    op: string | null = null,
    limit = BIG_LIMIT,
    page = 0,
    sort = "ASC",
    tx_hash: string | null = null,
    address: string | null = null,
  ) {
    const queryParams = [];
    let whereClause = "";

    if (block_index !== null) {
      whereClause += `src20.block_index = ?`;
      queryParams.push(block_index);
    }

    if (tick !== null) {
      if (Array.isArray(tick)) {
        const tickPlaceholders = tick.map(() => "?").join(", ");
        whereClause += (whereClause ? " AND " : "") +
          `src20.tick COLLATE utf8mb4_0900_as_ci IN (${tickPlaceholders})`;
        queryParams.push(...tick);
      } else {
        whereClause += (whereClause ? " AND " : "") +
          `src20.tick COLLATE utf8mb4_0900_as_ci = ?`;
        queryParams.push(tick);
      }
    }

    if (op !== null) {
      whereClause += (whereClause ? " AND " : "") + `src20.op = ?`;
      queryParams.push(op);
    }

    if (tx_hash !== null) {
      whereClause += (whereClause ? " AND " : "") + `src20.tx_hash = ?`;
      queryParams.push(tx_hash);
    }

    if (address !== null) {
      whereClause += (whereClause ? " AND " : "") +
        `(src20.creator = ? OR src20.destination = ?)`;
      queryParams.push(address, address);
    }

    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    if (limit) {
      queryParams.push(limit, offset);
    }

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
      ${whereClause ? `WHERE ${whereClause}` : ""}
      ORDER BY 
        src20.tx_index ${validOrder}
      ${limit ? `LIMIT ? OFFSET ?` : ""};
    `;

    queryParams.unshift(offset);

    return await handleSqlQueryWithCache(
      client,
      sqlQuery,
      queryParams,
      1000 * 60 * 2,
    );
  }

  static async get_src20_balance_with_client(
    client: Client,
    address: string | null = null,
    tick: string | string[] | null = null,
    amt = 0,
    limit = BIG_LIMIT,
    page = 0,
    sort = "ASC",
  ) {
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

    if (amt > 0) {
      whereClauses.push(`amt > ?`);
      queryParams.push(amt);
    }

    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    queryParams.push(limit, offset); // Add limit and offset at the end

    const validOrder = ["ASC", "DESC"].includes(sort.toUpperCase())
      ? sort.toUpperCase()
      : "ASC";

    const sqlQuery = `
      SELECT address, p, tick, amt, block_time, last_update
      FROM ${SRC20_BALANCE_TABLE}
      WHERE ${whereClauses.join(" AND ")}
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
      ? results.rows.map((result) => result.tick)
      : [];
    const tx_hashes_response = await Src20Class.get_valid_src20_tx_with_client(
      client,
      null,
      ticksToQuery.length > 0 ? ticksToQuery : tick,
      "DEPLOY",
    );
    const tx_hashes_map = tx_hashes_response.rows.reduce((map, row) => {
      map[row.tick] = row.tx_hash;
      return map;
    }, {});

    // Add transaction hash and deploy image URL to each result
    const resultsWithDeployImg = results.rows.map((result) => ({
      ...result,
      tx_hash: tx_hashes_map[result.tick],
      deploy_img: `${conf.IMAGES_SRC_PATH}/${tx_hashes_map[result.tick]}.svg`,
    }));

    return resultsWithDeployImg.length === 1 // if more than one result return array, otherwise object
      ? resultsWithDeployImg[0]
      : resultsWithDeployImg;
  }

  static async get_total_src20_holders_by_tick_with_client(
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

  static async get_src20_minting_progress_by_tick_with_client(
    client: Client,
    tick: string,
  ) {
    const max_supply_data = await handleSqlQueryWithCache(
      client,
      `
        SELECT max, deci, lim
        FROM ${SRC20_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        AND op = 'DEPLOY';
        `,
      [tick],
      0,
    );
    const max_supply = new BigFloat(max_supply_data.rows[0]["max"]);
    const decimals = parseInt(max_supply_data.rows[0]["deci"]);
    const limit = parseInt(max_supply_data.rows[0]["lim"]);

    const total_mints_data = await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) as total
        FROM ${SRC20_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        AND op = 'MINT';
        `,
      [tick],
      0,
    );

    const total_mints = parseInt(total_mints_data.rows[0]["total"]);

    const total_minted_data = await handleSqlQueryWithCache(
      client,
      `
        SELECT SUM(amt) as total
        FROM ${SRC20_BALANCE_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}';
        `,
      [tick],
      0,
    );

    const total_minted = new BigFloat(total_minted_data.rows[0]["total"] ?? 0);

    const progress = parseFloat(
      total_minted.div(max_supply).mul(100),
    ).toFixed(3);

    return {
      max_supply: max_supply.toString(),
      total_minted: total_minted.toString(),
      total_mints: total_mints,
      progress,
      decimals,
      limit,
    };
  }

  static async get_src20_minting_progress_by_tick_with_client_new(
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
    const progress = parseFloat(total_minted.div(max_supply).mul(100)).toFixed(
      3,
    );
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
