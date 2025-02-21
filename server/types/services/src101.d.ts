// Internal server-only types
// import type { InputData } from "$types/api/src20.d.ts";

export interface IPrepareSRC101TX {
  network: string;
  // fromAddress: string;
  sourceAddress: string;
  changeAddress: string;
  recAddress: string;
  feeRate: number;
  satsPerVB: number;
  transferString: string;
  trxType: "olga" | "multisig";
}

export interface IMintSRC101 extends Omit<IPrepareSRC101TX, "transferString"> {
  hash: string;
  toaddress: string;
  tokenid: string[];
  dua: string;
  prim: string;
  coef: string;
  sig: string;
  img: string[] | null;
}

export interface IDeploySRC101 extends Omit<IPrepareSRC101TX, "transferString"> {
  root: string;
  name: string;
  lim: string;
  owner: string;
  rec: string[];
  tick: string;
  pri: JSON;
  desc: string;
  mintstart: string;
  mintend: string;
  wla: string;
  imglp: string;
  imgf: string;
  description?: string;
}

export interface ITransferSRC101
  extends Omit<IPrepareSRC101TX, "transferString"> {
  hash: string;
  toaddress: string;
  tokenid: string;
}

export interface ISetrecordSRC101
  extends Omit<IPrepareSRC101TX, "transferString"> {
  hash: string;
  tokenid: string;
  type: string;
  data: JSON;
  prim: string;
}

export interface IRenewSRC101
  extends Omit<IPrepareSRC101TX, "transferString"> {
  hash: string;
  tokenid: string;
  dua: string;
}

export interface IPrepareSRC101TXResult {
  psbtHex: string;
  fee: number;
  change: number;
  inputsToSign: Array<{ index: number }>;
}