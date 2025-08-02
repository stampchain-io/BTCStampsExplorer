import type { BlockRow, FeeDetails } from "$types/base.d.ts";
import type { FeeData } from "$types/services.d.ts";
import type { SortKey } from "$types/sorting.d.ts";
import type { TimeSeriesData } from "$types/stamp.d.ts";
import type { ListProps } from "$types/ui.d.ts";

export interface TypeSafetyReport {
  totalTypes: number;
  coveragePercentage: number;
  safetyScore: number;
  criticalIssues: string[];
}

export interface TypeCoverageAnalysis {
  filesCovered: number;
  totalFiles: number;
  uncoveredFiles: string[];
  complexityRating: "low" | "medium" | "high";
}

export interface TypeSystemAlert {
  type: "warning" | "error" | "info";
  message: string;
  affectedFiles?: string[];
  suggestedFix?: string;
}

export interface CompilationMetrics {
  totalLines: number;
  typeAnnotationCoverage: number;
  errorCount: number;
  warningCount: number;
  compilationTime: number; // in milliseconds
}
import type { TransactionOptions } from "$types/wallet.d.ts";

export interface UTXOFromBlockCypher {
  tx_hash: string;
  block_height: number;
  tx_input_n: number;
  tx_output_n: number;
  value: number;
  ref_balance: number;
  spent: boolean;
  confirmations: number;
  confirmed: Date;
  double_spend: boolean;
  script: string;
  size: number;
}

export interface UTXOFromBlockchain {
  tx_hash_big_endian: string;
  tx_hash: string;
  tx_output_n: number;
  script: string;
  value: number;
  value_hex: string;
  confirmations: number;
  tx_index: number;
}

// UTXO interface moved to base.d.ts to avoid duplication
// Import with: import type { UTXO } from "$types/base.d.ts";

type Output = {
  address: string;
  value: number;
} | {
  script: string;
  value: number;
};

export interface BufferLike {
  readonly length: number;
  readonly buffer: ArrayBuffer;
  [key: number]: number;
  slice(start?: number, end?: number): BufferLike;
  toString(encoding?: string): string;
}

export type BinaryData = BufferLike | Uint8Array;

export interface BalanceOptions {
  format?: "BTC" | "satoshis";
  fallbackValue?: number | null;
}

export interface BTCBalanceInfoOptions {
  includeUSD?: boolean;
  apiBaseUrl?: string;
}

// ========================
// TypeScript Utility Types
// ========================

/**
 * Deep recursive partial type - makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[] ? readonly DeepPartial<U>[]
    : T[P] extends object ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Deep recursive required type - makes all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[] ? DeepRequired<U>[]
    : T[P] extends readonly (infer U)[] ? readonly DeepRequired<U>[]
    : T[P] extends object ? DeepRequired<T[P]>
    : T[P];
};

/**
 * Deep recursive readonly type - makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[] ? readonly DeepReadonly<U>[]
    : T[P] extends readonly (infer U)[] ? readonly DeepReadonly<U>[]
    : T[P] extends object ? DeepReadonly<T[P]>
    : T[P];
};

/**
 * Remove readonly modifiers from all properties
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Pick properties by their value type
 */
export type PickByValue<T, V> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends V ? K : never;
  }[keyof T]
>;

/**
 * Omit properties by their value type
 */
export type OmitByValue<T, V> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends V ? never : K;
  }[keyof T]
>;

/**
 * Pick only required properties from a type
 */
export type PickRequired<T> = Pick<
  T,
  {
    [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
  }[keyof T]
>;

/**
 * Pick only optional properties from a type
 */
export type PickOptional<T> = Pick<
  T,
  {
    [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
  }[keyof T]
>;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> =
  & Omit<T, K>
  & Required<Pick<T, K>>;

/**
 * Convert union to intersection type
 */
export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I
    : never;

/**
 * Extract promise value type
 */
export type PromiseValue<T> = T extends Promise<infer U> ? U : never;

/**
 * Extract function return type
 */
export type ReturnTypeOf<T> = T extends (...args: any[]) => infer R ? R : never;

/**
 * Extract function parameter types as tuple
 */
export type Parameters<T extends (...args: any) => any> = T extends
  (...args: infer P) => any ? P : never;

/**
 * Make nullable properties optional
 */
export type NullableToOptional<T> =
  & {
    [K in keyof T as null extends T[K] ? K : never]?: T[K];
  }
  & {
    [K in keyof T as null extends T[K] ? never : K]: T[K];
  };

/**
 * Non-nullable type helper
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Exhaustive check helper for switch statements
 */
export type Never = never;

/**
 * Brand type for nominal typing
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Tuple utilities
 */
export type Head<T extends readonly any[]> = T extends readonly [any, ...any[]]
  ? T[0]
  : never;

export type Tail<T extends readonly any[]> = T extends
  readonly [any, ...infer U] ? U
  : [];

export type Last<T extends readonly any[]> = T extends
  readonly [...any[], infer U] ? U
  : never;

/**
 * Object key utilities
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type ValuesOf<T> = T[keyof T];

/**
 * Type predicate helpers
 */
export type IsNever<T> = [T] extends [never] ? true : false;
export type IsAny<T> = 0 extends (1 & T) ? true : false;
export type IsUnknown<T> = IsAny<T> extends true ? false
  : unknown extends T ? true
  : false;

// ========================
// Bitcoin-Specific Types
// ========================

/**
 * Bitcoin address format types
 */
export type BitcoinAddressFormat =
  | "P2PKH"
  | "P2SH"
  | "P2WPKH"
  | "P2WSH"
  | "P2TR";

/**
 * Network types for Bitcoin addresses
 */
export type BitcoinNetwork = "mainnet" | "testnet" | "regtest";

/**
 * Address validation result type
 */
export interface AddressValidationResult {
  isValid: boolean;
  format?: BitcoinAddressFormat;
  network?: BitcoinNetwork;
  error?: string;
}

/**
 * Bitcoin address type guards
 */
export type AddressTypeGuard<T extends BitcoinAddressFormat> = (
  address: string,
) => boolean;

/**
 * Address format mapping type
 */
export type AddressFormatMap<T> = {
  [K in BitcoinAddressFormat]: T;
};

/**
 * Script type enumeration
 */
export type ScriptType =
  | "P2PK" // Pay to Public Key
  | "P2PKH" // Pay to Public Key Hash
  | "P2SH" // Pay to Script Hash
  | "P2WPKH" // Pay to Witness Public Key Hash
  | "P2WSH" // Pay to Witness Script Hash
  | "P2TR" // Pay to Taproot
  | "MULTISIG" // Multi-signature
  | "NULL_DATA" // OP_RETURN data
  | "UNKNOWN"; // Unknown script type

/**
 * Transaction input/output type utilities
 */
export interface TransactionInput {
  txid: string;
  vout: number;
  scriptSig: string;
  sequence: number;
  witness?: string[];
}

export interface TransactionOutput {
  value: number;
  scriptPubKey: string;
  address?: string;
  scriptType?: ScriptType;
}

/**
 * UTXO selection strategies
 */
export type UTXOSelectionStrategy =
  | "FIFO" // First In, First Out
  | "LIFO" // Last In, First Out
  | "LARGEST_FIRST" // Largest value first
  | "SMALLEST_FIRST" // Smallest value first
  | "OPTIMAL"; // Optimal selection algorithm

/**
 * Fee calculation types
 */
export interface FeeCalculationOptions {
  feeRate: number; // satoshis per byte
  strategy?: UTXOSelectionStrategy;
  dustThreshold?: number;
  maxFeeRate?: number;
}

export interface FeeEstimate {
  totalFee: number;
  feeRate: number;
  estimatedSize: number;
  inputCount: number;
  outputCount: number;
}

// ========================
// Data Transformation Types
// ========================

/**
 * API response wrapper type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
  timestamp?: number;
}

/**
 * API error type
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Sort order type
 */
export type SortOrder = "asc" | "desc";

/**
 * Generic sorting interface
 */
export interface SortConfig<T = string> {
  field: T;
  order: SortOrder;
}

/**
 * Filter operator types
 */
export type FilterOperator =
  | "eq" // equals
  | "ne" // not equals
  | "gt" // greater than
  | "gte" // greater than or equal
  | "lt" // less than
  | "lte" // less than or equal
  | "in" // in array
  | "nin" // not in array
  | "like" // string contains
  | "regex" // regex match
  | "exists"; // field exists

/**
 * Generic filter interface
 */
export interface FilterConfig<T = string> {
  field: T;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Query parameters type
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: SortConfig[];
  filters?: FilterConfig[];
  search?: string;
}

/**
 * Type-safe object merger
 */
export type DeepMerge<T, U> = {
  [K in keyof T | keyof U]: K extends keyof U
    ? K extends keyof T
      ? T[K] extends object ? U[K] extends object ? DeepMerge<T[K], U[K]>
        : U[K]
      : U[K]
    : U[K]
    : K extends keyof T ? T[K]
    : never;
};

/**
 * Array utilities
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Null/undefined handling utilities
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

/**
 * Safe property access type
 */
export type SafeGet<T, K extends string> = K extends keyof T
  ? T[K] extends object ? T[K]
  : T[K] | undefined
  : undefined;

/**
 * Type assertion helpers
 */
export type AssertType<T, U extends T> = U;
export type Cast<T, U> = T extends U ? T : U;

/**
 * Tagged union helpers
 */
export type DiscriminatedUnion<T, K extends keyof T, V extends T[K]> = T extends
  Record<K, V> ? T : never;

/**
 * Exhaustive check function type
 */
export type ExhaustiveCheck = (value: never) => never;

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

/**
 * Callback types
 */
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
export type CallbackWithParam<P, T = void> = (param: P) => T;
export type AsyncCallbackWithParam<P, T = void> = (param: P) => Promise<T>;

/**
 * Environment configuration type
 */
export interface EnvironmentConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT?: number;
  DATABASE_URL?: string;
  API_BASE_URL?: string;
  BITCOIN_NETWORK?: BitcoinNetwork;
  DEBUG?: boolean;
}

/**
 * TestResult - Migrated from runMarketDataTests.ts
 */
export interface TestResult {
  category: string;
  file: string;
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * URLUpdateParams - Migrated from useURLUpdate.ts
 */
export interface URLUpdateParams {
  sortBy?: "ASC" | "DESC";
  filterBy?: FilterTypes[];
}

/**
 * CarouselElement - Migrated from carousel-slider.ts
 */
export type CarouselElement = any;

/**
 * LeatherAddress - Migrated from leather.ts
 */
export interface LeatherAddress {
  symbol: "BTC" | "STX";
  type?: "p2wpkh" | "p2tr";
  address: string;
  publicKey: string;
  derivationPath?: string;
  tweakedPublicKey?: string;
}

/**
 * AddToastFunction - Migrated from leather.ts
 */
export type AddToastFunction = (
  message: string,
  type: BaseToast["type"],
) => void;

/**
 * JSONRPCError - Migrated from walletHelper.ts
 */
export interface JSONRPCError {
  jsonrpc?: string;
  id?: string;
  error?: {
    code?: number;
    message?: string;
  };
}

/**
 * FormStyles - Migrated from styles.ts
 */
export type FormStyles = {
  // Inputs
  inputField: string;
  inputFieldOutline: string;
  inputFieldSquare: string;
  inputNumeric: string;
  inputTextarea: string;
  inputSelect: string;
  inputCheckbox: string;
  inputRadio: string;

  // Gradients
  purpleGradient: string;
  greyGradient: string;
  outlineGradient: string;

  // Labels - not used
  labelBase: string;
  labelLarge: string;

  // States - not used
  stateDisabled: string;
  stateLoading: string;
  stateError: string;
  stateSuccess: string;

  // Messages - not used
  messageError: string;
  messageSuccess: string;
  messageHelp: string;
};

/**
 * IconVariants - Migrated from styles.ts
 */
export interface IconVariants {
  type: "icon" | "iconButton";
  name: string;
  weight: "extraLight" | "light" | "normal" | "bold" | "custom";
  size:
    | "xxxs"
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "xxsR"
    | "xsR"
    | "smR"
    | "mdR"
    | "lgR"
    | "xlR"
    | "xxlR"
    | "custom";
  color: "grey" | "purple" | "custom";
  className?: string;
  role?: JSX.AriaRole;
  ariaLabel?: string;
  onClick?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  onMouseEnter?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  onMouseLeave?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  href?: string;
  target?: string;
  rel?: string;
  text?: string;
}

/**
 * BadgeVariants - Migrated from styles.ts
 */
export interface BadgeVariants {
  text: string;
  className?: string;
}

/**
 * FAQContent - Migrated from data.ts
 */
export interface FAQContent {
  title: string;
  subtitle: string;
  description: string;
  items: FAQItem[];
}

/**
 * FAQItem - Migrated from data.ts
 */
export interface FAQItem {
  title: string;
  content: string | string[]; // Support for both single and multi-paragraph content
  links?: {
    text: string;
    href: string;
    target?: string;
    className?: string;
  }[];
  listItems?: {
    text: string;
    href?: string; // Make href optional
    target?: string;
    className?: string;
  }[];
}

/**
 * LayoutStyles - Migrated from styles.ts
 */
export type LayoutStyles = {
  // Base styles
  glassmorphism: string;
  transition: string;

  // Body styles
  body: string;
  bodyTool: string;
  bodyArticle: string;
  gapSection: string;
  gapSectionSlim: string;
  gapGrid: string;

  // Container styles
  containerBackground: string;
  containerDetailImage: string;
  containerCard: string;
  containerCardTable: string;
  containerColData: string;
  containerColForm: string;
  containerRowForm: string;

  // Row styles
  rowForm: string;
  rowResponsiveForm: string;
  rowTable: string;
  rowCardBorderLeft: string;
  rowCardBorderRight: string;
  rowCardBorderCenter: string;

  // Loader styles
  loaderSpinGrey: string;
  loaderSpinPurple: string;

  // Modal styles
  modalBgCenter: string;
  modalBgTop: string;
  modalSearch: string;
};

/**
 * AlignmentType - Migrated from styles.ts
 */
export type AlignmentType = keyof typeof alignmentClasses;

/**
 * Holder - Migrated from HoldersTable.tsx
 */
export interface Holder {
  address?: string;
  amt: string;
  percentage: string;
}

/**
 * TextStyles - Migrated from styles.ts
 */
export type TextStyles = {
  // Logo styles
  logoPurpleDL: string;
  logoPurpleDLLink: string;
  logoPurpleLD: string;
  logoPurpleLDLink: string;
  // Navigation styles
  navLinkPurple: string;
  navSublinkPurple: string;
  navLinkGrey: string;
  navLinkGreyLD: string;
  navLinkTransparentPurple: string;
  // Title styles
  titleGreyLD: string;
  titleGreyDL: string;
  titlePurpleLD: string;
  titlePurpleDL: string;
  // Subtitle styles
  subtitleGrey: string;
  subtitlePurple: string;
  // Heading styles
  headingGrey2: string;
  headingGreyLD: string;
  headingGreyLDLink: string;
  headingGreyDLLink: string;
  headingGrey: string;
  headingPurpleLD: string;
  // Body text styles
  textXxs: string;
  textXs: string;
  textSm: string;
  textSmLink: string;
  text: string;
  textLg: string;
  textXl: string;
  textLinkUnderline: string;
  // Label styles
  labelXs: string;
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  labelXsR: string;
  labelXsPosition: string;
  labelSmPurple: string;
  labelLogicResponsive: string;
  // Value styles
  valueXs: string;
  valueSm: string;
  valueSmLink: string;
  value: string;
  valueLg: string;
  valueXl: string;
  value2xl: string;
  value3xl: string;
  value2xlTransparent: string;
  value3xlTransparent: string;
  valueSmPurple: string;
  value2xlPurpleGlow: string;
  value5xlPurpleGlow: string;
  value7xlPurpleGlow: string;
  valueDarkSm: string;
  valueDarkXs: string;
  valueDark: string;
  // Special text styles
  tagline: string;
  copyright: string;
  loaderText: string;
};

/**
 * SelectorOption - Migrated from SelectorButtons.tsx
 */
export interface SelectorOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * SortOption - Migrated from SRC20OverviewContent.tsx
 */
export type SortOption = "name" | "date" | "supply" | "price" | "volume";

/**
 * SectionKey - Migrated from FilterContentSRC20.tsx
 */
export type SectionKey = "status" | "type" | "category" | "date" | "other";

/**
 * PeriodType - Migrated from FilterContentSRC20.tsx
 */
export type PeriodType = "24h" | "3d" | "7d";

/**
 * PropTypes - Migrated from SelectDate.tsx
 */
export interface PropTypes {
  setDateRange: (date: Date[]) => void;
  isUppercase?: boolean;
}

/**
 * NavLink - Migrated from Header.tsx
 */
export interface NavLink {
  title: string | {
    default: string;
    tablet: string;
  };
  href?: string;
  subLinks?: NavLink[];
}

/**
 * FooterLink - Migrated from Footer.tsx
 */
export interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
  hiddenOnMobile?: boolean;
}

/**
 * Holder - Migrated from HoldersTableBase.tsx
 */
export interface Holder {
  address: string | null;
  amt: number | string;
  percentage: number | string;
}

/**
 * Toast - Migrated from ToastProvider.tsx
 */
export interface Toast extends BaseToast {
  id: string; // Toast instances in the provider need an id for keying and removal
}

/**
 * ActivityLevelType - Migrated from activityLevels.ts
 */
export type ActivityLevelType = "low" | "medium" | "high" | "critical";

/**
 * FlagKeys - Migrated from flags.ts
 */
export type FlagKeys = keyof {
  debug: boolean;
  production: boolean;
  staging: boolean;
  development: boolean;
  testnet: boolean;
  mainnet: boolean;
};

/**
 * Breakpoints - Migrated from useBreakpoints.ts
 */
export type Breakpoints =
  | "desktop"
  | "tablet"
  | "mobileLg"
  | "mobileMd"
  | "mobileSm";

/**
 * UseFeeResult - Migrated from useFees.ts
 */
export interface UseFeeResult {
  fees: FeeData | null;
  loading: boolean;
  error: string | null;
  fetchFees: () => Promise<void>;
  // Enhanced functionality
  feeSource: {
    source: string;
    confidence: string;
    fallbackUsed: boolean;
  };
  isUsingFallback: boolean;
  lastGoodDataAge: number | null;
  forceRefresh: () => Promise<void>;
}

/**
 * ProgressiveFeeEstimationResult - Migrated from useProgressiveFeeEstimation.ts
 */
export interface ProgressiveFeeEstimationResult {
  feeDetails: FeeDetails;
  isEstimating: boolean;
  estimationError: string | null;
  refresh: () => void;
  // ✨ Additional test-friendly properties
  estimationCount: number;
  lastEstimationTime: number | null;
  cacheStatus: "fresh" | "stale" | "empty";
  feeDetailsVersion: number;
  // Background exact fee calculation state
  isPreFetching: boolean;
  preFetchedFees: FeeDetails | null;
}

/**
 * MarketDataCacheInfo - Migrated from api.ts
 */
export interface MarketDataCacheInfo {
  status: CacheStatus;
  ageMinutes: number;
  nextUpdateIn?: number;
}

/**
 * ValidationErrorCode - Migrated from errors.ts
 */
export enum ValidationErrorCode {
  REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",
  INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",
  INVALID_TYPE = "VALIDATION_INVALID_TYPE",
  INVALID_LENGTH = "VALIDATION_INVALID_LENGTH",
  INVALID_RANGE = "VALIDATION_INVALID_RANGE",
  INVALID_PATTERN = "VALIDATION_INVALID_PATTERN",
  INVALID_EMAIL = "VALIDATION_INVALID_EMAIL",
  INVALID_URL = "VALIDATION_INVALID_URL",
  INVALID_DATE = "VALIDATION_INVALID_DATE",
  DUPLICATE_VALUE = "VALIDATION_DUPLICATE_VALUE",
  REFERENCE_NOT_FOUND = "VALIDATION_REFERENCE_NOT_FOUND",
}

/**
 * APIErrorCode - Migrated from errors.ts
 */
export enum APIErrorCode {
  BAD_REQUEST = "API_BAD_REQUEST",
  UNAUTHORIZED = "API_UNAUTHORIZED",
  FORBIDDEN = "API_FORBIDDEN",
  NOT_FOUND = "API_NOT_FOUND",
  METHOD_NOT_ALLOWED = "API_METHOD_NOT_ALLOWED",
  CONFLICT = "API_CONFLICT",
  GONE = "API_GONE",
  UNPROCESSABLE_ENTITY = "API_UNPROCESSABLE_ENTITY",
  TOO_MANY_REQUESTS = "API_TOO_MANY_REQUESTS",
  INTERNAL_ERROR = "API_INTERNAL_ERROR",
  BAD_GATEWAY = "API_BAD_GATEWAY",
  SERVICE_UNAVAILABLE = "API_SERVICE_UNAVAILABLE",
  GATEWAY_TIMEOUT = "API_GATEWAY_TIMEOUT",
}

/**
 * BitcoinErrorCode - Migrated from errors.ts
 */
export enum BitcoinErrorCode {
  INVALID_ADDRESS = "BITCOIN_INVALID_ADDRESS",
  INVALID_TRANSACTION = "BITCOIN_INVALID_TRANSACTION",
  INSUFFICIENT_FUNDS = "BITCOIN_INSUFFICIENT_FUNDS",
  TRANSACTION_TOO_LARGE = "BITCOIN_TRANSACTION_TOO_LARGE",
  FEE_TOO_LOW = "BITCOIN_FEE_TOO_LOW",
  FEE_TOO_HIGH = "BITCOIN_FEE_TOO_HIGH",
  UTXO_NOT_FOUND = "BITCOIN_UTXO_NOT_FOUND",
  SCRIPT_VALIDATION_ERROR = "BITCOIN_SCRIPT_VALIDATION_ERROR",
  NETWORK_ERROR = "BITCOIN_NETWORK_ERROR",
  NODE_UNAVAILABLE = "BITCOIN_NODE_UNAVAILABLE",
  MEMPOOL_FULL = "BITCOIN_MEMPOOL_FULL",
  DOUBLE_SPEND = "BITCOIN_DOUBLE_SPEND",
}

/**
 * ErrorSeverity - Migrated from errors.ts
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * FeeEstimationError - Migrated from fee-estimation.ts
 */
export interface FeeEstimationError extends Error {
  /** Which phase the error occurred in */
  phase?: "instant" | "smart" | "exact";
  /** Error code for programmatic handling */
  code:
    | "TIMEOUT"
    | "NETWORK_ERROR"
    | "VALIDATION_ERROR"
    | "CACHE_ERROR"
    | "UTXO_ERROR"
    | "UNKNOWN";
  /** Original error if this wraps another error */
  originalError?: Error;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * ToolType - Migrated from fee-estimation.ts
 */
export type ToolType = ToolEstimationParams["toolType"];

/**
 * EstimationPhase - Migrated from fee-estimation.ts
 */
export type EstimationPhase = "instant" | "smart" | "exact";

/**
 * CacheResult - Migrated from fee-estimation.ts
 */
export type CacheResult<T> = {
  success: true;
  data: T;
  fromCache: boolean;
} | {
  success: false;
  error: string;
  fromCache: false;
};

/**
 * ActivityLevel - Migrated from marketData.d.ts
 */
export type ActivityLevel = "HOT" | "WARM" | "COOL" | "DORMANT" | "COLD";

/**
 * CacheStatus - Migrated from marketData.d.ts
 */
export type CacheStatus = "fresh" | "stale" | "expired";

/**
 * VolumeSources - Migrated from marketData.d.ts
 */
export type VolumeSources = Record<string, number>;

/**
 * ExchangeSources - Migrated from marketData.d.ts
 */
export type ExchangeSources = string[];

/**
 * GetPublicKeyFromAddress - Migrated from quicknode.d.ts
 */
export interface GetPublicKeyFromAddress {
  (address: string): Promise<string>;
}

/**
 * QuicknodeResult - Migrated from quicknode.d.ts
 */
export interface QuicknodeResult {
  result: any;
}

/**
 * FetchQuicknodeFunction - Migrated from quicknode.d.ts
 */
export interface FetchQuicknodeFunction {
  (
    method: string,
    params: unknown[],
    retries?: number,
  ): Promise<QuicknodeResult | null>;
}

/**
 * Dispense - Migrated from services.d.ts
 */
export interface Dispense {
  tx_hash: string;
  block_index: number;
  cpid: string;
  source: string;
  destination: string;
  dispenser_tx_hash: string;
  dispense_quantity: number;
  confirmed: boolean;
  btc_amount: number | undefined;
  close_block_index: number | null;
  dispenser_details: any | null;
}

/**
 * Fairminter - Migrated from services.d.ts
 */
export interface Fairminter {
  tx_hash: string;
  tx_index: number;
  block_index: number;
  source: string;
  asset: string;
  asset_parent: string;
  asset_longname: string;
  description: string;
  price: number;
  quantity_by_price: number;
  hard_cap: number;
  burn_payment: boolean;
  max_mint_per_tx: number;
  premint_quantity: number;
  start_block: number;
  end_block: number;
  minted_asset_commission_int: number;
  soft_cap: number;
  soft_cap_deadline_block: number;
  lock_description: boolean;
  lock_quantity: boolean;
  divisible: boolean;
  pre_minted: boolean;
  status: string;
  paid_quantity: number | null;
  confirmed: boolean;
}

/**
 * XcpBalance - Migrated from services.d.ts
 */
export interface XcpBalance {
  address: string | null;
  cpid: string;
  quantity: number;
  utxo: string;
  utxo_address: string;
  divisible: boolean;
}

/**
 * DispenserStats - Migrated from services.d.ts
 */
export interface DispenserStats {
  open: number;
  closed: number;
  total: number;
  items: Dispenser[];
}

/**
 * AsyncOperationConfig - Migrated from services.d.ts
 */
export interface AsyncOperationConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  retryBackoff: "linear" | "exponential";
  circuit?: CircuitBreakerConfig;
}

/**
 * CircuitBreakerConfig - Migrated from services.d.ts
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  enabled: boolean;
}

/**
 * RetryConfig - Migrated from services.d.ts
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

/**
 * LoggingConfig - Migrated from services.d.ts
 */
export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text";
  outputs: ("console" | "file" | "remote")[];
  contextFields: string[];
}

/**
 * MonitoringConfig - Migrated from services.d.ts
 */
export interface MonitoringConfig {
  enabled: boolean;
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  healthCheckInterval: number;
  performanceTracking: boolean;
}

/**
 * PaginatedResult - Migrated from services.d.ts
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * QueryCriteria - Migrated from services.d.ts
 */
export interface QueryCriteria {
  filters?: Record<string, unknown>;
  sorting?: SortCriteria[];
  pagination?: PaginationCriteria;
}

/**
 * SortCriteria - Migrated from services.d.ts
 */
export interface SortCriteria {
  field: string;
  direction: "asc" | "desc";
}

/**
 * PaginationCriteria - Migrated from services.d.ts
 */
export interface PaginationCriteria {
  offset: number;
  limit: number;
}

/**
 * IEventEmitter - Migrated from services.d.ts
 */
export interface IEventEmitter {
  /** Emit an event */
  emit<T>(
    eventType: string,
    data: T,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  /** Subscribe to events */
  on<T>(eventType: string, handler: EventHandler<T>): void;
  /** Unsubscribe from events */
  off<T>(eventType: string, handler: EventHandler<T>): void;
  /** Subscribe to events once */
  once<T>(eventType: string, handler: EventHandler<T>): void;
  /** Get event listener count */
  listenerCount(eventType: string): number;
}

/**
 * IMessageQueue - Migrated from services.d.ts
 */
export interface IMessageQueue {
  /** Send message to queue */
  send<T>(
    queueName: string,
    message: T,
    options?: MessageOptions,
  ): Promise<void>;
  /** Subscribe to queue messages */
  subscribe<T>(queueName: string, handler: MessageHandler<T>): Promise<void>;
  /** Unsubscribe from queue */
  unsubscribe(queueName: string): Promise<void>;
  /** Get queue statistics */
  getQueueStats(queueName: string): Promise<QueueStats>;
}

/**
 * MessageOptions - Migrated from services.d.ts
 */
export interface MessageOptions {
  delay?: number;
  ttl?: number;
  priority?: number;
  retries?: number;
}

/**
 * QueueStats - Migrated from services.d.ts
 */
export interface QueueStats {
  name: string;
  size: number;
  processing: number;
  failed: number;
  completed: number;
}

/**
 * IPubSub - Migrated from services.d.ts
 */
export interface IPubSub {
  /** Publish message to topic */
  publish<T>(topic: string, message: T): Promise<void>;
  /** Subscribe to topic */
  subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<string>;
  /** Unsubscribe from topic */
  unsubscribe(subscriptionId: string): Promise<void>;
  /** Get topic subscribers count */
  getSubscriberCount(topic: string): Promise<number>;
}

/**
 * TraceSpan - Migrated from services.d.ts
 */
export interface TraceSpan {
  id: string;
  traceId: string;
  operationName: string;
  startTime: string;
  duration?: number;
  tags: Record<string, unknown>;
  events: TraceEvent[];
}

/**
 * TimePeriod - Migrated from services.d.ts
 */
export interface TimePeriod {
  start: string;
  end: string;
}

/**
 * DispenserFilter - Migrated from services.d.ts
 */
export type DispenserFilter = "open" | "closed" | "all";

/**
 * MessageHandler - Migrated from services.d.ts
 */
export type MessageHandler<T = unknown> = (message: T) => void | Promise<void>;

/**
 * Deployment - Migrated from src101.d.ts
 */
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

/**
 * ProtocolComplianceLevel - Migrated from stamp.d.ts
 */
overallLevel: ProtocolComplianceLevel;

/**
 * ToolEndpointAdapter - Migrated from toolEndpointAdapter.ts
 */
export interface ToolEndpointAdapter<
  T extends TransactionOptions = TransactionOptions,
> {
  processTransaction(options: T): Promise<any>;
  validateOptions(options: T): boolean;
}

/**
 * ToolEndpointAdapterFactory - Migrated from toolEndpointAdapter.ts
 */
export interface ToolEndpointAdapterFactory {
  /**
   * Create an adapter for the specified tool type
   * @param toolType Type of tool to create adapter for
   * @returns Appropriate adapter instance
   */
  createAdapter(toolType: ToolType): ToolEndpointAdapter;

  /**
   * Get all supported tool types
   * @returns Array of supported tool types
   */
  getSupportedToolTypes(): ToolType[];
}

/**
 * ScriptTypeInfo - Migrated from transaction.d.ts
 */
export interface ScriptTypeInfo {
  type: ScriptType;
  isWitness: boolean;
  size: number;
  redeemScriptType?: ScriptTypeInfo;
}

/**
 * InputTypeForSizeEstimation - Migrated from transaction.d.ts
 */
export interface InputTypeForSizeEstimation {
  type: ScriptType;
  isWitness?: boolean;
  redeemScriptType?: ScriptType;
}

/**
 * OutputTypeForSizeEstimation - Migrated from transaction.d.ts
 */
export interface OutputTypeForSizeEstimation {
  type: ScriptType;
}

/**
 * DispenseRow - Migrated from transaction.d.ts
 */
export interface DispenseRow {
  /** Transaction hash of the dispense */
  tx_hash: string;
  /** Block index where dispense occurred */
  block_index: number;
  /** Asset being dispensed (CPID) */
  cpid: string;
  /** Source address (dispenser owner) */
  source: string;
  /** Destination address (recipient) */
  destination: string;
  /** Original dispenser transaction hash */
  dispenser_tx_hash: string;
  /** Quantity dispensed */
  dispense_quantity: number;
}

/**
 * DispenserRow - Migrated from transaction.d.ts
 */
export interface DispenserRow {
  /** Transaction hash that created the dispenser */
  tx_hash: string;
  /** Block index where dispenser was created */
  block_index: number;
  /** Source address (dispenser owner) */
  source: string;
  /** Asset being dispensed (CPID) */
  cpid: string;
  /** Quantity given per dispense */
  give_quantity: number;
  /** Remaining quantity available */
  give_remaining: number;
  /** Total quantity in escrow */
  escrow_quantity: number;
  /** Rate in satoshis per unit */
  satoshirate: number;
  /** Rate in BTC per unit */
  btcrate: number;
  /** Original dispenser transaction */
  origin: string;
  /** Array of dispense transactions */
  dispenses: DispenseRow[];
}

/**
 * NonNumberProps - Migrated from utils_demo.ts
 */
const nonNumbers: NonNumberProps = { name: "test", active: true };

/**
 * MergedPrefs - Migrated from utils_demo.ts
 */
/**
 * P2PKHAddress - Migrated from wallet.d.ts
 */
export interface P2PKHAddress {
  format: AddressFormat.P2PKH;
  address: string;
}

/**
 * P2SHAddress - Migrated from wallet.d.ts
 */
export interface P2SHAddress {
  format: AddressFormat.P2SH;
  address: string;
}

/**
 * BlockPageData - Migrated from [block_index].tsx
 */
export interface BlockPageData {
  currentBlock: BlockRow;
  relatedBlocks: BlockRow[];
  error?: string;
}

/**
 * BlockIndexData - Migrated from index.tsx
 */
export interface BlockIndexData {
  currentBlock: BlockRow;
  relatedBlocks: BlockRow[];
  lastBlock: number;
  error?: string;
}

/**
 * TestResult - Migrated from test-image.ts
 */
export interface TestResult {
  txHash: string;
  url: string;
  status: number;
  ok: boolean;
  contentType: string | null;
  headers: Record<string, string>;
  cors?: {
    allowOrigin: string | null;
    allowMethods: string | null;
    allowHeaders: string | null;
  };
  error?: string;
  type?: string;
}

/**
 * DatabaseSchema - Migrated from server.type.test.ts
 */
export interface DatabaseSchema {
  tables: { [tableName: string]: TableDefinition };
  indexes: { [indexName: string]: IndexDefinition };
  constraints: { [constraintName: string]: ConstraintDefinition };
  version: string;
}

/**
 * TableDefinition - Migrated from server.type.test.ts
 */
export interface TableDefinition {
  name: string;
  columns: { [columnName: string]: ColumnDefinition };
  primaryKey: string[];
  indexes?: IndexDefinition[];
  constraints?: ConstraintDefinition[];
  engine?: "InnoDB" | "MyISAM" | "Memory" | "Archive";
  charset?: string;
  collation?: string;
}

/**
 * IndexDefinition - Migrated from server.type.test.ts
 */
export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: "PRIMARY" | "UNIQUE" | "INDEX" | "FULLTEXT" | "SPATIAL";
  method?: "BTREE" | "HASH";
}

/**
 * ConstraintDefinition - Migrated from server.type.test.ts
 */
export interface ConstraintDefinition {
  name: string;
  table: string;
  type: "FOREIGN_KEY" | "CHECK" | "UNIQUE" | "PRIMARY_KEY";
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onUpdate?: "CASCADE" | "SET_NULL" | "RESTRICT" | "NO_ACTION";
  onDelete?: "CASCADE" | "SET_NULL" | "RESTRICT" | "NO_ACTION";
}

/**
 * WhereCondition - Migrated from server.type.test.ts
 */
export type WhereCondition<T> = {
  [K in keyof T]?: T[K] | {
    $eq?: T[K];
    $ne?: T[K];
    $gt?: T[K];
    $gte?: T[K];
    $lt?: T[K];
    $lte?: T[K];
    $in?: T[K][];
    $nin?: T[K][];
    $like?: string;
    $regex?: string;
  };
};

/**
 * DatabaseQueryResult - Migrated from server.type.test.ts
 */
export interface DatabaseQueryResult<T> {
  rows: T[];
  rowCount: number;
  command: string;
  fields: Array<{
    name: string;
    type: string;
    length: number;
    nullable: boolean;
    primaryKey: boolean;
    unique: boolean;
    autoIncrement: boolean;
    default: any;
  }>;
  affectedRows?: number;
  insertId?: number;
  warningCount?: number;
}

/**
 * QueryBuilder - Migrated from server.type.test.ts
 */
export interface QueryBuilder<T> {
  select: SelectQueryBuilder<T>;
  insert: InsertQueryBuilder<T>;
  update: UpdateQueryBuilder<T>;
  delete: DeleteQueryBuilder<T>;
}

/**
 * SelectQueryBuilder - Migrated from server.type.test.ts
 */
export interface SelectQueryBuilder<T> {
  from(table: string): SelectQueryBuilder<T>;
  where(condition: WhereCondition<T>): SelectQueryBuilder<T>;
  orderBy(column: keyof T, direction?: "ASC" | "DESC"): SelectQueryBuilder<T>;
  limit(count: number): SelectQueryBuilder<T>;
  offset(count: number): SelectQueryBuilder<T>;
  execute(): Promise<DatabaseQueryResult<T>>;
}

/**
 * InsertQueryBuilder - Migrated from server.type.test.ts
 */
export interface InsertQueryBuilder<T> {
  into(table: string): InsertQueryBuilder<T>;
  values(data: Partial<T> | Partial<T>[]): InsertQueryBuilder<T>;
  execute(): Promise<DatabaseQueryResult<T>>;
}

/**
 * UpdateQueryBuilder - Migrated from server.type.test.ts
 */
export interface UpdateQueryBuilder<T> {
  table(name: string): UpdateQueryBuilder<T>;
  set(data: Partial<T>): UpdateQueryBuilder<T>;
  where(condition: WhereCondition<T>): UpdateQueryBuilder<T>;
  execute(): Promise<DatabaseQueryResult<T>>;
}

/**
 * DeleteQueryBuilder - Migrated from server.type.test.ts
 */
export interface DeleteQueryBuilder<T> {
  from(table: string): DeleteQueryBuilder<T>;
  where(condition: WhereCondition<T>): DeleteQueryBuilder<T>;
  execute(): Promise<DatabaseQueryResult<T>>;
}

/**
 * ModelQueryBuilder - Migrated from server.type.test.ts
 */
export interface ModelQueryBuilder<T> extends QueryBuilder<T> {
  find(id: any): Promise<T | null>;
  findAll(options?: QueryOptions<T>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: any, data: Partial<T>): Promise<T>;
  delete(id: any): Promise<boolean>;
}

/**
 * QueryOptions - Migrated from server.type.test.ts
 */
export interface QueryOptions<T> {
  where?: WhereCondition<T>;
  orderBy?: { column: keyof T; direction: "ASC" | "DESC" }[];
  limit?: number;
  offset?: number;
  include?: string[];
}

/**
 * PaginatedResult - Migrated from server.type.test.ts
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
    from: number;
    to: number;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

/**
 * RelationDefinition - Migrated from server.type.test.ts
 */
export interface RelationDefinition {
  type: "hasOne" | "hasMany" | "belongsTo" | "belongsToMany";
  model: string;
  foreignKey?: string;
  localKey?: string;
  pivotTable?: string;
  pivotForeignKey?: string;
  pivotLocalKey?: string;
}

/**
 * DatabaseConnection - Migrated from server.type.test.ts
 */
export interface DatabaseConnection {
  type: "mysql" | "postgresql" | "sqlite" | "redis" | "mongodb";
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
    connectionTimeout?: number;
    acquireTimeout?: number;
    timeout?: number;
    reconnect?: boolean;
    pool?: {
      min: number;
      max: number;
      idle?: number;
    };
  };
  client: any;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ping(): Promise<boolean>;
  execute(query: string, params?: any[]): Promise<DatabaseQueryResult<any>>;
  transaction<T>(callback: (trx: any) => Promise<T>): Promise<T>;
}

/**
 * SQLDatabase - Migrated from server.type.test.ts
 */
export interface SQLDatabase extends DatabaseConnection {
  type: "mysql" | "postgresql" | "sqlite";
  query<T>(sql: string, params?: any[]): Promise<DatabaseQueryResult<T>>;
  prepare(sql: string): PreparedStatement;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * NoSQLDatabase - Migrated from server.type.test.ts
 */
export interface NoSQLDatabase extends DatabaseConnection {
  type: "mongodb";
  collection(name: string): Collection;
  createIndex(collection: string, index: any): Promise<void>;
  dropIndex(collection: string, index: string): Promise<void>;
}

/**
 * RedisDatabase - Migrated from server.type.test.ts
 */
export interface RedisDatabase extends DatabaseConnection {
  type: "redis";
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<string>;
  del(key: string | string[]): Promise<number>;
  exists(key: string): Promise<boolean>;
  expire(key: string, seconds: number): Promise<boolean>;
  keys(pattern: string): Promise<string[]>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  sadd(key: string, member: string | string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  zadd(key: string, score: number, member: string): Promise<number>;
  zrange(key: string, start: number, stop: number): Promise<string[]>;
}

/**
 * PreparedStatement - Migrated from server.type.test.ts
 */
export interface PreparedStatement {
  execute(params?: any[]): Promise<DatabaseQueryResult<any>>;
  close(): Promise<void>;
}

/**
 * Collection - Migrated from server.type.test.ts
 */
export interface Collection {
  find(query: any): Promise<any[]>;
  findOne(query: any): Promise<any | null>;
  insertOne(document: any): Promise<any>;
  insertMany(documents: any[]): Promise<any>;
  updateOne(query: any, update: any): Promise<any>;
  updateMany(query: any, update: any): Promise<any>;
  deleteOne(query: any): Promise<any>;
  deleteMany(query: any): Promise<any>;
  aggregate(pipeline: any[]): Promise<any[]>;
  createIndex(index: any): Promise<void>;
}

/**
 * ConnectionPoolStatistics - Migrated from server.type.test.ts
 */
export interface ConnectionPoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  maxConnections: number;
  minConnections: number;
  averageAcquireTime: number;
  peakActiveConnections: number;
  totalAcquiredConnections: number;
  totalReleasedConnections: number;
  connectionErrors: number;
  lastResetTime: Date;
}

/**
 * BackupOperation - Migrated from server.type.test.ts
 */
export interface BackupOperation {
  id: string;
  type: "full" | "incremental" | "differential";
  status: "pending" | "running" | "completed" | "failed";
  database: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  size?: number | null;
  location: string;
  compression?: "none" | "gzip" | "bzip2" | "lz4" | null;
  encryption: boolean;
  checksum?: string | null;
  error?: string | null;
}

/**
 * RestoreOperation - Migrated from server.type.test.ts
 */
export interface RestoreOperation {
  id: string;
  backupId: string;
  status: "pending" | "running" | "completed" | "failed";
  database: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  progress: number; // 0-100
  pointInTime?: Date | null;
  error?: string | null;
}

/**
 * MockQueryResult - Migrated from dbMock.ts
 */
export type MockQueryResult = {
  rows: any[];
  rowCount: number;
  affectedRows?: number;
};

/**
 * StubConfig - Migrated from dbMock.ts
 */
export type StubConfig = {
  method: "executeQuery" | "executeQueryWithCache";
  response: MockQueryResult | Error;
};

/**
 * MockConfig - Migrated from fixtureTestHelper.ts
 */
export interface MockConfig {
  method?: "executeQuery" | "executeQueryWithCache";
  response: MockResponse | Error;
  mapFixture?: (data: any) => any;
}

/**
 * XcpBalance - Migrated from v23-test-mocks.ts
 */
export interface XcpBalance {
  address: string;
  asset: string;
  cpid: string;
  quantity: number;
  utxo: string;
  utxo_address: string;
  divisible: boolean;
}

/**
 * FeeState - Migrated from feeInfiniteLoopPrevention.test.ts
 */
export interface FeeState {
  data: {
    recommendedFee: number;
    btcPrice: number;
  } | null;
  loading: boolean;
}

/**
 * MockDatabaseQueryResult - Migrated from mockDatabaseManager.ts
 */
export interface MockDatabaseQueryResult {
  rows: any[];
  [key: string]: any;
}

/**
 * MockDbConfig - Migrated from mockDbManager.ts
 */
export interface MockDbConfig {
  queryResults?: Map<string, any>;
  shouldThrowError?: boolean;
  errorMessage?: string;
}

/**
 * BenchmarkResult - Migrated from src20Controller.performance.test.ts
 */
export interface BenchmarkResult {
  operation: string;
  metrics: PerformanceMetrics[];
  average: {
    responseTime: number;
    memoryDelta: number;
    cpuTime: number;
  };
  p95: number;
  p99: number;
}

/**
 * TestCase - Migrated from createTransaction.test.ts
 */
export interface TestCase {
  name: string;
  input: {
    sourceAddress: string;
    toAddress: string;
    op: string;
    tick: string;
    amt?: string;
    max?: string;
    lim?: string;
    dec?: string;
    satsPerVB: number;
  };
  expectedOutputs: {
    dataOutputCount: number;
    dataPrefix: string;
    expectedDecodedData: {
      p: string;
      op: string;
      tick: string;
      amt?: string;
      max?: string;
      lim?: string;
      dec?: string;
    };
  };
}

/**
 * MockDbManager - Migrated from btcPriceService.test.ts
 */
export interface MockDbManager {
  handleCache: (
    key: string,
    fetchFn: () => Promise<unknown>,
    duration?: number,
  ) => Promise<unknown>;
  invalidateCacheByPattern: (pattern: string) => Promise<void>;
}

/**
 * MockPSBTInput - Migrated from psbt-utxo-fixtures.test.ts
 */
export interface MockPSBTInput {
  txid: string;
  vout: number;
  witnessUtxo: {
    script: Uint8Array;
    value: bigint;
  };
  redeemScript?: Uint8Array;
  witnessScript?: Uint8Array;
}

/**
 * AncestorInfo - Migrated from quicknodeUTXOService.test.ts
 */
export interface AncestorInfo {
  txid: string;
  fee: number;
  vsize: number;
  weight: number;
}

/**
 * ScriptTypeInfo - Migrated from quicknodeUTXOService.test.ts
 */
export interface ScriptTypeInfo {
  type: string;
  desc?: string;
}

/**
 * TestTokenData - Migrated from src20SupplyNumericSorting.test.ts
 */
export interface TestTokenData {
  tick: string;
  max: string;
  block_index: number;
  op: "DEPLOY" | "MINT" | "TRANSFER";
}

/**
 * PerformanceMetrics - Migrated from realtime-type-checker.ts
 */
export interface PerformanceMetrics {
  averageCheckTime: number;
  successRate: number;
  errorCount: number;
  warningCount: number;
  memoryUsageAverage: number;
  filesChecked: number;
}

/**
 * MonitoringConfig - Migrated from realtime-type-checker.ts
 */
export interface MonitoringConfig {
  projectRoot: string;
  outputPath: string;
  watchPatterns: string[];
  alertThresholds: {
    errorRate: number;
    averageCheckTime: number;
    memoryUsage: number;
  };
}

/**
 * MonitoringSystemConfig - Migrated from start-monitoring.ts
 */
export interface MonitoringSystemConfig {
  projectRoot: string;
  dashboardPort: number;
  apiPort: number;
  enableWebDashboard: boolean;
  enableAlerts: boolean;
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * ArticleLinks - Migrated from data.ts
 */
export interface ArticleLinks {
  title: string;
  href: string;
}

/**
 * ConnectStep - Migrated from data.ts
 */
export interface ConnectStep extends ListProps {
  number: number;
}

/**
 * TemplateStep - Migrated from data.ts
 */
export interface TemplateStep extends ListProps {
  number: number;
}

/**
 * Dispenser - Migrated from StampListingsAll.tsx
 */
export interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  tx_hash: string;
  close_block_index: number;
}

/**
 * Dispenser - Migrated from StampListingsOpen.tsx
 */
export interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
  block_index?: number;
  isSelected?: boolean;
}

/**
 * Dispense - Migrated from StampSales.tsx
 */
export interface Dispense {
  source: string;
  destination: string;
  dispense_quantity: number;
  satoshirate: number;
  tx_hash: string;
  block_time: number | null;
}

/**
 * SendRow - Migrated from StampTransfers.tsx
 */
export interface SendRow {
  source: string;
  destination: string;
  quantity: number;
  tx_hash: string;
  block_time: number | null;
  block_index?: number;
  cpid?: string;
}

/**
 * DimensionsType - Migrated from StampInfo.tsx
 */
export interface DimensionsType {
  width: number | string;
  height: number | string;
  unit: string | "responsive";
}

/**
 * FreshNavigationOptions - Migrated from FreshSRC20Gallery.tsx
 */
export interface FreshNavigationOptions {
  /** Use f-partial for smooth transitions */
  usePartial?: boolean;
  /** Scroll to element after navigation */
  scrollTarget?: string;
  /** Update URL parameters */
  updateUrl?: boolean;
}

/**
 * FreshNavigationOptions - Migrated from FreshStampGallery.tsx
 */
export interface FreshNavigationOptions {
  usePartial?: boolean;
  scrollTarget?: string;
  updateUrl?: boolean;
}

/**
 * Partner - Migrated from PartnersBanner.tsx
 */
export interface Partner {
  name: string;
  largeImage: string;
  smallImage: string;
  url?: string;
}

/**
 * DisplayCountBreakpoints - Migrated from StampSales.tsx
 */
export interface DisplayCountBreakpoints {
  mobileSm: number;
  mobileMd: number;
  mobileLg: number;
  tablet: number;
  desktop: number;
}

/**
 * URLSyncConfig - Migrated from useSortingURL.tsx
 */
export interface URLSyncConfig {
  /** URL parameter name for sort (default: "sortBy") */
  paramName?: string;
  /** Default sort value to use when no URL param is present */
  defaultSort: SortKey;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Whether to replace or push state (default: true for replace) */
  replaceState?: boolean;
  /** Whether to reset page parameter when sort changes (default: true) */
  resetPage?: boolean;
  /** Page parameter name (default: "page") */
  pageParamName?: string;
  /** Whether to enable URL synchronization (default: true) */
  enabled?: boolean;
}

/**
 * UseSortingURLReturn - Migrated from useSortingURL.tsx
 */
export interface UseSortingURLReturn {
  /** Current sort value from URL */
  sortBy: SortKey;
  /** Function to update sort in URL */
  setSortBy: (sortBy: SortKey) => void;
  /** Whether URL sync is currently enabled */
  isEnabled: boolean;
  /** Function to get current URL with updated sort */
  getUpdatedURL: (sortBy: SortKey) => string;
  /** Function to navigate to URL with updated sort */
  navigateToSort: (sortBy: SortKey) => void;
}

/**
 * SearchResult - Migrated from MintTool.tsx
 */
export interface SearchResult {
  tick: string;
  progress: number;
  total_minted: string;
  max_supply: number;
}

/**
 * SubmissionMessage - Migrated from StampingTool.tsx
 */
export interface SubmissionMessage {
  message: string;
  txid?: string;
}

/**
 * FileValidationResult - Migrated from StampingTool.tsx
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string | undefined;
}

/**
 * InputToSign - Migrated from TradeTool.tsx
 */
export interface InputToSign {
  index: number;
}

/**
 * StatusMessageType - Migrated from TradeTool.tsx
 */
export interface StatusMessageType {
  message: string;
  txid?: string;
}

/**
 * MonitoringConfiguration - Migrated from typeSystemHealthMonitor.ts
 */
export interface MonitoringConfiguration {
  /** Enable/disable different monitoring components */
  enabled: {
    compilationTracking: boolean;
    typeSafetyValidation: boolean;
    coverageAnalysis: boolean;
    alerting: boolean;
    dashboard: boolean;
  };
  /** Monitoring intervals (in milliseconds) */
  intervals: {
    healthCheck: number;
    fullAnalysis: number;
    dashboardUpdate: number;
  };
  /** Project-specific settings */
  project: {
    rootPath: string;
    includePatterns: string[];
    excludePatterns: string[];
    baselineEnabled: boolean;
  };
  /** Alert configuration */
  alerting: AlertConfiguration;
}

/**
 * DebouncedFunction - Migrated from debounce.ts
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

/**
 * AssertEqual - Migrated from base_test.ts
 */
export type AssertEqual<T, U> = T extends U ? U extends T ? true : false
  : false;

/**
 * AssertTrue - Migrated from base_test.ts
 */
export type AssertTrue<T extends true> = T;

/**
 * AssertExtends - Migrated from typeAssertions.ts
 */
export type AssertExtends<T, U> = T extends U ? true : false;

/**
 * AssertAssignable - Migrated from typeAssertions.ts
 */
export type AssertAssignable<T, U> = U extends T ? true : false;

/**
 * AssertFalse - Migrated from typeAssertions.ts
 */
export type AssertFalse<T extends false> = T;

/**
 * AssertNever - Migrated from typeAssertions.ts
 */
export type AssertNever<T extends never> = T;

/**
 * AssertHasProperty - Migrated from typeAssertions.ts
 */
export type AssertHasProperty<T, K extends keyof T> = T[K];

/**
 * AssertLiteral - Migrated from typeAssertions.ts
 */
export type AssertLiteral<T, U extends T> = U;

/**
 * IsExact - Migrated from typeAssertions.ts
 */
export type IsExact<T, U> = T extends U ? U extends T ? true : false : false;

/**
 * AssertScriptType - Migrated from typeAssertions.ts
 */
export type AssertScriptType<T> = T extends ScriptType ? T : never;

/**
 * TestTypeCompatibility - Migrated from typeAssertions.ts
 */
export type TestTypeCompatibility<A, B> = A extends B ? true : false;

/**
 * ValidateRequiredProperties - Migrated from typeAssertions.ts
 */
export type ValidateRequiredProperties<T, RequiredKeys extends keyof T> = {
  [K in RequiredKeys]: T[K] extends undefined ? never : T[K];
};

/**
 * ValidateOptionalProperties - Migrated from typeAssertions.ts
 */
export type ValidateOptionalProperties<T, OptionalKeys extends keyof T> = {
  [K in OptionalKeys]?: T[K];
};

/**
 * DependencyAnalysisResult - Migrated from typeValidation.ts
 */
export interface DependencyAnalysisResult {
  /** Map of file to its dependencies */
  dependencies: Map<string, string[]>;
  /** Circular dependencies found */
  circularDependencies: string[][];
  /** Missing dependencies */
  missingDependencies: string[];
  /** Unused dependencies */
  unusedDependencies: string[];
}

/**
 * TypeCompletenessResult - Migrated from typeValidation.ts
 */
export interface TypeCompletenessResult {
  /** Missing required properties */
  missingProperties: string[];
  /** Missing required methods */
  missingMethods: string[];
  /** Optional properties that could be required */
  optionalProperties: string[];
  /** Overall completeness score (0-100) */
  completenessScore: number;
}

/**
 * TypeCheckPerformanceResult - Migrated from typeValidation.ts
 */
export interface TypeCheckPerformanceResult {
  /** Time taken for type checking in milliseconds */
  checkTime: number;
  /** File size in bytes */
  fileSize: number;
  /** Lines of code */
  linesOfCode: number;
  /** Performance score (lines per second) */
  performanceScore: number;
}

/**
 * FixturePool - Migrated from fixtureLoader.ts
 */
export interface FixturePool<T> {
  getRandomItem(): T;
  getItemByIndex(index: number): T;
  getAllItems(): T[];
  count(): number;
}

/**
 * ToolEndpointFeeEstimatorConfig - Migrated from ToolEndpointFeeEstimator.ts
 */
export interface ToolEndpointFeeEstimatorConfig {
  /** Cache TTL in milliseconds (default: 30 seconds) */
  cacheTTL?: number;
  /** Request timeout in milliseconds (default: 10 seconds) */
  requestTimeout?: number;
  /** Maximum cache size (default: 100 entries) */
  maxCacheSize?: number;
  /** Enable request logging (default: true in development) */
  enableLogging?: boolean;
}

/**
 * FeeEstimationResult - Migrated from TransactionConstructionService.ts
 */
export interface FeeEstimationResult {
  phase: "instant" | "smart" | "exact"; // Updated: "cached" -> "smart" to reflect new tool endpoint approach
  minerFee: number;
  totalValue: number;
  dustValue: number;
  hasExactFees: boolean;
  cacheHit?: boolean;
  estimationTime?: number;
  estimationMethod?: string; // NEW: Track which estimation method was used
}

/**
 * RecommendedFees - Migrated from mempool.ts
 */
export interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

/**
 * ParsedImageReference - Migrated from imageProtocolUtils.ts
 */
export interface ParsedImageReference {
  protocol: string;
  hash: string;
  fullReference: string;
  isValid: boolean;
}

/**
 * StorageResult - Migrated from localStorage.ts
 */
export interface StorageResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fallback?: boolean;
}

/**
 * StorageConfig - Migrated from localStorage.ts
 */
export interface StorageConfig {
  version: number;
  prefix: string;
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum data size in characters
  enableCompression?: boolean;
  enableFallback?: boolean; // Use sessionStorage as fallback
}

/**
 * StorageErrorType - Migrated from localStorage.ts
 */
export type StorageErrorType =
  | "quota_exceeded"
  | "security_error"
  | "not_supported"
  | "unknown";

/**
 * AlertConfiguration - Migrated from typeSystemAlertManager.ts
 */
export interface AlertConfiguration {
  /** Alert thresholds configuration */
  thresholds: AlertThresholds;
  /** Notification settings */
  notifications: NotificationSettings;
  /** Escalation policies */
  escalation: EscalationPolicy;
  /** Alert filtering and routing */
  routing: AlertRouting;
}

/**
 * AlertThresholds - Migrated from typeSystemAlertManager.ts
 */
export interface AlertThresholds {
  /** Compilation performance thresholds */
  compilation: {
    /** Maximum acceptable compilation time (ms) */
    maxCompilationTime: number;
    /** Maximum acceptable memory usage (MB) */
    maxMemoryUsage: number;
    /** Minimum cache effectiveness percentage */
    minCacheEffectiveness: number;
    /** Maximum error count */
    maxErrors: number;
  };
  /** Type safety thresholds */
  typeSafety: {
    /** Minimum type coverage percentage */
    minCoverage: number;
    /** Maximum any type usage */
    maxAnyTypes: number;
    /** Minimum safety score */
    minSafetyScore: number;
    /** Maximum critical violations */
    maxCriticalViolations: number;
  };
  /** Performance regression thresholds */
  regression: {
    /** Maximum acceptable performance degradation percentage */
    maxPerformanceDegradation: number;
    /** Maximum acceptable coverage decrease */
    maxCoverageDecrease: number;
    /** Maximum acceptable safety score decrease */
    maxSafetyScoreDecrease: number;
  };
}

/**
 * NotificationSettings - Migrated from typeSystemAlertManager.ts
 */
export interface NotificationSettings {
  /** Enable/disable notifications */
  enabled: boolean;
  /** Webhook URLs for different severities */
  webhooks: {
    critical: string[];
    high: string[];
    medium: string[];
    low: string[];
  };
  /** Email settings */
  email: {
    enabled: boolean;
    recipients: {
      critical: string[];
      high: string[];
      medium: string[];
    };
    smtpConfig?: SMTPConfig;
  };
  /** Slack integration */
  slack: {
    enabled: boolean;
    channels: {
      critical: string;
      high: string;
      medium: string;
    };
    webhookUrl?: string;
  };
}

/**
 * SMTPConfig - Migrated from typeSystemAlertManager.ts
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * EscalationPolicy - Migrated from typeSystemAlertManager.ts
 */
export interface EscalationPolicy {
  /** Time to wait before escalating (minutes) */
  escalationTime: number;
  /** Maximum escalation levels */
  maxEscalationLevel: number;
  /** Escalation rules by severity */
  rules: {
    critical: EscalationRule;
    high: EscalationRule;
    medium: EscalationRule;
  };
}

/**
 * EscalationRule - Migrated from typeSystemAlertManager.ts
 */
export interface EscalationRule {
  /** Initial notification targets */
  initial: string[];
  /** Escalation levels with targets */
  levels: {
    level: number;
    targets: string[];
    delayMinutes: number;
  }[];
}

/**
 * AlertRouting - Migrated from typeSystemAlertManager.ts
 */
export interface AlertRouting {
  /** Route alerts based on file patterns */
  filePatterns: {
    pattern: string;
    targets: string[];
  }[];
  /** Route alerts based on alert types */
  alertTypes: {
    type: string;
    targets: string[];
  }[];
  /** Default routing targets */
  defaultTargets: string[];
}

/**
 * CompilationContext - Migrated from metricsCollector.ts
 */
export interface CompilationContext {
  sessionId: string;
  startTime: number;
  files: string[];
  config: CompilerConfiguration;
  memorySnapshots: number[];
  fileMetrics: Map<string, Partial<FileCompilationMetrics>>;
}

/**
 * SystemHealthSummary - Migrated from typeSystemDashboard.ts
 */
export interface SystemHealthSummary {
  /** Overall health status */
  status: "healthy" | "warning" | "critical";
  /** Health score (0-100) */
  score: number;
  /** Key metrics summary */
  keyMetrics: {
    compilationTime: MetricSummary;
    typeCoverage: MetricSummary;
    safetyScore: MetricSummary;
    activeAlerts: MetricSummary;
  };
  /** System uptime and availability */
  uptime: {
    percentage: number;
    lastOutage: number | null;
    downtimeMinutes: number;
  };
}

/**
 * MetricSummary - Migrated from typeSystemDashboard.ts
 */
export interface MetricSummary {
  current: number;
  previous: number;
  trend: "up" | "down" | "stable";
  status: "good" | "warning" | "critical";
}

/**
 * CompilationDashboardData - Migrated from typeSystemDashboard.ts
 */
export interface CompilationDashboardData {
  /** Current compilation metrics */
  current: CompilationMetrics | null;
  /** Performance trends over time */
  trends: {
    compilationTime: TimeSeriesData[];
    memoryUsage: TimeSeriesData[];
    cacheEffectiveness: TimeSeriesData[];
    errorCount: TimeSeriesData[];
  };
  /** Performance distribution */
  distribution: {
    compilationTimes: DistributionData;
    memoryUsage: DistributionData;
  };
  /** Top slow files */
  slowFiles: {
    filePath: string;
    averageTime: number;
    compilations: number;
  }[];
}

/**
 * TypeSafetyDashboardData - Migrated from typeSystemDashboard.ts
 */
export interface TypeSafetyDashboardData {
  /** Current type safety report */
  current: TypeSafetyReport | null;
  /** Safety trends over time */
  trends: {
    safetyScore: TimeSeriesData[];
    coveragePercentage: TimeSeriesData[];
    violationCount: TimeSeriesData[];
    anyTypeCount: TimeSeriesData[];
  };
  /** Violation breakdown by type */
  violationBreakdown: {
    type: string;
    count: number;
    severity: string;
  }[];
  /** Domain-specific health */
  domainHealth: {
    domain: string;
    score: number;
    status: "good" | "warning" | "critical";
    issueCount: number;
  }[];
}

/**
 * CoverageDashboardData - Migrated from typeSystemDashboard.ts
 */
export interface CoverageDashboardData {
  /** Current coverage analysis */
  current: TypeCoverageAnalysis | null;
  /** Coverage trends over time */
  trends: {
    overallCoverage: TimeSeriesData[];
    safetyScore: TimeSeriesData[];
    anyTypes: TimeSeriesData[];
  };
  /** Coverage by directory */
  byDirectory: {
    directory: string;
    coverage: number;
    files: number;
    status: "good" | "warning" | "critical";
  }[];
  /** Low coverage files */
  lowCoverageFiles: {
    filePath: string;
    coverage: number;
    issues: number;
    complexity: number;
  }[];
}

/**
 * AlertDashboardData - Migrated from typeSystemDashboard.ts
 */
export interface AlertDashboardData {
  /** Alert count by severity */
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  /** Recent alerts */
  recent: TypeSystemAlert[];
  /** Alert trends over time */
  trends: TimeSeriesData[];
  /** Most common alert types */
  commonTypes: {
    type: string;
    count: number;
    lastOccurrence: number;
  }[];
}

/**
 * TrendData - Migrated from typeSystemDashboard.ts
 */
export interface TrendData {
  /** Data points for the last 30 days */
  thirtyDay: {
    healthScore: TimeSeriesData[];
    compilationTime: TimeSeriesData[];
    typeCoverage: TimeSeriesData[];
    alertCount: TimeSeriesData[];
  };
  /** Weekly aggregated data */
  weekly: {
    averageHealthScore: number;
    averageCompilationTime: number;
    averageTypeCoverage: number;
    totalAlerts: number;
  }[];
  /** Performance regression detection */
  regressions: {
    detected: number;
    resolved: number;
    averageResolutionTime: number;
  };
}

/**
 * DistributionData - Migrated from typeSystemDashboard.ts
 */
export interface DistributionData {
  buckets: {
    min: number;
    max: number;
    count: number;
  }[];
  percentiles: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
}

/**
 * SystemInsight - Migrated from typeSystemDashboard.ts
 */
export interface SystemInsight {
  /** Insight type */
  type: "performance" | "quality" | "maintenance" | "optimization";
  /** Priority level */
  priority: "high" | "medium" | "low";
  /** Insight title */
  title: string;
  /** Detailed description */
  description: string;
  /** Supporting data */
  data: Record<string, any>;
  /** Recommended actions */
  recommendations: string[];
  /** Estimated impact */
  impact: string;
  /** Implementation effort */
  effort: "low" | "medium" | "high";
}

/**
 * LogMessage - Migrated from logger.ts
 */
export interface LogMessage {
  message: string;
  [key: string]: unknown;
}

/**
 * LogLevel - Migrated from logger.ts
 */
export type LogLevel = "debug" | "error" | "info" | "warn";

/**
 * FeeSourceMetrics - Migrated from monitoring.ts
 */
export interface FeeSourceMetrics {
  source: "mempool" | "quicknode" | "cached" | "default";
  successCount: number;
  failureCount: number;
  lastSuccess: number | null;
  lastFailure: number | null;
  averageResponseTime: number;
  totalRequests: number;
}

/**
 * FeeMonitoringData - Migrated from monitoring.ts
 */
export interface FeeMonitoringData {
  metrics: Record<string, FeeSourceMetrics>;
  alerts: FeeAlert[];
  lastReset: number;
}

/**
 * Project - Migrated from astAnalyzer.ts
 */
export interface Project {
  addSourceFilesAtPaths(patterns: string[]): Promise<SourceFile[]>;
  getSourceFiles(): SourceFile[];
  getSourceFile(path: string): SourceFile | undefined;
  getPreEmitDiagnostics(): Diagnostic[];
}

/**
 * SourceFile - Migrated from astAnalyzer.ts
 */
export interface SourceFile {
  getFilePath(): string;
  getText(): string;
  getImportDeclarations(): ImportDeclaration[];
  getExportDeclarations(): ExportDeclaration[];
  getVariableDeclarations(): VariableDeclaration[];
  getFunctions(): FunctionDeclaration[];
  getInterfaces(): InterfaceDeclaration[];
  getTypeAliases(): TypeAliasDeclaration[];
  getClasses(): ClassDeclaration[];
}

/**
 * ImportDeclaration - Migrated from astAnalyzer.ts
 */
export interface ImportDeclaration {
  getModuleSpecifierValue(): string;
  getImportClause(): ImportClause | undefined;
}

/**
 * ImportClause - Migrated from astAnalyzer.ts
 */
export interface ImportClause {
  getNamedBindings(): NamedImports | NamespaceImport | undefined;
}

/**
 * NamedImports - Migrated from astAnalyzer.ts
 */
export interface NamedImports {
  getElements(): ImportSpecifier[];
}

/**
 * ImportSpecifier - Migrated from astAnalyzer.ts
 */
export interface ImportSpecifier {
  getName(): string;
}

/**
 * ExportDeclaration - Migrated from astAnalyzer.ts
 */
export interface ExportDeclaration {
  getModuleSpecifierValue(): string | undefined;
}

/**
 * VariableDeclaration - Migrated from astAnalyzer.ts
 */
export interface VariableDeclaration {
  getName(): string;
  getType(): Type;
}

/**
 * FunctionDeclaration - Migrated from astAnalyzer.ts
 */
export interface FunctionDeclaration {
  getName(): string | undefined;
  getParameters(): ParameterDeclaration[];
  getReturnType(): Type;
}

/**
 * ParameterDeclaration - Migrated from astAnalyzer.ts
 */
export interface ParameterDeclaration {
  getName(): string;
  getType(): Type;
}

/**
 * InterfaceDeclaration - Migrated from astAnalyzer.ts
 */
export interface InterfaceDeclaration {
  getName(): string;
  getProperties(): PropertySignature[];
  getExtends(): ExpressionWithTypeArguments[];
}

/**
 * PropertySignature - Migrated from astAnalyzer.ts
 */
export interface PropertySignature {
  getName(): string;
  getType(): Type;
  hasQuestionToken(): boolean;
}

/**
 * TypeAliasDeclaration - Migrated from astAnalyzer.ts
 */
export interface TypeAliasDeclaration {
  getName(): string;
  getType(): Type;
}

/**
 * ClassDeclaration - Migrated from astAnalyzer.ts
 */
export interface ClassDeclaration {
  getName(): string | undefined;
  getProperties(): PropertyDeclaration[];
  getMethods(): MethodDeclaration[];
}

/**
 * PropertyDeclaration - Migrated from astAnalyzer.ts
 */
export interface PropertyDeclaration {
  getName(): string;
  getType(): Type;
}

/**
 * MethodDeclaration - Migrated from astAnalyzer.ts
 */
export interface MethodDeclaration {
  getName(): string;
  getParameters(): ParameterDeclaration[];
  getReturnType(): Type;
}

/**
 * Type - Migrated from astAnalyzer.ts
 */
export interface Type {
  getText(): string;
  getSymbol(): Symbol | undefined;
  isAny(): boolean;
  isUnknown(): boolean;
  isNever(): boolean;
  isNull(): boolean;
  isUndefined(): boolean;
}

/**
 * Symbol - Migrated from astAnalyzer.ts
 */
export interface Symbol {
  getName(): string;
}

/**
 * Diagnostic - Migrated from astAnalyzer.ts
 */
export interface Diagnostic {
  getMessageText(): string;
  getStart(): number;
  getEnd(): number;
  getSourceFile(): SourceFile | undefined;
  getCategory(): DiagnosticCategory;
}

/**
 * ExpressionWithTypeArguments - Migrated from astAnalyzer.ts
 */
export interface ExpressionWithTypeArguments {
  getExpression(): any;
}

/**
 * TypeCoverageStats - Migrated from astAnalyzer.ts
 */
export interface TypeCoverageStats {
  /** Total number of type annotations analyzed */
  totalAnnotations: number;
  /** Number of explicit type annotations */
  explicitTypes: number;
  /** Number of inferred types */
  inferredTypes: number;
  /** Number of any types (type safety issues) */
  anyTypes: number;
  /** Number of unknown types */
  unknownTypes: number;
  /** Type coverage percentage */
  coveragePercentage: number;
  /** Coverage by file type */
  coverageByFileType: Record<string, TypeCoverageStats>;
}

/**
 * DomainValidationResult - Migrated from astAnalyzer.ts
 */
export interface DomainValidationResult {
  /** Domain identifier */
  domain: string;
  /** Number of types analyzed in this domain */
  typesAnalyzed: number;
  /** Number of valid types */
  validTypes: number;
  /** Number of invalid or problematic types */
  invalidTypes: number;
  /** Specific issues found */
  issues: DomainTypeIssue[];
  /** Domain-specific recommendations */
  recommendations: string[];
}

/**
 * DomainTypeIssue - Migrated from astAnalyzer.ts
 */
export interface DomainTypeIssue {
  /** Issue type */
  type:
    | "missing_property"
    | "incorrect_type"
    | "missing_validation"
    | "inconsistent_naming"
    | "circular_reference";
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** File where issue was found */
  file: string;
  /** Line number */
  line?: number;
  /** Issue description */
  description: string;
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * TypeSafetyViolation - Migrated from astAnalyzer.ts
 */
export interface TypeSafetyViolation {
  /** Violation type */
  type:
    | "any_usage"
    | "missing_return_type"
    | "unsafe_assertion"
    | "missing_null_check"
    | "implicit_any";
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** File where violation occurred */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** Violation description */
  message: string;
  /** Code snippet showing the violation */
  codeSnippet: string;
  /** Suggested remediation */
  remediation: string;
}

/**
 * ImportPatternAnalysis - Migrated from astAnalyzer.ts
 */
export interface ImportPatternAnalysis {
  /** Total import statements analyzed */
  totalImports: number;
  /** Domain-specific imports */
  domainImports: number;
  /** Legacy $globals imports */
  legacyImports: number;
  /** Relative imports */
  relativeImports: number;
  /** External package imports */
  externalImports: number;
  /** Import pattern compliance percentage */
  compliancePercentage: number;
  /** Files with problematic import patterns */
  problematicFiles: string[];
}

/**
 * TypeSafetyRegression - Migrated from astAnalyzer.ts
 */
export interface TypeSafetyRegression {
  /** Previous report for comparison */
  previousReport: TypeSafetyReport;
  /** Changes in type coverage */
  coverageChange: {
    delta: number;
    trend: "improving" | "stable" | "degrading";
  };
  /** New violations introduced */
  newViolations: TypeSafetyViolation[];
  /** Violations that were resolved */
  resolvedViolations: TypeSafetyViolation[];
  /** Overall safety score change */
  safetyScoreChange: number;
}

/**
 * DiagnosticCategory - Migrated from astAnalyzer.ts
 */
export enum DiagnosticCategory {
  Warning = 0,
  Error = 1,
  Suggestion = 2,
  Message = 3,
}

/**
 * CoverageStats - Migrated from coverageAnalyzer.ts
 */
export interface CoverageStats {
  /** Total number of identifiers that could have type annotations */
  totalIdentifiers: number;
  /** Number of identifiers with explicit type annotations */
  typedIdentifiers: number;
  /** Number of identifiers with inferred types */
  inferredIdentifiers: number;
  /** Number of identifiers with any type */
  anyIdentifiers: number;
  /** Number of identifiers with unknown type */
  unknownIdentifiers: number;
  /** Coverage percentage (0-100) */
  coveragePercentage: number;
  /** Type safety score (0-100) */
  safetyScore: number;
}

/**
 * FileCoverageInfo - Migrated from coverageAnalyzer.ts
 */
export interface FileCoverageInfo {
  /** File path */
  filePath: string;
  /** Coverage statistics for this file */
  coverage: CoverageStats;
  /** Specific issues in this file */
  issues: TypeCoverageIssue[];
  /** File size in lines */
  lineCount: number;
  /** File complexity score */
  complexityScore: number;
}

/**
 * TypeCoverageIssue - Migrated from coverageAnalyzer.ts
 */
export interface TypeCoverageIssue {
  /** Issue type */
  type:
    | "missing_annotation"
    | "any_usage"
    | "implicit_any"
    | "unsafe_assertion";
  /** Severity level */
  severity: "low" | "medium" | "high" | "critical";
  /** Line number where issue occurs */
  line: number;
  /** Column number */
  column: number;
  /** Issue description */
  description: string;
  /** Code snippet showing the issue */
  codeSnippet: string;
  /** Suggested fix */
  suggestedFix: string;
}

/**
 * TypeRecommendation - Migrated from coverageAnalyzer.ts
 */
export interface TypeRecommendation {
  /** Recommendation category */
  category: "coverage" | "safety" | "performance" | "maintainability";
  /** Priority level */
  priority: "low" | "medium" | "high" | "critical";
  /** Recommendation description */
  description: string;
  /** Files affected by this recommendation */
  affectedFiles: string[];
  /** Estimated effort to implement */
  effort: "low" | "medium" | "high";
  /** Expected impact */
  impact: string;
}

/**
 * CoverageTrend - Migrated from coverageAnalyzer.ts
 */
export interface CoverageTrend {
  /** Previous analysis for comparison */
  previousAnalysis: TypeCoverageAnalysis;
  /** Coverage change since last analysis */
  coverageChange: number;
  /** Safety score change */
  safetyScoreChange: number;
  /** Trend direction */
  trend: "improving" | "stable" | "degrading";
  /** Files that improved */
  improvedFiles: string[];
  /** Files that degraded */
  degradedFiles: string[];
}

/**
 * StoredFeeData - Migrated from localStorage.ts
 */
export interface StoredFeeData {
  data: FeeData;
  version: string;
  savedAt: number;
}

/**
 * DateFormatOptions - Migrated from formatUtils.ts
 */
export interface DateFormatOptions {
  timeZone?: boolean;
  month?: "short" | "long" | "numeric" | "2-digit";
  year?: "numeric" | "2-digit";
  day?: "numeric" | "2-digit";
  includeRelative?: boolean;
}

/**
 * ContentTypeResult - Migrated from imageUtils.ts
 */
export interface ContentTypeResult {
  mimeType: string;
  isGzipped: boolean;
  isJavaScript?: boolean;
}

/**
 * BaseToast - Migrated from toastSignal.ts
 */
export interface BaseToast {
  id?: string; // id will be generated by the provider
  message: string;
  type: "success" | "error" | "info";
  autoDismiss?: boolean;
}

/**
 * HtmlRenderOptions - Migrated from htmlRenderer.ts
 */
export interface HtmlRenderOptions {
  width?: number;
  height?: number;
  delay?: number;
  quality?: number;
  deviceScaleFactor?: number;
}

/**
 * LocalRenderOptions - Migrated from localRenderer.ts
 */
export interface LocalRenderOptions {
  width?: number;
  height?: number;
  delay?: number;
  quality?: number;
}

/**
 * SvgConversionOptions - Migrated from svgUtils.ts
 */
export interface SvgConversionOptions {
  width?: number;
  height?: number;
  background?: string;
  font?: {
    loadSystemFonts?: boolean;
  };
  padding?: {
    color?: string;
  };
}

/**
 * DispenseInput - Migrated from dispense.ts
 */
export interface DispenseInput {
  address: string;
  dispenser: string;
  quantity: number;
  dryRun?: boolean; // Add dryRun support for unified fee estimation system
  options: {
    fee_per_kb?: number;
    satsPerVB?: number;
    allow_unconfirmed_inputs?: boolean;
    validate?: boolean;
    verbose?: boolean;
    [key: string]: any;
  };
}

/**
 * TrxType - Migrated from create.ts
 */
export type TrxType = "multisig" | "olga";

/**
 * ExtendedInputData - Migrated from create.ts
 */
export interface ExtendedInputData
  extends Omit<InputData, "feeRate" | "satsPerKB" | "satsPerVB"> {
  feeRate?: number | string;
  satsPerVB?: number | string;
  satsPerKB?: number | string;
  utxoAncestors?: AncestorInfo[];
  service_fee?: number | string;
  service_fee_address?: string;
  dryRun?: boolean;
  trxType?: TrxType;
  tg?: string;
  description?: string;
  desc?: string;
  img?: string; // Simple protocol:hash format (max 32 chars)
  icon?: string; // Simple protocol:hash format (max 32 chars)
}

/**
 * AncestorData - Migrated from [address].ts
 */
export interface AncestorData {
  fees: number;
  vsize: number;
  weight: number;
}

/**
 * DeployRouteParams - Migrated from deploy.ts
 */
export interface DeployRouteParams {
  tick: string;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * UtilityType - Migrated from scripts/consolidate-utility-types.ts
 */
interface UtilityType {
  file: string;
  line: number;
  name: string;
  definition: string;
  category: "interface" | "type" | "enum";
  suggestedLocation: string;
  size: number;
  exported: boolean;
}

/**
 * BaselineMetrics - Migrated from scripts/performance/baseline-collector.ts
 */
interface BaselineMetrics {
  timestamp: string;
  version: string;
  branch: string;
  commitHash: string;
  migration: {
    phase: "before" | "during" | "after";
    aliasImportPercentage: number;
    domainMigrationProgress: number;
  };
  performance: {
    typeCheckTimeMs: number;
    buildTimeMs: number;
    bundleSizeKB: number;
    memoryUsageMB: number;
    importResolutionMs: number;
  };
  codeMetrics: {
    totalFiles: number;
    typeDefinitionFiles: number;
    aliasImports: number;
    relativeImports: number;
    globalTypeUsage: number;
    domainTypeUsage: number;
  };
}

/**
 * BaseTransaction - Migrated from lib/types/stamping.ts
 */
interface BaseTransaction {
  block_index: number;
  tx_hash: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}

/**
 * BaseToast - Migrated from lib/utils/ui/notifications/toastSignal.ts
 */
export interface BaseToast {
  id?: string; // id will be generated by the provider
  message: string;
  type: "success" | "error" | "info";
  autoDismiss?: boolean;
}

/**
 * BaselineStatistics - Migrated from lib/utils/monitoring/compilation/performanceTracker.ts
 */
export interface BaselineStatistics {
  /** Number of runs included in baseline */
  sampleSize: number;
  /** Standard deviation of compilation times */
  timeStdDev: number;
  /** Standard deviation of memory usage */
  memoryStdDev: number;
  /** Confidence interval (95%) */
  confidenceInterval: [number, number];
}

/**
 * Utility type to flatten intersection types for better display
 */
export type Prettify<T> =
  & {
    [K in keyof T]: T[K];
  }
  & {};

/**
 * Type guard function type
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Validation function type
 */
export type ValidationFunction<T> = (value: T) => boolean | string;

/**
 * Date utility namespace
 */
export namespace DateUtils {
  export function formatDate(date: Date | string | number): string;
  export function parseDate(dateString: string): Date | null;
  export function isValidDate(date: unknown): date is Date;
  export function addDays(date: Date, days: number): Date;
  export function differenceInDays(date1: Date, date2: Date): number;
}

/**
 * Number utility namespace
 */
export namespace NumberUtils {
  export function isNumber(value: unknown): value is number;
  export function isInteger(value: unknown): value is number;
  export function clamp(value: number, min: number, max: number): number;
  export function round(value: number, decimals?: number): number;
  export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
  ): string;
}

/**
 * String utility namespace
 */
export namespace StringUtils {
  export function isString(value: unknown): value is string;
  export function isEmpty(value: string): boolean;
  export function capitalize(value: string): string;
  export function truncate(
    value: string,
    length: number,
    suffix?: string,
  ): string;
  export function kebabCase(value: string): string;
  export function camelCase(value: string): string;
}

export type MixedTypes = string | number | boolean | null | undefined;

export type FilterTypes<T> = {
  [K in keyof T]: T[K] extends MixedTypes ? T[K] : never;
};

export type NonNumberProps<T> = {
  [K in keyof T]: T[K] extends number ? never : K;
}[keyof T];

export interface CompilerConfiguration {
  target: string;
  module: string;
  strict: boolean;
  esModuleInterop: boolean;
}

export interface FileCompilationMetrics {
  filePath: string;
  linesOfCode: number;
  compilationTime: number;
  errorCount: number;
  warningCount: number;
  complexity: number;
}

export const alignmentClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
  top: "align-top",
  bottom: "align-bottom",
  middle: "align-middle",
} as const;

export type AlignmentKey = keyof typeof alignmentClasses;
