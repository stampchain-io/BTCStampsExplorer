import { SMALL_LIMIT, STAMP_TABLE } from "$constants";
import type { CollectionRow, CollectionWithCreators } from "$server/types/collection.d.ts";
import { dbManager } from "$server/database/databaseManager.ts";

// Local utility function for BTC decimal parsing
function parseBTCDecimal(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(parsed) ? null : parsed;
}

// Local utility function for integer parsing that preserves null
function parseIntOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = parseInt(value);
  return isNaN(parsed) ? null : parsed;
}

// Local utility function for float parsing that preserves null
function parseFloatOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

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
    const {
      limit = SMALL_LIMIT,
      page = 1,
      creator,
      sortBy = "DESC",
      minStampCount,
    } = options;
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

    const result = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 5, // 5 minutes cache in seconds
    ) as {
      rows: import("../../server/types/collection.d.ts").CollectionRow[];
      [key: string]: any;
    };

    return {
      ...result,
      rows: result.rows.map((row: any) => ({
        ...row,
        creators: row.creators ? row.creators.split(",") : [],
        stamps: row.stamp_numbers
          ? row.stamp_numbers.split(",").map(Number)
          : [],
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
      query =
        `SELECT COUNT(DISTINCT c.collection_id) as total FROM collections c`;

      if (creator) {
        query +=
          ` JOIN collection_creators cc ON c.collection_id = cc.collection_id WHERE cc.creator_address = ?`;
        queryParams.push(creator);
      }
    }

    const result = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 30, // 30 minutes cache in seconds
    ) as { rows: [{ total: number }] };

    return result.rows[0].total;
  }

  static async getCollectionByName(
    collectionName: string,
  ): Promise<CollectionRow | null> {
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
      60 * 10, // Cache for 10 minutes instead of never
    ) as { rows: CollectionRow[] };

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  static async getCollectionById(
    collectionId: string,
    options: {
      includeMarketData?: boolean;
      stampLimit?: number;
      stampPage?: number;
    } = {},
  ): Promise<CollectionWithCreators | null> {
    const {
      includeMarketData = true,
      stampLimit = 50,
      stampPage = 1,
    } = options;

    const stampOffset = (stampPage - 1) * stampLimit;

    let query = `
      SELECT
        HEX(c.collection_id) as collection_id,
        c.collection_name,
        c.collection_description,
        GROUP_CONCAT(DISTINCT cc.creator_address) as creators,
        GROUP_CONCAT(DISTINCT cr.creator) as creator_names,
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
    // Column names must match collection_market_data table schema
    // Use MAX() aggregation for GROUP BY compatibility (one market data row per collection)
    if (includeMarketData) {
      query += `,
        MAX(cmd.min_floor_price_btc) as minFloorPriceBTC,
        MAX(cmd.max_floor_price_btc) as maxFloorPriceBTC,
        MAX(cmd.avg_floor_price_btc) as avgFloorPriceBTC,
        MAX(cmd.median_floor_price_btc) as medianFloorPriceBTC,
        MAX(cmd.total_volume_24h_btc) as totalVolume24hBTC,
        MAX(cmd.stamps_with_prices_count) as stampsWithPricesCount,
        MAX(cmd.min_holder_count) as minHolderCount,
        MAX(cmd.max_holder_count) as maxHolderCount,
        MAX(cmd.avg_holder_count) as avgHolderCount,
        MAX(cmd.median_holder_count) as medianHolderCount,
        MAX(cmd.total_unique_holders) as totalUniqueHolders,
        MAX(cmd.avg_distribution_score) as avgDistributionScore,
        MAX(cmd.total_stamps_count) as totalStampsCount,
        MAX(cmd.last_updated) as marketDataLastUpdated
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
    if (includeMarketData) {
      // Use HEX() on both sides to guarantee matching regardless of column type
      query += `
      LEFT JOIN collection_market_data cmd ON HEX(cmd.collection_id) = HEX(c.collection_id)
      `;
    }

    query += `
      WHERE c.collection_id = UNHEX(?)
      GROUP BY c.collection_id, c.collection_name, c.collection_description
    `;

    let result: { rows: any[] };

    try {
      result = await this.db.executeQueryWithCache(
        query,
        [collectionId],
        60 * 5, // Cache for 5 minutes
      ) as { rows: any[] };
    } catch (error) {
      // If market data table doesn't exist yet, retry without it
      if (includeMarketData) {
        console.warn(
          "collection_market_data table query failed, retrying without market data:",
          error instanceof Error ? error.message : error,
        );
        return await this.getCollectionById(collectionId, {
          ...options,
          includeMarketData: false,
        });
      }
      throw error;
    }

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Get stamps for this collection with pagination
    const stampsQuery = `
      SELECT cs.stamp
      FROM collection_stamps cs
      WHERE cs.collection_id = UNHEX(?)
      ORDER BY cs.stamp DESC
      LIMIT ? OFFSET ?
    `;

    const stampsResult = await this.db.executeQueryWithCache(
      stampsQuery,
      [collectionId, stampLimit, stampOffset],
      60 * 5, // Cache for 5 minutes
    ) as { rows: Array<{ stamp: number }> };

    const stamps = stampsResult.rows.map((r) => r.stamp);

    // Check if market data exists
    const hasMarketData = includeMarketData &&
      row.marketDataLastUpdated !== undefined &&
      row.marketDataLastUpdated !== null;

    const marketData = hasMarketData
      ? {
        minFloorPriceBTC: parseBTCDecimal(row.minFloorPriceBTC),
        maxFloorPriceBTC: parseBTCDecimal(row.maxFloorPriceBTC),
        avgFloorPriceBTC: parseBTCDecimal(row.avgFloorPriceBTC),
        medianFloorPriceBTC: parseBTCDecimal(row.medianFloorPriceBTC),
        totalVolume24hBTC: parseBTCDecimal(row.totalVolume24hBTC) ?? 0,
        stampsWithPricesCount: parseIntOrNull(row.stampsWithPricesCount) ?? 0,
        minHolderCount: parseIntOrNull(row.minHolderCount) ?? 0,
        maxHolderCount: parseIntOrNull(row.maxHolderCount) ?? 0,
        avgHolderCount: parseFloatOrNull(row.avgHolderCount) ?? 0,
        medianHolderCount: parseIntOrNull(row.medianHolderCount),
        totalUniqueHolders: parseIntOrNull(row.totalUniqueHolders) ?? 0,
        avgDistributionScore: parseFloatOrNull(row.avgDistributionScore) ?? 0,
        totalStampsCount: parseIntOrNull(row.totalStampsCount) ?? 0,
        lastUpdated: row.marketDataLastUpdated
          ? new Date(row.marketDataLastUpdated)
          : null,
      }
      : null;

    return {
      collection_id: row.collection_id,
      collection_name: row.collection_name,
      collection_description: row.collection_description,
      creators: row.creators ? row.creators.split(",") : [],
      creator_names: row.creator_names
        ? row.creator_names.split(",").filter((name: string) => name && name !== "null")
        : [],
      stamp_count: typeof row.stamp_count === "string"
        ? parseInt(row.stamp_count)
        : row.stamp_count,
      total_editions: typeof row.total_editions === "string"
        ? parseInt(row.total_editions)
        : row.total_editions,
      stamps,
      img: row.img || "",
      marketData,
    } as CollectionWithCreators;
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
      60 * 5, // 5 minutes cache in seconds
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
  ): Promise<{
    rows: import("../../server/types/collection.d.ts").CollectionRow[];
    [key: string]: any;
  }> {
    const {
      limit = SMALL_LIMIT,
      page = 1,
      creator,
      sortBy = "DESC",
      minStampCount,
      includeMarketData = false,
    } = options;
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
    // Use MAX() aggregation for GROUP BY compatibility (one market data row per collection)
    if (includeMarketData) {
      query += `,
        MAX(cmd.min_floor_price_btc) as minFloorPriceBTC,
        MAX(cmd.max_floor_price_btc) as maxFloorPriceBTC,
        MAX(cmd.avg_floor_price_btc) as avgFloorPriceBTC,
        MAX(cmd.median_floor_price_btc) as medianFloorPriceBTC,
        MAX(cmd.total_volume_24h_btc) as totalVolume24hBTC,
        MAX(cmd.stamps_with_prices_count) as stampsWithPricesCount,
        MAX(cmd.min_holder_count) as minHolderCount,
        MAX(cmd.max_holder_count) as maxHolderCount,
        MAX(cmd.avg_holder_count) as avgHolderCount,
        MAX(cmd.median_holder_count) as medianHolderCount,
        MAX(cmd.total_unique_holders) as totalUniqueHolders,
        MAX(cmd.avg_distribution_score) as avgDistributionScore,
        MAX(cmd.total_stamps_count) as totalStampsCount,
        MAX(cmd.last_updated) as marketDataLastUpdated
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
    if (includeMarketData) {
      // Use HEX() on both sides to guarantee matching regardless of column type
      query += `
      LEFT JOIN collection_market_data cmd ON HEX(cmd.collection_id) = HEX(c.collection_id)
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

    let result: {
      rows: import("../../server/types/collection.d.ts").CollectionRow[];
      [key: string]: any;
    };

    try {
      result = await this.db.executeQueryWithCache(
        query,
        queryParams,
        60 * 5, // 5 minutes cache in seconds
      ) as typeof result;
    } catch (error) {
      // If market data table doesn't exist yet, retry without it
      if (includeMarketData) {
        console.warn(
          "collection_market_data table query failed, retrying without market data:",
          error instanceof Error ? error.message : error,
        );
        return await this.getCollectionDetailsWithMarketData({
          ...options,
          includeMarketData: false,
        });
      }
      throw error;
    }

    // Transform the results to include market data in the expected format
    if (includeMarketData && (result as any).rows) {
      (result as any).rows = (result as any).rows.map((row: any) => {
        // Check if market data exists (use last_updated as indicator)
        // If last_updated is null/undefined, this collection has no market data row
        const hasMarketData = row.marketDataLastUpdated !== undefined &&
          row.marketDataLastUpdated !== null;
        const marketData = hasMarketData
          ? {
            minFloorPriceBTC: parseBTCDecimal(row.minFloorPriceBTC),
            maxFloorPriceBTC: parseBTCDecimal(row.maxFloorPriceBTC),
            avgFloorPriceBTC: parseBTCDecimal(row.avgFloorPriceBTC),
            medianFloorPriceBTC: parseBTCDecimal(row.medianFloorPriceBTC),
            totalVolume24hBTC: parseBTCDecimal(row.totalVolume24hBTC) ?? 0,
            stampsWithPricesCount: parseIntOrNull(row.stampsWithPricesCount) ??
              0,
            minHolderCount: parseIntOrNull(row.minHolderCount) ?? 0,
            maxHolderCount: parseIntOrNull(row.maxHolderCount) ?? 0,
            avgHolderCount: parseFloatOrNull(row.avgHolderCount) ?? 0,
            medianHolderCount: parseIntOrNull(row.medianHolderCount),
            totalUniqueHolders: parseIntOrNull(row.totalUniqueHolders) ?? 0,
            avgDistributionScore: parseFloatOrNull(row.avgDistributionScore) ??
              0,
            totalStampsCount: parseIntOrNull(row.totalStampsCount) ?? 0,
            lastUpdated: row.marketDataLastUpdated
              ? new Date(row.marketDataLastUpdated)
              : null,
          }
          : null;

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
          creators: row.creators ? row.creators.split(",") : [],
          stamps: row.stamp_numbers
            ? row.stamp_numbers.split(",").map(Number)
            : [],
          stamp_count: typeof row.stamp_count === "string"
            ? parseInt(row.stamp_count)
            : row.stamp_count,
          total_editions: typeof row.total_editions === "string"
            ? parseInt(row.total_editions)
            : row.total_editions,
          marketData,
        };
      });
    } else {
      // Even without market data, transform creators and stamps into arrays
      (result as any).rows = (result as any).rows.map((row: any) => ({
        ...row,
        creators: row.creators ? row.creators.split(",") : [],
        stamps: row.stamp_numbers
          ? row.stamp_numbers.split(",").map(Number)
          : [],
        stamp_count: typeof row.stamp_count === "string"
          ? parseInt(row.stamp_count)
          : row.stamp_count,
        total_editions: typeof row.total_editions === "string"
          ? parseInt(row.total_editions)
          : row.total_editions,
      }));
    }

    return result;
  }
}
