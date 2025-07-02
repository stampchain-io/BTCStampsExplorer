import { DEFAULT_CACHE_DURATION, SMALL_LIMIT, STAMP_TABLE } from "$constants";
import { SUBPROTOCOLS } from "$globals";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampBalance,
  StampFilters,
  STAMP_FILETYPES,
  STAMP_EDITIONS,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_FILESIZES
} from "$globals";
import { XcpBalance } from "$types/index.d.ts";
import { summarize_issuances } from "./index.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { filterOptions } from "$lib/utils/filterOptions.ts";
import {
  isStampNumber,
  isTxHash,
  isStampHash,
  isCpid,
  getIdentifierType,
} from "$lib/utils/identifierUtils.ts";
import { getMimeType, getFileSuffixFromMime } from "$lib/utils/imageUtils.ts";
import { logger, LogNamespace } from "$lib/utils/logger.ts";

export class StampRepository {
  // Dependency injection support
  private static db: typeof dbManager = dbManager;
  
  static setDatabase(database: typeof dbManager): void {
    this.db = database;
  }

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
    suffix?: STAMP_SUFFIX_FILTERS[],
    isSearchQuery?: boolean,
    filters?: StampFilters,
    editions?: STAMP_EDITIONS[],
    range?: STAMP_RANGES,
    rangeMin?: string,
    rangeMax?: string
  ) {

    if (identifier !== undefined) {
      if (Array.isArray(identifier)) {
        const validIdentifiers = identifier.filter(
          (id) =>
            isStampNumber(id) || isTxHash(id) || isStampHash(id) || isCpid(id)
        );

        if (validIdentifiers.length === 0) {
          whereConditions.push("1 = 0");
          return;
        }

        const numericIds = validIdentifiers.filter((id): id is number =>
          isStampNumber(id)
        ); 
        const txHashes = validIdentifiers.filter((id): id is string =>
          isTxHash(id)
        );
        const stampHashes = validIdentifiers.filter((id): id is string =>
          isStampHash(id)
        );
        const cpids = validIdentifiers.filter((id): id is string => isCpid(id));

        const conditions: string[] = [];

        if (numericIds.length > 0) {
          conditions.push(
            `st.stamp IN (${numericIds.map(() => "?").join(",")})`
          );
          queryParams.push(...numericIds.map(Number));
        }

        if (txHashes.length > 0) {
          conditions.push(
            `st.tx_hash IN (${txHashes.map(() => "?").join(",")})`
          );
          queryParams.push(...txHashes);
        }

        if (stampHashes.length > 0) {
          conditions.push(
            `st.stamp_hash IN (${stampHashes.map(() => "?").join(",")})`
          );
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
      } else if (type === "stamps" && !identifier) {
        if (!isSearchQuery)
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
    if (ident && ident.length > 0 && !isSearchQuery) {
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
        typeof blockIdentifier === "number" ||
        /^\d+$/.test(blockIdentifier)
      ) {
        whereConditions.push("st.block_index = ?");
        queryParams.push(Number(blockIdentifier));
      } else if (
        typeof blockIdentifier === "string" &&
        blockIdentifier.length === 64
      ) {
        whereConditions.push("st.block_hash = ?");
        queryParams.push(blockIdentifier);
      }
    }

    if (collectionId) {
      if (Array.isArray(collectionId)) {
        whereConditions.push(
          `cs1.collection_id IN (${collectionId
            .map(() => "UNHEX(?)")
            .join(",")})`
        );
        queryParams.push(...collectionId);
      } else {
        whereConditions.push("cs1.collection_id = UNHEX(?)");
        queryParams.push(collectionId);
      }
    }

    // File suffix condition from suffix
    if (suffix && suffix.length > 0) {
      // Extract different filter types
      const fileExtensions = suffix.filter(filter => 
        !["legacy", "olga", "single", "multiple", "locked", "unlocked", "divisible"].includes(filter)
      );
      
      const encodingFilters = suffix.filter(filter => 
        filter === "legacy" || filter === "olga"
      );
      
      const editions = suffix.filter(filter => 
        ["single", "multiple", "locked", "unlocked", "divisible"].includes(filter)
      ) as STAMP_EDITIONS[];
      
      // Process file extensions
      if (fileExtensions.length > 0) {
        const suffixCondition = fileExtensions
          .map((suffix) => `st.stamp_url LIKE '%${suffix}'`)
          .join(" OR ");
        whereConditions.push(`(${suffixCondition})`);
      }
      
      // Process encoding filters
      if (encodingFilters.length > 0) {
        const encodingCondition = this.buildEncodingFilterSQL(encodingFilters);
        if (encodingCondition) {
          whereConditions.push(encodingCondition);
        }
      }
      
      // Process edition filters
      if (editions.length > 0) {
        this.buildEditionsFilterConditions(editions, whereConditions, queryParams);
      }
    }

    // **FilterBy conditions**
    if (filterBy && filterBy.length > 0 && !isSearchQuery) {
      const filterConditions: string[] = [];

      filterBy.forEach((filter) => {
        if (filterOptions[filter]) {
          const { suffixFilters: filterSuffixes, ident: filterIdent } =
            filterOptions[filter];

          const suffixCondition =
            filterSuffixes && filterSuffixes.length > 0
              ? `(${filterSuffixes
                  .map((suffix) => `st.stamp_url LIKE '%${suffix}'`)
                  .join(" OR ")})`
              : "";

          const identCondition =
            filterIdent && filterIdent.length > 0
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

    // Handle new filter system if filters are provided
    if (filters) {
      this.buildFilterConditions(filters, whereConditions, queryParams);
    }

    // Handle edition filters if not using the full filters object
    if (editions && editions.length > 0 && !filters) {
      this.buildEditionsFilterConditions(editions, whereConditions, queryParams);
    }

    // Handle range filters
    if (range) {
      this.buildRangeFilterConditions(
        range, 
        whereConditions, 
        queryParams, 
        rangeMin, 
        rangeMax
      );
    }
  }

  static async getTotalStampCountFromDb(options: {
    type?: STAMP_TYPES;
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
    identifier?: string | number | (string | number)[];
    blockIdentifier?: number | string;
    collectionId?: string | string[];
    filterBy?: STAMP_FILTER_TYPES[];
    suffix?: STAMP_SUFFIX_FILTERS[];
    fileType?: STAMP_FILETYPES[];
    creatorAddress?: string;
  }) {
    const {
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      collectionId,
      filterBy,
      suffix = [],
      fileType = [],
      creatorAddress,
    } = options;

    // Combine filters
    const combinedFilters = [...suffix, ...fileType];

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
      combinedFilters,
      false,
      undefined,
      undefined,
      undefined
    );

    if (creatorAddress) {
      whereConditions.push("st.creator = ?");
      queryParams.push(creatorAddress);
    }

    const whereClause =
      whereConditions.length > 0
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

    const resultTotal = await this.db.executeQueryWithCache(
      queryTotal,
      queryParams,
      60 * 3 // 3 minute cache in seconds
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
      const assets = xcpBalances.map((balance) => balance.cpid);
      if (assets.length === 0) {
        return {
          rows: [{ total: 0 }],
        };
      }

      console.log(
        `[StampRepository] Counting total stamps for ${assets.length} assets`
      );

      const query = `
        SELECT COUNT(*) AS total
        FROM ${STAMP_TABLE} st
        LEFT JOIN creator cr ON st.creator = cr.address
        WHERE st.cpid IN (${assets.map(() => "?").join(",")})
      `;

      const result = await this.db.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION
      );

      console.log(
        `[StampRepository] Total count query returned: ${result.rows[0]?.total}`
      );
      return result;
    } catch (error) {
      console.error("Error getting balance count:", error);
      return { rows: [{ total: 0 }] };
    }
  }

  static async getStampFile(identifier: string) {
    const sanitizedIdentifier = this.sanitize(identifier);
    const idType = getIdentifierType(sanitizedIdentifier);

    await logger.debug("content" as LogNamespace, {
      message: "StampRepository.getStampFile called",
      identifier,
      sanitizedIdentifier,
      idType,
    });

    // Build query based on identifier type
    let whereClause: string;
    let params: string[];

    switch (idType) {
      case "cpid":
        whereClause = "cpid = ?";
        params = [sanitizedIdentifier];
        break;

      case "stamp_number":
        whereClause = "stamp = ?";
        params = [sanitizedIdentifier];
        break;

      case "tx_hash":
        whereClause = "tx_hash = ?";
        params = [sanitizedIdentifier];
        break;

      case "stamp_hash":
        whereClause = "stamp_hash = ?";
        params = [sanitizedIdentifier];
        break;

      default:
        return null;
    }

    const query = `
      SELECT 
        tx_hash,
        stamp_hash,
        stamp_mimetype,
        cpid,
        stamp_base64,
        stamp_url,
        stamp
      FROM ${STAMP_TABLE}
      WHERE ${whereClause}
      AND stamp IS NOT NULL
      LIMIT 1;
    `;

    try {
      await logger.debug("content" as LogNamespace, {
        message: "StampRepository executing query",
        query,
        params,
        whereClause,
      });

      const data = await this.db.executeQueryWithCache(
        query,
        params,
        DEFAULT_CACHE_DURATION
      );

      await logger.debug("content" as LogNamespace, {
        message: "StampRepository query result",
        hasData: !!data?.rows?.length,
        cpid: data?.rows?.[0]?.cpid,
        mimetype: data?.rows?.[0]?.stamp_mimetype,
        identifier,
      });

      if (!data?.rows?.length) {
        return null;
      }

      const row = data.rows[0];

      // Build filename from tx_hash and stamp_url if available
      const suffix = row.stamp_url ? row.stamp_url.split(".").pop() : null;
      const fileName = suffix ? `${row.tx_hash}.${suffix}` : row.tx_hash;

      // Clean stamp_url to be relative path
      const cleanStampUrl = row.stamp_url
        ?.replace(/^https?:\/\/[^\/]+\/stamps\//, "") // Remove domain and /stamps/
        ?.replace(/^stamps\//, ""); // Also remove any standalone /stamps/ prefix

      await logger.debug("content" as LogNamespace, {
        message: "StampRepository processing URLs",
        originalUrl: row.stamp_url,
        cleanUrl: cleanStampUrl,
        fileName,
        suffix,
      });

      return {
        fileName,
        stamp_base64: row.stamp_base64,
        stamp_url: cleanStampUrl, // Store relative path
        tx_hash: row.tx_hash,
        stamp_mimetype: row.stamp_mimetype,
        stamp_hash: row.stamp_hash,
        cpid: row.cpid,
        stamp: row.stamp,
      };
    } catch (error) {
      await logger.error("content" as LogNamespace, {
        message: "StampRepository error",
        error: error instanceof Error ? error.message : String(error),
        identifier,
      });
      throw error;
    }
  }

  static async getStamps(options: {
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
    groupBy?: string;
    groupBySubquery?: boolean;
    collectionStampLimit?: number;
    skipTotalCount?: boolean;
    selectColumns?: string[];
    includeSecondary?: boolean;
    creatorAddress?: string;
    isSearchQuery?: boolean;
    filters?: StampFilters;
    filterBy?: STAMP_FILTER_TYPES[];
    suffix?: STAMP_SUFFIX_FILTERS[];
    fileType?: STAMP_FILETYPES[];
    editions?: STAMP_EDITIONS[];
    range?: STAMP_RANGES;
    rangeMin?: string;
    rangeMax?: string;
    market?: Extract<STAMP_MARKETPLACE, "listings" | "sales"> | "";
    dispensers?: boolean;
    atomics?: boolean;
    listings?: Extract<STAMP_MARKETPLACE, "all" | "bargain" | "affordable" | "premium" | "custom"> | "";
    listingsMin?: string;
    listingsMax?: string;
    sales?: Extract<STAMP_MARKETPLACE, "recent" | "premium" | "custom" | "volume"> | "";
    salesMin?: string;
    salesMax?: string;
    volume?: "24h" | "7d" | "30d" | "";
    volumeMin?: string;
    volumeMax?: string;
    fileSize?: STAMP_FILESIZES | null;
    fileSizeMin?: string;
    fileSizeMax?: string;
  }) {
    // Extract all parameters including both filter types
    const {
      limit = 100,
      page = 0,
      sortBy = "DESC",
      type,
      ident,
      identifier,
      blockIdentifier,
      allColumns = false,
      noPagination = false,
      cacheDuration = 60 * 3, // Default 3 minute cache in seconds
      collectionId,
      sortColumn = "block_index",
      groupBy,
      groupBySubquery = false,
      collectionStampLimit,
      skipTotalCount = false,
      selectColumns,
      includeSecondary = false,
      creatorAddress,
      isSearchQuery = false,
      filters,
      filterBy = [],
      suffix = [],
      fileType = [],
      editions = [],
      range,
      rangeMin,
      rangeMax,
      market,
      dispensers,
      atomics,
      listings,
      listingsMin,
      listingsMax,
      sales,
      salesMin,
      salesMax,
      volume,
      volumeMin,
      volumeMax,
      fileSize,
      fileSizeMin,
      fileSizeMax,
    } = options;

    // Combine both filter types for processing
    const combinedFilters = [...suffix, ...fileType];

    // Rest of the method remains the same, but use combinedFilters instead
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
      combinedFilters,
      isSearchQuery,
      filters,
      editions,
      range,
      rangeMin,
      rangeMax
    );

    if (creatorAddress) {
      whereConditions.push("st.creator = ?");
      queryParams.push(creatorAddress);
    }

    // Use either the object or direct parameters
    let effectiveRange = range;
    
    // If no range but direct parameters are provided, use those
    if (!effectiveRange && (rangeMin || rangeMax)) {
      effectiveRange = {
        sub: "stamp range",
        stampRange: {
          min: rangeMin || "",
          max: rangeMax || ""
        }
      } as STAMP_RANGES;
      console.log("Repository created range filters:", effectiveRange);
    }

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
      st.stamp_url, 
      st.stamp_mimetype,
      st.supply, 
      st.block_time, 
      st.tx_hash, 
      st.tx_index, 
      st.ident, 
      st.stamp_hash, 
      st.file_hash
    `;

    const secondaryColumns = `
      st.stamp_base64

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
      ? `st.${selectColumns.join(", st.")}` // Only selected columns if specified
      : allColumns
      ? `${coreColumns}, ${secondaryColumns}, ${extendedColumns}` // All columns including secondary
      : includeSecondary
      ? `${coreColumns}, ${secondaryColumns}` // Core + secondary columns
      : coreColumns; // Just core columns by default

    // Only include collection_id in select clause if collectionId is provided
    if (collectionId) {
      selectClause += `,
      HEX(cs1.collection_id) AS collection_id`;
    }

    const whereClause =
      whereConditions.length > 0
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

    // Check if any market data filters are present (Task 42)
    const hasMarketDataFilters = !!(
      filters?.minHolderCount || 
      filters?.maxHolderCount ||
      filters?.minDistributionScore ||
      filters?.maxTopHolderPercentage ||
      filters?.minFloorPriceBTC ||
      filters?.maxFloorPriceBTC ||
      filters?.minVolume24h ||
      filters?.minPriceChange24h ||
      filters?.minDataQualityScore ||
      filters?.maxCacheAgeMinutes ||
      filters?.priceSource
    );

    // Build join clause
    let joinClause = `
      LEFT JOIN creator AS cr ON st.creator = cr.address
    `;

    // Add market data join if needed
    if (hasMarketDataFilters) {
      joinClause += `
        LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid
      `;
    }

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
      
      // Add market data join if needed for collections
      if (hasMarketDataFilters) {
        joinClause += `
          LEFT JOIN stamp_market_data smd ON st.cpid = smd.cpid
        `;
      }
    }

    let groupByClause = "";
    if (groupBy) {
      groupByClause = `GROUP BY ${groupBy}`;
    }

    let query = ""; // Declare query variable

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
            WHERE cs1.collection_id IN (${collectionId
              .map(() => "UNHEX(?)")
              .join(",")})
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

    // Near the end of the getStamps method, right before executing the query
    console.log("[SQL DEBUG] Final SQL query:", query);
    console.log("[SQL DEBUG] With parameters:", queryParams);

    // Execute the data query
    const dataResult = await this.db.executeQueryWithCache(
      query,
      queryParams,
      cacheDuration
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
        suffix,
        fileType,
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
      const assets = xcpBalances.map((balance) => balance.cpid);
      if (assets.length === 0) return [];

      const offset = (page - 1) * limit;
      console.log(
        `[StampRepository] Fetching stamps with limit: ${limit}, offset: ${offset}`
      );

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

      const balances = await this.db.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION
      );

      console.log(
        `[StampRepository] Query returned ${balances.rows.length} rows of ${assets.length} total stamps`
      );

      const grouped = balances.rows.reduce(
        (acc: Record<string, StampBalance[]>, cur: StampBalance) => {
          acc[cur.cpid] = acc[cur.cpid] || [];
          acc[cur.cpid].push({ ...cur });
          return acc;
        },
        {}
      );

      const summarized = Object.keys(grouped).map((key) =>
        summarize_issuances(grouped[key])
      );
      // Use the passed xcpBalances for quantity info
      return summarized.map((summary: StampBalance) => {
        const xcp_balance = xcpBalances
          .filter((balance) => balance.cpid === summary.cpid)
          .reduce((acc, balance) => acc + balance.quantity, 0);
        const utxos = xcpBalances
          .filter(
            (balance) => balance.cpid === summary.cpid && balance.utxo
          )
          .map((balance) => ({
            quantity: balance.quantity,
            utxo: balance.utxo,
          }));
        const unbound_quantity = xcpBalances
          .filter(
            (balance) => balance.cpid === summary.cpid && !balance.utxo
          )
          .reduce((total, balance) => total + (balance.quantity || 0), 0);
        return {
          ...summary,
          unbound_quantity,
          address: xcpBalances.length ? xcpBalances[0].address : "",
          balance: xcp_balance ? xcp_balance : 0,
          utxos,
        };
      });
    } catch (error) {
      console.error("Error getting balances:", error);
      return [];
    }
  }

  static async getALLCPIDs(cacheDuration: number | "never" = 60 * 3) {
    const query = `
      SELECT DISTINCT cpid, stamp
      FROM ${STAMP_TABLE}
      WHERE ident != 'SRC-20'
      ORDER BY cpid ASC
    `;

    const result = await this.db.executeQueryWithCache(
      query,
      [],
      cacheDuration
    );

    console.log(`Query result:`, result.rows);

    return result.rows;
  }

  static async getCreatorNameByAddress(
    address: string
  ): Promise<string | null> {
    const query = `
      SELECT creator
      FROM creator
      WHERE address = ?
    `;

    const result = await this.db.executeQueryWithCache(
      query,
      [address],
      "never"
    );

    if (result && result.rows && result.rows.length > 0) {
      return result.rows[0].creator;
    }

    return null;
  }

  static async updateCreatorName(
    address: string,
    newName: string
  ): Promise<boolean> {
    const query = `
      INSERT INTO creator (address, creator)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE creator = ?
    `;

    try {
      const result = await this.db.executeQuery(query, [
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

  static async countTotalStamps(): Promise<{
    isValid: boolean;
    count: number;
  }> {
    try {
      const result = await this.getTotalStampCountFromDb({
        type: "all",
        skipTotalCount: false,
      });
      // If we can't get a count or it's 0, that indicates a database problem
      if (!result?.rows?.[0]?.total) {
        throw new Error("No stamps found in database");
      }
      const total = result.rows[0].total;
      return {
        isValid: true,
        count: total,
      };
    } catch (error) {
      console.error("Database connection check failed:", error);
      return {
        isValid: false,
        count: 0,
      };
    }
  }

  static async getStampsCreatedCount(address: string): Promise<{ total: number }> {
    const query = `
      SELECT COUNT(DISTINCT st.stamp) as total
      FROM ${STAMP_TABLE} st
      WHERE st.creator = ?
      AND st.ident IN ('STAMP', 'SRC-721')
    `;

    const result = await this.db.executeQueryWithCache(
      query,
      [address],
      60 * 3 // 3 minute cache in seconds
    );

    return {
      total: result.rows[0]?.total || 0
    };
  }

  static async getSpecificStamp(tx_index: string): Promise<{ stamp_url: string, stamp_mimetype: string }>{
     const query = `
      SELECT stamp_url, stamp_mimetype
      FROM ${STAMP_TABLE}
      WHERE stamp = ?
    `;


    const result = await this.db.executeQueryWithCache(
      query,
      [tx_index],
      DEFAULT_CACHE_DURATION
    );

    return {
      stamp_url: result.rows[0]?.stamp_url || 0,
      stamp_mimetype: result.rows[0]?.stamp_mimetype || 0
    };
  }

  /**
   * Builds SQL conditions for filtering stamps by file type
   * @param filetypes Array of file type filters
   * @param whereConditions Array of SQL conditions to append to
   * @param queryParams Array of parameters to append to
   */
  private static buildFileTypeFilterConditions(
    filetypes: STAMP_FILETYPES[],
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    // Separate encoding filters (legacy/olga) from mimetype filters
    const mimetypeFilters = filetypes.filter(type => 
      type !== "legacy" && type !== "olga"
    );
    
    const encodingFilters = filetypes.filter(type => 
      type === "legacy" || type === "olga"
    );
    
    // Handle mimetype filters
    if (mimetypeFilters.length > 0) {
      const mimetypeConditions = mimetypeFilters.map(filetype => {
        if (filetype === "jpg" || filetype === "jpeg") {
          return "st.stamp_mimetype = 'image/jpeg'";
        } else if (filetype === "png") {
          return "st.stamp_mimetype = 'image/png'";
        } else if (filetype === "gif") {
          return "st.stamp_mimetype = 'image/gif'";
        } else if (filetype === "webp") {
          return "st.stamp_mimetype = 'image/webp'";
        } else if (filetype === "avif") {
          return "st.stamp_mimetype = 'image/avif'";
        } else if (filetype === "bmp") {
          return "st.stamp_mimetype = 'image/bmp'";
        } else if (filetype === "svg") {
          return "st.stamp_mimetype = 'image/svg+xml'";
        } else if (filetype === "html") {
          return "st.stamp_mimetype = 'text/html'";
        } else if (filetype === "txt") {
          return "st.stamp_mimetype = 'text/plain'";
        } else if (filetype === "mp3" || filetype === "mpeg") {
          return "st.stamp_mimetype = 'audio/mpeg'";
        }
        return "";
      }).filter(Boolean);
      
      if (mimetypeConditions.length > 0) {
        whereConditions.push(`(${mimetypeConditions.join(" OR ")})`);
      }
    }
    
    // Handle encoding filters
    if (encodingFilters.length > 0) {
      const encodingCondition = this.buildEncodingFilterSQL(encodingFilters);
      if (encodingCondition) {
        whereConditions.push(encodingCondition);
      }
    }
  }

  /**
   * Builds SQL conditions for filtering stamps by encoding type (legacy or OLGA)
   * @param filters Array of file type filters that may include "legacy" or "olga"
   * @returns SQL condition string for filtering by encoding based on block height
   */
  private static buildEncodingFilterSQL(filters: STAMP_FILETYPES[]): string {
    if (!filters || !filters.includes("legacy") && !filters.includes("olga")) {
      return "";
    }
    
    let sql = "";
    
    if (filters.includes("legacy")) {
      sql += "st.block_index < 833000";
    }
    
    if (filters.includes("olga")) {
      if (sql) sql += " OR ";
      sql += "st.block_index >= 833000";
    }
    
    return sql ? `(${sql})` : "";
  }

  /**
   * Builds all SQL filter conditions from the given filters object
   * @param filters StampFilters object containing all filter options
   * @param whereConditions Array of SQL conditions to append to
   * @param queryParams Array of parameters to append to
   */
  private static buildFilterConditions(
    filters: StampFilters,
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    // Handle fileType filters (including encoding filters)
    if (filters.fileType && filters.fileType.length > 0) {
      this.buildFileTypeFilterConditions(filters.fileType, whereConditions, queryParams);
    }
    
    // Handle editions filters
    if (filters.editions && filters.editions.length > 0) {
      this.buildEditionsFilterConditions(filters.editions, whereConditions, queryParams);
    }
    
    // Handle range filters
    if (filters.range) {
      this.buildRangeFilterConditions(filters.range, whereConditions, queryParams, undefined, undefined);
    }
    
    // Handle market filters
    if (filters.market) {
      this.buildMarketFilterConditions(filters.market, undefined, undefined, whereConditions, queryParams);
    }
    
    // Handle new market data filters (Task 42)
    this.buildMarketDataFilterConditions(filters, whereConditions, queryParams);
    
    // Handle search text
    if (filters.search) {
      this.buildSearchConditions(filters.search, whereConditions, queryParams);
    }
  }

  /**
   * Builds SQL conditions for filtering stamps by edition properties
   * @param editions Array of edition filters
   * @param whereConditions Array of SQL conditions to append to
   * @param queryParams Array of parameters to append to
   */
  private static buildEditionsFilterConditions(
    editions: STAMP_EDITIONS[],
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    if (!editions || editions.length === 0) {
      return;
    }
    
    // Group filters by category
    const supplyFilters = [];
    const lockFilters = [];
    const divisibilityFilters = [];
    
    // Sort filters into their respective categories
    if (editions.includes("single")) {
      supplyFilters.push("st.supply = 1");
    }
    
    if (editions.includes("multiple")) {
      supplyFilters.push("st.supply > 1");
    }
    
    if (editions.includes("locked")) {
      lockFilters.push("st.locked = 1");
    }
    
    if (editions.includes("unlocked")) {
      lockFilters.push("st.locked = 0");
    }
    
    if (editions.includes("divisible")) {
      divisibilityFilters.push("st.divisible = 1");
    }
    
    // Build category conditions - within each category use OR
    const categoryConditions = [];
    
    if (supplyFilters.length > 0) {
      categoryConditions.push(`(${supplyFilters.join(" OR ")})`);
    }
    
    if (lockFilters.length > 0) {
      categoryConditions.push(`(${lockFilters.join(" OR ")})`);
    }
    
    if (divisibilityFilters.length > 0) {
      categoryConditions.push(`(${divisibilityFilters.join(" OR ")})`);
    }
    
    // Combine categories with AND logic (must satisfy all selected categories)
    if (categoryConditions.length > 0) {
      whereConditions.push(categoryConditions.join(" AND "));
    }
  }

  private static buildRangeFilterConditions(
    range: STAMP_RANGES,
    whereConditions: string[],
    queryParams: (string | number)[],
    rangeMin?: string,
    rangeMax?: string
  ) {
    console.log("[RANGE DEBUG] Starting buildRangeFilterConditions with:", range);
    console.log("[RANGE DEBUG] Type of range:", typeof range);
    console.log("[RANGE DEBUG] Initial whereConditions:", whereConditions);
    console.log("[RANGE DEBUG] Custom range values:", { min: rangeMin, max: rangeMax });

    // Handle preset ranges first
    if (range && range !== "custom") {
      console.log("[RANGE DEBUG] Processing preset range:", range);
      whereConditions.push("(st.stamp < ?)");
      queryParams.push(range);
      return; // Exit early for preset ranges
    }

    // Handle custom range
    if (range === "custom" || (rangeMin || rangeMax)) {
      console.log("[RANGE DEBUG] Handling custom range");
      if (rangeMin && rangeMax) {
        whereConditions.push("(st.stamp BETWEEN ? AND ?)");
        queryParams.push(rangeMin, rangeMax);
      } else if (rangeMin) {
        whereConditions.push("(st.stamp >= ?)");
        queryParams.push(rangeMin);
      } else if (rangeMax) {
        whereConditions.push("(st.stamp <= ?)");
        queryParams.push(rangeMax);
      }
    }

    console.log("[RANGE DEBUG] Final whereConditions:", whereConditions);
    console.log("[RANGE DEBUG] Final queryParams:", queryParams);
  }

  private static buildMarketFilterConditions(
    marketFilters: STAMP_MARKETPLACE[],
    marketMin?: string,
    marketMax?: string,
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    if (!marketFilters?.length) return;

    // Group filters by category
    const listingFilters = [];
    const saleFilters = [];

    // Sort filters into their respective categories
    // if (marketFilters.includes("atomic")) {
    //   listingFilters.push("st.has_active_atomic = true");
    // }
    // if (marketFilters.includes("dispensers")) {
    //   listingFilters.push("st.has_active_dispenser = true");
    // }
    // old listings push("st.unbound_quantity > 0");
    if (marketFilters.includes("listings")) {
      listingFilters.push("st.has_active_dispenser = true");
    }
    if (marketFilters.includes("sales")) {
      saleFilters.push("st.has_recent_sale = true");
    }
    // NEEDS TO BE CORRECTLY UPDATED
    if (marketFilters.includes("psbt")) {
      saleFilters.push("st.has_recent_sale = true");
    }

    // Build category conditions - within each category use OR
    const categoryConditions = [];

    if (listingFilters.length > 0) {
      categoryConditions.push(`(${listingFilters.join(" OR ")})`);
    }

    if (saleFilters.length > 0) {
      categoryConditions.push(`(${saleFilters.join(" OR ")})`);
    }

    // Combine categories with AND logic
    if (categoryConditions.length > 0) {
      whereConditions.push(categoryConditions.join(" AND "));
    }

    // Price range conditions
    if (marketMin) {
      whereConditions.push("st.market_price >= ?");
      queryParams.push(marketMin);
    }
    if (marketMax) {
      whereConditions.push("st.market_price <= ?");
      queryParams.push(marketMax);
    }
  }

  /**
   * Builds SQL conditions for filtering stamps by market data metrics (Task 42)
   * @param filters StampFilters object containing market data filter options
   * @param whereConditions Array of SQL conditions to append to
   * @param queryParams Array of parameters to append to
   */
  private static buildMarketDataFilterConditions(
    filters: StampFilters,
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    // Note: These filters require joining with stamp_market_data table
    // The join should be handled in the main query when any market data filter is present
    
    // Holder metrics
    if (filters.minHolderCount) {
      whereConditions.push("smd.holder_count >= ?");
      queryParams.push(Number(filters.minHolderCount));
    }
    if (filters.maxHolderCount) {
      whereConditions.push("smd.holder_count <= ?");
      queryParams.push(Number(filters.maxHolderCount));
    }
    if (filters.minDistributionScore) {
      whereConditions.push("smd.holder_distribution_score >= ?");
      queryParams.push(Number(filters.minDistributionScore));
    }
    if (filters.maxTopHolderPercentage) {
      whereConditions.push("smd.top_holder_percentage <= ?");
      queryParams.push(Number(filters.maxTopHolderPercentage));
    }
    
    // Market metrics
    if (filters.minFloorPriceBTC) {
      whereConditions.push("smd.floor_price_btc >= ?");
      queryParams.push(Number(filters.minFloorPriceBTC));
    }
    if (filters.maxFloorPriceBTC) {
      whereConditions.push("smd.floor_price_btc <= ?");
      queryParams.push(Number(filters.maxFloorPriceBTC));
    }
    if (filters.minVolume24h) {
      whereConditions.push("smd.volume_24h_btc >= ?");
      queryParams.push(Number(filters.minVolume24h));
    }
    if (filters.minPriceChange24h) {
      // Note: Price change is available in src20_market_data, not stamp_market_data
      // This might require a different join or approach
      console.log("Warning: minPriceChange24h filter requires src20_market_data join");
    }
    
    // Data quality
    if (filters.minDataQualityScore) {
      whereConditions.push("smd.data_quality_score >= ?");
      queryParams.push(Number(filters.minDataQualityScore));
    }
    if (filters.maxCacheAgeMinutes) {
      whereConditions.push("TIMESTAMPDIFF(MINUTE, smd.last_updated, NOW()) <= ?");
      queryParams.push(Number(filters.maxCacheAgeMinutes));
    }
    if (filters.priceSource) {
      const sources = filters.priceSource.split(',').map(s => s.trim());
      if (sources.length > 0) {
        const placeholders = sources.map(() => "?").join(",");
        whereConditions.push(`smd.price_source IN (${placeholders})`);
        queryParams.push(...sources);
      }
    }
  }
}
