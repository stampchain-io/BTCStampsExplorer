interface UTXOFromBlockCypher {
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

interface UTXOFromBlockchain {
  tx_hash_big_endian: string;
  tx_hash: string;
  tx_output_n: number;
  script: string;
  value: number;
  value_hex: string;
  confirmations: number;
  tx_index: number;
}

interface UTXO {
  txid: string;
  tx_hash: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
  script: string;
  size: number;
  index?: number;
}

type Output = {
  address: string;
  value: number;
} | {
  script: string;
  value: number;
};
