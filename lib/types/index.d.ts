import { DispenserRow } from "$globals";

export * from "./services.d.ts";
export * from "./quicknode.d.ts";
export * from "./src20.d.ts";
export * from "./src101.d.ts";
export * from "./wallet.d.ts";
export * from "./marketData.d.ts";
export * from "./utils.d.ts";
export * from "./stamp.d.ts";
export * from "./api.ts";

// Re-export specific market data types for convenience
export type {
  CacheStatus,
  CollectionWithMarketData,
  ExchangeSources,
  MarketDataSource,
  MarketDataSourcesRow,
  SRC20MarketDataResponse,
  SRC20WithMarketData,
  StampHolderCache,
  StampHolderCacheRow,
  StampMarketDataResponse,
  StampWithMarketData,
  VolumeSources,
} from "./marketData.d.ts";

// Re-export API types for convenience
export type {
  ApiErrorWithMarketContext,
  ApiResponseWithMarketData,
  BatchMarketDataResponse,
  CollectionWithMarketDataResponse,
  MarketDataCacheInfo,
  MarketDataErrorResponse,
  MarketDataHealthResponse,
  PaginatedMarketDataResponse,
  SRC20WithMarketDataResponse,
  StampWithMarketDataResponse,
  WithMarketDataResponse,
} from "./api.ts";

// Re-export extended interfaces with optional market data
export type { StampWithOptionalMarketData } from "./stamp.d.ts";

export type {
  PaginatedSRC20WithMarketDataResponse,
  SRC20MarketDataQueryParams,
  SRC20WithOptionalMarketData,
} from "./src20.d.ts";

export {
  type AdvancedFeeCalculatorProps,
  type AncestorInfo,
  type BaseFeeCalculatorProps,
  type FeeDetails,
  type FeeEstimationParams,
  type FeeEstimationResult,
  type ScriptType,
  type SimpleFeeCalculatorProps,
  type TransactionInput,
  type TransactionOutput,
  type UTXO,
} from "./base.d.ts";

export type { BTCBalanceInfo, BTCBalanceInfoOptions } from "./wallet.d.ts";
export type { Deployment } from "./src20.d.ts";

export interface WalletData {
  balance: number;
  usdValue: number;
  address: string;
  btcPrice: number;
  fee: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  stampValue: number;
  dispensers: {
    open: number;
    closed: number;
    total: number;
    items: DispenserRow[];
  };
}
