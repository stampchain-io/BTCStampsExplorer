import { Client } from "$mysql/mod.ts";
import { SMALL_LIMIT } from "constants";
import { dbManager } from "$lib/database/db.ts";

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
    );

    return result.rows[0].total;
  }

  static async getCollectionByName(client: Client, collectionName: string) {
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

    return await dbManager.executeQueryWithCache(
      query,
      [collectionName],
      "never",
    );
  }
}
