export type SRC101Operation = "deploy" | "mint" | "transfer" | "setrecord" | "renew";

export interface SRC101InputData {
  op: SRC101Operation;
  sourceAddress: string;
  toAddress?: string;
  fromAddress?: string;
  recAddress?: string;
  changeAddress: string;

  root?: string;
  name?: string;
  lim?: number;
  owner?: string;
  rec?: string[];
  tick?: string;
  pri?: JSON;
  desc?: string;
  mintstart?: number;
  mintend?: number;
  wla?: string;
  imglp?: string;
  imgf?: string;
  idua?: number;
  hash?: string;
  toaddress?: string;
  tokenid?: string[] | string;
  dua?: number;
  prim?: string;
  sig?: string;
  img?: string[] | string;
  coef?: number;

  feeRate: number;

  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
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
