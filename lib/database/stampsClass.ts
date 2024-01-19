import { Client } from "$mysql/mod.ts";
import { CommonClass, summarize_issuances } from "./index.ts";
import { STAMP_TABLE, TTL_CACHE } from "constants";
import { PROTOCOL_IDENTIFIERS as SUBPROTOCOLS } from "../utils/protocol.ts";
import { handleSqlQueryWithCache } from "../utils/cache.ts";
import { get_suffix_from_mimetype, getMimeType } from "utils/util.ts";

export class StampsClass {
  static async get_total_stamps_with_client(client: Client) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE is_btc_stamp IS NOT NULL;
      `,
      [],
      1000 * 60 * 2,
    );
  }

  static async get_total_stamps_by_ident_with_client(
    client: Client,
    ident: SUBPROTOCOLS,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT COUNT(*) AS total
      FROM ${STAMP_TABLE}
      WHERE ident = '${ident}'
      AND is_btc_stamp IS NOT NULL;
      `,
      [ident],
      1000 * 60 * 2,
    );
  }

  static async get_stamps_by_page_with_client(
    client: Client,
    limit = 1000,
    page = 1,
  ) {
    const offset = (page - 1) * limit;
    return await handleSqlQueryWithCache(
      client,
      `
        SELECT st.*, cr.creator AS creator_name
        FROM ${STAMP_TABLE} AS st
        LEFT JOIN creator AS cr ON st.creator = cr.address
        WHERE st.is_btc_stamp IS NOT NULL
        ORDER BY st.stamp
        LIMIT ${limit} OFFSET ${offset};
      `,
      [limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_resumed_stamps_by_page_with_client(
    client: Client,
    limit = 1000,
    page = 1,
    order = "DESC",
  ) {
    order = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    const offset = (page - 1) * limit;
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
      WHERE st.is_btc_stamp IS NOT NULL
      ORDER BY st.tx_index ${order}
      LIMIT ${limit} OFFSET ${offset};
      `,
      [limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_stamps_by_block_index_with_client(
    client: Client,
    block_index: number,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT st.*, cr.creator AS creator_name
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.block_index = '${block_index}'
      AND st.is_btc_stamp IS NOT NULL
      ORDER BY stamp
      `,
      [block_index],
      "never",
    );
  }

  static async get_stamps_by_ident_with_client(
    client: Client,
    ident: SUBPROTOCOLS,
    limit = 1000,
    page = 1,
  ) {
    const offset = (page - 1) * limit;
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT st.*, cr.creator AS creator_name
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.ident = '${ident}'
      AND st.is_btc_stamp IS NOT NULL
      ORDER BY st.stamp
      LIMIT ${limit} OFFSET ${offset};
      `,
      [ident, limit, offset],
      1000 * 60 * 2,
    );
  }

  static async get_stamp_by_stamp_with_client(client: Client, stamp: number) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT st.*, cr.creator AS creator_name
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.stamp = '${stamp}'
      ORDER BY st.tx_index;
      `,
      [stamp],
      TTL_CACHE,
    );
  }

  static async get_stamp_by_identifier_with_client(
    client: Client,
    identifier: string,
  ) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT st.*, cr.creator AS creator_name
      FROM ${STAMP_TABLE}
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE (st.cpid = '${identifier}' OR st.tx_hash = '${identifier}' OR st.stamp_hash = '${identifier}');
      `,
      [identifier, identifier, identifier],
      TTL_CACHE,
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
      WHERE (cpid = '${identifier}' OR tx_hash = '${identifier}' OR stamp_hash = '${identifier}')
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
    let data;
    if (!isNaN(Number(id))) {
      data = await CommonClass.get_issuances_by_stamp_with_client(
        client,
        Number(id),
      );
    } else {
      data = await CommonClass.get_issuances_by_identifier_with_client(
        client,
        id,
      );
    }
    if (!data) return null;
    const stamp = summarize_issuances(data.rows);
    return stamp;
  }

  static async get_cpid_from_identifier_with_client(
    client: Client,
    identifier: string,
  ) {
    if (!isNaN(Number(identifier))) {
      return await handleSqlQueryWithCache(
        client,
        `
        SELECT cpid FROM ${STAMP_TABLE}
        WHERE stamp = '${identifier}';
        `,
        [identifier],
        "never",
      );
    }
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT cpid FROM ${STAMP_TABLE}
      WHERE (cpid = '${identifier}' OR tx_hash = '${identifier}');
      `,
      [identifier, identifier],
      "never",
    );
  }
}
