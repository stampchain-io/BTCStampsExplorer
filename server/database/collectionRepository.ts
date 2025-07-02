import { SMALL_LIMIT, STAMP_TABLE } from "$constants";
import { dbManager } from "$server/database/databaseManager.ts";
import { Collection } from "$globals";
export class CollectionRepository {
  // Dependency injection support
  private static db: typeof dbManager = dbManager;
  
  static setDatabase(database: typeof dbManager): void {
    this.db = database;
  }

  static async getCollectionDetails(
    options: {
      limit?: number;
      page?: number;
      creator?: string;
      sortBy?: string;
      minStampCount?: number;
    },
  ) {
    const { limit = SMALL_LIMIT, page = 1, creator, sortBy = "DESC", minStampCount } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        c.collection_description,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        GROUP_CONCAT(DISTINCT cs.stamp) as stamp_numbers,
        COUNT(DISTINCT cs.stamp) as stamp_count,
        SUM(
          CASE 
            WHEN st.divisible = 1 THEN st.supply / 100000000
            WHEN st.supply > 100000 THEN 100000
            ELSE st.supply 
          END
        ) as total_editions
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
    `;

    const queryParams: any[] = [];

    if (creator) {
      query += ` WHERE cc.creator_address = ?`;
      queryParams.push(creator);
    }

    query += `
      GROUP BY c.collection_id, c.collection_name, c.collection_description
    `;

    // Add HAVING clause for minimum stamp count filter
    if (minStampCount !== undefined && minStampCount > 0) {
      query += ` HAVING COUNT(DISTINCT cs.stamp) >= ?`;
      queryParams.push(minStampCount);
    }

    query += `
      ORDER BY c.collection_name ${sortBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const results = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 5 // 5 minutes cache in seconds
    );

    return {
      ...results,
      rows: results.rows.map((row: any) => ({
        ...row,
        creators: row.creators ? row.creators.split(',') : [],
        stamps: row.stamp_numbers ? row.stamp_numbers.split(',').map(Number) : [],
      })),
    };
  }

  static async getTotalCollectionsByCreatorFromDb(
    creator?: string,
    minStampCount?: number,
  ) {
    let query: string;
    const queryParams: any[] = [];

    if (minStampCount !== undefined && minStampCount > 0) {
      // Use subquery to count collections with minimum stamp count
      query = `
        SELECT COUNT(*) as total FROM (
          SELECT c.collection_id
          FROM collections c
          LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
          LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      `;

      if (creator) {
        query += ` WHERE cc.creator_address = ?`;
        queryParams.push(creator);
      }

      query += `
          GROUP BY c.collection_id
          HAVING COUNT(DISTINCT cs.stamp) >= ?
        ) as filtered_collections
      `;
      queryParams.push(minStampCount);
    } else {
      // Original query for all collections
      query = `SELECT COUNT(DISTINCT c.collection_id) as total FROM collections c`;

      if (creator) {
        query += ` JOIN collection_creators cc ON c.collection_id = cc.collection_id WHERE cc.creator_address = ?`;
        queryParams.push(creator);
      }
    }

    const result = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 30 // 30 minutes cache in seconds
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
        c.collection_description,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        COUNT(DISTINCT cs.stamp) as stamp_count,
        SUM(
          CASE 
            WHEN st.divisible = 1 THEN st.supply / 100000000
            WHEN st.supply > 100000 THEN 100000
            ELSE st.supply 
          END
        ) as total_editions
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
      WHERE c.collection_name = ?
      GROUP BY c.collection_id, c.collection_name
    `;

    const result = await this.db.executeQueryWithCache(
      query,
      [collectionName],
      "never",
    ) as { rows: Collection[] };

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
      GROUP BY c.collection_id, c.collection_name, c.collection_description
      ORDER BY c.collection_name
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    return await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 5 // 5 minutes cache in seconds
    );
  }

  static async getCollectionDetailsWithMarketData(
    options: {
      limit?: number;
      page?: number;
      creator?: string;
      sortBy?: string;
      minStampCount?: number;
      includeMarketData?: boolean;
    },
  ) {
    const { limit = SMALL_LIMIT, page = 1, creator, sortBy = "DESC", minStampCount, includeMarketData = false } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        c.collection_description,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        GROUP_CONCAT(DISTINCT cr.creator) as creator_names,
        GROUP_CONCAT(DISTINCT cs.stamp) as stamp_numbers,
        COUNT(DISTINCT cs.stamp) as stamp_count,
        SUM(
          CASE 
            WHEN st.divisible = 1 THEN st.supply / 100000000
            WHEN st.supply > 100000 THEN 100000
            ELSE st.supply 
          END
        ) as total_editions
    `;

    // Add market data fields if requested
    if (includeMarketData) {
      query += `,
        cmd.min_floor_price_btc as minFloorPriceBTC,
        cmd.max_floor_price_btc as maxFloorPriceBTC,
        cmd.avg_floor_price_btc as avgFloorPriceBTC,
        NULL as medianFloorPriceBTC,
        cmd.total_volume_24h_btc as totalVolume24hBTC,
        cmd.stamps_with_prices_count as stampsWithPricesCount,
        cmd.min_holder_count as minHolderCount,
        cmd.max_holder_count as maxHolderCount,
        cmd.avg_holder_count as avgHolderCount,
        NULL as medianHolderCount,
        cmd.total_unique_holders as totalUniqueHolders,
        cmd.avg_distribution_score as avgDistributionScore,
        cmd.total_stamps_count as totalStampsCount,
        cmd.last_updated as marketDataLastUpdated
      `;
    }

    query += `
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN creator cr ON cc.creator_address = cr.address
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
    `;

    // Join market data table if requested
    // Note: For now we'll aggregate stamp market data for collections
    // TODO: When collection_market_data table is created, update this join
    if (includeMarketData) {
      // Aggregate market data from individual stamps in the collection
      query += `
      LEFT JOIN (
        SELECT 
          cs.collection_id,
          MIN(smd.floor_price_btc) as min_floor_price_btc,
          MAX(smd.floor_price_btc) as max_floor_price_btc,
          AVG(smd.floor_price_btc) as avg_floor_price_btc,
          SUM(smd.volume_24h_btc) as total_volume_24h_btc,
          COUNT(DISTINCT CASE WHEN smd.floor_price_btc IS NOT NULL THEN cs.stamp END) as stamps_with_prices_count,
          MIN(smd.holder_count) as min_holder_count,
          MAX(smd.holder_count) as max_holder_count,
          AVG(smd.holder_count) as avg_holder_count,
          SUM(smd.unique_holder_count) as total_unique_holders,
          AVG(smd.holder_distribution_score) as avg_distribution_score,
          COUNT(DISTINCT cs.stamp) as total_stamps_count,
          MAX(smd.last_updated) as last_updated
        FROM collection_stamps cs
        INNER JOIN StampTableV4 st ON cs.stamp = st.stamp
        LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid
        GROUP BY cs.collection_id
      ) cmd ON c.collection_id = cmd.collection_id
      `;
    }

    const queryParams: any[] = [];

    if (creator) {
      query += ` WHERE cc.creator_address = ?`;
      queryParams.push(creator);
    }

    query += `
      GROUP BY c.collection_id, c.collection_name, c.collection_description
    `;

    if (includeMarketData) {
      query += `, cmd.min_floor_price_btc, cmd.max_floor_price_btc, cmd.avg_floor_price_btc, 
                  cmd.total_volume_24h_btc, cmd.stamps_with_prices_count,
                  cmd.min_holder_count, cmd.max_holder_count, cmd.avg_holder_count, 
                  cmd.total_unique_holders, cmd.avg_distribution_score,
                  cmd.total_stamps_count, cmd.last_updated`;
    }

    // Add HAVING clause for minimum stamp count filter
    if (minStampCount !== undefined && minStampCount > 0) {
      query += ` HAVING COUNT(DISTINCT cs.stamp) >= ?`;
      queryParams.push(minStampCount);
    }

    query += `
      ORDER BY c.collection_name ${sortBy}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);

    const result = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 5 // 5 minutes cache in seconds
    );

    // Transform the results to include market data in the expected format
    if (includeMarketData && result.rows) {
      // Import parseBTCDecimal at the top of the file
      const { parseBTCDecimal } = await import("$lib/utils/marketData.ts");
      
      result.rows = result.rows.map((row: any) => {
        const marketData = row.minFloorPriceBTC !== undefined ? {
          minFloorPriceBTC: parseBTCDecimal(row.minFloorPriceBTC),
          maxFloorPriceBTC: parseBTCDecimal(row.maxFloorPriceBTC),
          avgFloorPriceBTC: parseBTCDecimal(row.avgFloorPriceBTC),
          medianFloorPriceBTC: parseBTCDecimal(row.medianFloorPriceBTC),
          totalVolume24hBTC: parseBTCDecimal(row.totalVolume24hBTC) || 0,
          stampsWithPricesCount: parseInt(row.stampsWithPricesCount) || 0,
          minHolderCount: parseInt(row.minHolderCount) || 0,
          maxHolderCount: parseInt(row.maxHolderCount) || 0,
          avgHolderCount: parseFloat(row.avgHolderCount) || 0,
          medianHolderCount: parseInt(row.medianHolderCount) || 0,
          totalUniqueHolders: parseInt(row.totalUniqueHolders) || 0,
          avgDistributionScore: parseFloat(row.avgDistributionScore) || 0,
          totalStampsCount: parseInt(row.totalStampsCount) || 0,
          lastUpdated: row.marketDataLastUpdated ? new Date(row.marketDataLastUpdated) : null
        } : null;

        // Clean up the row object
        delete row.minFloorPriceBTC;
        delete row.maxFloorPriceBTC;
        delete row.avgFloorPriceBTC;
        delete row.medianFloorPriceBTC;
        delete row.totalVolume24hBTC;
        delete row.stampsWithPricesCount;
        delete row.minHolderCount;
        delete row.maxHolderCount;
        delete row.avgHolderCount;
        delete row.medianHolderCount;
        delete row.totalUniqueHolders;
        delete row.avgDistributionScore;
        delete row.totalStampsCount;
        delete row.marketDataLastUpdated;

        return {
          ...row,
          marketData
        };
      });
    }

    return result;
  }
}
