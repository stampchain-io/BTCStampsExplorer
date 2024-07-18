// deno-lint-ignore-file no-explicit-any

import { Client } from "$mysql/mod.ts";
import { summarize_issuances } from "$lib/database/index.ts";
import { get_balances } from "utils/xcp.ts";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { BIG_LIMIT, STAMP_TABLE, TTL_CACHE } from "utils/constants.ts";
import { StampBalance } from "globals";

const BLOCK_FIELDS =
  `block_index, block_time, block_hash, previous_block_hash, ledger_hash, txlist_hash, messages_hash`;

export class CommonClass {
  /**
   * Retrieves block information by block index or hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param blockIdentifier - The block index or hash to retrieve information for.
   * @returns A promise that resolves to the block information.
   */
  static async get_block_info_with_client(
    client: Client,
    blockIdentifier: number | string,
  ) {
    const isIndex = typeof blockIdentifier === "number" ||
      /^\d+$/.test(blockIdentifier);
    const field = isIndex ? "block_index" : "block_hash";
    const queryValue = isIndex ? Number(blockIdentifier) : blockIdentifier;

    return await handleSqlQueryWithCache(
      client,
      `
      SELECT ${BLOCK_FIELDS}
      FROM blocks
      WHERE ${field} = ?;
      `,
      [queryValue],
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
    try {
      const blocks = await handleSqlQueryWithCache(
        client,
        `
        SELECT ${BLOCK_FIELDS}
        FROM blocks
        ORDER BY block_index DESC
        LIMIT ?;
        `,
        [num],
        0,
      );

      const populated = await Promise.all(
        blocks.rows.map(async (block: any) => {
          const tx_info_from_block = await handleSqlQueryWithCache(
            client,
            `
          SELECT COUNT(*) AS tx_count
          FROM ${STAMP_TABLE}
          WHERE block_index = ?;
          `,
            [block.block_index],
            "never",
          );

          return {
            ...block,
            tx_count: tx_info_from_block.rows[0]["tx_count"],
          };
        }),
      );

      return populated.reverse();
    } catch (error) {
      console.error("Error in get_last_x_blocks_with_client:", error);
      throw error;
    }
  }
  /**
   * Retrieves related blocks with the specified client.
   *
   * @param client - The database client.
   * @param blockIdentifier - The block index (number) or block hash (string).
   * @returns A promise that resolves to an array of related blocks.
   */
  static async get_related_blocks_with_client(
    client: Client,
    blockIdentifier: number | string,
  ) {
    let block_index: number;

    if (typeof blockIdentifier === "number" || /^\d+$/.test(blockIdentifier)) {
      block_index = Number(blockIdentifier);
    } else {
      block_index = await this.get_block_index_by_hash(
        client,
        String(blockIdentifier),
      );
    }

    const [blocks, stamps] = await Promise.all([
      handleSqlQueryWithCache(
        client,
        `
      SELECT ${BLOCK_FIELDS}
      FROM blocks
      WHERE block_index >= ? - 2
      AND block_index <= ? + 2
      ORDER BY block_index DESC;
      `,
        [block_index, block_index],
        0,
      ),
      handleSqlQueryWithCache(
        client,
        `
      SELECT block_index, COUNT(*) AS issuances
      FROM ${STAMP_TABLE}
      WHERE block_index >= ? - 2
      AND block_index <= ? + 2
      GROUP BY block_index;
      `,
        [block_index, block_index],
        "never",
      ),
    ]);

    const stampMap = new Map(
      stamps.rows.map((row) => [row.block_index, row.issuances]),
    );

    const result = blocks.rows.map((block) => ({
      ...block,
      issuances: stampMap.get(block.block_index) ?? 0,
      sends: 0, // FIXME: need to add the send data
    }));

    return result.reverse();
  }

  /**
   * Retrieves the block index by its hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param block_hash - The hash of the block to retrieve the index for.
   * @returns The block index if found, otherwise undefined.
   */
  static async get_block_index_by_hash(
    client: Client,
    block_hash: string,
  ) {
    const result = await handleSqlQueryWithCache(
      client,
      `
      SELECT block_index
      FROM blocks
      WHERE block_hash = ?;
      `,
      [block_hash],
      "never",
    );
    return result?.rows?.[0]?.block_index;
  }

  // -------------Stamps--------------

  /**
   * Retrieves the total stamp balance for a given address using the provided database client.
   *
   * @param client - The database client to use for the query.
   * @param address - The address for which to retrieve the stamp balance.
   * @returns A promise that resolves to the total stamp balance.
   * @throws If there is an error retrieving the balances.
   */
  static async get_count_stamp_balances_by_address(
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
  static async get_stamp_balances_by_address(
    client: Client,
    address: string,
    limit = BIG_LIMIT,
    page = 1,
    order = "DESC",
  ): Promise<StampBalance[]> {
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

      const grouped = balances.rows.reduce(
        (acc: Record<string, StampBalance[]>, cur: StampBalance) => {
          acc[cur.cpid] = acc[cur.cpid] || [];
          acc[cur.cpid].push({
            ...cur,
            is_btc_stamp: cur.is_btc_stamp ?? 0,
          });
          return acc;
        },
        {},
      );

      const summarized = Object.keys(grouped).map((key) =>
        summarize_issuances(grouped[key])
      );

      return summarized.map((summary: StampBalance) => {
        const xcp_balance = xcp_balances.find((balance) =>
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
