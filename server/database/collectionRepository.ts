import { HIDDEN_COLLECTION_NAMES, SMALL_LIMIT, STAMP_TABLE } from "$constants";
import { dbManager } from "$server/database/databaseManager.ts";
import type { CollectionRow, CollectionWithCreators } from "$server/types/collection.d.ts";

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

// HAVING fragment for the editions filter — counts stamps whose supply is
// NOT exactly one unit for their type (divisible stamps store supply in
// satoshi-like units, so one edition = 100_000_000; non-divisible stamps use
// raw supply, so one edition = 1). "single" collections have zero such
// stamps (every stamp is a 1-of-1); "multiple" collections have at least
// one. This per-stamp check is used instead of comparing SUM(editions) to
// COUNT(stamps) because that comparison misclassifies collections
// containing divisible stamps with a supply far below one full unit (e.g.
// supply = 1), which pulls the summed total below the stamp count even
// though those stamps aren't 1-of-1 editions.
function buildEditionsHavingCondition(
  editionsFilter?: "single" | "multiple",
): string | null {
  const nonSingleEditionStamps = `SUM(
    CASE
      WHEN st.divisible = 1 AND st.supply != 100000000 THEN 1
      WHEN st.divisible = 0 AND st.supply != 1 THEN 1
      ELSE 0
    END
  )`;
  if (editionsFilter === "single") {
    return `${nonSingleEditionStamps} = 0`;
  }
  if (editionsFilter === "multiple") {
    return `${nonSingleEditionStamps} > 0`;
  }
  return null;
}

// WHERE fragment excluding known test/placeholder collections by name
// (case-insensitive). Applied in SQL so the total count and the rendered
// rows always match — see HIDDEN_COLLECTION_NAMES.
function buildHiddenNamesCondition(): string {
  const placeholders = HIDDEN_COLLECTION_NAMES.map(() => "?").join(",");
  return `LOWER(c.collection_name) NOT IN (${placeholders})`;
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
      editionsFilter?: "single" | "multiple";
    },
  ) {
    const {
      limit = SMALL_LIMIT,
      page = 1,
      creator,
      sortBy = "DESC",
      minStampCount,
      editionsFilter,
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

    const whereConditions: string[] = [buildHiddenNamesCondition()];
    const hiddenNamesParams = HIDDEN_COLLECTION_NAMES.map((n) => n.toLowerCase());
    if (creator) {
      whereConditions.push(`cc.creator_address = ?`);
    }
    query += ` WHERE ${whereConditions.join(" AND ")}`;
    queryParams.push(...hiddenNamesParams);
    if (creator) {
      queryParams.push(creator);
    }

    query += `
      GROUP BY c.collection_id, c.collection_name, c.collection_description
    `;

    // Add HAVING clause(s) for minimum stamp count / editions filters
    const havingConditions: string[] = [];
    if (minStampCount !== undefined && minStampCount > 0) {
      havingConditions.push(`COUNT(DISTINCT cs.stamp) >= ?`);
      queryParams.push(minStampCount);
    }
    const editionsHaving = buildEditionsHavingCondition(editionsFilter);
    if (editionsHaving) {
      havingConditions.push(editionsHaving);
    }
    if (havingConditions.length > 0) {
      query += ` HAVING ${havingConditions.join(" AND ")}`;
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
    editionsFilter?: "single" | "multiple",
  ) {
    let query: string;
    const queryParams: any[] = [];

    const editionsHaving = buildEditionsHavingCondition(editionsFilter);
    const needsGroupedCount = (minStampCount !== undefined &&
      minStampCount > 0) || editionsHaving !== null;

    if (needsGroupedCount) {
      // Use subquery to count collections matching the stamp-count / editions filters
      query = `
        SELECT COUNT(*) as total FROM (
          SELECT c.collection_id
          FROM collections c
          LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
          LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
          LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
      `;

      const whereConditions: string[] = [buildHiddenNamesCondition()];
      if (creator) {
        whereConditions.push(`cc.creator_address = ?`);
      }
      query += ` WHERE ${whereConditions.join(" AND ")}`;
      queryParams.push(...HIDDEN_COLLECTION_NAMES.map((n) => n.toLowerCase()));
      if (creator) {
        queryParams.push(creator);
      }

      query += ` GROUP BY c.collection_id`;

      const havingConditions: string[] = [];
      if (minStampCount !== undefined && minStampCount > 0) {
        havingConditions.push(`COUNT(DISTINCT cs.stamp) >= ?`);
        queryParams.push(minStampCount);
      }
      if (editionsHaving) {
        havingConditions.push(editionsHaving);
      }
      query += ` HAVING ${havingConditions.join(" AND ")}`;

      query += ` ) as filtered_collections`;
    } else {
      // Simple count for all collections, still excluding hidden names
      query = `SELECT COUNT(DISTINCT c.collection_id) as total FROM collections c`;

      const whereConditions: string[] = [buildHiddenNamesCondition()];
      if (creator) {
        query += ` JOIN collection_creators cc ON c.collection_id = cc.collection_id`;
        whereConditions.push(`cc.creator_address = ?`);
      }
      query += ` WHERE ${whereConditions.join(" AND ")}`;
      queryParams.push(...HIDDEN_COLLECTION_NAMES.map((n) => n.toLowerCase()));
      if (creator) {
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
    ) as { rows: any[] };

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      ...row,
      creators: row.creators ? row.creators.split(",") : [],
      stamp_count: typeof row.stamp_count === "string"
        ? parseInt(row.stamp_count)
        : row.stamp_count,
      total_editions: typeof row.total_editions === "string"
        ? parseFloat(row.total_editions)
        : row.total_editions,
    } as CollectionRow;
  }

  static async getCollectionByStamp(
    stampNumber: number,
  ): Promise<{
    collection_id: string;
    collection_name: string;
    collection_description: string;
  } | null> {
    const query = `
      SELECT collection_name, collection_description, HEX(c.collection_id) as collection_id
      FROM collections c
      JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      WHERE cs.stamp = ?
    `;

    try {
      const result = await this.db.executeQueryWithCache(
        query,
        [stampNumber],
        60 * 5, // 5 minutes cache in seconds
      ) as { rows: Array<{ collection_id: string; collection_name: string; collection_description: string }> };

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      console.debug(
        `getCollectionByStamp: stamp=${stampNumber} -> collection="${row.collection_name}" (${row.collection_id})`,
      );
      return {
        collection_id: row.collection_id,
        collection_name: row.collection_name,
        collection_description: row.collection_description,
      };
    } catch (error) {
      console.error(
        `getCollectionByStamp: error fetching collection for stamp=${stampNumber}:`,
        error,
      );
      throw error;
    }
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

    // Core collection query (no market data JOIN - fetched separately)
    const query = `
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
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN creator cr ON cc.creator_address = cr.address
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
      WHERE c.collection_id = UNHEX(?)
      GROUP BY c.collection_id, c.collection_name, c.collection_description
    `;

    const result = await this.db.executeQueryWithCache(
      query,
      [collectionId],
      60 * 5, // Cache for 5 minutes
    ) as { rows: any[] };

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

    // Fetch market data separately - collection_market_data.collection_id is BINARY(16),
    // so we use UNHEX() to convert the hex string parameter for matching.
    // Actual table columns: collection_id, floor_price_btc, avg_price_btc, total_value_btc,
    // volume_24h_btc, volume_7d_btc, volume_30d_btc, total_volume_btc, total_stamps,
    // unique_holders, listed_stamps, sold_stamps_24h, last_updated, created_at
    let marketData = null;
    if (includeMarketData) {
      try {
        const marketQuery = `
          SELECT
            floor_price_btc,
            avg_price_btc,
            total_value_btc,
            volume_24h_btc,
            volume_7d_btc,
            volume_30d_btc,
            total_volume_btc,
            total_stamps,
            unique_holders,
            listed_stamps,
            sold_stamps_24h,
            last_updated
          FROM collection_market_data
          WHERE collection_id = UNHEX(?)
          LIMIT 1
        `;

        const marketResult = await this.db.executeQueryWithCache(
          marketQuery,
          [collectionId],
          60 * 5, // Cache for 5 minutes
        ) as { rows: any[] };

        if (marketResult.rows && marketResult.rows.length > 0) {
          const md = marketResult.rows[0];
          const floorPrice = parseBTCDecimal(md.floor_price_btc);
          marketData = {
            floorPriceBTC: floorPrice,
            avgPriceBTC: parseBTCDecimal(md.avg_price_btc),
            totalValueBTC: parseBTCDecimal(md.total_value_btc) ?? 0,
            volume24hBTC: parseBTCDecimal(md.volume_24h_btc) ?? 0,
            volume7dBTC: parseBTCDecimal(md.volume_7d_btc) ?? 0,
            volume30dBTC: parseBTCDecimal(md.volume_30d_btc) ?? 0,
            totalVolumeBTC: parseBTCDecimal(md.total_volume_btc) ?? 0,
            totalStamps: parseIntOrNull(md.total_stamps) ?? 0,
            uniqueHolders: parseIntOrNull(md.unique_holders) ?? 0,
            listedStamps: parseIntOrNull(md.listed_stamps) ?? 0,
            soldStamps24h: parseIntOrNull(md.sold_stamps_24h) ?? 0,
            lastUpdated: md.last_updated ? new Date(md.last_updated) : null,
          };
        }
      } catch (error) {
        console.error("Error fetching market data for collection:", collectionId, error);
      }
    }

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
      editionsFilter?: "single" | "multiple";
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
      editionsFilter,
    } = options;
    const offset = (page - 1) * limit;
    const editionsHaving = buildEditionsHavingCondition(editionsFilter);
    const havingConditions: string[] = [];
    if (minStampCount !== undefined && minStampCount > 0) {
      havingConditions.push(`COUNT(DISTINCT cs.stamp) >= ?`);
    }
    if (editionsHaving) {
      havingConditions.push(editionsHaving);
    }

    // Core collection query (no market data JOIN - fetched separately)
    const query = `
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
      FROM collections c
      LEFT JOIN collection_creators cc ON c.collection_id = cc.collection_id
      LEFT JOIN creator cr ON cc.creator_address = cr.address
      LEFT JOIN collection_stamps cs ON c.collection_id = cs.collection_id
      LEFT JOIN ${STAMP_TABLE} st ON cs.stamp = st.stamp
      WHERE ${buildHiddenNamesCondition()}${
      creator ? " AND cc.creator_address = ?" : ""
    }
      GROUP BY c.collection_id, c.collection_name, c.collection_description
      ${
      havingConditions.length > 0
        ? `HAVING ${havingConditions.join(" AND ")}`
        : ""
    }
      ORDER BY c.collection_name ${sortBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams: any[] = [];
    queryParams.push(...HIDDEN_COLLECTION_NAMES.map((n) => n.toLowerCase()));
    if (creator) queryParams.push(creator);
    if (minStampCount !== undefined && minStampCount > 0) queryParams.push(minStampCount);
    queryParams.push(limit, offset);

    const result = await this.db.executeQueryWithCache(
      query,
      queryParams,
      60 * 5, // 5 minutes cache in seconds
    ) as {
      rows: import("../../server/types/collection.d.ts").CollectionRow[];
      [key: string]: any;
    };

    // Build a map of market data keyed by collection_id (hex string)
    // collection_market_data.collection_id is BINARY(16), so use UNHEX() for matching
    // and HEX() in SELECT to get hex strings for the map key.
    let marketDataMap: Map<string, any> | null = null;
    if (includeMarketData && result.rows && result.rows.length > 0) {
      try {
        const collectionIds = result.rows.map((r: any) => r.collection_id);
        const placeholders = collectionIds.map(() => "UNHEX(?)").join(",");
        const marketQuery = `
          SELECT
            HEX(collection_id) as collection_id_hex,
            floor_price_btc,
            avg_price_btc,
            total_value_btc,
            volume_24h_btc,
            volume_7d_btc,
            volume_30d_btc,
            total_volume_btc,
            total_stamps,
            unique_holders,
            listed_stamps,
            sold_stamps_24h,
            last_updated
          FROM collection_market_data
          WHERE collection_id IN (${placeholders})
        `;

        const marketResult = await this.db.executeQueryWithCache(
          marketQuery,
          collectionIds,
          60 * 5,
        ) as { rows: any[] };

        if (marketResult.rows && marketResult.rows.length > 0) {
          marketDataMap = new Map();
          for (const md of marketResult.rows) {
            const hexId = md.collection_id_hex;
            const floorPrice = parseBTCDecimal(md.floor_price_btc);
            marketDataMap.set(hexId, {
              floorPriceBTC: floorPrice,
              avgPriceBTC: parseBTCDecimal(md.avg_price_btc),
              totalValueBTC: parseBTCDecimal(md.total_value_btc) ?? 0,
              volume24hBTC: parseBTCDecimal(md.volume_24h_btc) ?? 0,
              volume7dBTC: parseBTCDecimal(md.volume_7d_btc) ?? 0,
              volume30dBTC: parseBTCDecimal(md.volume_30d_btc) ?? 0,
              totalVolumeBTC: parseBTCDecimal(md.total_volume_btc) ?? 0,
              totalStamps: parseIntOrNull(md.total_stamps) ?? 0,
              uniqueHolders: parseIntOrNull(md.unique_holders) ?? 0,
              listedStamps: parseIntOrNull(md.listed_stamps) ?? 0,
              soldStamps24h: parseIntOrNull(md.sold_stamps_24h) ?? 0,
              lastUpdated: md.last_updated ? new Date(md.last_updated) : null,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching batch market data:", error);
      }
    }

    // Transform rows with market data attached
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
      ...(includeMarketData
        ? { marketData: marketDataMap?.get(row.collection_id) ?? null }
        : {}),
    }));

    return result;
  }
}
