import { DispenserRow } from "$globals";

export * from "./api.d.ts";
export * from "./fee-estimation.ts";
export * from "./marketData.d.ts";
export * from "./quicknode.d.ts";
export * from "./services.d.ts";
export * from "./src101.d.ts";
export * from "./src20.d.ts";
export * from "./stamp.d.ts";
export * from "./ui.d.ts";
export * from "./utils.d.ts";
export * from "./wallet.d.ts";

// Re-export specific fee estimation types for convenience
export type {
  CacheManagerConfig,
  CacheResult,
  CacheStats,
  DetailedUTXO,
  EstimationPhase,
  FeeEstimationError,
  ProgressiveFeeEstimationOptions,
  ProgressiveFeeEstimationResult,
  ToolEstimationParams,
  ToolType,
  UTXOCache,
  UtxoSelectionStrategy,
} from "./fee-estimation.ts";

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
  AddressHandlerContext,
  AddressTickHandlerContext,
  BlockHandlerContext,
  BlockInfoResponseBody,
  DeployResponseBody,
  IdentHandlerContext,
  PaginatedDispenserResponseBody,
  PaginatedIdResponseBody,
  PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  PaginatedStampBalanceResponseBody,
  PaginatedStampResponseBody,
  PaginatedTickResponseBody,
  Src20BalanceResponseBody,
  Src20ResponseBody,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
  StampBlockResponseBody,
  StampPageProps,
  StampsAndSrc20,
  TickHandlerContext,
} from "./api.d.ts";

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
  type BasicUTXO,
  type BlockRow,
  type BTCBalance,
  type BtcInfo,
  type Config,
  type FeeDetails,
  type FeeEstimationParams,
  type FeeEstimationResult,
  type ROOT_DOMAIN_TYPES,
  type ScriptType,
  type SimpleFeeCalculatorProps,
  type SUBPROTOCOLS,
  type TransactionInput,
  type TransactionOutput,
  type UTXO,
  type WalletDataTypes,
  type XCPParams,
} from "./base.d.ts";

export type { Deployment } from "./src20.d.ts";
export type {
  BlockCypherAddressBalanceResponse,
  BTCBalanceInfo,
  WalletInfo as Wallet,
} from "./wallet.d.ts";

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
