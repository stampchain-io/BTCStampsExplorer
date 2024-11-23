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

type Output = {
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

export interface AddressInfoOptions {
  includeUSD?: boolean;
  apiBaseUrl?: string;
}
