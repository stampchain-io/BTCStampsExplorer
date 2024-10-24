export const STAMP_SELECT_COLUMNS = `
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

export const getStampSelectQuery = (tableAlias: string = "st") => `
  SELECT ${STAMP_SELECT_COLUMNS.replace(/st\./g, `${tableAlias}.`)}
  FROM ${tableAlias}
  LEFT JOIN creator cr ON ${tableAlias}.creator = cr.address
`;
