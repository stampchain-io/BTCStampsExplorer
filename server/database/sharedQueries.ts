export const STAMP_BASE_COLUMNS = `
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

export const STAMP_URL_VALIDATION = `
  st.stamp_url IS NOT NULL
  AND st.stamp_url != ''
  AND st.stamp_url NOT LIKE '%undefined%'
  AND st.stamp_url NOT LIKE '%null%'
  AND st.stamp_mimetype IS NOT NULL
`;

export const STAMP_BALANCE_COLUMNS = `
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
`;

export const STAMP_FILENAME_COLUMNS = `
  st.tx_hash,
  st.stamp_hash,
  st.stamp_mimetype,
  st.cpid,
  st.stamp_base64
`;

export const getStampSelectQuery = (
  options: {
    tableAlias?: string;
    includeCreator?: boolean;
    allColumns?: boolean;
    includeCollectionId?: boolean;
    includeRowNumber?: boolean;
    sortColumn?: string;
    sortOrder?: string;
    columnSet?: 'base' | 'balance' | 'filename';
  } = {}
) => {
  const {
    tableAlias = "st",
    includeCreator = true,
    allColumns = false,
    includeCollectionId = false,
    includeRowNumber = false,
    sortColumn = "tx_index",
    sortOrder = "DESC",
    columnSet = 'base'
  } = options;

  let selectClause;
  if (allColumns) {
    selectClause = `${tableAlias}.*, cr.creator AS creator_name`;
  } else {
    switch (columnSet) {
      case 'balance':
        selectClause = STAMP_BALANCE_COLUMNS.replace(/st\./g, `${tableAlias}.`);
        break;
      case 'filename':
        selectClause = STAMP_FILENAME_COLUMNS.replace(/st\./g, `${tableAlias}.`);
        break;
      default:
        selectClause = STAMP_BASE_COLUMNS.replace(/st\./g, `${tableAlias}.`);
    }
  }

  if (includeCollectionId) {
    selectClause += `, HEX(cs1.collection_id) AS collection_id`;
  }

  if (includeRowNumber) {
    selectClause = `${selectClause}, ROW_NUMBER() OVER (
      PARTITION BY cs1.collection_id 
      ORDER BY ${tableAlias}.${sortColumn} ${sortOrder}
    ) as rn`;
  }

  return `
    SELECT ${selectClause}
    FROM ${tableAlias}
    ${includeCreator ? `LEFT JOIN creator cr ON ${tableAlias}.creator = cr.address` : ''}
  `.trim();
};
