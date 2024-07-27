// deno-lint-ignore-file no-explicit-any

import { Client } from "$mysql/mod.ts";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { STAMP_TABLE } from "utils/constants.ts";

const BLOCK_FIELDS =
  `block_index, block_time, block_hash, previous_block_hash, ledger_hash, txlist_hash, messages_hash`;

export class BlockRepository {
  /**
   * Retrieves block information by block index or hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param blockIdentifier - The block index or hash to retrieve information for.
   * @returns A promise that resolves to the block information.
   */
  static async getBlockInfoFromDb(
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
  static async getLastBlockFromDb(client: Client) {
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
  static async getRelatedBlocksWithStampsFromDb(
    client: Client,
    blockIdentifier: number | string,
  ) {
    let block_index: number;

    if (typeof blockIdentifier === "number" || /^\d+$/.test(blockIdentifier)) {
      block_index = Number(blockIdentifier);
    } else {
      block_index = await this._getBlockIndexByHash(
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
      SELECT block_index, COUNT(*) AS stampcount
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
      stamps.rows.map((row) => [row.block_index, row.stampcount]),
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
  static async _getBlockIndexByHash(
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
}
