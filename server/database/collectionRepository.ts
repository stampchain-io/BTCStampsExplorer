import { SMALL_LIMIT } from "constants";
import { dbManager } from "../db.ts";
import { Collection } from "globals";
export class CollectionRepository {
  static async getCollections(
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

    return await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 5, // 5 minutes cache
    );
  }

  static async getTotalCollectionsByCreatorFromDb(
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

    const result = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 30,
    ) as { rows: [{ total: number }] };

    return result.rows[0].total;
  }

  static async getCollectionByName(
    collectionName: string,
  ): Promise<Collection | null> {
    const query = `
      SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        COUNT(DISTINCT cs.stamp) as stamp_count
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      WHERE c.collection_name = ?
      GROUP BY c.collection_id, c.collection_name
    `;

    const result = await dbManager.executeQueryWithCache(
      query,
      [collectionName],
      "never",
    ) as QueryResult<Collection>;

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getCollectionNames(
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
        collection_name
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
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

    return await dbManager.executeQueryWithCache(
      query,
      queryParams,
      1000 * 60 * 5, // 5 minutes cache
    );
  }
}
