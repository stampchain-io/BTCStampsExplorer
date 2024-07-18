import { Client } from "$mysql/mod.ts";
import { CommonClass, summarize_issuances } from "./index.ts";
import { SMALL_LIMIT, STAMP_TABLE, TTL_CACHE } from "constants";
import { PROTOCOL_IDENTIFIERS as SUBPROTOCOLS } from "utils/protocol.ts";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { get_suffix_from_mimetype } from "utils/util.ts";

export class StampsClass {
  static async get_total_stamp_count(
    client: Client,
    type: "stamps" | "cursed",
    ident?: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
  ) {
    const stampCondition = type === "stamps" ? "stamp >= 0" : "stamp < 0";
    let query = `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE ${stampCondition}
    `;

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

  static async get_stamps_by_page_with_client(
    client: Client,
    limit = SMALL_LIMIT,
    page = 1,
    sort_order: "asc" | "desc" = "asc",
    type: "stamps" | "cursed",
  ) {
    const offset = (page - 1) * limit;
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const stampCondition = type === "stamps" ? "st.stamp >= 0" : "st.stamp < 0";
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT st.*, cr.creator AS creator_name
        FROM ${STAMP_TABLE} AS st
        LEFT JOIN creator AS cr ON st.creator = cr.address
        WHERE ${stampCondition}
        ORDER BY st.stamp ${order}
        LIMIT ? OFFSET ?;
      `,
      [limit, offset],
      1000 * 60 * 3,
    );
  }

  static async get_resumed_stamps_by_page_with_client(
    client: Client,
    page_size = SMALL_LIMIT,
    page = 1,
    orderBy = "DESC",
    filterBy,
    typeBy: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
    type: "stamps" | "cursed",
  ) {
    orderBy = orderBy.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (page - 1) * page_size;
    const stampCondition = type === "stamps" ? "st.stamp >= 0" : "st.stamp < 0";
    const identList = Array.isArray(typeBy) ? typeBy : [typeBy];
    const identCondition = identList.map((id) => `ident = '${id}'`).join(
      " OR ",
    );

    return await handleSqlQueryWithCache(
      client,
      `
      SELECT
        st.stamp,
        st.cpid,
        st.creator,
        cr.creator AS creator_name,
        st.tx_hash,
        st.stamp_mimetype,
        st.supply,
        st.divisible,
        st.locked,
        st.ident,
        st.block_time,
        st.block_index
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE ${stampCondition} AND ${identCondition}
      ORDER BY st.stamp ${orderBy}
      LIMIT ? OFFSET ?;
      `,
      [page_size, offset],
      1000 * 60 * 3,
    );
  }

  static async get_resumed_stamps(
    client: Client,
    order = "DESC",
    typeBy: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
    type: "stamps" | "cursed",
  ) {
    const identList = Array.isArray(typeBy) ? typeBy : [typeBy];
    const identCondition = identList.map((id) => `ident = '${id}'`).join(
      " OR ",
    );

    const stampCondition = type === "stamps" ? "stamp >= 0" : "stamp < 0";

    order = order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    return await handleSqlQueryWithCache(
      client,
      `
      SELECT
        st.stamp,
        st.cpid,
        st.creator,
        cr.creator AS creator_name,
        st.tx_hash,
        st.stamp_mimetype,
        st.supply,
        st.divisible,
        st.locked,
        st.ident,
        st.block_time,
        st.block_index
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.is_btc_stamp IS NOT NULL AND (${identCondition}) AND (${stampCondition})
      `,
      [],
      1000 * 60 * 3,
    );
  }

  static async get_stamps_by_ident_with_client(
    client: Client,
    ident: typeof SUBPROTOCOLS,
    limit = SMALL_LIMIT,
    page = 1,
    type: "stamps" | "cursed",
  ) {
    const offset = (page - 1) * limit;
    const stampCondition = type === "stamps" ? "st.stamp >= 0" : "st.stamp < 0";
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT
        st.stamp,
        st.cpid,
        st.creator,
        cr.creator AS creator_name,
        st.tx_hash, st.stamp_mimetype,
        st.supply, st.divisible,
        st.locked,
        st.ident,
        st.block_time,
        st.block_index
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.ident = ?
      AND ${stampCondition}
      ORDER BY st.stamp
      LIMIT ? OFFSET ?;
      `,
      [ident, limit, offset],
      1000 * 60 * 3,
    );
  }

  static async get_stamp_file_by_identifier_with_client(
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
    const ext = get_suffix_from_mimetype(data.rows[0].stamp_mimetype);
    return `${data.rows[0].tx_hash}.${ext}`;
  }

  static async get_stamp_with_client(client: Client, id: string) {
    const data = await CommonClass.get_stamps_by_stamp_tx_hash_cpid_stamp_hash(
      client,
      id,
    );

    if (!data || !data.rows) return null;
    const stamp = summarize_issuances(data.rows);
    return stamp;
  }
}
