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
// Import with: import type { UTXO } from "./base.d.ts";

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
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
