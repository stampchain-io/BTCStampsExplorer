import { Client } from "$mysql/mod.ts";
import { STAMP_TABLE } from "constants"
import { handleSqlQueryWithCache } from "utils/cache.ts"
import { TTL_CACHE } from "constants";
import { SUBPROTOCOLS } from "utils/protocol.ts"


export const get_total_cursed_with_client = async (client: Client) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT COUNT(*) AS total
    FROM ${STAMP_TABLE}
    WHERE is_btc_stamp IS NULL
    AND is_reissue IS NULL;
    `,
    [],
    1000 * 60 * 2
  );
};

export const get_total_cursed_by_ident_with_client = async (client: Client, ident: SUBPROTOCOLS) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT COUNT(*) AS total
    FROM ${STAMP_TABLE}
    WHERE ident = ?
    AND is_btc_stamp IS NULL
    AND is_reissue IS NULL;
    `,
    [ident],
    1000 * 60 * 2
  );
};

export const get_cursed_by_page_with_client = async (client: Client, limit = 1000, page = 0) => {
  const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.is_btc_stamp IS NULL
    AND st.is_reissue IS NULL
    ORDER BY st.tx_index
    LIMIT ? OFFSET ?;
    `,
    [limit, offset],
    1000 * 60 * 2
  );
};

export const get_resumed_cursed_by_page_with_client = async (client: Client, limit = 1000, page = 1, order = "DESC") => {
  order = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.stamp, st.cpid, st.creator, cr.creator AS creator_name, st.tx_hash, st.stamp_mimetype, st.supply, st.divisible, st.locked
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.is_btc_stamp IS NULL
    AND st.is_reissue IS NULL
    ORDER BY st.tx_index ${order}
    LIMIT ? OFFSET ?;
    `,
    [limit, offset],
    1000 * 60 * 2
  );
};

export const get_cursed_by_block_index_with_client = async (client: Client, block_index: number) => {
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE} AS st
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.block_index = ?
    AND st.is_btc_stamp IS NULL
    AND st.is_reissue IS NULL
    ORDER BY st.tx_index
    `,
    [block_index],
    "never"
  );
};

export const get_cursed_by_ident_with_client = async (client: Client, ident: SUBPROTOCOLS, limit = 1000, page = 0) => {
  const offset = limit && page ? Number(limit) * (Number(page) - 1) : 0;
  return await handleSqlQueryWithCache(
    client,
    `
    SELECT st.*, cr.creator AS creator_name
    FROM ${STAMP_TABLE}
    LEFT JOIN creator AS cr ON st.creator = cr.address
    WHERE st.ident = ?
    AND st.is_btc_stamp IS NULL
    AND st.is_reissue IS NULL
    ORDER BY st.tx_index
    LIMIT ? OFFSET ?;
    `,
    [ident, limit, offset],
    1000 * 60 * 2
  );
};
