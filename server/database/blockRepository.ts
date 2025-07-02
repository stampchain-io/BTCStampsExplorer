// deno-lint-ignore-file no-explicit-any

import { STAMP_TABLE } from "$lib/utils/constants.ts";
import { dbManager } from "$server/database/databaseManager.ts";

const BLOCK_FIELDS =
  `block_index, block_time, block_hash, previous_block_hash, ledger_hash, txlist_hash, messages_hash`;

export class BlockRepository {
  // Dependency injection support
  private static db: typeof dbManager = dbManager;
  
  static setDatabase(database: typeof dbManager): void {
    this.db = database;
  }

  /**
   * Retrieves block information by block index or hash using the provided database client.
   * @param client - The database client to use for the query.
   * @param blockIdentifier - The block index or hash to retrieve information for.
   * @returns A promise that resolves to the block information.
   */
  static async getBlockInfoFromDb(
    blockIdentifier: number | string,
  ) {
    const isIndex = typeof blockIdentifier === "number" ||
      /^\d+$/.test(blockIdentifier);
    const field = isIndex ? "block_index" : "block_hash";
    const queryValue = isIndex ? Number(blockIdentifier) : blockIdentifier;

    return await this.db.executeQueryWithCache(
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
  static async getLastBlockFromDb() {
    return await this.db.executeQueryWithCache(
      `
      SELECT MAX(block_index)
      AS last_block
      FROM blocks;
      `,
      [],
      0,
    );
  }

  static async getLastXBlocksFromDb(num = 10) {
    try {
      const result = await this.db.executeQueryWithCache(
        `
        SELECT ${BLOCK_FIELDS}
        FROM blocks
        ORDER BY block_index DESC
        LIMIT ?;
        `,
        [num],
        0,
      ) || { rows: [] };

      const blocks = result.rows;
      const blockIndexes = blocks.map((block) => block.block_index);

      const tx_counts_result = await this.db.executeQueryWithCache<
        { block_index: number; tx_count: number }[]
      >(
        `
        SELECT block_index, COUNT(*) AS tx_count
        FROM ${STAMP_TABLE}
        WHERE block_index IN (${blockIndexes.map(() => "?").join(",")})
        GROUP BY block_index;
        `,
        blockIndexes,
        "never",
      ) || { rows: [] };

      const tx_counts = tx_counts_result.rows;

      const tx_count_map = new Map(
        tx_counts.map((item) => [item.block_index, item.tx_count]),
      );

      const populated = blocks.map((block) => ({
        ...block,
        tx_count: tx_count_map.get(block.block_index) || 0,
      }));

      return populated.reverse();
    } catch (error) {
      console.error("Error in getLastXBlocks:", error);
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
    blockIdentifier: number | string,
  ) {
    let block_index: number;

    if (typeof blockIdentifier === "number" || /^\d+$/.test(blockIdentifier)) {
      block_index = Number(blockIdentifier);
    } else {
      block_index = await this._getBlockIndexByHash(
        String(blockIdentifier),
      );
    }

    const [blocks, stamps] = await Promise.all([
      this.db.executeQueryWithCache(
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
      this.db.executeQueryWithCache(
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
  static async _getBlockIndexByHash(block_hash: string) {
    const result = await this.db.executeQueryWithCache(
      `
      SELECT block_index
      FROM blocks
      WHERE block_hash = ?
      LIMIT 1;
      `,
      [block_hash],
      "never",
    );
    return (result as number[])[0];
  }
}
