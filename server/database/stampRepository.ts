import { DEFAULT_CACHE_DURATION, SMALL_LIMIT, STAMP_TABLE } from "$constants";
import { SUBPROTOCOLS } from "globals";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampBalance,
} from "globals";
import { XcpBalance } from "$types/index.d.ts";
import { summarize_issuances } from "./index.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { filterOptions } from "$lib/utils/filterOptions.ts";
import { isStampNumber, isTxHash, isStampHash, isCpid } from "$lib/utils/identifierUtils.ts";

export class StampRepository {
  static sanitize(input: string): string {
    return input.replace(/[^\w.-]/gi, "");
  }

  private static buildIdentifierConditions(
    whereConditions: string[],
    queryParams: (string | number)[],
    identifier?: string | number | (string | number)[],
    type?: STAMP_TYPES,
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string,
    blockIdentifier?: number | string,
    collectionId?: string | string[],
    filterBy?: STAMP_FILTER_TYPES[],
    suffixFilters?: STAMP_SUFFIX_FILTERS[],
  ) {
    if (identifier !== undefined) {
      if (Array.isArray(identifier)) {
        const validIdentifiers = identifier.filter(id => 
          isStampNumber(id) || isTxHash(id) || isStampHash(id) || isCpid(id)
        );

        if (validIdentifiers.length === 0) {
          whereConditions.push("1 = 0");
          return;
        }

        const numericIds = validIdentifiers.filter((id): id is number => isStampNumber(id));
        const txHashes = validIdentifiers.filter((id): id is string => isTxHash(id));
        const stampHashes = validIdentifiers.filter((id): id is string => isStampHash(id));
        const cpids = validIdentifiers.filter((id): id is string => isCpid(id));

        const conditions: string[] = [];

        if (numericIds.length > 0) {
          conditions.push(`st.stamp IN (${numericIds.map(() => "?").join(",")})`);
          queryParams.push(...numericIds.map(Number));
        }

        if (txHashes.length > 0) {
          conditions.push(`st.tx_hash IN (${txHashes.map(() => "?").join(",")})`);
          queryParams.push(...txHashes);
        }

        if (stampHashes.length > 0) {
          conditions.push(`st.stamp_hash IN (${stampHashes.map(() => "?").join(",")})`);
          queryParams.push(...stampHashes);
        }

        if (cpids.length > 0) {
          conditions.push(`st.cpid IN (${cpids.map(() => "?").join(",")})`);
          queryParams.push(...cpids);
        }

        whereConditions.push(`(${conditions.join(" OR ")})`);
      } else {
        if (isStampNumber(identifier)) {
          whereConditions.push("st.stamp = ?");
          queryParams.push(Number(identifier));
        } else if (isTxHash(identifier)) {
          whereConditions.push("st.tx_hash = ?");
          queryParams.push(identifier);
        } else if (isStampHash(identifier)) {
          whereConditions.push("st.stamp_hash = ?");
          queryParams.push(identifier);
        } else if (isCpid(identifier)) {
          whereConditions.push("st.cpid = ?");
          queryParams.push(identifier);
        } else {
          whereConditions.push("1 = 0");
        }
      }
    }

    // Type-based stamp condition
    let stampCondition = "";
    if (type !== "all") {
      if (type === "cursed") {
        stampCondition = "st.stamp < 0";
      } else if (type === "stamps") {
        stampCondition = "st.stamp >= 0 AND st.ident != 'SRC-20'";
      } else if (type === "posh") {
        stampCondition =
          "st.stamp < 0 AND st.cpid NOT LIKE 'A%' AND st.ident != 'SRC-20'";
      } else if (type === "classic") {
        stampCondition =
          "st.stamp >= 0 AND st.cpid LIKE 'A%' AND st.ident != 'SRC-20'";
      } else if (type === "src20") {
        stampCondition = "st.ident = 'SRC-20'";
      }
      if (stampCondition) {
        whereConditions.push(`(${stampCondition})`);
      }
    } else {
      // For 'all' type, only exclude 'SRC-20'- this messes up the api/block route
      // stampCondition = "st.ident != 'SRC-20'";
      // whereConditions.push(`(${stampCondition})`);
    }

    // Ident condition
    if (ident && ident.length > 0) {
      const identList = Array.isArray(ident) ? ident : [ident];
      if (identList.length > 0) {
        const identCondition = identList.map(() => "st.ident = ?").join(" OR ");
        whereConditions.push(`(${identCondition})`);
        queryParams.push(...identList.map(String));
      }
    }

    // Block identifier condition
    if (blockIdentifier !== undefined) {
      if (
        typeof blockIdentifier === "number" || /^\d+$/.test(blockIdentifier)
      ) {
        whereConditions.push("st.block_index = ?");
        queryParams.push(Number(blockIdentifier));
      } else if (
        typeof blockIdentifier === "string" && blockIdentifier.length === 64
      ) {
        whereConditions.push("st.block_hash = ?");
        queryParams.push(blockIdentifier);
      }
    }

    if (collectionId) {
      if (Array.isArray(collectionId)) {
        whereConditions.push(
          `cs1.collection_id IN (${
            collectionId.map(() => "UNHEX(?)").join(",")
          })`,
        );
        queryParams.push(...collectionId);
      } else {
        whereConditions.push("cs1.collection_id = UNHEX(?)");
        queryParams.push(collectionId);
      }
    }

    // File suffix condition from suffixFilters
    if (suffixFilters && suffixFilters.length > 0) {
      const suffixCondition = suffixFilters.map((suffix) =>
        `st.stamp_url LIKE '%${suffix}'`
      ).join(" OR ");
      whereConditions.push(`(${suffixCondition})`);
    }

    // **FilterBy conditions**
    if (filterBy && filterBy.length > 0) {
      const filterConditions: string[] = [];

      filterBy.forEach((filter) => {
        if (filterOptions[filter]) {
          const { suffixFilters: filterSuffixes, ident: filterIdent } =
            filterOptions[filter];

          const suffixCondition = filterSuffixes && filterSuffixes.length > 0
            ? `(${
              filterSuffixes.map((suffix) => `st.stamp_url LIKE '%${suffix}'`)
                .join(" OR ")
            })`
            : "";

          const identCondition = filterIdent && filterIdent.length > 0
            ? `(${filterIdent.map(() => "st.ident = ?").join(" OR ")})`
            : "";

          // Add ident parameters to queryParams
          if (filterIdent && filterIdent.length > 0) {
            queryParams.push(...filterIdent.map(String));
          }

          if (suffixCondition && identCondition) {
            filterConditions.push(`(${identCondition} AND ${suffixCondition})`);
          } else if (identCondition) {
            filterConditions.push(identCondition);
          } else if (suffixCondition) {
            filterConditions.push(suffixCondition);
          }
        }
      });

      if (filterConditions.length > 0) {
        whereConditions.push(`(${filterConditions.join(" OR ")})`);
      }
    }
  }

  static async getTotalStampCountFromDb(
    options: {
      type?: STAMP_TYPES;
      ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
      identifier?: string | number | (string | number)[];
      blockIdentifier?: number | string;
      collectionId?: string | string[];
      filterBy?: STAMP_FILTER_TYPES[];
      suffixFilters?: STAMP_SUFFIX_FILTERS[];
    },
  ) {
    const {
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      collectionId,
      filterBy,
      suffixFilters,
    } = options;

    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    this.buildIdentifierConditions(
      whereConditions,
      queryParams,
      identifier,
      type,
      ident,
      blockIdentifier,
      collectionId,
      filterBy,
      suffixFilters,
    );

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // Build join clause
    let joinClause = `
      LEFT JOIN creator AS cr ON st.creator = cr.address
    `;

    // Include collection_stamps join only if collectionId is provided
    if (collectionId) {
      joinClause = `
        JOIN collection_stamps cs1 ON st.stamp = cs1.stamp
        ${joinClause}
      `;
    }

    const queryTotal = `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE} AS st
      ${joinClause}
      ${whereClause}
    `;

    const resultTotal = await dbManager.executeQueryWithCache(
      queryTotal,
      queryParams,
      1000 * 60 * 3,
    );

    return resultTotal;
  }

  /**
   * Retrieves the total stamp balance for a given address using the provided database client.
   *
   * @param client - The database client to use for the query.
   * @param address - The address for which to retrieve the stamp balance.
   * @returns A promise that resolves to the total stamp balance.
   * @throws If there is an error retrieving the balances.
   */
  static async getCountStampBalancesByAddressFromDb(
    address: string,
    xcpBalances: XcpBalance[]
  ) {
    try {
      const assets = xcpBalances.map(balance => balance.cpid);
      if (assets.length === 0) {
        return {
          rows: [{ total: 0 }]
        };
      }

      console.log(`[StampRepository] Counting total stamps for ${assets.length} assets`);

      const query = `
        SELECT COUNT(*) AS total
        FROM ${STAMP_TABLE} st
        LEFT JOIN creator cr ON st.creator = cr.address
        WHERE st.cpid IN (${assets.map(() => "?").join(",")})
      `;

      const result = await dbManager.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION
      );

      console.log(`[StampRepository] Total count query returned: ${result.rows[0]?.total}`);
      return result;
    } catch (error) {
      console.error("Error getting balance count:", error);
      return { rows: [{ total: 0 }] };
    }
  }

  static async getStampFilenameByIdFromDb(
    identifier: string,
  ): Promise<string | null> {
    const sanitizedIdentifier = this.sanitize(identifier);
    const data = await dbManager.executeQueryWithCache(
      `
      SELECT tx_hash, stamp_hash, stamp_mimetype, cpid, stamp_base64, stamp_url
      FROM ${STAMP_TABLE}
      WHERE (cpid = ? OR tx_hash = ? OR stamp_hash = ?)
      AND stamp IS NOT NULL;
      `,
      [sanitizedIdentifier, sanitizedIdentifier, sanitizedIdentifier],
      DEFAULT_CACHE_DURATION,
    );

    if (!data || data.rows.length === 0) {
      return null;
    }

    const { tx_hash, stamp_mimetype, stamp_url, stamp_base64 } = data.rows[0];

    if (!tx_hash || !stamp_mimetype || !stamp_url) {
      return null;
    }

    // Get extension from stamp_url
    const extension = stamp_url.split('.').pop() || '';
    const fileName = `${tx_hash}.${extension}`;

    return { fileName, base64: stamp_base64, stamp_mimetype };
  }

  static async getStamps(
    options: {
      limit?: number;
      page?: number;
      sortBy?: "ASC" | "DESC";
      type?: STAMP_TYPES;
      ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
      identifier?: string | number | (string | number)[];
      blockIdentifier?: number | string;
      allColumns?: boolean;
      noPagination?: boolean;
      cacheDuration?: number | "never";
      collectionId?: string | string[];
      sortColumn?: string;
      filterBy?: STAMP_FILTER_TYPES[];
      suffixFilters?: STAMP_SUFFIX_FILTERS[];
      groupBy?: string;
      groupBySubquery?: boolean;
      collectionStampLimit?: number;
      skipTotalCount?: boolean;
      selectColumns?: string[];
    },
  ) {
    const queryOptions = {
      limit: SMALL_LIMIT,
      page: 1,
      sortBy: "ASC",
      type: "stamps",
      ...options,
      ...(options.collectionId && (!options.groupBy || !options.groupBySubquery) ? {
        groupBy: "collection_id",
        groupBySubquery: true
      } : {})
    };

    const {
      limit,
      page,
      sortBy,
      type,
      ident,
      identifier,
      blockIdentifier,
      allColumns = false,
      noPagination = false,
      cacheDuration = 1000 * 60 * 3,
      collectionId,
      sortColumn = "tx_index",
      filterBy,
      suffixFilters,
      groupBy,
      groupBySubquery = false,
      collectionStampLimit = 12,
      skipTotalCount = false,
      selectColumns,
    } = queryOptions;

    const whereConditions: string[] = [];
    const queryParams: (string | number)[] = [];

    this.buildIdentifierConditions(
      whereConditions,
      queryParams,
      identifier,
      type,
      ident,
      blockIdentifier,
      collectionId,
      filterBy,
      suffixFilters,
    );

    // Core stamp fields that are always needed
    const coreColumns = `
      st.stamp, 
      st.block_index, 
      st.cpid, 
      st.creator, 
      cr.creator AS creator_name, 
      st.divisible, 
      st.keyburn, 
      st.locked, 
      st.stamp_base64, 
      st.stamp_mimetype, 
      st.stamp_url, 
      st.supply, 
      st.block_time, 
      st.tx_hash, 
      st.tx_index, 
      st.ident, 
      st.stamp_hash, 
      st.file_hash
    `;

    // Extended fields for full stamp details
    const extendedColumns = `
      st.asset_longname,
      st.message_index,
      st.src_data,
      st.is_btc_stamp,
      st.is_reissue,
      st.is_valid_base64
    `;

    // Select either custom columns, or core+extended columns, or just core columns
    let selectClause = selectColumns 
      ? `st.${selectColumns.join(', st.')}` // Only selected columns if specified
      : allColumns 
        ? `${coreColumns}, ${extendedColumns}` // All columns if allColumns is true
        : coreColumns; // Just core columns by default

    // Only include collection_id in select clause if collectionId is provided
    if (collectionId) {
      selectClause += `,
      HEX(cs1.collection_id) AS collection_id`;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const order = sortBy.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const orderClause = `ORDER BY st.${sortColumn} ${order}`;

    let limitClause = "";
    let offsetClause = "";

    if (!noPagination) {
      limitClause = `LIMIT ?`;
      const offset = Math.max(0, (page - 1) * limit);
      offsetClause = `OFFSET ?`;
      queryParams.push(limit, offset);
    }

    // Build join clause
    let joinClause = `
      LEFT JOIN creator AS cr ON st.creator = cr.address
    `;

    // Include collection_stamps join only if collectionId is provided
    if (collectionId) {
      // Add warning if collection query is missing required parameters
      if (!groupBy || groupBy !== "collection_id" || !groupBySubquery) {
        console.warn(
          "Warning: Collection query missing required parameters. For optimal collection querying, use groupBy: 'collection_id' and groupBySubquery: true"
        );
      }

      joinClause = `
        JOIN collection_stamps cs1 ON st.stamp = cs1.stamp
        LEFT JOIN creator AS cr ON st.creator = cr.address
      `;
    }

    let groupByClause = "";
    if (groupBy) {
      groupByClause = `GROUP BY ${groupBy}`;
    }

    let query = ''; // Declare query variable

    if (collectionId && groupBy === "collection_id") {
      // Handle single collection case differently from multiple collections
      if (!Array.isArray(collectionId)) {
        // Simple query for single collection with standard pagination
        query = `
          SELECT ${selectClause}
          FROM ${STAMP_TABLE} AS st
          ${joinClause}
          ${whereClause}
          ${orderClause}
          ${limitClause}
          ${offsetClause}
        `;
      } else {
        // Complex query for multiple collections with per-collection limits
        const subQuery = `
          WITH ValidStamps AS (
            SELECT 
              ${coreColumns},
              HEX(cs1.collection_id) as collection_id,
              ROW_NUMBER() OVER (
                PARTITION BY cs1.collection_id 
                ORDER BY st.${sortColumn} ${order}
              ) as rn
            FROM ${STAMP_TABLE} st
            ${joinClause}
            WHERE cs1.collection_id IN (${collectionId.map(() => "UNHEX(?)").join(",")})
              AND (
                st.stamp_url IS NOT NULL
                AND st.stamp_url != ''
                AND st.stamp_url NOT LIKE '%undefined%'
                AND st.stamp_url NOT LIKE '%null%'
                AND st.stamp_mimetype IS NOT NULL
              )
          )
        `;

        // Main query with pagination
        query = `
          ${subQuery}
          SELECT *
          FROM ValidStamps ranked_stamps
          WHERE rn <= ${collectionStampLimit}
          ORDER BY ${sortColumn} ${order}
          LIMIT ? OFFSET ?
        `;

        // Add parameters for multiple collections
        queryParams.push(...collectionId);
      }
    } else {
      // Standard query for non-collection cases
      query = `
        SELECT ${selectClause}
        FROM ${STAMP_TABLE} AS st
        ${joinClause}
        ${whereClause}
        ${groupByClause}
        ${orderClause}
        ${limitClause}
        ${offsetClause}
      `;
    }

    // Execute the data query
    const dataResult = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      cacheDuration,
    );

    // Get total count only if needed
    let total = 0;
    let totalPages = 1;

    if (!skipTotalCount) {
      const totalResult = await this.getTotalStampCountFromDb({
        type,
        ident,
        identifier,
        blockIdentifier,
        collectionId,
        filterBy,
        suffixFilters,
      });
      total = totalResult.rows[0]?.total || 0;
      totalPages = noPagination ? 1 : Math.ceil(total / limit);
    }

    return {
      stamps: dataResult.rows,
      page,
      page_size: limit,
      pages: totalPages,
      total,
    };
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
  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
    xcpBalances: XcpBalance[],
    order = "DESC"
  ): Promise<StampBalance[]> {
    try {
      const assets = xcpBalances.map(balance => balance.cpid);
      if (assets.length === 0) return [];

      const offset = (page - 1) * limit;
      console.log(`[StampRepository] Fetching stamps with limit: ${limit}, offset: ${offset}`);

      const query = `
        SELECT 
          st.stamp, 
          st.tx_hash,
          st.cpid, 
          st.stamp_url, 
          st.stamp_mimetype, 
          st.divisible, 
          st.supply, 
          st.locked, 
          st.creator, 
          cr.creator AS creator_name
        FROM ${STAMP_TABLE} st
        LEFT JOIN creator cr ON st.creator = cr.address
        WHERE st.cpid IN (${assets.map(() => "?").join(",")})
        ORDER BY st.stamp ${order}
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      const balances = await dbManager.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION
      );

      console.log(`[StampRepository] Query returned ${balances.rows.length} rows of ${assets.length} total stamps`);

      const grouped = balances.rows.reduce(
        (acc: Record<string, StampBalance[]>, cur: StampBalance) => {
          acc[cur.cpid] = acc[cur.cpid] || [];
          acc[cur.cpid].push({ ...cur });
          return acc;
        },
        {}
      );

      const summarized = Object.keys(grouped).map(key => 
        summarize_issuances(grouped[key])
      );

      // Use the passed xcpBalances for quantity info
      return summarized.map((summary: StampBalance) => {
        const xcp_balance = xcpBalances.find(
          balance => balance.cpid === summary.cpid
        );
        return {
          ...summary,
          balance: xcp_balance ? xcp_balance.quantity : 0
        };
      });
    } catch (error) {
      console.error("Error getting balances:", error);
      return [];
    }
  }

  static async getALLCPIDs(cacheDuration: number | "never" = 1000 * 60 * 3) {
    const query = `
      SELECT DISTINCT cpid, stamp
      FROM ${STAMP_TABLE}
      WHERE ident != 'SRC-20'
      ORDER BY cpid ASC
    `;

    const result = await dbManager.executeQueryWithCache(
      query,
      [],
      cacheDuration,
    );

    console.log(`Query result:`, result.rows);

    return result.rows;
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    const query = `
      SELECT creator
      FROM creator
      WHERE address = ?
    `;

    const result = await dbManager.executeQueryWithCache(
      query,
      [address],
      "never",
    );

    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0].creator;
    }

    return null;
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    const query = `
      INSERT INTO creator (address, creator)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE creator = ?
    `;

    try {
      const result = await dbManager.executeQuery(query, [
        address,
        newName,
        newName,
      ]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating creator name:", error);
      return false;
    }
  }

  static async countTotalStamps(): Promise<{ isValid: boolean; count: number }> {
    try {
      const result = await this.getTotalStampCountFromDb({
        type: "all",
        skipTotalCount: false
      });
      // If we can't get a count or it's 0, that indicates a database problem
      if (!result?.rows?.[0]?.total) {
        throw new Error("No stamps found in database");
      }
      const total = result.rows[0].total;
      return {
        isValid: true,
        count: total
      };
    } catch (error) {
      console.error("Database connection check failed:", error);
      return {
        isValid: false,
        count: 0
      };
    }
  }
}
