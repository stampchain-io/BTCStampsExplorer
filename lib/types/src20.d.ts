import type { SRC20Row } from "$globals";
import type {
  CacheStatus,
  MarketListingAggregated,
  SRC20MarketData,
} from "$types/marketData.d.ts";
import type { BufferLike } from "$types/utils.d.ts";

type INETWORK = "mainnet" | "testnet";

/**
 * Chart data point: [timestamp, priceInSatoshis]
 * - timestamp: Unix timestamp in milliseconds (from Date.getTime())
 * - priceInSatoshis: Price converted to satoshis (BTC * 100000000)
 */
export type ChartDataPoint = [number, number];

/**
 * Chart data structure used by ChartWidget component
 * Array of time-series price data points for Highcharts
 */
export type ChartData = ChartDataPoint[];

/**
 * Chart configuration options for different chart types
 */
export interface ChartOptions {
  type?: "line" | "candlestick";
  title?: string;
  yAxisTitle?: string;
  fromPage?: string;
  tick?: string;
}

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
    value: bigint;
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
  op?: SRC20Operation; // Optional for validation testing
  sourceAddress: string;
  toAddress?: string; // Optional, only required for transfer operations
  fromAddress?: string;
  changeAddress?: string; // Optional for validation testing
  tick: string;
  feeRate?: number; // Optional for validation testing
  amt?: string;
  max?: string;
  lim?: string;
  dec?: number;
  x?: string;
  web?: string;
  email?: string;
  tg?: string;
  description?: string;
  desc?: string;
  img?: string;
  icon?: string;
  isEstimate?: boolean;
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
  initialCounts?: {
    totalMints: number;
    totalTransfers: number;
  };
  highcharts?: ChartData;
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
  includeMarketData?: boolean; // NEW: API v2.3 enhancement for market data enrichment
}

// Add EnrichedSRC20Row type
export interface EnrichedSRC20Row extends SRC20Row {
  market_data?: MarketListingAggregated;
  chart?: ChartData;
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
