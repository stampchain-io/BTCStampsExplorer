/**
 * BTCStampsExplorer Type Definitions - Public API
 *
 * This file provides the main entry point for all client-side type definitions
 * used throughout the BTCStampsExplorer application. Types are organized by
 * functional domains and exported using TypeScript 5.3+ patterns.
 *
 * @fileoverview Public API exports for client-side type definitions
 * @version 2.0.0
 * @author BTCStampsExplorer Team
 *
 * Usage:
 * ```typescript
 * import type { StampData, SRC20Token, ApiResponse } from '@/lib/types';
 * import type { Bitcoin } from '@/lib/types'; // Namespace import
 * ```
 *
 * Export Organization:
 * - Core Domain Types: Bitcoin primitives, transactions, addresses
 * - Token Types: Stamps, SRC-20, SRC-101 token definitions
 * - API Types: Request/response interfaces, handler contexts
 * - UI Types: Component props, state definitions
 * - Utility Types: Pagination, validation, error handling
 * - Market Data: Pricing, volume, market analysis types
 */

// ============================================================================
// Core Bitcoin & Blockchain Types
// ============================================================================

export type {
  AncestorInfo,
  BasicUTXO,
  // Block and transaction data
  BlockRow,
  BTCBalance,
  BtcInfo,
  // Configuration and constants
  Config,
  // Fee calculation types
  FeeDetails,
  FeeEstimationParams,
  FeeEstimationResult,
  ROOT_DOMAIN_TYPES,
  // Bitcoin base primitives
  ScriptType,
  SUBPROTOCOLS,
  TransactionInput,
  TransactionOutput,
  UTXO,
  WalletDataTypes,
  XCPParams,
} from "./base.d.ts";

export type {
  BlockInfo,
  InputTypeForSizeEstimation,
  MintStampInputData,
  Output,
  OutputTypeForSizeEstimation,
  // Script and size estimation
  ScriptTypeInfo,
  // Transaction processing types
  SendRow,
  TX,
  TXError,
} from "./transaction.d.ts";

// ============================================================================
// Token & Asset Types
// ============================================================================

export type {
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  STAMP_TYPES,
  StampBalance,
  // Stamp enums and types
  StampClassification,
  // Stamp filters and props
  StampFilters,
  // Stamp metadata and validation
  StampMetadata,
  StampParsingResult,
  StampRarity,
  // Core stamp data structures
  StampRow,
  StampStatus,
  StampTransactionInput,
  StampTransactionOutput,
  // Stamp transaction types
  StampTransactionType,
  StampValidationError,
  StampValidationResult,
  StampValidationStatus,
  StampValidationWarning,
  // Extended stamp interfaces
  StampWithOptionalMarketData,
  ValidatedStamp,
} from "./stamp.d.ts";

export type {
  Deployment,
  EnrichedSRC20Row,
  PaginatedSRC20WithMarketDataResponse,
  // PSBT signing
  SignPSBTResult,
  SRC20_DETAILS,
  SRC20_FILTER_TYPES,
  SRC20_MARKET,
  SRC20_STATUS,
  // SRC-20 type constants
  SRC20_TYPES,
  SRC20Balance,
  SRC20BalanceRequestParams,
  // SRC-20 filters and requests
  SRC20Filters,
  SRC20HolderData,
  SRC20MarketDataQueryParams,
  SRC20MintStatus,
  // SRC-20 operations and status
  SRC20Operation,
  // SRC-20 core types
  SRC20Row,
  SRC20SnapshotRequestParams,
  SRC20TickPageData,
  SRC20TrxRequestParams,
  // Extended SRC-20 interfaces
  SRC20WithOptionalMarketData,
} from "./src20.d.ts";

export type {
  // SRC-101 types
  SRC101Balance,
} from "./src101.d.ts";

// ============================================================================
// API & Network Types
// ============================================================================

export type {
  // Handler contexts
  AddressHandlerContext,
  AddressTickHandlerContext,
  BlockHandlerContext,
  BlockInfoResponseBody,
  // API response bodies
  DeployResponseBody,
  IdentHandlerContext,
  PaginatedDispenserResponseBody,
  // Paginated responses
  PaginatedIdResponseBody,
  PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  PaginatedStampBalanceResponseBody,
  PaginatedStampResponseBody,
  PaginatedTickResponseBody,
  Src20BalanceResponseBody,
  Src20ResponseBody,
  // Request parameters
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
  StampBlockResponseBody,
  // Page props and combined data
  StampPageProps,
  StampsAndSrc20,
  TickHandlerContext,
} from "./api.d.ts";

// ============================================================================
// Wallet & Address Types
// ============================================================================

export type {
  // External API responses
  BlockCypherAddressBalanceResponse,
  BTCBalanceInfo,
  // Mempool API response types
  MempoolAddressResponse,
  // Core wallet types
  WalletInfo,
  // Legacy wallet interface (deprecated - use WalletInfo)
  WalletInfo as Wallet,
} from "./wallet.d.ts";

// ============================================================================
// UI & Component Types
// ============================================================================

export type {
  AnimationProps,
  AriaAttributes,
  AsyncStateProps,
  BaseButtonProps,
  // Base component types
  BaseComponentProps,
  Breakpoints,
  ButtonColor,
  ButtonProps,
  ButtonSize,
  // Button types
  ButtonVariant,
  CollectionGalleryProps,
  // Theme and styling
  ColorPalette,
  ComponentWithChildren,
  ContainerProps,
  EmptyStateProps,
  ErrorStateProps,
  ExtendedComponentProps,
  // Layout types
  FlexboxProps,
  // Form component types
  FormControlProps,
  GridProps,
  IconButtonProps,
  IconProps,
  // Icon and animation types
  IconSize,
  IconWeight,
  InputProps,
  KeyboardNavigationProps,
  // State component types
  LoadingStateProps,
  ProcessingButtonProps,
  ResponsiveProps,
  // Responsive and accessibility
  ResponsiveValue,
  ScreenReaderProps,
  SelectProps,
  SpacingScale,
  SRC20CardProps,
  SRC20CardSize,
  // Gallery and card types
  StampGalleryProps,
  // Table and display types
  TableColumn,
  TableProps,
  TextareaProps,
  Theme,
  TransitionProps,
  Typography,
} from "./ui.d.ts";

// ============================================================================
// Utility & Infrastructure Types
// ============================================================================

export type {
  PaginatedResponse,
  PaginationProps,
  // Pagination types
  PaginationQueryParams,
} from "./pagination.d.ts";

export type {
  // BTC balance options
  BTCBalanceInfoOptions,
  DateUtils,
  // Utility functions and helpers
  DeepPartial,
  NonEmptyArray,
  NumberUtils,
  Optional,
  PartialKeys,
  RequiredKeys,
  // String and numeric utilities
  StringUtils,
  // Type guards and validation
  TypeGuard,
  ValidationFunction,
} from "./utils.d.ts";

export type {
  APIError,
  APIErrorCode,
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  // Error discrimination and utilities
  ApplicationError,
  AsyncErrorHandler,
  AsyncResult,
  AuthenticationError,
  AuthorizationError,
  // Error handling types
  BaseError,
  BitcoinError,
  BitcoinErrorCode,
  ConfigurationError,
  DatabaseError,
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorByType,
  ErrorContext,
  ErrorFallbackProps,
  ErrorHandler,
  // React error boundary types
  ErrorInfo,
  ErrorRecoveryAction,
  ErrorRecoveryFunction,
  ErrorReportingFunction,
  ErrorSeverity,
  ErrorTransformer,
  // Error structures and responses
  FieldValidationError,
  NetworkError,
  Result,
  SRC20Error,
  SRC20ErrorCode,
  StampError,
  StampErrorCode,
  ValidationError,
  // Error enums and codes
  ValidationErrorCode,
  ValidationErrorCollection,
  ValidationResult,
} from "./errors.d.ts";

// ============================================================================
// Market Data & Analytics Types
// ============================================================================

export type {
  // Cache and source types
  CacheStatus,
  CollectionWithMarketData,
  ExchangeSources,
  MarketDataSource,
  MarketDataSourcesRow,
  // Market data responses
  SRC20MarketDataResponse,
  // Extended data with market info
  SRC20WithMarketData,
  // Holder and cache data
  StampHolderCache,
  StampHolderCacheRow,
  StampMarketDataResponse,
  StampWithMarketData,
  VolumeSources,
} from "./marketData.d.ts";

// ============================================================================
// Fee Estimation & Advanced Transaction Types
// ============================================================================

export type {
  // Cache management
  CacheManagerConfig,
  CacheResult,
  CacheStats,
  // UTXO management
  DetailedUTXO,
  EstimationPhase,
  FeeEstimationError,
  // Progressive fee estimation
  ProgressiveFeeEstimationOptions,
  ProgressiveFeeEstimationResult,
  ToolEstimationParams,
  // Tool-specific types
  ToolType,
  UTXOCache,
  UtxoSelectionStrategy,
} from "./fee-estimation.ts";

// ============================================================================
// External Service & Integration Types
// ============================================================================

export type {
  // QuickNode API types
  QuickNodeConfig,
  QuickNodeError,
  QuickNodeResponse,
} from "./quicknode.d.ts";

export type {
  // Dispenser types
  Dispenser,
  DispenserFilter,
  DispenserStats,
  // Service configuration and responses
  ServiceConfig,
  ServiceError,
  ServiceResponse,
} from "./services.d.ts";
export type { __TYPE_ONLY_MODULE__ };

// ============================================================================
// Namespace Exports for Organized Access
// ============================================================================

/**
 * Bitcoin-related types organized under a namespace
 *
 * Usage:
 * ```typescript
 * import type { Bitcoin } from '@/lib/types';
 *
 * const utxo: Bitcoin.UTXO = { ... };
 * const transaction: Bitcoin.TransactionInput = { ... };
 * ```
 */
export namespace Bitcoin {
  export type BasicUTXO = import("./base.d.ts").BasicUTXO;
  export type BlockRow = import("./base.d.ts").BlockRow;
  export type BTCBalance = import("./base.d.ts").BTCBalance;
  export type BtcInfo = import("./base.d.ts").BtcInfo;
  export type ScriptType = import("./base.d.ts").ScriptType;
  export type TransactionInput = import("./base.d.ts").TransactionInput;
  export type TransactionOutput = import("./base.d.ts").TransactionOutput;
  export type UTXO = import("./base.d.ts").UTXO;

  export type BlockInfo = import("./transaction.d.ts").BlockInfo;
  export type MintStampInputData =
    import("./transaction.d.ts").MintStampInputData;
  export type ScriptTypeInfo = import("./transaction.d.ts").ScriptTypeInfo;
  export type SendRow = import("./transaction.d.ts").SendRow;
  export type TX = import("./transaction.d.ts").TX;
  export type TXError = import("./transaction.d.ts").TXError;
}

/**
 * Token-related types organized under a namespace
 *
 * Usage:
 * ```typescript
 * import type { Tokens } from '@/lib/types';
 *
 * const stamp: Tokens.StampData = { ... };
 * const src20: Tokens.SRC20Data = { ... };
 * ```
 */
export namespace Tokens {
  export type StampBalance = import("./stamp.d.ts").StampBalance;
  export type StampRow = import("./stamp.d.ts").StampRow;
  export type StampWithOptionalMarketData =
    import("./stamp.d.ts").StampWithOptionalMarketData;
  export type ValidatedStamp = import("./stamp.d.ts").ValidatedStamp;

  export type Deployment = import("./src20.d.ts").Deployment;
  export type SRC20Balance = import("./src20.d.ts").SRC20Balance;
  export type SRC20Row = import("./src20.d.ts").SRC20Row;
  export type SRC20WithOptionalMarketData =
    import("./src20.d.ts").SRC20WithOptionalMarketData;

  export type SRC101Balance = import("./src101.d.ts").SRC101Balance;
}

/**
 * API-related types organized under a namespace
 *
 * Usage:
 * ```typescript
 * import type { API } from '@/lib/types';
 *
 * const context: API.AddressHandlerContext = { ... };
 * const response: API.PaginatedStampResponseBody = { ... };
 * ```
 */
export namespace API {
  export {
    type AddressHandlerContext,
    type BlockHandlerContext,
    type BlockInfoResponseBody,
    type DeployResponseBody,
    type IdentHandlerContext,
    type PaginatedSrc20ResponseBody,
    type PaginatedStampResponseBody,
    type Src20BalanceResponseBody,
    type Src20ResponseBody,
    type StampPageProps,
    type TickHandlerContext,
  } from "./api.d.ts";

  export {
    type ApiErrorResponse,
    type ApiResponse,
    type ApiSuccessResponse,
  } from "./errors.d.ts";
}

/**
 * Error-related types organized under a namespace
 *
 * Usage:
 * ```typescript
 * import type { Errors } from '@/lib/types';
 *
 * const validation: Errors.ValidationError = new ValidationError(...);
 * const result: Errors.Result<StampData> = { ... };
 * ```
 */
export namespace Errors {
  export {
    type APIError,
    type ApplicationError,
    type AsyncResult,
    type BitcoinError,
    type ErrorHandler,
    type Result,
    type SRC20Error,
    type StampError,
    type ValidationError,
    type ValidationResult,
  } from "./errors.d.ts";
}

// ============================================================================
// Legacy Compatibility Exports
// ============================================================================

/**
 * @deprecated Use WalletInfo instead
 * Maintained for backward compatibility
 */
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
    items: unknown[]; // Simplified to avoid circular dependencies
  };
}

// ============================================================================
// Module Type Validation
// ============================================================================

/**
 * Type-only assertion to ensure all exports are type-only
 * This prevents accidental runtime imports and supports tree-shaking
 */
declare const __TYPE_ONLY_MODULE__: unique symbol;
