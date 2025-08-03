/**
 * Runtime constants for API error handling
 * This file contains the actual values for enums and constants declared in api.d.ts
 */

/**
 * HTTP status code constants for type safety
 */
export const HttpStatusCodes = {
  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Standardized error codes for API responses
 * Follows OpenAPI 3.0+ error code patterns
 */
export enum ApiErrorCode {
  // General errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",

  // Request errors
  INVALID_REQUEST = "INVALID_REQUEST",
  MISSING_PARAMETER = "MISSING_PARAMETER",
  INVALID_PARAMETER = "INVALID_PARAMETER",
  PARAMETER_OUT_OF_RANGE = "PARAMETER_OUT_OF_RANGE",

  // Authentication/Authorization
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Resource errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",
  RESOURCE_LOCKED = "RESOURCE_LOCKED",

  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_FORMAT = "INVALID_FORMAT",
  VALUE_TOO_LARGE = "VALUE_TOO_LARGE",
  VALUE_TOO_SMALL = "VALUE_TOO_SMALL",

  // Bitcoin/Blockchain specific
  INVALID_ADDRESS = "INVALID_ADDRESS",
  INVALID_TRANSACTION = "INVALID_TRANSACTION",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  NETWORK_ERROR = "NETWORK_ERROR",

  // Stamp specific
  INVALID_STAMP = "INVALID_STAMP",
  STAMP_NOT_FOUND = "STAMP_NOT_FOUND",
  INVALID_CPID = "INVALID_CPID",

  // SRC-20 specific
  INVALID_TICK = "INVALID_TICK",
  TICK_NOT_FOUND = "TICK_NOT_FOUND",
  MINT_EXCEEDED = "MINT_EXCEEDED",
}

/**
 * HTTP status code to error code mapping
 */
export const HttpStatusToErrorCode: Record<number, ApiErrorCode> = {
  [HttpStatusCodes.BAD_REQUEST]: ApiErrorCode.INVALID_REQUEST,
  [HttpStatusCodes.UNAUTHORIZED]: ApiErrorCode.AUTHENTICATION_REQUIRED,
  [HttpStatusCodes.FORBIDDEN]: ApiErrorCode.INSUFFICIENT_PERMISSIONS,
  [HttpStatusCodes.NOT_FOUND]: ApiErrorCode.RESOURCE_NOT_FOUND,
  [HttpStatusCodes.CONFLICT]: ApiErrorCode.RESOURCE_CONFLICT,
  [HttpStatusCodes.UNPROCESSABLE_ENTITY]: ApiErrorCode.VALIDATION_FAILED,
  [HttpStatusCodes.TOO_MANY_REQUESTS]: ApiErrorCode.RATE_LIMIT_EXCEEDED,
  [HttpStatusCodes.INTERNAL_SERVER_ERROR]: ApiErrorCode.INTERNAL_ERROR,
  [HttpStatusCodes.SERVICE_UNAVAILABLE]: ApiErrorCode.SERVICE_UNAVAILABLE,
} as const;

// Re-export types from api.d.ts for convenience
export type {
  ApiErrorResponse,
  AuthenticationErrorResponse,
  BaseErrorResponse,
  BlockchainErrorResponse,
  ErrorHandlerContext,
  ErrorResponseFactory,
  ErrorTransformer,
  FieldError,
  HttpStatusCode,
  ProblemDetails,
  RateLimitErrorResponse,
  ResourceErrorResponse,
  ValidationErrorResponse,
} from "$types/api.d.ts";
