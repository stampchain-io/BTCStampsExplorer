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

/* ===== SRC20 TABLE ===== */
export type SRC20ViewType = "minted" | "minting";
export type Timeframe = "24H" | "3D" | "7D" | "1M" | "ALL";

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
    timeframes: ["24H", "3D", "7D", "1M", "ALL"],
  },
  {
    key: "volume",
    label: "VOLUME",
    timeframes: ["24H", "3D", "7D", "1M", "ALL"],
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
    timeframes: ["24H", "3D", "7D", "1M", "ALL"],
  },
  { key: "progress", label: "PROGRESS" },
  { key: "mint", label: "MINT" },
];
