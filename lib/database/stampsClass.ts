import { Client } from "$mysql/mod.ts";
import { CommonClass, summarize_issuances } from "./index.ts";
import { SMALL_LIMIT, STAMP_TABLE, TTL_CACHE } from "constants";
import { PROTOCOL_IDENTIFIERS as SUBPROTOCOLS } from "utils/protocol.ts";
import { handleSqlQueryWithCache } from "utils/cache.ts";
import { get_suffix_from_mimetype } from "utils/util.ts";

export class StampsClass {
  static async get_total_stamps_with_client(
    client: Client,
    type: "stamps" | "cursed",
  ) {
    const stampCondition = type === "stamps" ? "stamp >= 0" : "stamp < 0";
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE  ${stampCondition};
      `,
      [],
      1000 * 60 * 3,
    );
  }

  /**
   * Retrieves the total number of stamps by identifier(s) with the specified client.
   *
   * @param client - The database client.
   * @param ident - The identifier(s) of the stamps. It can be a single identifier or an array of identifiers.
   *                If it's a single identifier, it should be one of the values defined in the SUBPROTOCOLS enum.
   *                If it's an array of identifiers, each identifier should be one of the values defined in the SUBPROTOCOLS enum.
   * @returns A promise that resolves to the total number of stamps matching the identifier(s) with the client.
   */
  static async get_total_stamps_by_ident_with_client(
    client: Client,
    ident: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
    type: "stamps" | "cursed",
  ) {
    const identList = Array.isArray(ident) ? ident : [ident];
    const identCondition = identList.map((id) => `ident = '${id}'`).join(
      " OR ",
    );
    const stampCondition = type === "stamps" ? "stamp >= 0" : "stamp < 0";
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE (${identCondition})
        AND ${stampCondition}
      AND is_btc_stamp IS NOT NULL;
      `,
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
    limit = SMALL_LIMIT,
    page = 1,
    order = "DESC",
    type: "stamps" | "cursed",
  ) {
    order = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
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
      WHERE ${stampCondition} AND (st.ident = 'STAMP' or st.ident = 'SRC-721')
      ORDER BY st.tx_index ?
      LIMIT ? OFFSET ?;
      `,
      [order, limit, offset],
      1000 * 60 * 3,
    );
  }

  static async get_resumed_stamps(
    client: Client,
    order = "DESC",
    typeBy: typeof SUBPROTOCOLS | typeof SUBPROTOCOLS[] | string,
  ) {
    const identList = Array.isArray(typeBy) ? typeBy : [typeBy];
    const identCondition = identList.map((id) => `ident = '${id}'`).join(
      " OR ",
    );

    order = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
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
      WHERE st.is_btc_stamp IS NOT NULL AND (${identCondition})
      `,
      [],
      1000 * 60 * 3,
    );
  }

  static async get_stamps_by_block_index_with_client(
    client: Client,
    block_index: number,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT
        st.stamp,
        st.tx_hash,
        st.cpid,
        st.creator,
        cr.creator AS creator_name,
        st.tx_hash, st.stamp_mimetype,
        st.supply, st.divisible,
        st.keyburn, st.stamp_base64,
        st.stamp_url,
        st.stamp_hash,
        st.locked,
        st.ident,
        st.block_time,
        st.file_hash,
        st.block_index, cr.creator AS creator_name
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.block_index = ?
      AND st.is_btc_stamp IS NOT NULL
      ORDER BY stamp;
      `,
      [block_index],
      "never",
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
