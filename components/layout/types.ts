// Re-export table types for layout components
/* ===== DONATE CTA ===== */
export interface TxOutput {
  scriptpubkey_address: string;
  value: number;
}

export interface Transaction {
  status: {
    block_time: number;
  };
  vout: TxOutput[];
}

export interface DonateStampData {
  stamp: string;
  stamp_mimetype: string;
  stamp_url: string;
  tx_hash: string;
}
/* ===== ===== ===== ===== ===== ===== */

/* ===== SRC20 TOKEN CARDS TABLE ===== */
export type SRC20ViewType = "minted" | "minting";
export type Timeframe = "24H" | "7D" | "30D" | "1M" | "ALL";

export interface TableColumn {
  key: string;
  label: string;
  timeframes?: Timeframe[];
}

/* ===== SRC20CARD MINTED COLUMNS ===== */
export const MINTED_COLUMNS: TableColumn[] = [
  { key: "token", label: "TOKEN" },
  { key: "deploy", label: "DEPLOY" },
  { key: "holders", label: "HOLDERS" },
  { key: "price", label: "PRICE" },
  {
    key: "change",
    label: "CHANGE",
    timeframes: ["24H", "7D", "30D", "1M", "ALL"],
  },
  {
    key: "volume",
    label: "VOLUME",
    timeframes: ["24H", "7D", "30D", "1M", "ALL"],
  },
  { key: "marketcap", label: "MARKETCAP" },
  { key: "chart", label: "CHART" },
];

/* ===== SRC20CARD MINTING COLUMNS ===== */
export const MINTING_COLUMNS: TableColumn[] = [
  { key: "token", label: "TOKEN" },
  { key: "deploy", label: "DEPLOY" },
  { key: "holders", label: "HOLDERS" },
  { key: "trending", label: "TRENDING" },
  {
    key: "mints",
    label: "MINTS",
    timeframes: ["24H", "7D", "30D", "1M", "ALL"],
  },
  { key: "progress", label: "PROGRESS" },
  { key: "mint", label: "MINT" },
];
/* ===== ===== ===== ===== ===== ===== */

/* ===== DATA TABLE ===== */
export type TableType = "stamps" | "src20" | "src101" | "vault";

export interface TabData {
  dispensers?: any[];
  dispenses?: any[];
  sends?: any[];
  mints?: any[];
  transfers?: any[];
  [key: string]: any[] | undefined;
}

export interface FetchResponse {
  data: any[];
  total: number;
}

/* ===== TABLE STYLING UTILITIES ===== */
export const colGroup = (customColumns: Array<{ width: string }>) => {
  return customColumns.map((col, i) => ({
    key: i,
    className: col.width,
  }));
};
