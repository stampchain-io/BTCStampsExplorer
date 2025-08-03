/**
 * Enhanced Error Type Guards for TS18046 Resolution
 *
 * Provides comprehensive type guards for safe error handling in catch blocks,
 * resolving 'unknown' error type issues and enabling type-safe error processing.
 */

import {
  APIError,
  AuthenticationError,
  AuthorizationError,
  BaseError,
  BitcoinError,
  ConfigurationError,
  DatabaseError,
  NetworkError,
  SRC20Error,
  StampError,
  ValidationError,
} from "$types/errors.ts";

// ===== BASIC ERROR TYPE GUARDS =====

/**
 * Type guard to check if unknown value is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if unknown value is a standard Error with message
 */
export function isStandardError(
  error: unknown,
): error is Error & { message: string } {
  return error instanceof Error && typeof error.message === "string";
}

/**
 * Type guard to check if unknown value has error-like properties
 */
export function isErrorLike(
  error: unknown,
): error is { message: string; name?: string; stack?: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

/**
 * Type guard to check if unknown value is an ApplicationError (BaseError subclass)
 */
export function isApplicationError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

// ===== SPECIFIC ERROR TYPE GUARDS =====

/**
 * Type guard to check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Type guard to check if error is an APIError
 */
export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

/**
 * Type guard to check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Type guard to check if error is a BitcoinError
 */
export function isBitcoinError(error: unknown): error is BitcoinError {
  return error instanceof BitcoinError;
}

/**
 * Type guard to check if error is an SRC20Error
 */
export function isSRC20Error(error: unknown): error is SRC20Error {
  return error instanceof SRC20Error;
}

/**
 * Type guard to check if error is a StampError
 */
export function isStampError(error: unknown): error is StampError {
  return error instanceof StampError;
}

/**
 * Type guard to check if error is a DatabaseError
 */
export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

/**
 * Type guard to check if error is an AuthenticationError
 */
export function isAuthenticationError(
  error: unknown,
): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

/**
 * Type guard to check if error is an AuthorizationError
 */
export function isAuthorizationError(
  error: unknown,
): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/**
 * Type guard to check if error is a ConfigurationError
 */
export function isConfigurationError(
  error: unknown,
): error is ConfigurationError {
  return error instanceof ConfigurationError;
}

// ===== HTTP/FETCH ERROR TYPE GUARDS =====

/**
 * Type guard to check if error is a fetch Response error
 */
export function isFetchError(
  error: unknown,
): error is Response & { status: number; statusText: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    "statusText" in error &&
    typeof (error as any).status === "number" &&
    typeof (error as any).statusText === "string"
  );
}

/**
 * Type guard to check if error has HTTP status code
 */
export function hasStatusCode(
  error: unknown,
): error is { status: number } | { statusCode: number } {
  return (
    error !== null &&
    typeof error === "object" &&
    (("status" in error && typeof (error as any).status === "number") ||
      ("statusCode" in error && typeof (error as any).statusCode === "number"))
  );
}

// ===== RUNTIME ERROR PROPERTY GUARDS =====

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as any).message === "string"
  );
}

/**
 * Type guard to check if error has a stack property
 */
export function hasStack(error: unknown): error is { stack: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "stack" in error &&
    typeof (error as any).stack === "string"
  );
}

/**
 * Type guard to check if error has a name property
 */
export function hasName(error: unknown): error is { name: string } {
  return (
    error !== null &&
    typeof error === "object" &&
    "name" in error &&
    typeof (error as any).name === "string"
  );
}

/**
 * Type guard to check if error has a code property
 */
export function hasCode(error: unknown): error is { code: string | number } {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (typeof (error as any).code === "string" ||
      typeof (error as any).code === "number")
  );
}

// ===== UTILITY TYPE GUARDS =====

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Type guard to check if value is an object (excluding null)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Type guard to check if object has a specific property
 */
export function hasProperty<T, K extends string>(
  obj: T,
  prop: K,
): obj is T & Record<K, unknown> {
  return obj != null && typeof obj === "object" && prop in obj;
}

/**
 * Type guard to check if object has a property with specific type
 */
export function hasPropertyOfType<T, K extends string, V>(
  obj: T,
  prop: K,
  typeGuard: (value: unknown) => value is V,
): obj is T & Record<K, V> {
  return (
    obj != null &&
    typeof obj === "object" &&
    prop in obj &&
    typeGuard((obj as any)[prop])
  );
}

// ===== PATTERN-BASED ERROR DETECTION =====

/**
 * Type guard to detect timeout errors based on message patterns
 */
export function isTimeoutError(error: unknown): error is Error {
  if (!isError(error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("request timeout") ||
    message.includes("connection timeout")
  );
}

/**
 * Type guard to detect network errors based on message patterns
 */
export function isNetworkErrorByMessage(error: unknown): error is Error {
  if (!isError(error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("fetch") ||
    message.includes("net::") ||
    message.includes("dns")
  );
}

/**
 * Type guard to detect CORS errors based on message patterns
 */
export function isCORSError(error: unknown): error is Error {
  if (!isError(error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("cors") ||
    message.includes("cross-origin") ||
    message.includes("access-control")
  );
}

/**
 * Type guard to detect validation errors based on message patterns
 */
export function isValidationErrorByMessage(error: unknown): error is Error {
  if (!isError(error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required") ||
    message.includes("format")
  );
}

// ===== COMPOSITE TYPE GUARDS =====

/**
 * Comprehensive type guard that checks for any recognizable error type
 */
export function isRecognizableError(
  error: unknown,
): error is Error | BaseError | { message: string } {
  return (
    isError(error) ||
    isApplicationError(error) ||
    isErrorLike(error) ||
    isFetchError(error)
  );
}

/**
 * Type guard for errors that should be retried
 */
export function isRetryableError(error: unknown): error is Error {
  if (isNetworkError(error)) return true;
  if (isTimeoutError(error)) return true;
  if (isAPIError(error) && error.statusCode && error.statusCode >= 500) {
    return true;
  }
  if (hasStatusCode(error)) {
    const status = "status" in error ? error.status : (error as any).statusCode;
    return status === 429 || status >= 500;
  }
  return false;
}

/**
 * Type guard for errors that should be reported to monitoring
 */
export function isReportableError(error: unknown): error is Error {
  if (isValidationError(error)) return false;
  if (
    isAPIError(error) && error.statusCode && error.statusCode < 500 &&
    error.statusCode !== 429
  ) {
    return false;
  }
  return true;
}
