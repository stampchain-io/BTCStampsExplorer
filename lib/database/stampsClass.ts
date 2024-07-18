import { Client } from "$mysql/mod.ts";
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

  static async get_stamps(
    client: Client,
    options: {
      limit?: number;
      page?: number;
      sort_order?: "asc" | "desc";
      type?: "stamps" | "cursed";
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
      type,
      ident,
      identifier,
      blockIdentifier,
      all_columns = false,
      no_pagination = false,
      cache_duration = 1000 * 60 * 3,
    } = options;

    const offset = no_pagination ? 0 : (page - 1) * limit;
    const order = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const whereConditions = [];
    const queryParams: any[] = [];

    // Type condition
    if (type) {
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
      queryParams.push(...identList);
    }

    // Identifier condition (stamp, tx_hash, cpid, or stamp_hash)
    if (identifier) {
      const isNumber = typeof identifier === "number" ||
        !isNaN(Number(identifier));
      const isTxHash = typeof identifier === "string" &&
        identifier.length === 64 && /^[a-fA-F0-9]+$/.test(identifier);
      const isStampHash = typeof identifier === "string" &&
        /^[a-zA-Z0-9]{12,20}$/.test(identifier) && /[a-z]/.test(identifier) &&
        /[A-Z]/.test(identifier);

      const identifierCondition = isNumber
        ? "st.stamp = ?"
        : isTxHash
        ? "st.tx_hash = ?"
        : isStampHash
        ? "st.stamp_hash = ?"
        : "st.cpid = ?";

      whereConditions.push(identifierCondition);
      queryParams.push(identifier);
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

    const query = `
      SELECT ${selectClause}
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      ${whereClause}
      ORDER BY st.stamp ${order}
      ${no_pagination ? "" : "LIMIT ? OFFSET ?"};
    `;

    if (!no_pagination) {
      queryParams.push(limit, offset);
    }

    return await handleSqlQueryWithCache(
      client,
      query,
      queryParams,
      cache_duration,
    );
  }
}
