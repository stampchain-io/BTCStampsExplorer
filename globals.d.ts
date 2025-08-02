declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
    DENO_BUILD_MODE: boolean | undefined;
    LeatherProvider: {
      request: (method: string, params?: any) => Promise<any>;
      // Add other known properties and methods of LeatherProvider here
    };
    mockTxData: {
      vout: Array<{
        scriptPubKey: {
          type: string;
          hex: string;
        };
      }>;
    };
    Buffer?: typeof import("node:buffer").Buffer;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DENO_ENV?: "development" | "production" | "test";
    DEV_BASE_URL?: string;
    SKIP_REDIS_CONNECTION?: "true" | "false";
    // Add other environment variables here if needed
  }
}

// ============================================================================
// BACKWARD COMPATIBILITY RE-EXPORTS
// ============================================================================
// This section provides temporary re-exports for gradual migration support.
// These will be removed in a future version - use domain-specific imports instead.

// Base Bitcoin and Core Types
/**
 * @deprecated Use `import type { UTXO } from "./lib/types/base.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  AncestorInfo,
  BasicUTXO,
  FeeDetails,
  FeeEstimationParams,
  FeeEstimationResult,
  ScriptType,
  SUBPROTOCOLS,
  TransactionInput,
  TransactionOutput,
  TransferDetails,
  UTXO,
} from "./lib/types/base.d.ts";

// Bitcoin Stamps Protocol Types
/**
 * @deprecated Use `import type { StampRow } from "./lib/types/stamp.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  STAMP_EDITIONS,
  STAMP_FILESIZES,
  STAMP_FILETYPES,
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  STAMP_RANGES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampBalance,
  StampClassification,
  StampDetail,
  StampRarity,
  StampRow,
  StampStatus,
  StampValidationStatus,
} from "./lib/types/stamp.d.ts";

// SRC-20 Token Types
/**
 * @deprecated Use `import type { SRC20Row } from "./lib/types/src20.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  EnrichedSRC20Row,
  SRC20_DETAILS,
  SRC20_FILTER_TYPES,
  SRC20_MARKET,
  SRC20_STATUS,
  SRC20_TYPES,
  SRC20Balance,
  Src20Detail,
  SRC20Operation,
  SRC20Row,
  Src20SnapShotDetail,
} from "./lib/types/src20.d.ts";

// Wallet and Transaction Types
/**
 * @deprecated Use `import type { WalletStampWithValue } from "./lib/types/wallet.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  HorizonAddress,
  HorizonGetAddressesResponse,
  HorizonSignMessageParams,
  HorizonSignPsbtParams,
  HorizonWalletAPI,
  StampBalance as WalletStampBalance,
  UTXOAttachmentInfo,
  UTXOInfo,
  WalletStampWithValue,
} from "./lib/types/wallet.d.ts";

// Transaction Types
/**
 * @deprecated Use `import type { TransactionRow } from "./lib/types/transaction.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  SendRow,
  Transaction,
  TransactionBuilder,
  TransactionConstructionParams,
  TransactionEstimateParams,
  UTXOSelectionStrategy,
} from "./lib/types/transaction.d.ts";

// API Types
/**
 * @deprecated Use `import type { ApiResponse } from "./lib/types/api.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  AddressHandlerContext,
  AddressTickHandlerContext,
  ApiError,
  ApiRequest,
  ApiResponse,
  BlockHandlerContext,
  IdentHandlerContext,
  PaginatedIdResponseBody,
  PaginatedSrc20ResponseBody,
  PaginatedStampResponseBody,
  TickHandlerContext,
} from "./lib/types/api.d.ts";

// UI and Component Types
/**
 * @deprecated Use `import type { ButtonVariant } from "./lib/types/ui.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  AdvancedFeeCalculatorProps,
  BaseFeeCalculatorProps,
  ButtonSize,
  ButtonVariant,
  ComponentProps,
  SimpleFeeCalculatorProps,
  StampGalleryProps,
} from "./lib/types/ui.d.ts";

// Utility and Helper Types
/**
 * @deprecated Use `import type { DeepPartial } from "./lib/types/utils.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  DeepPartial,
  DeepRequired,
  NonEmptyArray,
  Prettify,
  UnionToIntersection,
} from "./lib/types/utils.d.ts";

// Pagination Types
/**
 * @deprecated Use `import type { PaginationProps } from "./lib/types/pagination.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  PaginationConfig,
  PaginationProps,
  PaginationType,
} from "./lib/types/pagination.d.ts";

// Sorting Types
/**
 * @deprecated Use `import type { SortDirection } from "./lib/types/sorting.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  SortConfig,
  SortDirection,
  SortState,
} from "./lib/types/sorting.d.ts";

// Market Data Types
/**
 * @deprecated Use `import type { StampMarketData } from "./lib/types/marketData.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  CacheStatus,
  MarketDataProvider,
  SRC20MarketData,
  StampMarketData,
} from "./lib/types/marketData.d.ts";

// Error Types
/**
 * @deprecated Use `import type { AppError } from "./lib/types/errors.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  APIError,
  ErrorContext,
  ErrorSeverity,
  NetworkError,
  ValidationError,
} from "./lib/types/errors.d.ts";

// Service Types
/**
 * @deprecated Use `import type { CacheService } from "./lib/types/services.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  CacheService,
  DatabaseService,
  NotificationService,
  ServiceConfig,
} from "./lib/types/services.d.ts";

// Fee Types
/**
 * @deprecated Use `import type { FeeRate } from "./lib/types/fee.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
export type {
  FeeCalculatorConfig,
  FeeCalculatorResult,
  FeeEstimate,
  FeeRate,
} from "./lib/types/fee.d.ts";

export {};
