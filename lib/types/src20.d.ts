import type { BufferLike } from "./utils.d.ts";

type INETWORK = "mainnet" | "testnet";

export interface VOUT {
  address?: string;
  script?: BufferLike;
  value: number;
}

export interface PSBTInput {
  hash: string;
  index: number;
  witnessUtxo?: {
    script: BufferLike;
    value: number;
  };
  nonWitnessUtxo?: BufferLike;
  redeemScript?: BufferLike;
  sequence?: number;
}

export interface SRC20OperationResult {
  psbtHex: string;
  inputsToSign: { index: number; address: string }[];
  error?: string;
}

export type SRC20Operation = "deploy" | "mint" | "transfer";

export interface InputData {
  op: SRC20Operation;
  sourceAddress: string;
  toAddress: string;
  fromAddress?: string;
  changeAddress: string;
  tick: string;
  feeRate: number;
  amt?: string;
  max?: string;
  lim?: string;
  dec?: number;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
}

export interface SignPSBTResult {
  signed: boolean;
  psbt?: string;
  txid?: string;
  cancelled?: boolean;
  error?: string;
}

export interface Deployment {
  amt: number;
  block_index: number;
  block_time: string;
  creator: string;
  creator_name: string;
  deci: number;
  destination: string;
  lim: number;
  max: number;
  op: string;
  p: string;
  tick: string;
  tx_hash: string;
}

export interface MintStatus {
  decimals: number;
  limit: number;
  max_supply: number;
  progress: number;
  total_minted: number;
  total_mints: number;
}
