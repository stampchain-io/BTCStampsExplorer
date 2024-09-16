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

export interface SRC20Input {
  network: string;
  utxos: UTXO[];
  changeAddress: string;
  toAddress: string;
  feeRate: number;
  transferString: string;
  action: string;
}

export interface IMintSRC20 {
  toAddress: string;
  changeAddress: string;
  feeRate: number;
  tick: string;
  amt: string;
}

export interface IDeploySRC20 {
  toAddress: string;
  changeAddress: string;
  tick: string;
  feeRate: number;
  max: string;
  lim: string;
  dec?: number;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
}

export interface IPrepareSRC20TX {
  network: string;
  utxos: UTXO[];
  changeAddress: string;
  toAddress: string;
  feeRate: number;
  transferString: string;
  enableRBF?: boolean;
}

export interface IPrepareSRC20TXResult {
  psbtHex: string;
  fee: number;
  change: number;
  inputsToSign: Array<{ index: number }>;
}

export interface ITransferSRC20 {
  toAddress: string;
  fromAddress: string;
  tick: string;
  feeRate: number;
  amt: string;
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
