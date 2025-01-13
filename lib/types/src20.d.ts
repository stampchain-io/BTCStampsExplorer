import type { BufferLike } from "$types/utils.d.ts";
import type { MarketListingSummary } from "$types/marketData.d.ts";

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
  top_mints_percentage?: number;
}

export interface SRC20MintStatus {
  max_supply: string;
  total_minted: string;
  limit: string;
  total_mints: number;
  progress: string;
  decimals: number;
  tx_hash: string;
}

export interface SRC20MintDataResponse {
  mintStatus: SRC20MintStatus | null;
  holders: number;
}

export interface SRC20HolderData {
  amt: string;
  percentage: string;
  address?: string;
}

export interface SRC20TickPageData {
  last_block: number;
  deployment: Deployment;
  total_transfers: number;
  total_mints: number;
  total_holders: number;
  holders: SRC20HolderData[];
  mint_status: SRC20MintStatus;
  total_transactions: number;
  marketInfo?: MarketListingSummary;
}

export interface SRC20BalanceRequestParams {
  address?: string;
  tick?: string;
  amt?: number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortField?: string;
  includePagination?: boolean;
  includeMintData?: boolean;
}
