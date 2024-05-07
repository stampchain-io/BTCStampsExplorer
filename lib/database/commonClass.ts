// deno-lint-ignore-file no-explicit-any

import { Client } from "$mysql/mod.ts";
import { summarize_issuances } from "./index.ts";
import { get_balances } from "../utils/xcp.ts";
import { handleSqlQueryWithCache } from "../utils/cache.ts";
import { BIG_LIMIT, STAMP_TABLE, TTL_CACHE } from "../utils/constants.ts";

export class CommonClass {
  /**
   * Retrieves block information by block index or hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param block_index_or_hash - The block index or hash to retrieve information for.
   * @returns A promise that resolves to the block information.
   */
  static async get_block_info_with_client(
    client: Client,
    block_index_or_hash: number | string,
  ) {
    const isIndex = !isNaN(Number(block_index_or_hash));
    const field = isIndex ? "block_index" : "block_hash";

    return await handleSqlQueryWithCache(
      client,
      `
      SELECT block_index, block_time, block_hash, previous_block_hash, ledger_hash, 
      txlist_hash, messages_hash 
      FROM blocks
      WHERE ${field} = ?;
      `,
      [block_index_or_hash],
      "never",
    );
  }

  /**
   * Retrieves the last block index from the database using the provided client.
   *
   * @param client - The database client to use for the query.
   * @returns A promise that resolves to the last block index.
   */
  static async get_last_block_with_client(client: Client) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT MAX(block_index)
      AS last_block
      FROM blocks;
      `,
      [],
      0,
    );
  }

  /**
   * Retrieves the last X blocks with the specified client.
   *
   * @param client - The database client to use for the query.
   * @param num - The number of blocks to retrieve. Defaults to 10.
   * @returns A promise that resolves to an array of blocks with additional transaction count information.
   */
  static async get_last_x_blocks_with_client(
    client: Client,
    num = 10,
  ) {
    const blocks = await handleSqlQueryWithCache(
      client,
      `
      SELECT block_index, block_time, block_hash, previous_block_hash, ledger_hash, 
      txlist_hash, messages_hash 
      FROM blocks
      ORDER BY block_index DESC
      LIMIT ${num};
      `,
      [num],
      0,
    );
    const populated = blocks.rows.map(async (block: any) => {
      const tx_info_from_block = await handleSqlQueryWithCache(
        client,
        `
        SELECT COUNT(*) AS tx_count
        FROM ${STAMP_TABLE}
        WHERE block_index = '${block.block_index}';
        `,
        [block.block_index],
        "never",
      );

      return {
        ...block,
        tx_count: tx_info_from_block.rows[0]["tx_count"],
      };
    });
    return Promise.all(populated.reverse());
  }

  /**
   * Retrieves related blocks with the specified client.
   *
   * @param client - The database client.
   * @param block_index_or_hash - The block index or hash.
   * @returns A promise that resolves to an array of related blocks.
   */
  static async get_related_blocks_with_client(
    client: Client,
    block_index_or_hash: number | string,
  ) {
    let block_index: number;

    if (!isNaN(Number(block_index_or_hash))) {
      block_index = Number(block_index_or_hash);
    } else {
      block_index = await this.get_block_index_by_hash_with_client(
        client,
        block_index_or_hash,
      );
    }

    const blocks = await handleSqlQueryWithCache(
      client,
      `
    SELECT block_index, block_time, block_hash, previous_block_hash, ledger_hash, 
    txlist_hash, messages_hash 
    FROM blocks
    WHERE block_index >= ? - 2
    AND block_index <= ? + 2
    ORDER BY block_index DESC;
    `,
      [block_index, block_index],
      0,
    );
    const populated = blocks?.rows?.map(async (block: any) => {
      const stamps_from_block = await handleSqlQueryWithCache(
        client,
        `
      SELECT COUNT(*) AS issuances
      FROM ${STAMP_TABLE}
      WHERE block_index = ?;
      `,
        [block.block_index],
        "never",
      );

      const sends_from_block = 0; // FIXME: need to add the send data

      return {
        ...block,
        issuances: stamps_from_block.rows[0]["issuances"] ?? 0,
        sends: sends_from_block,
      };
    });
    const result = await Promise.all(populated.reverse());
    return result;
  }

  static async get_stamps_with_client(
    client: Client,
    block_index_or_hash: number | string,
  ) {
    const isBlockIndex = !isNaN(Number(block_index_or_hash));
    const query = `
      SELECT st.*, num.stamp AS stamp, num.is_btc_stamp AS is_btc_stamp
      FROM ${STAMP_TABLE} st
      LEFT JOIN (
          SELECT cpid, stamp, is_btc_stamp
          FROM ${STAMP_TABLE}
          WHERE stamp IS NOT NULL
          AND is_btc_stamp IS NOT NULL
      ) num ON st.cpid = num.cpid
      WHERE st.${isBlockIndex ? "block_index" : "block_hash"} = ?
      ORDER BY st.${isBlockIndex ? "stamp" : "tx_index"};
    `;
    return await handleSqlQueryWithCache(
      client,
      query,
      [block_index_or_hash],
      "never",
    );
  }

  /**
   * Retrieves the block index by its hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param block_hash - The hash of the block to retrieve the index for.
   * @returns The block index if found, otherwise undefined.
   */
  static async get_block_index_by_hash_with_client(
    client: Client,
    block_hash: string,
  ) {
    const result = await handleSqlQueryWithCache(
      client,
      `
      SELECT block_index
      FROM blocks
      WHERE block_hash = '${block_hash}';
      `,
      [block_hash],
      "never",
    );
    return result?.rows?.[0]?.block_index;
  }

  // -------------Stamps--------------

  /**
   * Retrieves the issuances for a specific stamp using the provided database client.
   *
   * @param client - The database client to use for the query.
   * @param stamp - The stamp number to retrieve issuances for.
   * @returns A Promise that resolves to the issuances for the specified stamp, or null if no issuances are found.
   */
  static async get_issuances_by_stamp_with_client(
    client: Client,
    stamp: number,
  ) {
    let issuances = await handleSqlQueryWithCache(
      client,
      `
      SELECT stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_base64, stamp_mimetype, 
      stamp_url, supply, block_time, tx_hash, tx_index, ident, stamp_hash, is_btc_stamp, file_hash

      FROM ${STAMP_TABLE}
      WHERE stamp = '${stamp}'
      ORDER BY stamp;
      `,
      [stamp],
      TTL_CACHE,
    );
    const cpid = issuances?.rows[0]?.cpid;
    if (!cpid) return null;
    issuances = await handleSqlQueryWithCache(
      client,
      `
      SELECT stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_base64, stamp_mimetype, 
      stamp_url, supply, block_time, tx_hash, tx_index, ident, stamp_hash, is_btc_stamp, file_hash
      FROM ${STAMP_TABLE}
      WHERE (cpid = '${cpid}')
      ORDER BY stamp;
      `,
      [cpid],
      TTL_CACHE,
    );
    return issuances;
  }

  /**
   * Retrieves issuances by identifier with the specified client.
   *
   * @param client - The database client.
   * @param identifier - The identifier to search for.
   * @returns A Promise that resolves to the list of issuances.
   */
  static async get_issuances_by_identifier_with_client(
    client: Client,
    identifier: string,
  ) {
    if (typeof identifier !== "string") {
      throw new Error("Identifier must be a string");
    }

    const issuances = await handleSqlQueryWithCache(
      client,
      `
      SELECT stamp, block_index, cpid, creator, divisible, keyburn, locked, stamp_base64, stamp_mimetype, 
      stamp_url, supply, block_time, tx_hash, tx_index, ident, stamp_hash, is_btc_stamp, file_hash
      FROM ${STAMP_TABLE}
      WHERE cpid = (
        SELECT cpid
        FROM ${STAMP_TABLE}
        WHERE (cpid = ? OR tx_hash = ? OR stamp_hash = ?)
        LIMIT 1
      )
      ORDER BY stamp;
      `,
      [identifier],
      TTL_CACHE,
    );
    return issuances;
  }

  /**
   * Retrieves the total stamp balance for a given address using the provided database client.
   *
   * @param client - The database client to use for the query.
   * @param address - The address for which to retrieve the stamp balance.
   * @returns A promise that resolves to the total stamp balance.
   * @throws If there is an error retrieving the balances.
   */
  static async get_total_stamp_balance_with_client(
    client: Client,
    address: string,
  ) {
    try {
      const xcp_balances = await get_balances(address);
      const assets = xcp_balances.map((balance: any) => balance.cpid);
      if (assets.length === 0) {
        return {
          rows: [
            {
              total: 0,
            },
          ],
        };
      }
      const query = `
        SELECT 
          COUNT(*) AS total
        FROM 
          ${STAMP_TABLE} st
        LEFT JOIN 
          creator cr ON st.creator = cr.address
        WHERE 
          st.cpid IN (${assets.map((asset: string) => `'${asset}'`).join(",")})
      `;
      const balances = await handleSqlQueryWithCache(
        client,
        query,
        assets,
        TTL_CACHE,
      );
      return balances;
    } catch (error) {
      console.error("Error getting balances: ", error);
      return [];
    }
  }

  /**
   * Retrieves stamp balances for a given address using a database client.
   *
   * @param client - The database client to use for the query.
   * @param address - The address for which to retrieve stamp balances.
   * @param limit - The maximum number of stamp balances to retrieve. Default is SMALL_LIMIT.
   * @param page - The page number of stamp balances to retrieve. Default is 1.
   * @param order - The order in which to retrieve the stamp balances. Default is "DESC".
   * @returns An array of summarized stamp balances for the given address.
   */
  static async get_stamp_balances_by_address_with_client(
    client: Client,
    address: string,
    limit = BIG_LIMIT,
    page = 1,
    order = "DESC",
  ) {
    const offset = (page - 1) * limit;
    try {
      const xcp_balances = await get_balances(address);
      const assets = xcp_balances.map((balance: any) => balance.cpid);

      const query = `
        SELECT 
          st.cpid, 
          st.stamp, 
          st.stamp_base64,
          st.stamp_url, 
          st.stamp_mimetype, 
          st.tx_hash, 
          st.is_btc_stamp,  
          st.divisible, 
          st.supply, 
          st.locked, 
          st.creator, 
          cr.creator AS creator_name
        FROM 
          ${STAMP_TABLE} st
        LEFT JOIN 
          creator cr ON st.creator = cr.address
        WHERE 
          st.cpid IN ( ${
        assets.map((asset: string) => `'${asset}'`).join(", ")
      } )
        ORDER BY st.stamp ${order}
        LIMIT ${limit}
        OFFSET ${offset};
      `;

      const balances = await handleSqlQueryWithCache(
        client,
        query,
        assets,
        TTL_CACHE,
      );

      const grouped = balances.rows.reduce((acc: any, cur: any) => {
        acc[cur.cpid] = acc[cur.cpid] || [];
        acc[cur.cpid].push(cur);
        return acc;
      }, {});

      const summarized = Object.keys(grouped).map((key) =>
        summarize_issuances(grouped[key])
      );

      return summarized.map((summary) => {
        const xcp_balance = xcp_balances.find((balance: any) =>
          balance.cpid === summary.cpid
        );
        return {
          ...summary,
          balance: xcp_balance ? xcp_balance.quantity : 0,
        };
      });
    } catch (error) {
      console.error("Error getting balances: ", error);
      return [];
    }
  }
}
