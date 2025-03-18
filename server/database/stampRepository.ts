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
  STAMP_RARITY,
  STAMP_MARKET
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
import type { STAMP_RARITY } from "$/globals.d.ts";

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
    isSearchQuery?: boolean,
    filters?: StampFilters,
    editionFilters?: STAMP_EDITIONS[],
    rarityFilters?: STAMP_RARITY
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

    // File suffix condition from suffixFilters
    if (suffixFilters && suffixFilters.length > 0) {
      // Extract different filter types
      const fileExtensions = suffixFilters.filter(filter => 
        !["legacy", "olga", "single", "multiple", "locked", "unlocked", "divisible"].includes(filter)
      );
      
      const encodingFilters = suffixFilters.filter(filter => 
        filter === "legacy" || filter === "olga"
      );
      
      const editionFilters = suffixFilters.filter(filter => 
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
      if (editionFilters.length > 0) {
        this.buildEditionsFilterConditions(editionFilters, whereConditions, queryParams);
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
    if (editionFilters && editionFilters.length > 0 && !filters) {
      this.buildEditionsFilterConditions(editionFilters, whereConditions, queryParams);
    }

    // Handle rarity filters
    if (rarityFilters) {
      this.buildRarityFilterConditions(rarityFilters, whereConditions, queryParams);
    }
  }

  static async getTotalStampCountFromDb(options: {
    type?: STAMP_TYPES;
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
    identifier?: string | number | (string | number)[];
    blockIdentifier?: number | string;
    collectionId?: string | string[];
    filterBy?: STAMP_FILTER_TYPES[];
    suffixFilters?: STAMP_SUFFIX_FILTERS[];
    filetypeFilters?: STAMP_FILETYPES[];
    creatorAddress?: string;
  }) {
    const {
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      collectionId,
      filterBy,
      suffixFilters = [],
      filetypeFilters = [],
      creatorAddress,
    } = options;

    // Combine filters
    const combinedFilters = [...suffixFilters, ...filetypeFilters];

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

    const resultTotal = await dbManager.executeQueryWithCache(
      queryTotal,
      queryParams,
      1000 * 60 * 3
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

      const result = await dbManager.executeQueryWithCache(
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

      const data = await dbManager.executeQueryWithCache(
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
    sortOrder?: string;
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
    suffixFilters?: STAMP_SUFFIX_FILTERS[];
    filetypeFilters?: STAMP_FILETYPES[];
    editionFilters?: STAMP_EDITIONS[];
    rarityFilters?: STAMP_RARITY;
  }) {
    // Extract all parameters including both filter types
    const {
      limit = 100,
      page = 0,
      sortBy = "DESC",
      sortOrder,
      type,
      ident,
      identifier,
      blockIdentifier,
      allColumns = false,
      noPagination = false,
      cacheDuration = 1000 * 60 * 3,
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
      suffixFilters = [],
      filetypeFilters = [],
      editionFilters = [],
      rarityFilters,
    } = options;

    // Combine both filter types for processing
    const combinedFilters = [...suffixFilters, ...filetypeFilters];

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
      editionFilters,
      rarityFilters
    );

    if (creatorAddress) {
      whereConditions.push("st.creator = ?");
      queryParams.push(creatorAddress);
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

    const order = sortOrder?.includes("asc") ? "ASC" : "DESC"
    // const order = sortBy.toUpperCase() === "DESC" ? "DESC" : "ASC";
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

    // Execute the data query
    const dataResult = await dbManager.executeQueryWithCache(
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
        suffixFilters,
        filetypeFilters,
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

      const balances = await dbManager.executeQueryWithCache(
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

    const result = await dbManager.executeQueryWithCache(
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

    const result = await dbManager.executeQueryWithCache(
      query,
      [address],
      1000 * 60 * 3 // 3 minute cache
    );

    return {
      total: result.rows[0]?.total || 0
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
        } else if (filetype === "mp3" || filetype === "mpeg") {
          return "st.stamp_mimetype = 'audio/mpeg'";
        } else if (filetype === "bmp") {
          return "st.stamp_mimetype = 'image/bmp'";
        } else if (filetype === "svg") {
          return "st.stamp_mimetype = 'image/svg+xml'";
        } else if (filetype === "html") {
          return "st.stamp_mimetype = 'text/html'";
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
    // Handle filetype filters (including encoding filters)
    if (filters.filetype && filters.filetype.length > 0) {
      this.buildFileTypeFilterConditions(filters.filetype, whereConditions, queryParams);
    }
    
    // Handle editions filters
    if (filters.editions && filters.editions.length > 0) {
      this.buildEditionsFilterConditions(filters.editions, whereConditions, queryParams);
    }
    
    // Handle rarity filters
    if (filters.rarity) {
      this.buildRarityFilterConditions(filters.rarity, whereConditions, queryParams);
    }
    
    // Handle market filters
    if (filters.market) {
      this.buildMarketFilterConditions(filters.market, whereConditions, queryParams);
    }
    
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

  private static buildRarityFilterConditions(
    rarityFilters: STAMP_RARITY,
    whereConditions: string[],
    queryParams: (string | number)[]
  ) {
    // Handle preset range (string value)
    if (typeof rarityFilters === 'string') {
      switch (rarityFilters) {
        case "100":
          whereConditions.push("(st.stamp < 100 AND st.stamp >= 0)");
          break;
        case "1000":
          whereConditions.push("(st.stamp < 1000 AND st.stamp >= 100)");
          break;
        case "5000":
          whereConditions.push("(st.stamp < 5000 AND st.stamp >= 1000)");
          break;
        case "10000":
          whereConditions.push("(st.stamp < 10000 AND st.stamp >= 5000)");
          break;
      }
    }
    // Handle custom stamp range (object value)
    else if (typeof rarityFilters === 'object' && rarityFilters && 'stampRange' in rarityFilters) {
      const { min, max } = rarityFilters.stampRange;
      const rangeConditions = [];
      
      if (min !== undefined && min !== null && min !== '') {
        rangeConditions.push("st.stamp >= ?");
        queryParams.push(Number(min));
      }
      
      if (max !== undefined && max !== null && max !== '') {
        rangeConditions.push("st.stamp <= ?");
        queryParams.push(Number(max));
      }
      
      if (rangeConditions.length > 0) {
        whereConditions.push(`(${rangeConditions.join(" AND ")})`);
      }
    }
  }
}
