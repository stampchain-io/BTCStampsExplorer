/**
 * Comprehensive Error Types Module for BTC Stamps Explorer
 *
 * Provides domain-specific error classes, error codes, validation structures,
 * and React error boundary types for standardized error handling across the application.
 *
 * @module errors
 * @version 1.0.0
 */

// ===== BASE ERROR TYPES =====

/**
 * Base error class for all custom application errors
 * Extends native Error with additional metadata and stack trace support
 */
export declare class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number | undefined;
  public readonly details: unknown | undefined;
  public readonly timestamp: number;
  public readonly correlationId: string;

  constructor(
    message: string,
    code: string,
    statusCode?: number,
    details?: unknown,
  );

  toJSON(): {
    name: string;
    message: string;
    code: string;
    statusCode: number | undefined;
    details: unknown | undefined;
    timestamp: number;
    correlationId: string;
    stack: string | undefined;
  };
}

// ===== DOMAIN-SPECIFIC ERROR CLASSES =====

/**
 * Validation error for input validation failures
 */
export declare class ValidationError extends BaseError {
  public readonly field: string | undefined;
  public readonly rule: string | undefined;
  public readonly path: string[] | undefined;

  constructor(
    message: string,
    field?: string,
    rule?: string,
    path?: string[],
    details?: unknown,
  );
}

/**
 * API error for HTTP/API related failures
 */
export declare class APIError extends BaseError {
  public readonly method: string | undefined;
  public readonly url: string | undefined;
  public readonly responseBody: unknown | undefined;

  constructor(
    message: string,
    statusCode?: number,
    method?: string,
    url?: string,
    responseBody?: unknown,
  );
}

/**
 * Bitcoin-related error for blockchain operations
 */
export declare class BitcoinError extends BaseError {
  public readonly operation: string | undefined;
  public readonly txHash: string | undefined;
  public readonly address: string | undefined;

  constructor(
    message: string,
    operation?: string,
    txHash?: string,
    address?: string,
    details?: unknown,
  );
}

/**
 * SRC-20 token related error
 */
export declare class SRC20Error extends BaseError {
  public readonly operation: "mint" | "deploy" | "transfer";
  public readonly tick: string | undefined;
  public readonly amount: string | undefined;

  constructor(
    message: string,
    operation: "mint" | "deploy" | "transfer",
    tick?: string,
    amount?: string,
    details?: unknown,
  );
}

/**
 * Stamp-related error for stamp operations
 */
export declare class StampError extends BaseError {
  public readonly stampId: number | undefined;
  public readonly cpid: string | undefined;
  public readonly creator: string | undefined;

  constructor(
    message: string,
    stampId?: number,
    cpid?: string,
    creator?: string,
    details?: unknown,
  );
}

/**
 * Database error for database operations
 */
export declare class DatabaseError extends BaseError {
  public readonly query: string | undefined;
  public readonly table: string | undefined;
  public readonly operation: string | undefined;

  constructor(
    message: string,
    query?: string,
    table?: string,
    operation?: string,
    details?: unknown,
  );
}

/**
 * Network error for network-related failures
 */
export declare class NetworkError extends BaseError {
  public readonly url: string | undefined;
  public readonly timeout: number | undefined;

  constructor(
    message: string,
    url?: string,
    timeout?: number,
    details?: unknown,
  );
}

/**
 * Authentication error for auth failures
 */
export declare class AuthenticationError extends BaseError {
  public readonly userId: string | undefined;
  public readonly provider: string | undefined;

  constructor(
    message: string,
    userId?: string,
    provider?: string,
    details?: unknown,
  );
}

/**
 * Authorization error for permission failures
 */
export declare class AuthorizationError extends BaseError {
  public readonly resource: string | undefined;
  public readonly action: string | undefined;
  public readonly userId: string | undefined;

  constructor(
    message: string,
    resource?: string,
    action?: string,
    userId?: string,
    details?: unknown,
  );
}

/**
 * Configuration error for config-related failures
 */
export declare class ConfigurationError extends BaseError {
  public readonly configKey: string | undefined;
  public readonly expectedType: string | undefined;

  constructor(
    message: string,
    configKey?: string,
    expectedType?: string,
    details?: unknown,
  );
}

// ===== ERROR CODE ENUMS =====

/**
 * Validation error codes
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
 * API error codes
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
 * Bitcoin error codes
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
 * SRC-20 error codes
 */
export enum SRC20ErrorCode {
  INVALID_TICKER = "SRC20_INVALID_TICKER",
  TOKEN_NOT_FOUND = "SRC20_TOKEN_NOT_FOUND",
  TOKEN_ALREADY_EXISTS = "SRC20_TOKEN_ALREADY_EXISTS",
  INSUFFICIENT_BALANCE = "SRC20_INSUFFICIENT_BALANCE",
  INVALID_AMOUNT = "SRC20_INVALID_AMOUNT",
  MINT_LIMIT_EXCEEDED = "SRC20_MINT_LIMIT_EXCEEDED",
  TOKEN_FULLY_MINTED = "SRC20_TOKEN_FULLY_MINTED",
  INVALID_DECIMALS = "SRC20_INVALID_DECIMALS",
  DEPLOYMENT_FAILED = "SRC20_DEPLOYMENT_FAILED",
  TRANSFER_FAILED = "SRC20_TRANSFER_FAILED",
  MINT_FAILED = "SRC20_MINT_FAILED",
}

/**
 * Stamp error codes
 */
export enum StampErrorCode {
  STAMP_NOT_FOUND = "STAMP_NOT_FOUND",
  INVALID_STAMP_DATA = "STAMP_INVALID_STAMP_DATA",
  INVALID_CPID = "STAMP_INVALID_CPID",
  STAMP_ALREADY_EXISTS = "STAMP_ALREADY_EXISTS",
  INVALID_CREATOR = "STAMP_INVALID_CREATOR",
  INVALID_SUPPLY = "STAMP_INVALID_SUPPLY",
  INVALID_DIVISIBILITY = "STAMP_INVALID_DIVISIBILITY",
  INVALID_LOCK_STATUS = "STAMP_INVALID_LOCK_STATUS",
  INVALID_MEDIA_TYPE = "STAMP_INVALID_MEDIA_TYPE",
  MEDIA_TOO_LARGE = "STAMP_MEDIA_TOO_LARGE",
  INVALID_BASE64 = "STAMP_INVALID_BASE64",
}

// ===== ERROR SEVERITY LEVELS =====

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// ===== VALIDATION ERROR STRUCTURES =====

/**
 * Field-specific validation error details
 */
export interface FieldValidationError {
  field: string;
  code: ValidationErrorCode;
  message: string;
  value?: unknown;
  path?: string[];
  rule?: string;
  params?: Record<string, unknown>;
}

/**
 * Validation error collection for multiple field errors
 */
export interface ValidationErrorCollection {
  errors: FieldValidationError[];
  hasErrors: boolean;
  getErrorsForField(field: string): FieldValidationError[];
  getFirstError(): FieldValidationError | null;
  getAllMessages(): string[];
}

/**
 * Validation result type
 */
export type ValidationResult<T = unknown> =
  | { valid: true; data: T }
  | { valid: false; errors: FieldValidationError[] };

// ===== API ERROR RESPONSE TYPES =====

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  status: "error";
  code: string;
  details?: unknown;
  timestamp?: number;
  correlationId?: string;
  path?: string;
  method?: string;
}

/**
 * API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  data: T;
  status: "success";
  message?: string;
  timestamp?: number;
  correlationId?: string;
}

/**
 * Generic API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * HTTP status code to error code mapping
 */
export declare const HTTP_STATUS_TO_ERROR_CODE: Record<number, APIErrorCode>;

// ===== REACT ERROR BOUNDARY TYPES =====

/**
 * Generic React element type
 */
export type ReactNode = unknown;

/**
 * Generic React component type
 */
export type ComponentType<P = Record<PropertyKey, never>> = (
  props: P,
) => ReactNode;

/**
 * Error information passed to error boundaries
 */
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Error boundary component props
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  errorId: string;
}

/**
 * Error recovery action types
 */
export type ErrorRecoveryAction =
  | "retry"
  | "refresh"
  | "redirect"
  | "login"
  | "go_back"
  | "contact_support";

/**
 * Error context for React error handling
 */
export interface ErrorContext {
  reportError: (error: Error, context?: string) => void;
  clearError: () => void;
  hasError: boolean;
  error: Error | null;
  retry: () => void;
}

// ===== ERROR TYPE DISCRIMINATION =====

/**
 * Discriminated union of all custom error types
 */
export type ApplicationError =
  | ValidationError
  | APIError
  | BitcoinError
  | SRC20Error
  | StampError
  | DatabaseError
  | NetworkError
  | AuthenticationError
  | AuthorizationError
  | ConfigurationError
  | BaseError;

/**
 * Error type discrimination by error code prefix
 */
export type ErrorByType<T extends string> = T extends `VALIDATION_${string}`
  ? ValidationError
  : T extends `API_${string}` ? APIError
  : T extends `BITCOIN_${string}` ? BitcoinError
  : T extends `SRC20_${string}` ? SRC20Error
  : T extends `STAMP_${string}` ? StampError
  : T extends `DATABASE_${string}` ? DatabaseError
  : T extends `NETWORK_${string}` ? NetworkError
  : T extends `AUTH_${string}` ? AuthenticationError | AuthorizationError
  : T extends `CONFIG_${string}` ? ConfigurationError
  : BaseError;

// ===== TYPE GUARDS =====

/**
 * Type guard to check if error is an ApplicationError
 */
export declare function isApplicationError(
  error: unknown,
): error is ApplicationError;

/**
 * Type guard to check if error is a ValidationError
 */
export declare function isValidationError(
  error: unknown,
): error is ValidationError;

/**
 * Type guard to check if error is an APIError
 */
export declare function isAPIError(error: unknown): error is APIError;

/**
 * Type guard to check if error is a BitcoinError
 */
export declare function isBitcoinError(error: unknown): error is BitcoinError;

/**
 * Type guard to check if error is an SRC20Error
 */
export declare function isSRC20Error(error: unknown): error is SRC20Error;

/**
 * Type guard to check if error is a StampError
 */
export declare function isStampError(error: unknown): error is StampError;

/**
 * Type guard to check if error is a NetworkError
 */
export declare function isNetworkError(error: unknown): error is NetworkError;

/**
 * Type guard to check if error is an AuthenticationError
 */
export declare function isAuthenticationError(
  error: unknown,
): error is AuthenticationError;

/**
 * Type guard to check if error is an AuthorizationError
 */
export declare function isAuthorizationError(
  error: unknown,
): error is AuthorizationError;

// ===== UTILITY FUNCTIONS =====

export declare function createValidationErrorCollection(
  errors?: FieldValidationError[],
): ValidationErrorCollection;
export declare function getUserFriendlyMessage(error: ApplicationError): string;
export declare function shouldReportError(error: ApplicationError): boolean;
export declare function getRecoveryAction(
  error: ApplicationError,
): ErrorRecoveryAction;

// ===== ERROR UTILITY TYPES =====

/**
 * Error handler function type
 */
export type ErrorHandler<T = unknown> = (error: ApplicationError) => T;

/**
 * Async error handler function type
 */
export type AsyncErrorHandler<T = unknown> = (
  error: ApplicationError,
) => Promise<T>;

/**
 * Error recovery function type
 */
export type ErrorRecoveryFunction = () => void | Promise<void>;

/**
 * Error reporting function type
 */
export type ErrorReportingFunction = (
  error: ApplicationError,
  context?: string,
) => void | Promise<void>;

/**
 * Result type that can contain either data or error
 */
export type Result<T, E extends ApplicationError = ApplicationError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E extends ApplicationError = ApplicationError> =
  Promise<Result<T, E>>;

/**
 * Error transformation function type
 */
export type ErrorTransformer<
  TIn extends ApplicationError,
  TOut extends ApplicationError,
> = (error: TIn) => TOut;

// ===== LEGACY ERROR COMPATIBILITY =====

/**
 * Legacy error type mappings for backward compatibility
 * @deprecated Use new error classes instead
 */
export enum ErrorType {
  /** @deprecated Use NetworkError */
  NETWORK_ERROR = "network",
  /** @deprecated Use APIError */
  API_ERROR = "api",
  /** @deprecated Use ValidationError */
  DATA_ERROR = "data",
  /** @deprecated Use ValidationError */
  VALIDATION_ERROR = "validation",
  /** @deprecated Use NetworkError */
  TIMEOUT_ERROR = "timeout",
  /** @deprecated Use AuthenticationError */
  AUTH_ERROR = "auth",
  /** @deprecated Use BaseError */
  UNKNOWN_ERROR = "unknown",
}

/**
 * Legacy error info interface
 * @deprecated Use ApplicationError classes instead
 */
export interface LegacyErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  timestamp: Date;
  recoverable: boolean;
  retryable: boolean;
  action?: string;
}
