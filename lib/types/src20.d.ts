import type { BufferLike } from "$types/utils.d.ts";
import type {
  CacheStatus,
  MarketListingAggregated,
  SRC20MarketData,
} from "$types/marketData.d.ts";
import type { SRC20Row } from "$globals";

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
  marketInfo?: MarketListingAggregated;
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

// Add EnrichedSRC20Row type
export interface EnrichedSRC20Row extends SRC20Row {
  market_data?: MarketListingAggregated;
  chart?: any; // Define a proper chart data type if available, using 'any' for now
  // holders is inherited from SRC20Row
  // deploy_img, deploy_tx, stamp_url are inherited from SRC20Row
}

/**
 * Extended SRC20 interface that includes optional market data from cache
 * Used when SRC20 tokens are fetched with market data
 */
export interface SRC20WithOptionalMarketData extends SRC20Row {
  // Optional market data fields
  marketData?: SRC20MarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;

  // Legacy fields for backward compatibility
  market_data?: MarketListingAggregated;
  priceBTC?: number | null;
  priceUSD?: number | null;
  marketCapUSD?: number | null;
  volume24h?: number | null;
}

/**
 * Query parameters for SRC20 endpoints with market data
 */
export interface SRC20MarketDataQueryParams {
  includeMarketData?: boolean;
  marketDataOnly?: boolean; // Only return tokens with market data
  minMarketCap?: number;
  minVolume24h?: number;
  sortByMarketCap?: "asc" | "desc";
}

/**
 * Paginated SRC20 response with market data
 */
export interface PaginatedSRC20WithMarketDataResponse {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  last_block: number;
  data: SRC20WithOptionalMarketData[];
  marketDataSummary?: {
    tokensWithData: number;
    tokensWithoutData: number;
    totalMarketCapBTC: number;
    totalMarketCapUSD: number;
    totalVolume24hBTC: number;
    cacheStatus: CacheStatus;
  };
}
