import { DEFAULT_CACHE_DURATION, SMALL_LIMIT, STAMP_TABLE } from "constants";
import { SUBPROTOCOLS } from "globals";
import { getFileSuffixFromMime } from "utils/util.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { FILTER_TYPES, STAMP_TYPES, StampBalance, XCPBalance } from "globals";
import { summarize_issuances } from "./index.ts";
import { dbManager } from "../../server/database/db.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { filterOptions } from "utils/filterOptions.ts";

export class StampRepository {
  static sanitize(input: string): string {
    return input.replace(/[^\w.-]/gi, "");
  }

  private static buildIdentifierConditions(
    whereConditions: string[],
    queryParams: (string | number)[],
    identifier?: string | number | (string | number)[] | undefined,
    type?: STAMP_TYPES,
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string,
    blockIdentifier?: number | string,
    collectionId?: string,
    filterBy?: FILTER_TYPES[],
  ) {
    if (identifier !== undefined) {
      if (Array.isArray(identifier)) {
        const numericIds = identifier.filter((id): id is number =>
          typeof id === "number"
        );
        const stringIds = identifier.filter((id): id is string =>
          typeof id === "string"
        );

        if (numericIds.length > 0) {
          whereConditions.push(
            `st.stamp IN (${numericIds.map(() => "?").join(",")})`,
          );
          queryParams.push(...numericIds);
        }

        if (stringIds.length > 0) {
          whereConditions.push(
            `st.cpid IN (${stringIds.map(() => "?").join(",")})`,
          );
          queryParams.push(...stringIds);
        }
      } else {
        const isNumber = typeof identifier === "number" ||
          !isNaN(Number(identifier));
        const isTxHash = typeof identifier === "string" &&
          identifier.length === 64 && /^[a-fA-F0-9]+$/.test(identifier);
        const isStampHash = typeof identifier === "string" &&
          /^[a-zA-Z0-9]{12,20}$/.test(identifier) && /[a-z]/.test(identifier) &&
          /[A-Z]/.test(identifier);

        if (isNumber) {
          whereConditions.push("st.stamp = ?");
          queryParams.push(Number(identifier));
        } else if (isTxHash) {
          whereConditions.push("st.tx_hash = ?");
          queryParams.push(identifier);
        } else if (isStampHash) {
          whereConditions.push("st.stamp_hash = ?");
          queryParams.push(identifier);
        } else {
          whereConditions.push("st.cpid = ?");
          queryParams.push(identifier);
        }
      }
    } else if (type !== "all") {
      let stampCondition: string;
      if (type === "stamps") {
        stampCondition = "st.stamp >= 0 and st.ident != 'SRC-20'";
      } else if (type === "cursed") {
        stampCondition = "st.stamp < 0";
      } else if (type === "posh") {
        stampCondition =
          "st.stamp < 0 AND st.cpid NOT LIKE 'A%' and st.ident != 'SRC-20'";
      } else if (type === "classic") {
        stampCondition =
          "st.stamp >= 0 AND st.cpid LIKE 'A%' and st.ident != 'SRC-20'";
      } else {
        stampCondition = "";
      }
      if (stampCondition) {
        whereConditions.push(stampCondition);
      }
    }

    // Ident condition
    if (ident) {
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
      whereConditions.push("cs.collection_id = UNHEX(?)");
      queryParams.push(collectionId);
    }

    // File suffix and ident condition
    if (filterBy && filterBy.length > 0) {
      const filterConditions: string[] = [];
      filterBy.forEach((filter) => {
        if (filterOptions[filter]) {
          const { suffixFilters, ident: filterIdent } = filterOptions[filter];
          const suffixCondition = suffixFilters.length > 0
            ? `(${
              suffixFilters.map((suffix) => `st.stamp_url LIKE '%${suffix}'`)
                .join(" OR ")
            })`
            : "";
          const identCondition = filterIdent.length > 0
            ? `(${filterIdent.map(() => "st.ident = ?").join(" OR ")})`
            : "";

          if (suffixCondition && identCondition) {
            filterConditions.push(`(${suffixCondition} AND ${identCondition})`);
            queryParams.push(...filterIdent);
          } else if (suffixCondition) {
            filterConditions.push(suffixCondition);
          } else if (identCondition) {
            filterConditions.push(identCondition);
            queryParams.push(...filterIdent);
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
      collectionId?: string;
      filterBy?: FILTER_TYPES[];
    },
  ) {
    const {
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      collectionId,
      filterBy,
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
    );

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const queryTotal = `
    SELECT COUNT(*) AS total
    FROM ${STAMP_TABLE} AS st
    ${collectionId ? "JOIN collection_stamps cs ON st.stamp = cs.stamp" : ""}
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
  ) {
    try {
      const xcp_balances = await XcpManager.getXcpBalancesByAddress(address);
      const assets = xcp_balances.map((balance: any) => balance.cpid);
      if (assets.length === 0) {
        return {
          rows: [
            {
              total: 0,
            },
          ],
        };
      }
      const query = `
          SELECT 
            COUNT(*) AS total
          FROM 
            ${STAMP_TABLE} st
          LEFT JOIN 
            creator cr ON st.creator = cr.address
          WHERE 
            st.cpid IN (${
        assets.map((asset: string) => `'${asset}'`).join(",")
      })
        `;
      const balances = await dbManager.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION,
      );
      return balances;
    } catch (error) {
      console.error("Error getting balances: ", error);
      return [];
    }
  }

  static async getStampFilenameByIdFromDb(
    identifier: string,
  ): Promise<string | null> {
    const sanitizedIdentifier = this.sanitize(identifier);
    const data = await dbManager.executeQueryWithCache(
      `
      SELECT tx_hash, stamp_hash, stamp_mimetype, cpid, stamp_base64
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

    const tx_hash = data.rows[0]?.tx_hash;
    const stamp_mimetype = data.rows[0]?.stamp_mimetype;

    if (!tx_hash || !stamp_mimetype) {
      return null;
    }

    const ext = getFileSuffixFromMime(stamp_mimetype);
    const fileName = `${tx_hash}.${ext}`;
    const base64 = data.rows[0].stamp_base64;

    return { fileName, base64, stamp_mimetype };
  }

  static async getStampsFromDb(
    options: {
      limit?: number;
      page?: number;
      sortBy?: "asc" | "desc";
      type?: STAMP_TYPES;
      ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
      identifier?: string | number | (string | number)[];
      blockIdentifier?: number | string;
      allColumns?: boolean;
      noPagination?: boolean;
      cacheDuration?: number | "never";
      collectionId?: string;
      sortColumn?: string;
      filterBy?: FILTER_TYPES[];
    },
  ) {
    const {
      limit = SMALL_LIMIT,
      page = 1,
      sortBy = "ASC",
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      allColumns = false,
      noPagination = false,
      cacheDuration = 1000 * 60 * 3,
      collectionId,
      sortColumn = "tx_index",
      filterBy,
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
    );

    const specificColumns = `
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
      st.is_btc_stamp, 
      st.file_hash
    `;

    const selectClause = allColumns
      ? "st.*, cr.creator AS creator_name"
      : specificColumns;
    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";
    const order = sortBy.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const orderClause = `ORDER BY st.${sortColumn} ${order}`;

    let limitClause = "";
    let offsetClause = "";

    if (!noPagination) {
      limitClause = `LIMIT ${limit}`;
      const offset = Math.max(0, (page - 1) * limit);
      offsetClause = `OFFSET ${offset}`;
    }

    const query = `
    SELECT ${selectClause}
    FROM ${STAMP_TABLE} AS st
    ${collectionId ? "JOIN collection_stamps cs ON st.stamp = cs.stamp" : ""}
    LEFT JOIN creator AS cr ON st.creator = cr.address
    ${whereClause}
    ${orderClause}
    ${limitClause}
    ${offsetClause}
    `;

    const result = await dbManager.executeQueryWithCache(
      query,
      queryParams,
      cacheDuration,
    );

    return result;
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
  static async getStampBalancesByAddressFromDb(
    address: string,
    limit = BIG_LIMIT,
    page = 1,
    order = "DESC",
  ): Promise<StampBalance[]> {
    const offset = (page - 1) * limit;
    try {
      const xcp_balances = await XcpManager.getXcpBalancesByAddress(address);
      const assets = xcp_balances.map((balance: XCPBalance) => balance.cpid);

      const query = `
        SELECT 
          st.cpid, 
          st.stamp, 
          st.stamp_base64,
          st.stamp_url, 
          st.stamp_mimetype, 
          st.tx_hash, 
          st.divisible, 
          st.supply, 
          st.locked, 
          st.creator, 
          cr.creator AS creator_name
        FROM 
          ${STAMP_TABLE} st
        LEFT JOIN 
          creator cr ON st.creator = cr.address
        WHERE 
          st.cpid IN ( ${
        assets.map((asset: string) => `'${asset}'`).join(", ")
      } )
        ORDER BY st.stamp ${order}
        LIMIT ${limit}
        OFFSET ${offset};
      `;

      const balances = await dbManager.executeQueryWithCache(
        query,
        assets,
        DEFAULT_CACHE_DURATION,
      );

      const grouped = balances.rows.reduce(
        (acc: Record<string, StampBalance[]>, cur: StampBalance) => {
          acc[cur.cpid] = acc[cur.cpid] || [];
          acc[cur.cpid].push({
            ...cur,
            is_btc_stamp: cur.is_btc_stamp ?? 0,
          });
          return acc;
        },
        {},
      );

      const summarized = Object.keys(grouped).map((key) =>
        summarize_issuances(grouped[key])
      );

      return summarized.map((summary: StampBalance) => {
        const xcp_balance = xcp_balances.find((
          balance: { cpid: string; quantity: number },
        ) => balance.cpid === summary.cpid);
        return {
          ...summary,
          balance: xcp_balance ? xcp_balance.quantity : 0,
        };
      });
    } catch (error) {
      console.error("Error getting balances: ", error);
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
}
