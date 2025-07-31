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
  // Bitcoin base primitives
  ScriptType,
  UTXO,
  BasicUTXO,
  TransactionInput,
  TransactionOutput,
  BTCBalance,
  BtcInfo,
  
  // Configuration and constants
  Config,
  ROOT_DOMAIN_TYPES,
  SUBPROTOCOLS,
  WalletDataTypes,
  
  // Block and transaction data
  BlockRow,
  XCPParams,
  
  // Fee calculation types
  FeeDetails,
  FeeEstimationParams,
  FeeEstimationResult,
  BaseFeeCalculatorProps,
  SimpleFeeCalculatorProps,
  AdvancedFeeCalculatorProps,
  AncestorInfo,
} from "./base.d.ts";

export type {
  // Transaction processing types
  SendRow,
  BlockInfo,
  TX,
  TXError,
  MintStampInputData,
  
  // Script and size estimation
  ScriptTypeInfo,
  InputTypeForSizeEstimation,
  OutputTypeForSizeEstimation,
  Output,
} from "./transaction.d.ts";

// ============================================================================
// Token & Asset Types
// ============================================================================

export type {
  // Core stamp data structures
  StampRow,
  StampBalance,
  ValidatedStamp,
  
  // Extended stamp interfaces
  StampWithOptionalMarketData,
  
  // Stamp metadata and validation
  StampMetadata,
  StampValidationResult,
  StampValidationError,
  StampValidationWarning,
  
  // Stamp enums and types
  StampClassification,
  StampValidationStatus,
  StampRarity,
  StampStatus,
  STAMP_TYPES,
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  
  // Stamp transaction types
  StampTransactionType,
  StampTransactionInput,
  StampTransactionOutput,
  StampParsingResult,
  
  // Stamp filters and props
  StampFilters,
} from "./stamp.d.ts";

export type {
  // SRC-20 core types
  SRC20Row,
  SRC20Balance,
  EnrichedSRC20Row,
  Deployment,
  
  // SRC-20 operations and status
  SRC20Operation,
  SRC20MintStatus,
  SRC20HolderData,
  SRC20TickPageData,
  
  // SRC-20 type constants
  SRC20_TYPES,
  SRC20_FILTER_TYPES,
  SRC20_STATUS,
  SRC20_DETAILS,
  SRC20_MARKET,
  
  // Extended SRC-20 interfaces
  SRC20WithOptionalMarketData,
  PaginatedSRC20WithMarketDataResponse,
  SRC20MarketDataQueryParams,
  
  // SRC-20 filters and requests
  SRC20Filters,
  SRC20TrxRequestParams,
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
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
  IdentHandlerContext,
  TickHandlerContext,
  
  // API response bodies
  DeployResponseBody,
  Src20ResponseBody,
  Src20BalanceResponseBody,
  StampBlockResponseBody,
  BlockInfoResponseBody,
  
  // Paginated responses
  PaginatedIdResponseBody,
  PaginatedDispenserResponseBody,
  PaginatedSrc20ResponseBody,
  PaginatedSrc20BalanceResponseBody,
  PaginatedStampResponseBody,
  PaginatedStampBalanceResponseBody,
  PaginatedTickResponseBody,
  
  // Request parameters
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
  
  // Page props and combined data
  StampPageProps,
  StampsAndSrc20,
} from "./api.d.ts";

// ============================================================================
// Wallet & Address Types
// ============================================================================

export type {
  // Core wallet types
  WalletInfo,
  BTCBalanceInfo,
  
  // External API responses
  BlockCypherAddressBalanceResponse,
  
  // Legacy wallet interface (deprecated - use WalletInfo)
  WalletInfo as Wallet,
} from "./wallet.d.ts";

// ============================================================================
// UI & Component Types
// ============================================================================

export type {
  // Base component types
  BaseComponentProps,
  ExtendedComponentProps,
  ComponentWithChildren,
  
  // Theme and styling
  ColorPalette,
  Typography,
  SpacingScale,
  Breakpoints,
  Theme,
  
  // Button types
  ButtonVariant,
  ButtonColor,
  ButtonSize,
  ButtonProps,
  BaseButtonProps,
  IconButtonProps,
  ProcessingButtonProps,
  
  // Form component types
  FormControlProps,
  InputProps,
  SelectProps,
  TextareaProps,
  
  // Layout types
  FlexboxProps,
  GridProps,
  ContainerProps,
  
  // Table and display types
  TableColumn,
  TableProps,
  PaginationProps,
  
  // State component types
  LoadingStateProps,
  ErrorStateProps,
  EmptyStateProps,
  AsyncStateProps,
  
  // Gallery and card types
  StampGalleryProps,
  CollectionGalleryProps,
  SRC20CardSize,
  SRC20CardProps,
  
  // Responsive and accessibility
  ResponsiveValue,
  ResponsiveProps,
  AriaAttributes,
  KeyboardNavigationProps,
  ScreenReaderProps,
  
  // Icon and animation types
  IconSize,
  IconWeight,
  IconProps,
  AnimationProps,
  TransitionProps,
} from "./ui.d.ts";

// ============================================================================
// Utility & Infrastructure Types
// ============================================================================

export type {
  // Pagination types
  PaginationQueryParams,
  PaginatedResponse,
  PaginationProps,
} from "./pagination.d.ts";

export type {
  // Utility functions and helpers
  DeepPartial,
  Optional,
  RequiredKeys,
  PartialKeys,
  NonEmptyArray,
  
  // Type guards and validation
  TypeGuard,
  ValidationFunction,
  
  // String and numeric utilities
  StringUtils,
  NumberUtils,
  DateUtils,
} from "./utils.d.ts";

export type {
  // Error handling types
  BaseError,
  ValidationError,
  APIError,
  BitcoinError,
  SRC20Error,
  StampError,
  DatabaseError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  
  // Error enums and codes
  ValidationErrorCode,
  APIErrorCode,
  BitcoinErrorCode,
  SRC20ErrorCode,
  StampErrorCode,
  ErrorSeverity,
  
  // Error structures and responses
  FieldValidationError,
  ValidationErrorCollection,
  ValidationResult,
  ApiErrorResponse,
  ApiSuccessResponse,
  ApiResponse,
  
  // React error boundary types
  ErrorInfo,
  ErrorBoundaryState,
  ErrorBoundaryProps,
  ErrorFallbackProps,
  ErrorRecoveryAction,
  ErrorContext,
  
  // Error discrimination and utilities
  ApplicationError,
  ErrorByType,
  Result,
  AsyncResult,
  ErrorHandler,
  AsyncErrorHandler,
  ErrorRecoveryFunction,
  ErrorReportingFunction,
  ErrorTransformer,
} from "./errors.d.ts";

// ============================================================================
// Market Data & Analytics Types
// ============================================================================

export type {
  // Market data responses
  SRC20MarketDataResponse,
  StampMarketDataResponse,
  
  // Extended data with market info
  SRC20WithMarketData,
  StampWithMarketData,
  CollectionWithMarketData,
  
  // Cache and source types
  CacheStatus,
  MarketDataSource,
  MarketDataSourcesRow,
  ExchangeSources,
  VolumeSources,
  
  // Holder and cache data
  StampHolderCache,
  StampHolderCacheRow,
} from "./marketData.d.ts";

// ============================================================================
// Fee Estimation & Advanced Transaction Types
// ============================================================================

export type {
  // Progressive fee estimation
  ProgressiveFeeEstimationOptions,
  ProgressiveFeeEstimationResult,
  EstimationPhase,
  FeeEstimationError,
  
  // Tool-specific types
  ToolType,
  ToolEstimationParams,
  
  // UTXO management
  DetailedUTXO,
  UTXOCache,
  UtxoSelectionStrategy,
  
  // Cache management
  CacheManagerConfig,
  CacheResult,
  CacheStats,
} from "./fee-estimation.ts";

// ============================================================================
// External Service & Integration Types
// ============================================================================

export type {
  // QuickNode API types
  QuickNodeConfig,
  QuickNodeResponse,
  QuickNodeError,
} from "./quicknode.d.ts";

export type {
  // Service configuration and responses
  ServiceConfig,
  ServiceResponse,
  ServiceError,
} from "./services.d.ts";

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
  export {
    type ScriptType,
    type UTXO,
    type BasicUTXO,
    type TransactionInput,
    type TransactionOutput,
    type BTCBalance,
    type BtcInfo,
    type BlockRow,
  } from "./base.d.ts";
  
  export {
    type SendRow,
    type BlockInfo,
    type TX,
    type TXError,
    type MintStampInputData,
    type ScriptTypeInfo,
  } from "./transaction.d.ts";
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
  export {
    type StampRow,
    type StampBalance,
    type ValidatedStamp,
    type StampWithOptionalMarketData,
  } from "./stamp.d.ts";
  
  export {
    type SRC20Row,
    type SRC20Balance,
    type Deployment,
    type SRC20WithOptionalMarketData,
  } from "./src20.d.ts";
  
  export {
    type SRC101Balance,
  } from "./src101.d.ts";
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
    type IdentHandlerContext,
    type TickHandlerContext,
    type PaginatedStampResponseBody,
    type PaginatedSrc20ResponseBody,
    type DeployResponseBody,
    type Src20ResponseBody,
    type Src20BalanceResponseBody,
    type BlockInfoResponseBody,
    type StampPageProps,
  } from "./api.d.ts";
  
  export {
    type ApiResponse,
    type ApiErrorResponse,
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
    type ApplicationError,
    type ValidationError,
    type APIError,
    type BitcoinError,
    type SRC20Error,
    type StampError,
    type ValidationResult,
    type Result,
    type AsyncResult,
    type ErrorHandler,
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
export type { __TYPE_ONLY_MODULE__ };