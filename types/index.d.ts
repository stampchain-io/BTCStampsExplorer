export interface InputData {
  op: string;
  tick: string;
  toAddress: string;
  sourceAddress: string;
  changeAddress?: string;
  feeRate: number;
  amt?: string | number;
  max?: string | number;
  lim?: string | number;
  dec?: number;
  fromAddress?: string;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
  multisig?: boolean;
  trxType?: "multisig" | "olga";
}
