import { Buffer } from "buffer";

type INETWORK = "mainnet" | "testnet";

export interface VOUT {
  address?: string;
  script?: Buffer;
  value: number;
}

export interface PSBTInput {
  hash: string;
  index: number;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
  nonWitnessUtxo?: Buffer;
  redeemScript?: Buffer;
  sequence?: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  script: string;
  size?: number;
}

export interface IPrepareSRC20TX {
  network: string;
  changeAddress: string;
  toAddress: string;
  feeRate: number;
  transferString: string;
  enableRBF?: boolean;
}

export interface IMintSRC20 extends Omit<IPrepareSRC20TX, "transferString"> {
  tick: string;
  amt: string;
}

export interface IDeploySRC20 extends Omit<IPrepareSRC20TX, "transferString"> {
  tick: string;
  max: string;
  lim: string;
  dec?: number;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
}

export interface ITransferSRC20
  extends Omit<IPrepareSRC20TX, "transferString"> {
  fromAddress: string;
  tick: string;
  amt: string;
}

export interface IPrepareSRC20TXResult {
  psbtHex: string;
  fee: number;
  change: number;
  inputsToSign: Array<{ index: number }>;
}

export interface SRC20OperationResult {
  psbtHex: string;
  inputsToSign: { index: number; address: string }[];
  error?: string;
}

export type SRC20Operation = "deploy" | "mint" | "transfer";

export interface InputData {
  op: SRC20Operation;
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
