import { Client } from "$mysql/mod.ts";
import {
  get_issuances_by_identifier_with_client,
  get_issuances_by_stamp_with_client,
  summarize_issuances,
} from './index.ts';
import { STAMP_TABLE, TTL_CACHE } from "constants"
import { SUBPROTOCOLS } from "utils/protocol.ts"
import { handleSqlQueryWithCache } from "utils/cache.ts"


export const get_total_stamps_with_client = async (client: Client) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT COUNT(*) AS total
    FROM ${STAMP_TABLE}
    WHERE is_btc_stamp IS NOT NULL;
    `,
    [],
    1000 * 60 * 2
  );
};

export const get_total_stamps_by_ident_with_client = async (client: Client, ident: SUBPROTOCOLS) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT COUNT(*) AS total
    FROM ${STAMP_TABLE}
    WHERE ident = ?
    AND is_btc_stamp IS NOT NULL;
    `,
    [ident],
    1000 * 60 * 2
  );
};

export const get_stamps_by_page_with_client = async (client: Client, limit = 1000, page = 1) => {
  const offset = (page - 1) * limit;
  return await handleSqlQueryWithCache(
    client,
    `
      SELECT st.*, cr.creator AS creator_name
      FROM ${STAMP_TABLE} AS st
      LEFT JOIN creator AS cr ON st.creator = cr.address
      WHERE st.is_btc_stamp IS NOT NULL
      ORDER BY st.stamp
      LIMIT ? OFFSET ?;
    `,
    [limit, offset],
    1000 * 60 * 2
  );
};

export const get_resumed_stamps_by_page_with_client = async (client: Client, limit = 1000, page = 1, order = "DESC") => {
  order = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.stamp, st.cpid, st.creator, cr.creator AS creator_name, st.tx_hash, st.stamp_mimetype, st.supply, st.divisible, st.locked, st.ident, st.block_time, st.block_index
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.is_btc_stamp IS NOT NULL
    ORDER BY st.tx_index ${order}
    LIMIT ? OFFSET ?;
    `,
    [limit, offset],
    1000 * 60 * 2
  );
};

export const get_stamps_by_block_index_with_client = async (client: Client, block_index: number) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.block_index = ?
    AND st.is_btc_stamp IS NOT NULL
    ORDER BY stamp
    `,
    [block_index],
    "never"
  );
};

export const get_stamps_by_ident_with_client = async (client: Client, ident: SUBPROTOCOLS, limit = 1000, page = 1) => {
  const offset = (page - 1) * limit;
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.ident = ?
    AND st.is_btc_stamp IS NOT NULL
    ORDER BY st.stamp
    LIMIT ? OFFSET ?;
    `,
    [ident, limit, offset],
    1000 * 60 * 2
  );
};

export const get_stamp_by_stamp_with_client = async (client: Client, stamp: number) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.stamp = ?
    ORDER BY st.tx_index;
    `,
    [stamp],
    TTL_CACHE
  );
};

export const get_stamp_by_identifier_with_client = async (client: Client, identifier: string) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE}
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE (st.cpid = ? OR st.tx_hash = ? OR st.stamp_hash = ?);
    `,
    [identifier, identifier, identifier],
    TTL_CACHE
  );
};

export const get_stamp_with_client = async (client: Client, id: string) => {
  let data;
  if (!isNaN(Number(id))) {
    data = await get_issuances_by_stamp_with_client(client, Number(id));
  } else {
    data = await get_issuances_by_identifier_with_client(client, id);
  }
  if (!data) return null;
  const stamp = summarize_issuances(data.rows);
  return stamp;
}

export const get_cpid_from_identifier_with_client = async (client: Client, identifier: string) => {
  if (!isNaN(Number(identifier))) {
    return await handleSqlQueryWithCache(
      client,
      `
      SELECT cpid FROM ${STAMP_TABLE}
      WHERE stamp = ?;
      `,
      [identifier],
      "never"
    );
  }
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT cpid FROM ${STAMP_TABLE}
    WHERE (cpid = ? OR tx_hash = ?);
    `,
    [identifier, identifier],
    "never"
  );
}
