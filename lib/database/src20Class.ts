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
  static async get_total_valid_src20_tx_with_client(client: Client) {
    return await handleSqlQueryWithCache(
      client,
      `
    SELECT COUNT(*) AS total
    FROM ${SRC20_TABLE}
    `,
      [],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_from_block_with_client(
    client: Client,
    block_index: number,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
    SELECT COUNT(*) AS total
    FROM ${SRC20_TABLE}
    WHERE block_index = '${block_index}';
    `,
      [block_index],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_from_block_by_tick_with_client(
    client: Client,
    block_index: number,
    tick: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
    SELECT COUNT(*) AS total
    FROM ${SRC20_TABLE}
    WHERE block_index = ${block_index}
    AND tick COLLATE utf8mb4_0900_as_ci = '${tick}'
    `,
      [block_index, tick],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_with_client(
    client: Client,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_from_block_with_client(
    client: Client,
    block_index: number,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN
            creator destination_info ON src20.destination = destination_info.address
        WHERE src20.block_index = '${block_index}'
        ORDER BY
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [block_index, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_from_block_by_tick_with_client(
    client: Client,
    block_index: number,
    tick: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN
            creator destination_info ON src20.destination = destination_info.address
        WHERE src20.block_index = '${block_index}'
        AND src20.tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        ORDER BY
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [block_index, tick, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_tick_with_client(
    client: Client,
    tick: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        `,
      [tick],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_tick_with_op_with_client(
    client: Client,
    tick: string,
    op: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        AND op = '${op}'
        `,
      [tick, op],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_tick_with_op_with_client(
    client: Client,
    tick: string,
    op: string,
    limit = BIG_LIMIT,
    page = 0,
    order = "ASC",
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            src20.tick COLLATE utf8mb4_0900_as_ci = '${tick}'
            AND src20.op = '${op}'
        ORDER BY 
            src20.tx_index ${order}
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [tick, op, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_tick_with_client(
    client: Client,
    tick: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            src20.tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        ORDER BY src20.tx_index ASC
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [tick, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_op_with_client(
    client: Client,
    op: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE op = '${op}'
        ORDER BY tx_index ASC
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [op, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_op_with_client(
    client: Client,
    op: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            (@row_number:=@row_number + 1) AS row_num,
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        CROSS JOIN
            (SELECT @row_number := ${offset} - 1) AS init
        WHERE 
            src20.op = '${op}'
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [offset, op, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_deploy_by_tick_with_client(
    client: Client,
    ticks: string[],
  ) {
    const ticksArray = typeof ticks === "string" ? [ticks] : ticks;
    const tickPlaceholders = ticksArray.map(() => "?").join(",");
    return await handleSqlQueryWithCache(
      client,
      `
            SELECT 
                src20.tx_hash,
                src20.tx_index,
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
                src20.status,
                creator_info.creator as creator_name,
                destination_info.creator as destination_name
            FROM 
                ${SRC20_TABLE} src20
            LEFT JOIN 
                creator creator_info ON src20.creator = creator_info.address
            LEFT JOIN 
                creator destination_info ON src20.destination = destination_info.address
            WHERE src20.op = 'DEPLOY'
            AND src20.tick COLLATE utf8mb4_0900_as_ci IN (${tickPlaceholders})
            `,
      ticks,
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_tx_hash_with_client(
    client: Client,
    tx_hash: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM
            ${SRC20_TABLE} src20
        LEFT JOIN
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN
            creator destination_info ON src20.destination = destination_info.address
        WHERE src20.tx_hash = '${tx_hash}';
        `,
      [tx_hash],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_address_with_client(
    client: Client,
    address: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE address = ${address};
        `,
      [address],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_address_with_client(
    client: Client,
    address: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            (src20.creator = '${address}' OR src20.destination = '${address}')
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [address, address, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_address_and_tick_with_client(
    client: Client,
    address: string,
    tick: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE address = '${address}'
        AND tick COLLATE utf8mb4_0900_as_ci = '${tick}';
        `,
      [address, tick],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_address_and_tick_with_client(
    client: Client,
    address: string,
    tick: string,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.tx_hash,
            src20.tx_index,
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
            src20.status,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            (src20.creator = '${address}' OR src20.destination = '${address}')
        AND src20.tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [address, address, tick, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_src20_balance_by_address_with_client(
    client: Client,
    address: string,
    limit = BIG_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    const results = await handleSqlQueryWithCache(
      client,
      `
            SELECT address,p,tick,amt,block_time,last_update
            FROM ${SRC20_BALANCE_TABLE}
            WHERE address = '${address}' AND amt > 0
            ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [address, limit, offset],
      1000 * 60 * 2,
    );

    const ticks = results.rows ? results.rows.map((result) => result.tick) : [];
    const tx_hashes_response = await Src20Class
      .get_valid_src20_deploy_by_tick_with_client(client, ticks);
    const tx_hashes_map = tx_hashes_response.rows.reduce((map, row) => {
      map[row.tick] = row.tx_hash;
      return map;
    }, {});

    const resultsAndHashes = results.rows.map((result) => ({
      ...result,
      tx_hash: tx_hashes_map[result.tick],
    }));

    const resultsWithDeployImg = resultsAndHashes.map((row) => {
      const deployImg = `${conf.IMAGES_SRC_PATH}/${row.tx_hash}.svg`;
      return { ...row, deploy_img: deployImg };
    });
    return { rows: resultsWithDeployImg };
  }

  static async get_src20_balance_by_address_and_tick_with_client(
    client: Client,
    address: string,
    tick: string,
  ) {
    const results = await handleSqlQueryWithCache(
      client,
      `
        SELECT address,p,tick,amt,block_time,last_update
        FROM ${SRC20_BALANCE_TABLE}
        WHERE address = '${address}' and amt > 0
        AND tick COLLATE utf8mb4_0900_as_ci = '${tick}';
        `,
      [address, tick],
      1000 * 60 * 2,
    );
    const tx_hashes_response = await Src20Class
      .get_valid_src20_deploy_by_tick_with_client(client, [tick]);
    const tx_hash = tx_hashes_response.rows[0].tx_hash;
    const deployImg = `${conf.IMAGES_SRC_PATH}/${tx_hash}.svg`;

    const resultsWithDeployImg = results.rows.map((result) => {
      return { ...result, deploy_img: deployImg };
    });

    return { rows: resultsWithDeployImg };
  }

  static async get_src20_holders_by_tick_with_client(
    client: Client,
    tick: string,
    amt = 1,
    limit = SMALL_LIMIT,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT id,address,p,tick,amt,block_time,last_update
        FROM ${SRC20_BALANCE_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        AND amt >= ${amt}
        ORDER BY amt DESC
        ${limit ? `LIMIT ${limit} OFFSET ${offset}` : ""};
        `,
      [tick, amt, limit, offset],
      0,
    );
  }

  static async get_total_src20_holders_by_tick_with_client(
    client: Client,
    tick: string,
    amt = 1,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_BALANCE_TABLE}
        WHERE tick COLLATE utf8mb4_0900_as_ci = '${tick}'
        AND amt >= ${amt};
        `,
      [tick, amt],
      0,
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
