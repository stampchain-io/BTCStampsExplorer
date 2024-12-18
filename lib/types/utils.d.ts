export interface UTXOFromBlockCypher {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
  ref_balance: number;
  spent: boolean;
  confirmations: number;
  confirmed: Date;
  double_spend: boolean;
  script: string;
  size: number;
}

export interface UTXOFromBlockchain {
  tx_hash_big_endian: string;
  tx_hash: string;
  tx_output_n: number;
  script: string;
  value: number;
  value_hex: string;
  confirmations: number;
  tx_index: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  script: string;
  size: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  index?: number;
}

export type Output = {
  address: string;
  value: number;
} | {
  script: string;
  value: number;
};

export interface BufferLike {
  readonly length: number;
  readonly buffer: ArrayBuffer;
  [key: number]: number;
  slice(start?: number, end?: number): BufferLike;
  toString(encoding?: string): string;
}

export type BinaryData = BufferLike | Uint8Array;

export interface BalanceOptions {
  format?: "BTC" | "satoshis";
  fallbackValue?: number | null;
}

export interface BTCBalanceInfoOptions {
  includeUSD?: boolean;
  apiBaseUrl?: string;
}

export interface BlockCypherAddressBalanceResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface StampRow {
  stamp: number;
  stamp_mime?: string;
  stamp_mimetype?: string; // Alias for backward compatibility
  stamp_size?: number;
  tx_hash: string;
  block_index: number;
  block_time: string;
  creator: string;
  creator_name: string;
  destination: string;
  p: string;
  op: string;
  supply: number;
  supply_left: number;
  stamp_type: string;
  stamp_url: string;
  stamp_preview_url?: string;
  divisible?: boolean;
  cpid?: string;
  balance?: number;
  mime_type?: string;
  file_type?: string;
  file_size?: number;
  content_length?: number;
  content_type?: string;
  sha256?: string;
  floorPrice?: string | number;
  floorPriceUSD?: number;
  marketCap?: number;
  marketCapUSD?: number;
  keyburn?: boolean;
  locked?: boolean;
  sale_data?: {
    tx_hash: string;
    block_index: number;
    block_time: string;
    price: number;
    btc_amount: number;
  };
}

export interface StampWithSaleData extends StampRow {
  floorPrice?: string | number;
  recentSalePrice?: string | number;
  ident?: string;
}

export interface SRC20Row {
  tx_hash: string;
  block_index: number;
  block_time: string;
  creator: string;
  creator_name: string;
  destination: string;
  p: string;
  op: string;
  supply: number;
  supply_left: number;
  holders: number;
  floor_unit_price?: number;
  progress?: string;
}

export interface DispenserRow {
  tx_hash: string;
  block_index: number;
  block_time: string;
  creator: string;
  destination: string;
  p: string;
  op: string;
  supply: number;
  supply_left: number;
  status: string;
  price: number;
  stamp?: {
    stamp: number;
    stamp_mime?: string;
    stamp_size?: number;
  };
  give_remaining: number;
  give_quantity: number;
  escrow_quantity: number;
  btcrate: number;
  origin: string;
}

export interface StampSectionProps {
  title: string;
  type: "all" | "recent" | "featured";
  stamps: StampRow[];
  layout: "grid" | "list";
  showDetails: boolean;
  gridClass?: string;
  displayCounts?: {
    mobileSm: number;
    mobileLg: number;
    tablet: number;
    desktop: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
}
