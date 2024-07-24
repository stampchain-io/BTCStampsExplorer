import { Client } from "$mysql/mod.ts";
import { Collection, StampRow } from "globals";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { SMALL_LIMIT } from "constants";

export class CollectionRepository {
  static async getCollections(
    client: Client,
    options: {
      limit?: number;
      page?: number;
      creator?: string;
    },
  ) {
    const { limit = SMALL_LIMIT, page = 1, creator } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        COUNT(DISTINCT cs.stamp) as stamp_count
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
    `;

    const queryParams: any[] = [];

    if (creator) {
      query += ` WHERE cc.creator_address = ?`;
      queryParams.push(creator);
    }

    query += `
      GROUP BY c.collection_id, c.collection_name
      ORDER BY c.collection_name
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    return await handleSqlQueryWithCache(
      client,
      query,
      queryParams,
      1000 * 60 * 5, // 5 minutes cache
    );
  }

  static async getCollectionStamps(
    client: Client,
    collectionId: string,
    limit: number,
    offset: number,
  ) {
    const query = `
      SELECT 
        s.stamp,
        s.block_index,
        s.cpid,
        s.creator,
        cr.creator AS creator_name,
        s.divisible,
        s.keyburn,
        s.locked,
        s.stamp_base64,
        s.stamp_mimetype,
        s.stamp_url,
        s.supply,
        s.block_time,
        s.tx_hash,
        s.tx_index,
        s.ident,
        s.stamp_hash,
        s.is_btc_stamp,
        s.file_hash
      FROM StampTableV4 s
      JOIN collection_stamps cs ON s.stamp = cs.stamp
      LEFT JOIN creator cr ON s.creator = cr.address
      WHERE cs.collection_id = UNHEX(?)
      ORDER BY s.stamp DESC
      LIMIT ? OFFSET ?
    `;

    return await handleSqlQueryWithCache(
      client,
      query,
      [collectionId, limit, offset],
      1000 * 60 * 5, // 5 minutes cache
    );
  }

  static async getTotalCollections(
    client: Client,
    creator?: string,
  ) {
    let query =
      `SELECT COUNT(DISTINCT c.collection_id) as total FROM collections c`;
    const queryParams: any[] = [];

    if (creator) {
      query +=
        ` JOIN collection_creators cc ON c.collection_id = cc.collection_id WHERE cc.creator_address = ?`;
      queryParams.push(creator);
    }

    const result = await handleSqlQueryWithCache(
      client,
      query,
      queryParams,
      1000 * 60 * 5, // 5 minutes cache
    );

    return result.rows[0].total;
  }
}
