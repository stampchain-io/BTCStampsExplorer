/**
 * Constant Type Declarations
 * Type definitions for constant validation and utilities
 */

import type {
  StampEdition,
  StampFiletype,
  StampFilterType,
  StampMarketplace,
  StampType,
} from "$constants";
import type { SRC20ErrorCode } from "./src20.d.ts";
import type {
  APIErrorCode,
  BitcoinErrorCode,
  StampErrorCode,
  ValidationErrorCode,
} from "./errors.d.ts";

// ============================================================================
// TYPE GUARD DECLARATIONS
// ============================================================================

export declare function isValidStampType(value: unknown): value is StampType;
export declare function isValidStampFilterType(
  value: unknown,
): value is StampFilterType;
export declare function isValidStampMarketplace(
  value: unknown,
): value is StampMarketplace;
export declare function isValidStampFiletype(
  value: unknown,
): value is StampFiletype;
export declare function isValidStampEdition(
  value: unknown,
): value is StampEdition;

export declare function isValidSRC20ErrorCode(
  value: unknown,
): value is SRC20ErrorCode;
export declare function isValidStampErrorCode(
  value: unknown,
): value is StampErrorCode;
export declare function isValidValidationErrorCode(
  value: unknown,
): value is ValidationErrorCode;
export declare function isValidAPIErrorCode(
  value: unknown,
): value is APIErrorCode;
export declare function isValidBitcoinErrorCode(
  value: unknown,
): value is BitcoinErrorCode;

export declare function isValidErrorCode(
  value: unknown,
): value is
  | SRC20ErrorCode
  | StampErrorCode
  | ValidationErrorCode
  | APIErrorCode
  | BitcoinErrorCode;

// ============================================================================
// ASSERTION DECLARATIONS
// ============================================================================

export declare function validateStampType(
  value: unknown,
): asserts value is StampType;
export declare function validateStampFilterType(
  value: unknown,
): asserts value is StampFilterType;

export declare function validateConstants(
  validations: Array<
    { value: unknown; validator: (value: unknown) => boolean; name: string }
  >,
): void;

// ============================================================================
// UTILITY DECLARATIONS
// ============================================================================

export declare function getStampTypeDisplay(type: StampType): string;
export declare function parseStampType(
  value: string,
  fallback?: StampType,
): StampType;
export declare function getStampTypeOptions(): Array<{
  label: string;
  value: StampType;
  key: string;
}>;

// ============================================================================
// RE-EXPORTS
// ============================================================================

export type {
  StampEdition,
  StampFiletype,
  StampFilterType,
  StampMarketplace,
  StampType,
} from "$constants";
