import { Client } from "$mysql/mod.ts";
import { SRC20_BALANCE_TABLE, SRC20_TABLE, TTL_CACHE } from "constants";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { BigFloat } from "bigfloat/mod.ts";

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

  static async get_valid_src20_tx_with_client(
    client: Client,
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            SRC20Valid src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [limit, offset],
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
        WHERE tick = ?
        `,
      [tick],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_tick_with_client(
    client: Client,
    tick: string,
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            SRC20Valid src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            src20.tick = ?
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [tick, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_total_valid_src20_tx_by_op_with_client(
    client: Client,
    op = "DEPLOY",
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) AS total
        FROM ${SRC20_TABLE}
        WHERE op = ?
        ORDER BY tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [op, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_op_with_client(
    client: Client,
    op = "DEPLOY",
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            src20.op = ?
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [op, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_deploy_by_tick_with_client(
    client: Client,
    tick: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            src20.op = 'DEPLOY'
        AND src20.tick = ?
        `,
      [tick],
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
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM
            ${SRC20_TABLE} src20
        LEFT JOIN
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN
            creator destination_info ON src20.destination = destination_info.address
        WHERE
            src20.tx_hash = ?
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
        WHERE address = ?
        `,
      [address],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_address_with_client(
    client: Client,
    address: string,
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            (src20.creator = ? OR src20.destination = ?)
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
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
        WHERE address = ?
        AND tick = ?
        `,
      [address, tick],
      1000 * 60 * 2,
    );
  }

  static async get_valid_src20_tx_by_address_and_tick_with_client(
    client: Client,
    address: string,
    tick: string,
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT 
            src20.*,
            creator_info.creator as creator_name,
            destination_info.creator as destination_name
        FROM 
            ${SRC20_TABLE} src20
        LEFT JOIN 
            creator creator_info ON src20.creator = creator_info.address
        LEFT JOIN 
            creator destination_info ON src20.destination = destination_info.address
        WHERE 
            (src20.creator = ? OR src20.destination = ?)
        AND src20.tick = ?
        ORDER BY 
            src20.tx_index
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [address, address, tick, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_src20_balance_by_address_with_client(
    client: Client,
    address: string,
    limit = 1000,
    page = 0,
  ) {
    const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT id,address,p,tick,amt,block_time,last_update
        FROM ${SRC20_BALANCE_TABLE}
        WHERE address = ?
        ${limit ? `LIMIT ? OFFSET ?` : ""};
        `,
      [address, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_src20_balance_by_address_and_tick_with_client(
    client: Client,
    address: string,
    tick: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT id,address,p,tick,amt,block_time,last_update
        FROM ${SRC20_BALANCE_TABLE}
        WHERE address = ?
        AND tick = ?;
        `,
      [address, tick],
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
        SELECT max, deci
        FROM ${SRC20_TABLE}
        WHERE tick = ?
        AND op = 'DEPLOY';
        `,
      [tick],
      0,
    );
    const max_supply = new BigFloat(max_supply_data.rows[0]["max"]);
    const decimals = parseInt(max_supply_data.rows[0]["deci"]);

    const total_mints_data = await handleSqlQueryWithCache(
      client,
      `
        SELECT COUNT(*) as total
        FROM ${SRC20_TABLE}
        WHERE tick = ?
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
        WHERE tick = ?
        `,
      [tick],
      0,
    );

    const total_minted = new BigFloat(total_minted_data.rows[0]["total"]);

    const progress = parseFloat(
      total_minted.div(max_supply).mul(100),
    ).toFixed(3);

    return {
      max_supply: max_supply.toString(),
      total_minted: total_minted.toString(),
      total_mints: total_mints,
      progress,
      decimals,
    };
  }
}
