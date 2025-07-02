import type { CacheStatus, StampMarketData } from "./marketData.d.ts";

export interface stampTransferData {
  sourceWallet: string;
  destinationWallet: string;
  assetName: string;
  qty: number;
  divisible: boolean;
  satsPerKB: number;
}

export interface stampMintData {
  sourceWallet: string;
  destinationWallet?: string;
  assetName?: string;
  base64Data: string;
  qty: number;
  locked: boolean;
  divisible: boolean;
  satsPerKB: number;
  file?: unknown;
}

/**
 * Extended stamp interface that includes optional market data
 * Used when stamps are fetched with market data from the cache
 */
export interface StampWithOptionalMarketData {
  // All standard stamp fields would be inherited from StampRow
  stamp?: number | null;
  block_index: number;
  cpid: string;
  creator: string;
  divisible: number;
  keyburn?: number | null;
  locked: number;
  stamp_base64: string;
  stamp_mimetype: string;
  stamp_url: string;
  supply?: number | null;
  tx_hash: string;
  tx_index: number;
  ident: string;
  creator_name?: string | null;
  stamp_hash: string;
  file_hash: string;

  // Optional market data fields
  marketData?: StampMarketData | null;
  marketDataMessage?: string;
  cacheStatus?: CacheStatus;
  cacheAgeMinutes?: number;

  // Legacy fields for backward compatibility
  floorPrice?: number | null;
  floorPriceUSD?: number | null;
  marketCapUSD?: number | null;
}
