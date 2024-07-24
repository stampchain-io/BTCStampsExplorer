import { Client } from "$mysql/mod.ts";
import { SMALL_LIMIT, STAMP_TABLE, TTL_CACHE } from "constants";
import { PROTOCOL_IDENTIFIERS as SUBPROTOCOLS } from "utils/protocol.ts";
import { get_balances } from "utils/xcp.ts";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { getFileSuffixFromMime } from "utils/util.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { StampBalance, XCPBalance } from "globals";
import { summarize_issuances } from "./index.ts";

export class StampRepository {
  static async getTotalStampCountFromDb(
    client: Client,
    type: "stamps" | "cursed" | "all",
    ident?: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
  ) {
    let stampCondition = "";
    if (type !== "all") {
      stampCondition = type === "stamps" ? "stamp >= 0" : "stamp < 0";
    }

    let query = `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE 1=1
    `;

    if (stampCondition) {
      query += ` AND ${stampCondition}`;
    }

    if (ident) {
      const identList = Array.isArray(ident) ? ident : [ident];
      const identCondition = identList.map((id) => `ident = '${id}'`).join(
        " OR ",
      );
      query += ` AND (${identCondition}) AND is_btc_stamp IS NOT NULL`;
    }

    query += ";";

    return await handleSqlQueryWithCache(
      client,
      query,
      [],
      1000 * 60 * 3,
    );
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
    client: Client,
    address: string,
  ) {
    try {
      const xcp_balances = await get_balances(address);
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
      const balances = await handleSqlQueryWithCache(
        client,
        query,
        assets,
        TTL_CACHE,
      );
      return balances;
    } catch (error) {
      console.error("Error getting balances: ", error);
      return [];
    }
  }

  static async getStampFilenameByIdFromDb(
    client: Client,
    identifier: string,
  ) {
    const data = await handleSqlQueryWithCache(
      client,
      `
      SELECT tx_hash, stamp_hash, stamp_mimetype, cpid
      FROM ${STAMP_TABLE}
      WHERE (cpid = ? OR tx_hash = ? OR stamp_hash = ?)
      AND stamp IS NOT NULL;
      `,
      [identifier, identifier, identifier],
      TTL_CACHE,
    );
    if (!data) return null;
    const ext = getFileSuffixFromMime(data.rows[0].stamp_mimetype);
    return `${data.rows[0].tx_hash}.${ext}`;
  }

  static async getStampsFromDb(
    client: Client,
    options: {
      limit?: number;
      page?: number;
      sort_order?: "asc" | "desc";
      type?: "stamps" | "cursed" | "all";
      ident?: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string;
      identifier?: string | number;
      blockIdentifier?: number | string;
      all_columns?: boolean;
      no_pagination?: boolean;
      cache_duration?: number | "never";
    },
  ) {
    const {
      limit = SMALL_LIMIT,
      page = 1,
      sort_order = "asc",
      type = "stamps",
      ident,
      identifier,
      blockIdentifier,
      all_columns = false,
      no_pagination = false,
      cache_duration = 1000 * 60 * 3,
    } = options;

    const whereConditions = [];
    const queryParams: (string | number)[] = [];

    // Identifier condition (stamp, tx_hash, cpid, or stamp_hash)
    if (identifier !== undefined) {
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
    } else if (type !== "all") {
      // Only add this condition if we're not searching for a specific stamp
      const stampCondition = type === "stamps"
        ? "st.stamp >= 0"
        : "st.stamp < 0";
      whereConditions.push(stampCondition);
    }

    // Ident condition
    if (ident) {
      const identList = Array.isArray(ident) ? ident : [ident];
      const identCondition = `(${
        identList.map(() => "st.ident = ?").join(" OR ")
      })`;
      whereConditions.push(identCondition);
      queryParams.push(...(identList as string[]));
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

    const selectClause = all_columns
      ? "st.*, cr.creator AS creator_name"
      : specificColumns;

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const order = sort_order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    const orderClause = `ORDER BY st.stamp ${order}`;

    let limitClause = "";
    let offsetClause = "";

    if (!no_pagination) {
      limitClause = `LIMIT ${limit}`;
      const offset = (page - 1) * limit;
      offsetClause = `OFFSET ${offset}`;
    }

    const query = `
      SELECT ${selectClause}
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      ${whereClause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `;

    console.log(`Executing query:`, query);
    console.log(`Query params:`, queryParams);

    const result = await handleSqlQueryWithCache(
      client,
      query,
      queryParams,
      cache_duration,
    );
    console.log(`Query result:`, result);

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
    client: Client,
    address: string,
    limit = BIG_LIMIT,
    page = 1,
    order = "DESC",
  ): Promise<StampBalance[]> {
    const offset = (page - 1) * limit;
    try {
      const xcp_balances = await get_balances(address);
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

      const balances = await handleSqlQueryWithCache(
        client,
        query,
        assets,
        TTL_CACHE,
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
}
