/**
 * Type assertion utilities for compile-time type testing
 *
 * These utilities help validate type relationships and constraints
 * at compile time using TypeScript's type system.
 */

// Basic type equality assertion
export type AssertEqual<T, U> = T extends U ? U extends T ? true : false
  : false;

// Assert that a type extends another
export type AssertExtends<T, U> = T extends U ? true : false;

// Assert that a type is assignable to another
export type AssertAssignable<T, U> = U extends T ? true : false;

// Assert true constraint (forces compile error if false)
export type AssertTrue<T extends true> = T;

// Assert false constraint
export type AssertFalse<T extends false> = T;

// Assert that a type is never
export type AssertNever<T extends never> = T;

// Assert that a type has a specific property
export type AssertHasProperty<T, K extends keyof T> = T[K];

// Assert that a type is a specific literal type
export type AssertLiteral<T, U extends T> = U;

// Utility to extract keys of a type
export type Keys<T> = keyof T;

// Utility to make all properties optional
export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
  }
  : T;

// Utility to make all properties required
export type DeepRequired<T> = T extends object ? {
    [P in keyof T]-?: DeepRequired<T[P]>;
  }
  : T;

// Test if a type is any
export type IsAny<T> = 0 extends (1 & T) ? true : false;

// Test if a type is unknown
export type IsUnknown<T> = IsAny<T> extends true ? false
  : unknown extends T ? true
  : false;

// Test if a type is never
export type IsNever<T> = [T] extends [never] ? true : false;

// Helper to create compile-time type tests
export function typeTest<_T extends true>(): void {
  // This function exists only for its type parameter
  // It ensures compile-time type checking
}

// Test if two types are exactly equal
export type IsExact<T, U> = T extends U ? U extends T ? true : false : false;

// Runtime assertion function for type testing (no-op at runtime)
export function assertType<T>(_value: T): void {
  // This is a no-op function used only for compile-time type checking
  // The presence of this call ensures TypeScript validates the type
}

// ============================================================================
// BITCOIN-SPECIFIC TYPE VALIDATORS
// ============================================================================

/**
 * Bitcoin address validation patterns
 */
export const BITCOIN_ADDRESS_PATTERNS = {
  P2PKH: /^1[a-km-zA-HJ-NP-Z1-9]{25,33}$/,
  P2SH: /^3[a-km-zA-HJ-NP-Z1-9]{25,33}$/,
  P2WPKH: /^bc1[a-z0-9]{39,59}$/,
  P2TR: /^bc1p[a-z0-9]{58}$/,
} as const;

/**
 * Type guard for P2PKH Bitcoin addresses
 */
export function isP2PKHAddress(address: string): address is string {
  return BITCOIN_ADDRESS_PATTERNS.P2PKH.test(address);
}

/**
 * Type guard for P2SH Bitcoin addresses
 */
export function isP2SHAddress(address: string): address is string {
  return BITCOIN_ADDRESS_PATTERNS.P2SH.test(address);
}

/**
 * Type guard for P2WPKH Bitcoin addresses
 */
export function isP2WPKHAddress(address: string): address is string {
  return BITCOIN_ADDRESS_PATTERNS.P2WPKH.test(address);
}

/**
 * Type guard for P2TR Bitcoin addresses
 */
export function isP2TRAddress(address: string): address is string {
  return BITCOIN_ADDRESS_PATTERNS.P2TR.test(address);
}

/**
 * Validates Bitcoin address format based on script type
 */
export function validateBitcoinAddressType(
  address: string,
  expectedType: "P2PKH" | "P2SH" | "P2WPKH" | "P2TR",
): boolean {
  switch (expectedType) {
    case "P2PKH":
      return isP2PKHAddress(address);
    case "P2SH":
      return isP2SHAddress(address);
    case "P2WPKH":
      return isP2WPKHAddress(address);
    case "P2TR":
      return isP2TRAddress(address);
    default:
      return false;
  }
}

/**
 * Type assertion for Bitcoin transaction hash (32-byte hex string)
 */
export type AssertTxHash<T> = T extends string
  ? T extends
    `${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}${string}`
    ? T
  : never
  : never;

/**
 * Type guard for Bitcoin transaction hash format
 */
export function isTxHash(value: string): value is string {
  return /^[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Type guard for valid UTXO structure
 */
export function isValidUTXO(value: unknown): value is {
  txid: string;
  vout: number;
  value: number;
  script: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "txid" in value &&
    "vout" in value &&
    "value" in value &&
    "script" in value &&
    typeof (value as any).txid === "string" &&
    isTxHash((value as any).txid) &&
    typeof (value as any).vout === "number" &&
    (value as any).vout >= 0 &&
    typeof (value as any).value === "number" &&
    (value as any).value >= 0 &&
    typeof (value as any).script === "string"
  );
}

/**
 * Type assertion for Bitcoin script types
 */
export type AssertScriptType<T> = T extends
  | "P2PKH"
  | "P2SH"
  | "P2WPKH"
  | "P2WSH"
  | "P2TR"
  | "OP_RETURN"
  | "UNKNOWN" ? T
  : never;

/**
 * Type guard for valid script types
 */
export function isValidScriptType(value: string): value is
  | "P2PKH"
  | "P2SH"
  | "P2WPKH"
  | "P2WSH"
  | "P2TR"
  | "OP_RETURN"
  | "UNKNOWN" {
  return [
    "P2PKH",
    "P2SH",
    "P2WPKH",
    "P2WSH",
    "P2TR",
    "OP_RETURN",
    "UNKNOWN",
  ].includes(value);
}

// ============================================================================
// SRC-20 TOKEN TYPE VALIDATORS
// ============================================================================

/**
 * Type assertion for SRC-20 operation types
 */
export type AssertSRC20Operation<T> = T extends "deploy" | "mint" | "transfer"
  ? T
  : never;

/**
 * Type guard for SRC-20 operation types
 */
export function isSRC20Operation(
  value: string,
): value is "deploy" | "mint" | "transfer" {
  return ["deploy", "mint", "transfer"].includes(value);
}

/**
 * Type guard for valid SRC-20 token ticker format
 */
export function isValidSRC20Ticker(ticker: string): boolean {
  // SRC-20 tickers are typically 1-5 characters, alphanumeric
  return /^[A-Za-z0-9]{1,5}$/.test(ticker);
}

/**
 * Type guard for SRC-20 deploy operation structure
 */
export function isValidSRC20Deploy(value: unknown): value is {
  op: "deploy";
  tick: string;
  max: string;
  lim?: string;
  dec?: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "op" in value &&
    "tick" in value &&
    "max" in value &&
    (value as any).op === "deploy" &&
    typeof (value as any).tick === "string" &&
    isValidSRC20Ticker((value as any).tick) &&
    typeof (value as any).max === "string" &&
    /^\d+$/.test((value as any).max)
  );
}

/**
 * Type guard for SRC-20 mint operation structure
 */
export function isValidSRC20Mint(value: unknown): value is {
  op: "mint";
  tick: string;
  amt: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "op" in value &&
    "tick" in value &&
    "amt" in value &&
    (value as any).op === "mint" &&
    typeof (value as any).tick === "string" &&
    isValidSRC20Ticker((value as any).tick) &&
    typeof (value as any).amt === "string" &&
    /^\d+$/.test((value as any).amt)
  );
}

/**
 * Type guard for SRC-20 transfer operation structure
 */
export function isValidSRC20Transfer(value: unknown): value is {
  op: "transfer";
  tick: string;
  amt: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "op" in value &&
    "tick" in value &&
    "amt" in value &&
    (value as any).op === "transfer" &&
    typeof (value as any).tick === "string" &&
    isValidSRC20Ticker((value as any).tick) &&
    typeof (value as any).amt === "string" &&
    /^\d+$/.test((value as any).amt)
  );
}

// ============================================================================
// SRC-101 NFT TYPE VALIDATORS
// ============================================================================

/**
 * Type guard for SRC-101 NFT operation types
 */
export function isSRC101Operation(
  value: string,
): value is "deploy" | "mint" | "transfer" {
  return ["deploy", "mint", "transfer"].includes(value);
}

/**
 * Type guard for valid SRC-101 collection slug format
 */
export function isValidSRC101Slug(slug: string): boolean {
  // Collection slugs are typically lowercase alphanumeric with hyphens
  return /^[a-z0-9-]{1,32}$/.test(slug);
}

/**
 * Type guard for SRC-101 deploy operation structure
 */
export function isValidSRC101Deploy(value: unknown): value is {
  op: "deploy";
  slug: string;
  name: string;
  supply: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "op" in value &&
    "slug" in value &&
    "name" in value &&
    "supply" in value &&
    (value as any).op === "deploy" &&
    typeof (value as any).slug === "string" &&
    isValidSRC101Slug((value as any).slug) &&
    typeof (value as any).name === "string" &&
    (value as any).name.length > 0 &&
    typeof (value as any).supply === "string" &&
    /^\d+$/.test((value as any).supply)
  );
}

// ============================================================================
// STAMP PROTOCOL TYPE VALIDATORS
// ============================================================================

/**
 * Type assertion for stamp classification types
 */
export type AssertStampClassification<T> = T extends
  | "blessed"
  | "cursed"
  | "classic"
  | "posh" ? T
  : never;

/**
 * Type guard for stamp classification types
 */
export function isValidStampClassification(
  value: string,
): value is "blessed" | "cursed" | "classic" | "posh" {
  return ["blessed", "cursed", "classic", "posh"].includes(value);
}

/**
 * Type guard for valid stamp number (positive integer or null)
 */
export function isValidStampNumber(value: unknown): value is number | null {
  return value === null ||
    (typeof value === "number" && value > 0 && Number.isInteger(value));
}

/**
 * Type guard for valid CPID format (Counterparty Asset ID)
 */
export function isValidCPID(value: string): boolean {
  // CPID format: typically "A" followed by digits, or custom names
  return /^[A-Z][A-Z0-9]{0,11}$/.test(value) ||
    /^[A-Z][a-zA-Z0-9.]{2,}$/.test(value);
}

/**
 * Type guard for valid base64 stamp data
 */
export function isValidBase64StampData(data: string): boolean {
  try {
    // Check if it's valid base64
    const decoded = atob(data);
    // Check if it has reasonable length for stamp data
    return decoded.length > 0 && decoded.length <= 64000; // 64KB max
  } catch {
    return false;
  }
}

/**
 * Type guard for valid stamp MIME type
 */
export function isValidStampMimeType(mimeType: string): boolean {
  const validMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/avif",
    "image/bmp",
    "image/svg+xml",
    "text/html",
    "text/plain",
    "audio/mpeg",
  ];
  return validMimeTypes.includes(mimeType);
}

/**
 * Type guard for stamp row structure
 */
export function isValidStampRow(value: unknown): value is {
  stamp: number | null;
  cpid: string;
  ident: string;
  block_index: number;
  tx_hash: string;
  creator: string;
  stamp_base64: string;
  stamp_mimetype: string;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "stamp" in value &&
    "cpid" in value &&
    "ident" in value &&
    "block_index" in value &&
    "tx_hash" in value &&
    "creator" in value &&
    "stamp_base64" in value &&
    "stamp_mimetype" in value &&
    isValidStampNumber((value as any).stamp) &&
    typeof (value as any).cpid === "string" &&
    isValidCPID((value as any).cpid) &&
    typeof (value as any).ident === "string" &&
    typeof (value as any).block_index === "number" &&
    (value as any).block_index > 0 &&
    typeof (value as any).tx_hash === "string" &&
    isTxHash((value as any).tx_hash) &&
    typeof (value as any).creator === "string" &&
    typeof (value as any).stamp_base64 === "string" &&
    isValidBase64StampData((value as any).stamp_base64) &&
    typeof (value as any).stamp_mimetype === "string" &&
    isValidStampMimeType((value as any).stamp_mimetype)
  );
}

// ============================================================================
// TRANSACTION TYPE VALIDATORS
// ============================================================================

/**
 * Type guard for valid transaction input structure
 */
export function isValidTransactionInput(value: unknown): value is {
  type: string;
  isWitness: boolean;
  size: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "isWitness" in value &&
    "size" in value &&
    typeof (value as any).type === "string" &&
    isValidScriptType((value as any).type) &&
    typeof (value as any).isWitness === "boolean" &&
    typeof (value as any).size === "number" &&
    (value as any).size > 0
  );
}

/**
 * Type guard for valid transaction output structure
 */
export function isValidTransactionOutput(value: unknown): value is {
  type: string;
  value: number;
  isWitness: boolean;
  size: number;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "value" in value &&
    "isWitness" in value &&
    "size" in value &&
    typeof (value as any).type === "string" &&
    isValidScriptType((value as any).type) &&
    typeof (value as any).value === "number" &&
    (value as any).value >= 0 &&
    typeof (value as any).isWitness === "boolean" &&
    typeof (value as any).size === "number" &&
    (value as any).size > 0
  );
}

// ============================================================================
// ADVANCED TYPE TESTING UTILITIES
// ============================================================================

/**
 * Compile-time test for Bitcoin address type validation
 */
export function bitcoinAddressTypeTest<T extends string>(
  address: T,
  expectedType: "P2PKH" | "P2SH" | "P2WPKH" | "P2TR",
): T extends string ? boolean : never {
  return validateBitcoinAddressType(address, expectedType) as any;
}

/**
 * Utility to test type compatibility at compile time
 */
export type TestTypeCompatibility<A, B> = A extends B
  ? B extends A ? "compatible"
  : "partially-compatible"
  : "incompatible";

/**
 * Type-level validation for required properties
 */
export type ValidateRequiredProperties<T, RequiredKeys extends keyof T> = {
  [K in RequiredKeys]: T[K] extends undefined ? never : T[K];
};

/**
 * Type-level validation for optional properties
 */
export type ValidateOptionalProperties<T, OptionalKeys extends keyof T> = {
  [K in OptionalKeys]?: T[K];
};

/**
 * Runtime type validator builder
 */
export function createTypeValidator<T>(
  validators: Record<keyof T, (value: unknown) => boolean>,
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    for (const [key, validator] of Object.entries(validators)) {
      if (!(key in value) || !validator((value as any)[key])) {
        return false;
      }
    }

    return true;
  };
}

/**
 * Performance-aware type validation with early exit
 */
export function validateTypeQuick<T>(
  value: unknown,
  requiredKeys: (keyof T)[],
  typeCheckers: Partial<Record<keyof T, (val: unknown) => boolean>>,
): value is T {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  // Quick check for required keys
  for (const key of requiredKeys) {
    if (!(key as string in obj)) {
      return false;
    }
  }

  // Type check specific properties if provided
  for (const [key, checker] of Object.entries(typeCheckers)) {
    if (key in obj && !checker(obj[key])) {
      return false;
    }
  }

  return true;
}
