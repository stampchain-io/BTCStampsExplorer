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
