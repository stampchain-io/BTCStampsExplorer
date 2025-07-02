// Internal server-only types
// import type { InputData } from "$types/api/src20.d.ts";

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