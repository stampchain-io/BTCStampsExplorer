/**
 * Constant Type Guards and Utilities
 * Runtime validation for constant types defined throughout the application
 */

import {
  APIErrorCode,
  BitcoinErrorCode,
  SRC20ErrorCode,
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_FILTER_TYPES,
  STAMP_MARKETPLACE,
  STAMP_TYPES,
  StampErrorCode,
  ValidationErrorCode,
} from "$constants";
// Import types directly from constants
import type {
  StampEdition,
  StampFiletype,
  StampFilterType,
  StampMarketplace,
  StampType,
} from "$constants";

// Re-export type definitions for convenience
export type {
  StampEdition,
  StampFiletype,
  StampFilterType,
  StampMarketplace,
  StampType,
} from "$constants";

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

// Create Sets for O(1) lookup performance
const STAMP_TYPE_SET = new Set(Object.values(STAMP_TYPES));
const STAMP_FILTER_TYPE_SET = new Set(Object.values(STAMP_FILTER_TYPES));
const STAMP_MARKETPLACE_SET = new Set(Object.values(STAMP_MARKETPLACE));
const STAMP_EDITION_SET = new Set(Object.values(STAMP_EDITIONS));
const STAMP_FILETYPE_SET = new Set(Object.values(STAMP_FILETYPES));

// ============================================================================
// STAMP CONSTANT TYPE GUARDS
// ============================================================================

/**
 * Type guard for StampType constants
 * @example
 * ```typescript
 * if (isValidStampType(userInput)) {
 *   // userInput is now typed as StampType
 *   return getStampsByType(userInput);
 * }
 * ```
 */
export function isValidStampType(value: unknown): value is StampType {
  return STAMP_TYPE_SET.has(value as StampType);
}

/**
 * Type guard for StampFilterType constants
 */
export function isValidStampFilterType(
  value: unknown,
): value is StampFilterType {
  return STAMP_FILTER_TYPE_SET.has(value as StampFilterType);
}

/**
 * Type guard for StampMarketplace constants
 */
export function isValidStampMarketplace(
  value: unknown,
): value is StampMarketplace {
  return STAMP_MARKETPLACE_SET.has(value as StampMarketplace);
}

/**
 * Type guard for StampFiletype constants
 */
export function isValidStampFiletype(value: unknown): value is StampFiletype {
  return STAMP_FILETYPE_SET.has(value as StampFiletype);
}

/**
 * Type guard for StampEdition constants
 */
export function isValidStampEdition(value: unknown): value is StampEdition {
  return STAMP_EDITION_SET.has(value as StampEdition);
}

// ============================================================================
// ERROR CODE TYPE GUARDS
// ============================================================================

/**
 * Type guard for SRC20ErrorCode
 */
export function isValidSRC20ErrorCode(value: unknown): value is SRC20ErrorCode {
  return Object.values(SRC20ErrorCode).includes(value as SRC20ErrorCode);
}

/**
 * Type guard for StampErrorCode
 */
export function isValidStampErrorCode(value: unknown): value is StampErrorCode {
  return Object.values(StampErrorCode).includes(value as StampErrorCode);
}

/**
 * Type guard for ValidationErrorCode
 */
export function isValidValidationErrorCode(
  value: unknown,
): value is ValidationErrorCode {
  return Object.values(ValidationErrorCode).includes(
    value as ValidationErrorCode,
  );
}

/**
 * Type guard for APIErrorCode
 */
export function isValidAPIErrorCode(value: unknown): value is APIErrorCode {
  return typeof value === "string" &&
    Object.values(APIErrorCode).includes(value as APIErrorCode);
}

/**
 * Type guard for BitcoinErrorCode
 */
export function isValidBitcoinErrorCode(
  value: unknown,
): value is BitcoinErrorCode {
  return typeof value === "string" &&
    Object.values(BitcoinErrorCode).includes(value as BitcoinErrorCode);
}

// ============================================================================
// COMPOSITE GUARDS AND ASSERTIONS
// ============================================================================

/**
 * Type guard for any error code type
 */
export function isValidErrorCode(
  value: unknown,
): value is
  | SRC20ErrorCode
  | StampErrorCode
  | ValidationErrorCode
  | APIErrorCode
  | BitcoinErrorCode {
  return isValidSRC20ErrorCode(value) ||
    isValidStampErrorCode(value) ||
    isValidValidationErrorCode(value) ||
    isValidAPIErrorCode(value) ||
    isValidBitcoinErrorCode(value);
}

/**
 * Type guard with error details for better debugging
 * @throws {Error} If value is not a valid stamp type
 */
export function validateStampType(value: unknown): asserts value is StampType {
  if (!isValidStampType(value)) {
    throw new Error(
      `Invalid stamp type: ${value}. Valid values are: ${
        Object.values(STAMP_TYPES).join(", ")
      }`,
    );
  }
}

/**
 * Type guard with error details for filter types
 * @throws {Error} If value is not a valid filter type
 */
export function validateStampFilterType(
  value: unknown,
): asserts value is StampFilterType {
  if (!isValidStampFilterType(value)) {
    throw new Error(
      `Invalid filter type: ${value}. Valid values are: ${
        Object.values(STAMP_FILTER_TYPES).join(", ")
      }`,
    );
  }
}

/**
 * Batch validation for multiple constant values
 * @example
 * ```typescript
 * validateConstants([
 *   { value: stampType, validator: isValidStampType, name: "stampType" },
 *   { value: filterType, validator: isValidStampFilterType, name: "filterType" }
 * ]);
 * ```
 */
export function validateConstants(
  validations: Array<
    { value: unknown; validator: (value: unknown) => boolean; name: string }
  >,
): void {
  const errors: string[] = [];

  for (const { value, validator, name } of validations) {
    if (!validator(value)) {
      errors.push(`Invalid ${name}: ${value}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Constant validation failed:\n${errors.join("\n")}`);
  }
}

// ============================================================================
// CONSTANT UTILITIES
// ============================================================================

/**
 * Get display name for stamp type
 */
export function getStampTypeDisplay(type: StampType): string {
  const displays: Record<StampType, string> = {
    [STAMP_TYPES.ALL]: "All Stamps",
    [STAMP_TYPES.STAMPS]: "Regular Stamps",
    [STAMP_TYPES.CURSED]: "Cursed Stamps",
    [STAMP_TYPES.CLASSIC]: "Classic Stamps",
    [STAMP_TYPES.POSH]: "Posh Stamps",
    [STAMP_TYPES.SRC20]: "SRC-20 Images",
  };
  return displays[type] || type;
}

/**
 * Parse string to stamp type with fallback
 */
export function parseStampType(
  value: string,
  fallback = STAMP_TYPES.ALL,
): StampType {
  const normalized = value.toLowerCase();
  const found = Object.entries(STAMP_TYPES).find(([_, v]) => v === normalized);
  return found ? found[1] : fallback;
}

/**
 * Get all stamp type options for UI components
 */
export function getStampTypeOptions() {
  return Object.entries(STAMP_TYPES).map(([key, value]) => ({
    label: getStampTypeDisplay(value),
    value,
    key,
  }));
}
