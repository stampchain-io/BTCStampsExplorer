/**
 * Tests for Error Types Module
 *
 * Validates error class instantiation, inheritance, stack trace preservation,
 * type discrimination, and proper error handling patterns.
 */

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertStringIncludes,
} from "@std/assert";
import {
  APIError,
  APIErrorCode,
  type ApiErrorResponse,
  type ApplicationError,
  AuthenticationError,
  AuthorizationError,
  BaseError,
  BitcoinError,
  BitcoinErrorCode,
  captureReactError,
  ConfigurationError,
  createApiErrorResponse,
  createApiSuccessResponse,
  createDefaultErrorFallback,
  createErrorBoundaryConfig,
  createErrorBoundaryState,
  createErrorContext,
  createErrorFallbackProps,
  createErrorRecovery,
  createErrorReporter,
  createErrorState,
  createFieldValidationError,
  createValidationErrorCollection,
  DatabaseError,
  type ErrorBoundaryState,
  ErrorSeverity,
  extractComponentStack,
  type FieldValidationError,
  generateErrorId,
  getRecoveryAction,
  getUserFriendlyMessage,
  HTTP_STATUS_TO_ERROR_CODE,
  isAPIError,
  isApplicationError,
  isAuthenticationError,
  isAuthorizationError,
  isBitcoinError,
  isNetworkError,
  isSRC20Error,
  isStampError,
  isValidationError,
  NetworkError,
  resetErrorBoundaryState,
  type Result,
  shouldReportError,
  SRC20Error,
  SRC20ErrorCode,
  StampError,
  StampErrorCode,
  validateBitcoinAddress,
  validateEmail,
  validateLength,
  validatePattern,
  validateRange,
  validateRequired,
  validateSRC20Ticker,
  validateUrl,
  ValidationError,
  ValidationErrorCode,
} from "./errors.ts";

Deno.test("BaseError - basic instantiation and properties", () => {
  const error = new BaseError("Test error", "TEST_ERROR", 500, {
    key: "value",
  });

  assertEquals(error.message, "Test error");
  assertEquals(error.code, "TEST_ERROR");
  assertEquals(error.statusCode, 500);
  assertEquals(error.details, { key: "value" });
  assert(error.timestamp > 0);
  assert(error.correlationId.startsWith("err-"));
  assertInstanceOf(error, Error);
  assert(error.stack !== undefined);
});

Deno.test("BaseError - stack trace preservation", () => {
  function throwError() {
    throw new BaseError("Stack test", "STACK_TEST");
  }

  try {
    throwError();
  } catch (error) {
    assertInstanceOf(error, BaseError);
    assert(error.stack !== undefined);
    assertStringIncludes(error.stack!, "throwError");
  }
});

Deno.test("BaseError - JSON serialization", () => {
  const error = new BaseError("JSON test", "JSON_TEST", 400, { test: true });
  const json = error.toJSON();

  assertEquals(json.name, "BaseError");
  assertEquals(json.message, "JSON test");
  assertEquals(json.code, "JSON_TEST");
  assertEquals(json.statusCode, 400);
  assertEquals(json.details, { test: true });
  assert(json.timestamp > 0);
  assert(json.correlationId.startsWith("err-"));
  assert(json.stack !== undefined);
});

Deno.test("ValidationError - field validation details", () => {
  const error = new ValidationError(
    "Invalid email format",
    "email",
    "format",
    ["user", "contact", "email"],
    { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  );

  assertEquals(error.message, "Invalid email format");
  assertEquals(error.code, "VALIDATION_ERROR");
  assertEquals(error.statusCode, 400);
  assertEquals(error.field, "email");
  assertEquals(error.rule, "format");
  assertEquals(error.path, ["user", "contact", "email"]);
  assertInstanceOf(error, ValidationError);
  assertInstanceOf(error, BaseError);
});

Deno.test("APIError - HTTP status code mapping", () => {
  const error = new APIError("Not found", 404, "GET", "/api/stamps/999");

  assertEquals(error.message, "Not found");
  assertEquals(error.code, "API_CLIENT_ERROR");
  assertEquals(error.statusCode, 404);
  assertEquals(error.method, "GET");
  assertEquals(error.url, "/api/stamps/999");
});

Deno.test("APIError - server error classification", () => {
  const error = new APIError("Internal server error", 500, "POST", "/api/mint");

  assertEquals(error.code, "API_SERVER_ERROR");
  assertEquals(error.statusCode, 500);
});

Deno.test("BitcoinError - transaction context", () => {
  const error = new BitcoinError(
    "Insufficient funds",
    "send_transaction",
    "abc123hash",
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  );

  assertEquals(error.message, "Insufficient funds");
  assertEquals(error.code, "BITCOIN_ERROR");
  assertEquals(error.statusCode, 422);
  assertEquals(error.operation, "send_transaction");
  assertEquals(error.txHash, "abc123hash");
  assertEquals(error.address, "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
});

Deno.test("SRC20Error - token operation context", () => {
  const error = new SRC20Error(
    "Token not found",
    "mint",
    "PEPE",
    "1000",
    { blockIndex: 800000 },
  );

  assertEquals(error.message, "Token not found");
  assertEquals(error.code, "SRC20_ERROR");
  assertEquals(error.operation, "mint");
  assertEquals(error.tick, "PEPE");
  assertEquals(error.amount, "1000");
  assertEquals(error.details, { blockIndex: 800000 });
});

Deno.test("StampError - stamp context", () => {
  const error = new StampError(
    "Invalid stamp data",
    12345,
    "A1234567890123456789",
    "bc1qcreator123",
  );

  assertEquals(error.message, "Invalid stamp data");
  assertEquals(error.code, "STAMP_ERROR");
  assertEquals(error.stampId, 12345);
  assertEquals(error.cpid, "A1234567890123456789");
  assertEquals(error.creator, "bc1qcreator123");
});

Deno.test("DatabaseError - database context", () => {
  const error = new DatabaseError(
    "Connection timeout",
    "SELECT * FROM stamps",
    "stamps",
    "SELECT",
  );

  assertEquals(error.message, "Connection timeout");
  assertEquals(error.code, "DATABASE_ERROR");
  assertEquals(error.statusCode, 500);
  assertEquals(error.query, "SELECT * FROM stamps");
  assertEquals(error.table, "stamps");
  assertEquals(error.operation, "SELECT");
});

Deno.test("NetworkError - network context", () => {
  const error = new NetworkError(
    "Request timeout",
    "https://api.example.com/data",
    30000,
  );

  assertEquals(error.message, "Request timeout");
  assertEquals(error.code, "NETWORK_ERROR");
  assertEquals(error.statusCode, 503);
  assertEquals(error.url, "https://api.example.com/data");
  assertEquals(error.timeout, 30000);
});

Deno.test("AuthenticationError - auth context", () => {
  const error = new AuthenticationError(
    "Invalid token",
    "user123",
    "jwt",
  );

  assertEquals(error.message, "Invalid token");
  assertEquals(error.code, "AUTH_ERROR");
  assertEquals(error.statusCode, 401);
  assertEquals(error.userId, "user123");
  assertEquals(error.provider, "jwt");
});

Deno.test("AuthorizationError - permission context", () => {
  const error = new AuthorizationError(
    "Access denied",
    "/admin/users",
    "DELETE",
    "user123",
  );

  assertEquals(error.message, "Access denied");
  assertEquals(error.code, "AUTHORIZATION_ERROR");
  assertEquals(error.statusCode, 403);
  assertEquals(error.resource, "/admin/users");
  assertEquals(error.action, "DELETE");
  assertEquals(error.userId, "user123");
});

Deno.test("ConfigurationError - config context", () => {
  const error = new ConfigurationError(
    "Missing required config",
    "DATABASE_URL",
    "string",
  );

  assertEquals(error.message, "Missing required config");
  assertEquals(error.code, "CONFIG_ERROR");
  assertEquals(error.statusCode, 500);
  assertEquals(error.configKey, "DATABASE_URL");
  assertEquals(error.expectedType, "string");
});

Deno.test("Error codes - ValidationErrorCode enum", () => {
  assertEquals(ValidationErrorCode.REQUIRED_FIELD, "VALIDATION_REQUIRED_FIELD");
  assertEquals(ValidationErrorCode.INVALID_FORMAT, "VALIDATION_INVALID_FORMAT");
  assertEquals(
    ValidationErrorCode.DUPLICATE_VALUE,
    "VALIDATION_DUPLICATE_VALUE",
  );
});

Deno.test("Error codes - APIErrorCode enum", () => {
  assertEquals(APIErrorCode.BAD_REQUEST, "API_BAD_REQUEST");
  assertEquals(APIErrorCode.NOT_FOUND, "API_NOT_FOUND");
  assertEquals(APIErrorCode.INTERNAL_ERROR, "API_INTERNAL_ERROR");
});

Deno.test("Error codes - BitcoinErrorCode enum", () => {
  assertEquals(BitcoinErrorCode.INVALID_ADDRESS, "BITCOIN_INVALID_ADDRESS");
  assertEquals(
    BitcoinErrorCode.INSUFFICIENT_FUNDS,
    "BITCOIN_INSUFFICIENT_FUNDS",
  );
  assertEquals(BitcoinErrorCode.NETWORK_ERROR, "BITCOIN_NETWORK_ERROR");
});

Deno.test("Error codes - SRC20ErrorCode enum", () => {
  assertEquals(SRC20ErrorCode.INVALID_TICKER, "SRC20_INVALID_TICKER");
  assertEquals(SRC20ErrorCode.TOKEN_NOT_FOUND, "SRC20_TOKEN_NOT_FOUND");
  assertEquals(SRC20ErrorCode.MINT_LIMIT_EXCEEDED, "SRC20_MINT_LIMIT_EXCEEDED");
});

Deno.test("Error codes - StampErrorCode enum", () => {
  assertEquals(StampErrorCode.STAMP_NOT_FOUND, "STAMP_NOT_FOUND");
  assertEquals(StampErrorCode.INVALID_CPID, "STAMP_INVALID_CPID");
  assertEquals(StampErrorCode.MEDIA_TOO_LARGE, "STAMP_MEDIA_TOO_LARGE");
});

Deno.test("HTTP status to error code mapping", () => {
  assertEquals(HTTP_STATUS_TO_ERROR_CODE[400], APIErrorCode.BAD_REQUEST);
  assertEquals(HTTP_STATUS_TO_ERROR_CODE[404], APIErrorCode.NOT_FOUND);
  assertEquals(HTTP_STATUS_TO_ERROR_CODE[500], APIErrorCode.INTERNAL_ERROR);
  assertEquals(
    HTTP_STATUS_TO_ERROR_CODE[503],
    APIErrorCode.SERVICE_UNAVAILABLE,
  );
});

Deno.test("Type guards - isApplicationError", () => {
  const appError = new ValidationError("Test");
  const stdError = new Error("Standard error");

  assert(isApplicationError(appError));
  assert(!isApplicationError(stdError));
  assert(!isApplicationError("string"));
  assert(!isApplicationError(null));
});

Deno.test("Type guards - isValidationError", () => {
  const validationError = new ValidationError("Test");
  const apiError = new APIError("Test", 400);

  assert(isValidationError(validationError));
  assert(!isValidationError(apiError));
});

Deno.test("Type guards - isAPIError", () => {
  const apiError = new APIError("Test", 404);
  const validationError = new ValidationError("Test");

  assert(isAPIError(apiError));
  assert(!isAPIError(validationError));
});

Deno.test("Type guards - isBitcoinError", () => {
  const bitcoinError = new BitcoinError("Test");
  const src20Error = new SRC20Error("Test", "mint");

  assert(isBitcoinError(bitcoinError));
  assert(!isBitcoinError(src20Error));
});

Deno.test("Type guards - isSRC20Error", () => {
  const src20Error = new SRC20Error("Test", "deploy");
  const stampError = new StampError("Test");

  assert(isSRC20Error(src20Error));
  assert(!isSRC20Error(stampError));
});

Deno.test("Type guards - isStampError", () => {
  const stampError = new StampError("Test");
  const networkError = new NetworkError("Test");

  assert(isStampError(stampError));
  assert(!isStampError(networkError));
});

Deno.test("Type guards - isNetworkError", () => {
  const networkError = new NetworkError("Test");
  const authError = new AuthenticationError("Test");

  assert(isNetworkError(networkError));
  assert(!isNetworkError(authError));
});

Deno.test("Type guards - isAuthenticationError", () => {
  const authError = new AuthenticationError("Test");
  const authzError = new AuthorizationError("Test");

  assert(isAuthenticationError(authError));
  assert(!isAuthenticationError(authzError));
});

Deno.test("Type guards - isAuthorizationError", () => {
  const authzError = new AuthorizationError("Test");
  const authError = new AuthenticationError("Test");

  assert(isAuthorizationError(authzError));
  assert(!isAuthorizationError(authError));
});

Deno.test("Error inheritance chain", () => {
  const validationError = new ValidationError("Test");

  assertInstanceOf(validationError, ValidationError);
  assertInstanceOf(validationError, BaseError);
  assertInstanceOf(validationError, Error);

  // Check prototype chain
  assertEquals(validationError.constructor.name, "ValidationError");
  assertEquals(
    Object.getPrototypeOf(validationError).constructor.name,
    "ValidationError",
  );
});

Deno.test("FieldValidationError structure", () => {
  const fieldError: FieldValidationError = {
    field: "email",
    code: ValidationErrorCode.INVALID_FORMAT,
    message: "Invalid email format",
    value: "not-an-email",
    path: ["user", "contact", "email"],
    rule: "email",
    params: { pattern: "email" },
  };

  assertEquals(fieldError.field, "email");
  assertEquals(fieldError.code, ValidationErrorCode.INVALID_FORMAT);
  assertEquals(fieldError.message, "Invalid email format");
  assertEquals(fieldError.value, "not-an-email");
  assertEquals(fieldError.path, ["user", "contact", "email"]);
  assertEquals(fieldError.rule, "email");
  assertEquals(fieldError.params, { pattern: "email" });
});

Deno.test("ApiErrorResponse structure", () => {
  const apiErrorResponse: ApiErrorResponse = {
    error: "Validation failed",
    status: "error",
    code: "VALIDATION_ERROR",
    details: { field: "email" },
    timestamp: Date.now(),
    correlationId: "err-123-abc",
    path: "/api/users",
    method: "POST",
  };

  assertEquals(apiErrorResponse.status, "error");
  assertEquals(apiErrorResponse.error, "Validation failed");
  assertEquals(apiErrorResponse.code, "VALIDATION_ERROR");
  assert(apiErrorResponse.timestamp !== undefined);
});

Deno.test("Result type usage", () => {
  const successResult: Result<string> = {
    success: true,
    data: "Success value",
  };

  const errorResult: Result<string, ValidationError> = {
    success: false,
    error: new ValidationError("Validation failed"),
  };

  assertEquals(successResult.success, true);
  if (successResult.success) {
    assertEquals(successResult.data, "Success value");
  }

  assertEquals(errorResult.success, false);
  if (!errorResult.success) {
    assertInstanceOf(errorResult.error, ValidationError);
  }
});

Deno.test("ErrorBoundaryState structure", () => {
  const errorBoundaryState: ErrorBoundaryState = {
    hasError: true,
    error: new ValidationError("Test error"),
    errorInfo: {
      componentStack: "at Component\n at App",
      errorBoundary: "ErrorBoundary",
      errorBoundaryStack: "at ErrorBoundary\n at App",
    },
    errorId: "error-123",
  };

  assertEquals(errorBoundaryState.hasError, true);
  assertInstanceOf(errorBoundaryState.error, ValidationError);
  assertEquals(
    errorBoundaryState.errorInfo?.componentStack,
    "at Component\n at App",
  );
  assertEquals(errorBoundaryState.errorId, "error-123");
});

Deno.test("Error severity levels", () => {
  assertEquals(ErrorSeverity.LOW, "low");
  assertEquals(ErrorSeverity.MEDIUM, "medium");
  assertEquals(ErrorSeverity.HIGH, "high");
  assertEquals(ErrorSeverity.CRITICAL, "critical");
});

Deno.test("ApplicationError discriminated union type narrowing", () => {
  function handleError(error: ApplicationError): string {
    if (error instanceof ValidationError) {
      return `Validation error: ${error.field}`;
    } else if (error instanceof APIError) {
      return `API error: ${error.statusCode}`;
    } else if (error instanceof SRC20Error) {
      return `SRC20 error: ${error.operation}`;
    } else {
      return `Generic error: ${error.code}`;
    }
  }

  const validationError = new ValidationError("Test", "email");
  const apiError = new APIError("Test", 404);
  const src20Error = new SRC20Error("Test", "mint");
  const baseError = new BaseError("Test", "BASE_ERROR");

  assertEquals(handleError(validationError), "Validation error: email");
  assertEquals(handleError(apiError), "API error: 404");
  assertEquals(handleError(src20Error), "SRC20 error: mint");
  assertEquals(handleError(baseError), "Generic error: BASE_ERROR");
});

Deno.test("Error correlation ID uniqueness", () => {
  const error1 = new BaseError("Test 1", "TEST_1");
  const error2 = new BaseError("Test 2", "TEST_2");

  assert(error1.correlationId !== error2.correlationId);
  assert(error1.correlationId.startsWith("err-"));
  assert(error2.correlationId.startsWith("err-"));
});

Deno.test("Error timestamp accuracy", () => {
  const beforeTime = Date.now();
  const error = new BaseError("Test", "TEST");
  const afterTime = Date.now();

  assert(error.timestamp >= beforeTime);
  assert(error.timestamp <= afterTime);
});

Deno.test("ValidationErrorCollection utility", () => {
  const errors: FieldValidationError[] = [
    {
      field: "email",
      code: ValidationErrorCode.INVALID_FORMAT,
      message: "Invalid email format",
    },
    {
      field: "email",
      code: ValidationErrorCode.REQUIRED_FIELD,
      message: "Email is required",
    },
    {
      field: "name",
      code: ValidationErrorCode.REQUIRED_FIELD,
      message: "Name is required",
    },
  ];

  const collection = createValidationErrorCollection(errors);

  assert(collection.hasErrors);
  assertEquals(collection.errors.length, 3);
  assertEquals(collection.getErrorsForField("email").length, 2);
  assertEquals(collection.getErrorsForField("name").length, 1);
  assertEquals(collection.getErrorsForField("missing").length, 0);
  assertEquals(collection.getFirstError()?.field, "email");
  assertEquals(collection.getAllMessages().length, 3);
});

Deno.test("getUserFriendlyMessage function", () => {
  const validationError = new ValidationError("Invalid format", "email");
  const apiError = new APIError("Not found", 404);
  const networkError = new NetworkError("Connection failed");
  const bitcoinError = new BitcoinError("Insufficient funds");
  const src20Error = new SRC20Error("Token not found", "mint");

  assertEquals(
    getUserFriendlyMessage(validationError),
    "Invalid email: Invalid format",
  );
  assertEquals(
    getUserFriendlyMessage(apiError),
    "The requested resource was not found.",
  );
  assertEquals(
    getUserFriendlyMessage(networkError),
    "Network connection error. Please check your connection and try again.",
  );
  assertEquals(
    getUserFriendlyMessage(bitcoinError),
    "Bitcoin transaction error: Insufficient funds",
  );
  assertEquals(
    getUserFriendlyMessage(src20Error),
    "SRC-20 mint error: Token not found",
  );
});

Deno.test("shouldReportError function", () => {
  const validationError = new ValidationError("Invalid");
  const clientError = new APIError("Bad request", 400);
  const rateLimitError = new APIError("Too many requests", 429);
  const serverError = new APIError("Internal error", 500);
  const networkError = new NetworkError("Connection failed");

  assert(!shouldReportError(validationError));
  assert(!shouldReportError(clientError));
  assert(shouldReportError(rateLimitError));
  assert(shouldReportError(serverError));
  assert(shouldReportError(networkError));
});

Deno.test("getRecoveryAction function", () => {
  const validationError = new ValidationError("Invalid");
  const authError = new AuthenticationError("Unauthorized");
  const networkError = new NetworkError("Connection failed");
  const notFoundError = new APIError("Not found", 404);
  const serverError = new APIError("Internal error", 500);

  assertEquals(getRecoveryAction(validationError), "go_back");
  assertEquals(getRecoveryAction(authError), "login");
  assertEquals(getRecoveryAction(networkError), "retry");
  assertEquals(getRecoveryAction(notFoundError), "go_back");
  assertEquals(getRecoveryAction(serverError), "retry");
});

Deno.test("Validation utilities - createFieldValidationError", () => {
  const error = createFieldValidationError(
    "email",
    ValidationErrorCode.INVALID_EMAIL,
    "Invalid email format",
    "not-email",
    ["user", "contact", "email"],
    "email",
    { pattern: "email" },
  );

  assertEquals(error.field, "email");
  assertEquals(error.code, ValidationErrorCode.INVALID_EMAIL);
  assertEquals(error.message, "Invalid email format");
  assertEquals(error.value, "not-email");
  assertEquals(error.path, ["user", "contact", "email"]);
  assertEquals(error.rule, "email");
  assertEquals(error.params, { pattern: "email" });
});

Deno.test("Validation utilities - validateRequired", () => {
  // Valid values
  assertEquals(validateRequired("name", "John"), null);
  assertEquals(validateRequired("age", 25), null);
  assertEquals(validateRequired("active", false), null);

  // Invalid values
  const error1 = validateRequired("name", "");
  assert(error1 !== null);
  assertEquals(error1.field, "name");
  assertEquals(error1.code, ValidationErrorCode.REQUIRED_FIELD);

  const error2 = validateRequired("name", null);
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.REQUIRED_FIELD);

  const error3 = validateRequired("name", undefined);
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.REQUIRED_FIELD);
});

Deno.test("Validation utilities - validateLength", () => {
  // Valid lengths
  assertEquals(validateLength("name", "John", 2, 10), null);
  assertEquals(validateLength("name", "A", 1, 5), null);

  // Invalid type
  const error1 = validateLength("name", 123 as any, 2, 10);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Too short
  const error2 = validateLength("name", "A", 2, 10);
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_LENGTH);
  assertEquals(error2.params?.min, 2);

  // Too long
  const error3 = validateLength("name", "VeryLongName", 2, 5);
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_LENGTH);
  assertEquals(error3.params?.max, 5);
});

Deno.test("Validation utilities - validateEmail", () => {
  // Valid emails
  assertEquals(validateEmail("email", "test@example.com"), null);
  assertEquals(validateEmail("email", "user.name+tag@domain.co.uk"), null);

  // Invalid type
  const error1 = validateEmail("email", 123 as any);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Invalid email formats
  const error2 = validateEmail("email", "not-an-email");
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_EMAIL);

  const error3 = validateEmail("email", "@domain.com");
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_EMAIL);
});

Deno.test("Validation utilities - validateUrl", () => {
  // Valid URLs
  assertEquals(validateUrl("url", "https://example.com"), null);
  assertEquals(validateUrl("url", "http://localhost:3000"), null);
  assertEquals(validateUrl("url", "ftp://files.example.com"), null);

  // Invalid type
  const error1 = validateUrl("url", 123 as any);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Invalid URLs
  const error2 = validateUrl("url", "not-a-url");
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_URL);

  const error3 = validateUrl("url", "://missing-protocol");
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_URL);
});

Deno.test("Validation utilities - validateRange", () => {
  // Valid ranges
  assertEquals(validateRange("age", 25, 0, 100), null);
  assertEquals(validateRange("score", 85, 0, 100), null);

  // Invalid type
  const error1 = validateRange("age", "25" as any, 0, 100);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  const error2 = validateRange("age", NaN, 0, 100);
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_TYPE);

  // Below minimum
  const error3 = validateRange("age", -5, 0, 100);
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_RANGE);
  assertEquals(error3.params?.min, 0);

  // Above maximum
  const error4 = validateRange("age", 150, 0, 100);
  assert(error4 !== null);
  assertEquals(error4.code, ValidationErrorCode.INVALID_RANGE);
  assertEquals(error4.params?.max, 100);
});

Deno.test("Validation utilities - validatePattern", () => {
  const phonePattern = /^\d{3}-\d{3}-\d{4}$/;

  // Valid pattern
  assertEquals(validatePattern("phone", "123-456-7890", phonePattern), null);

  // Invalid type
  const error1 = validatePattern("phone", 123 as any, phonePattern);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Invalid pattern
  const error2 = validatePattern("phone", "123-45-6789", phonePattern);
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_PATTERN);
  assertEquals(error2.params?.pattern, phonePattern.source);
});

Deno.test("Validation utilities - validateBitcoinAddress", () => {
  // Valid Bitcoin addresses (examples)
  assertEquals(
    validateBitcoinAddress("address", "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"),
    null,
  );
  assertEquals(
    validateBitcoinAddress("address", "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
    null,
  );
  assertEquals(
    validateBitcoinAddress(
      "address",
      "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    ),
    null,
  );

  // Invalid type
  const error1 = validateBitcoinAddress("address", 123 as any);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Invalid address format
  const error2 = validateBitcoinAddress("address", "not-a-bitcoin-address");
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_FORMAT);

  const error3 = validateBitcoinAddress("address", "1InvalidAddress");
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_FORMAT);
});

Deno.test("Validation utilities - validateSRC20Ticker", () => {
  // Valid tickers
  assertEquals(validateSRC20Ticker("tick", "BTC"), null);
  assertEquals(validateSRC20Ticker("tick", "PEPE"), null);
  assertEquals(validateSRC20Ticker("tick", "STAMP"), null);

  // Invalid type
  const error1 = validateSRC20Ticker("tick", 123 as any);
  assert(error1 !== null);
  assertEquals(error1.code, ValidationErrorCode.INVALID_TYPE);

  // Invalid length
  const error2 = validateSRC20Ticker("tick", "AB");
  assert(error2 !== null);
  assertEquals(error2.code, ValidationErrorCode.INVALID_LENGTH);

  const error3 = validateSRC20Ticker("tick", "TOOLONG");
  assert(error3 !== null);
  assertEquals(error3.code, ValidationErrorCode.INVALID_LENGTH);

  // Invalid format
  const error4 = validateSRC20Ticker("tick", "btc");
  assert(error4 !== null);
  assertEquals(error4.code, ValidationErrorCode.INVALID_FORMAT);

  const error5 = validateSRC20Ticker("tick", "BT1");
  assert(error5 !== null);
  assertEquals(error5.code, ValidationErrorCode.INVALID_FORMAT);
});

Deno.test("API response utilities - createApiErrorResponse", () => {
  const errorResponse = createApiErrorResponse(
    "Validation failed",
    "VALIDATION_ERROR",
    { field: "email" },
    "correlation-123",
    "/api/users",
    "POST",
  );

  assertEquals(errorResponse.error, "Validation failed");
  assertEquals(errorResponse.status, "error");
  assertEquals(errorResponse.code, "VALIDATION_ERROR");
  assertEquals(errorResponse.details, { field: "email" });
  assertEquals(errorResponse.correlationId, "correlation-123");
  assertEquals(errorResponse.path, "/api/users");
  assertEquals(errorResponse.method, "POST");
  assert(errorResponse.timestamp > 0);
});

Deno.test("API response utilities - createApiSuccessResponse", () => {
  const successResponse = createApiSuccessResponse(
    { id: 1, name: "John" },
    "User created successfully",
    "correlation-456",
  );

  assertEquals(successResponse.data, { id: 1, name: "John" });
  assertEquals(successResponse.status, "success");
  assertEquals(successResponse.message, "User created successfully");
  assertEquals(successResponse.correlationId, "correlation-456");
  assert(successResponse.timestamp > 0);

  // Test without optional parameters
  const simpleResponse = createApiSuccessResponse({ result: "ok" });
  assertEquals(simpleResponse.data, { result: "ok" });
  assertEquals(simpleResponse.status, "success");
  assert(simpleResponse.correlationId.startsWith("api-"));
});

// ===== REACT ERROR HANDLING PATTERN TESTS =====

Deno.test("React Error Handling - generateErrorId", () => {
  const id1 = generateErrorId();
  const id2 = generateErrorId();

  assert(id1.startsWith("err-"));
  assert(id2.startsWith("err-"));
  assert(id1 !== id2); // Should be unique
  assert(id1.length > 15); // Should have timestamp and random part
});

Deno.test("React Error Handling - createErrorBoundaryState", () => {
  // Without error
  const emptyState = createErrorBoundaryState();
  assertEquals(emptyState.hasError, false);
  assertEquals(emptyState.error, null);
  assertEquals(emptyState.errorInfo, null);
  assertEquals(emptyState.errorId, null);

  // With error
  const error = new Error("Test error");
  const errorInfo = { componentStack: "at Component" };
  const errorState = createErrorBoundaryState(error, errorInfo);

  assertEquals(errorState.hasError, true);
  assertEquals(errorState.error, error);
  assertEquals(errorState.errorInfo, errorInfo);
  assert(errorState.errorId !== null);
  assert(errorState.errorId.startsWith("err-"));
});

Deno.test("React Error Handling - resetErrorBoundaryState", () => {
  const resetState = resetErrorBoundaryState();

  assertEquals(resetState.hasError, false);
  assertEquals(resetState.error, null);
  assertEquals(resetState.errorInfo, null);
  assertEquals(resetState.errorId, null);
});

Deno.test("React Error Handling - extractComponentStack", () => {
  // With componentStack
  const errorInfo1 = { componentStack: "at Component\n  at App" };
  assertEquals(extractComponentStack(errorInfo1), "at Component\n  at App");

  // With stack
  const errorInfo2 = { stack: "Error: Test\n  at Component" };
  assertEquals(
    extractComponentStack(errorInfo2),
    "Error: Test\n  at Component",
  );

  // With string
  assertEquals(extractComponentStack("string error info"), "string error info");

  // With null/undefined
  assertEquals(extractComponentStack(null), "");
  assertEquals(extractComponentStack(undefined), "");

  // With object without expected properties
  const errorInfo3 = { other: "data" };
  assertEquals(
    extractComponentStack(errorInfo3),
    JSON.stringify(errorInfo3, null, 2),
  );
});

Deno.test("React Error Handling - createErrorContext", () => {
  let reportedError: Error | null = null;
  let reportedContext: string | undefined;
  let cleared = false;
  let retried = false;
  const mockError = new Error("Test error");

  const context = createErrorContext({
    reportError: (error, ctx) => {
      reportedError = error;
      reportedContext = ctx;
    },
    clearError: () => {
      cleared = true;
    },
    hasError: true,
    error: mockError,
    retry: () => {
      retried = true;
    },
  });

  assertEquals(context.hasError, true);
  assertEquals(context.error, mockError);

  context.reportError(mockError, "test context");
  assertEquals(reportedError, mockError);
  assertEquals(reportedContext, "test context");

  context.clearError();
  assertEquals(cleared, true);

  context.retry();
  assertEquals(retried, true);
});

Deno.test("React Error Handling - createErrorFallbackProps", () => {
  const error = new Error("Test error");
  const errorInfo = { componentStack: "at Component" };
  const resetError = () => {};
  const errorId = "custom-error-id";

  const props = createErrorFallbackProps(error, errorInfo, resetError, errorId);

  assertEquals(props.error, error);
  assertEquals(props.errorInfo, errorInfo);
  assertEquals(props.resetError, resetError);
  assertEquals(props.errorId, errorId);

  // Test with auto-generated errorId
  const props2 = createErrorFallbackProps(error, errorInfo, resetError);
  assert(props2.errorId.startsWith("err-"));
});

Deno.test("React Error Handling - captureReactError", () => {
  const originalError = new Error("Component crashed");
  const errorInfo = { componentStack: "at Component\n  at App" };
  const componentName = "TestComponent";

  const result = captureReactError(originalError, errorInfo, componentName);

  // Check captured error
  assertInstanceOf(result.capturedError, BaseError);
  assertEquals(result.capturedError.code, "REACT_ERROR");
  assertEquals(result.capturedError.statusCode, 500);
  assert(result.capturedError.message.includes("React component error"));
  assert(result.capturedError.message.includes(originalError.message));

  // Check details
  const details = result.capturedError.details as any;
  assertEquals(details.originalError, originalError.name);
  assertEquals(details.originalMessage, originalError.message);
  assertEquals(details.componentStack, "at Component\n  at App");
  assertEquals(details.componentName, componentName);

  // Check error boundary state
  assertEquals(result.errorBoundaryState.hasError, true);
  assertEquals(result.errorBoundaryState.error, originalError);
  assertEquals(result.errorBoundaryState.errorInfo, errorInfo);

  // Check should report
  assert(typeof result.shouldReport === "boolean");
});

Deno.test("React Error Handling - createErrorRecovery", () => {
  let retryCount = 0;
  let resetCalled = false;
  let redirectPath = "";

  const recovery = createErrorRecovery({
    onRetry: () => {
      retryCount++;
    },
    onReset: () => {
      resetCalled = true;
    },
    onRedirect: (path) => {
      redirectPath = path;
    },
    maxRetries: 2,
  });

  // Test retry
  recovery.retry();
  assertEquals(retryCount, 1);

  // Test reset
  recovery.reset();
  assertEquals(resetCalled, true);

  // Test redirect
  recovery.redirect("/error");
  assertEquals(redirectPath, "/error");

  // Test canRetry
  assertEquals(recovery.canRetry(1), true);
  assertEquals(recovery.canRetry(2), false);
  assertEquals(recovery.canRetry(3), false);
});

Deno.test("React Error Handling - createErrorRecovery with async retry", async () => {
  let asyncRetryCount = 0;

  const recovery = createErrorRecovery({
    onRetry: async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      asyncRetryCount++;
    },
  });

  recovery.retry();

  // Wait a bit for async operation
  await new Promise((resolve) => setTimeout(resolve, 20));
  assertEquals(asyncRetryCount, 1);
});

Deno.test("React Error Handling - createErrorReporter", () => {
  let reportedError: any = null;
  let reportedContext: string | undefined;
  let reportedMetadata: Record<string, unknown> | undefined;

  const reporter = createErrorReporter({
    onReport: (error, context, metadata) => {
      reportedError = error;
      reportedContext = context;
      reportedMetadata = metadata;
    },
    includeUserAgent: false,
    includeUrl: false,
    includeTimestamp: true,
  });

  const testError = new Error("Test error");
  reporter(testError, "test context");

  assertInstanceOf(reportedError, BaseError);
  assertEquals(reportedError.code, "REACT_ERROR");
  assertEquals(reportedContext, "test context");
  assert(reportedMetadata?.timestamp !== undefined);
  assertEquals(reportedMetadata?.userAgent, undefined);
  assertEquals(reportedMetadata?.url, undefined);
});

Deno.test("React Error Handling - createErrorState", () => {
  const errorState = createErrorState();

  // Initial state
  assertEquals(errorState.error, null);
  assertEquals(errorState.hasError, false);

  // Set error
  const testError = new Error("Test error");
  errorState.setError(testError);
  assertEquals(errorState.error, testError);
  assertEquals(errorState.hasError, true);

  // Clear error
  errorState.clearError();
  assertEquals(errorState.error, null);
  assertEquals(errorState.hasError, false);

  // Reset error (same as clear)
  errorState.setError(testError);
  errorState.resetError();
  assertEquals(errorState.error, null);
  assertEquals(errorState.hasError, false);
});

Deno.test("React Error Handling - createErrorState with initial error", () => {
  const initialError = new Error("Initial error");
  const errorState = createErrorState(initialError);

  assertEquals(errorState.error, initialError);
  assertEquals(errorState.hasError, true);
});

Deno.test("React Error Handling - createErrorBoundaryConfig", () => {
  let errorHandled = false;

  const config = createErrorBoundaryConfig({
    isolate: true,
    resetKeys: ["key1", "key2"],
    resetOnPropsChange: true,
    fallbackComponent: "CustomFallback",
    onError: (_error) => {
      errorHandled = true;
    },
    enableErrorReporting: true,
  });

  assertEquals(config.isolate, true);
  assertEquals(config.resetKeys, ["key1", "key2"]);
  assertEquals(config.resetOnPropsChange, true);
  assertEquals(config.fallback, "CustomFallback");

  // Test error handler
  const testError = new Error("Test error");
  const testErrorInfo = { componentStack: "at Component" };
  config.onError(testError, testErrorInfo);
  assertEquals(errorHandled, true);
});

Deno.test("React Error Handling - createDefaultErrorFallback", () => {
  const fallbackCreator = createDefaultErrorFallback({
    title: "Custom Error Title",
    showErrorDetails: true,
    showRetryButton: true,
    showErrorId: true,
  });

  const error = new ValidationError("Test validation error", "email");
  const errorInfo = { componentStack: "at Component" };
  const resetError = () => {};
  const errorId = "test-error-123";

  const fallbackComponent = fallbackCreator({
    error,
    errorInfo,
    resetError,
    errorId,
  });

  // Check structure
  assertEquals(fallbackComponent.type, "div");
  assert(fallbackComponent.props.className.includes("bg-red-50"));
  assert(Array.isArray(fallbackComponent.props.children));

  // Check children structure
  const children = fallbackComponent.props.children;
  const title = children.find((child: any) => child?.type === "h3");
  const message = children.find((child: any) =>
    child?.type === "p" && !child?.props?.className?.includes("text-xs")
  );
  const errorIdElement = children.find((child: any) =>
    child?.type === "p" && child?.props?.children?.includes("Error ID:")
  );
  const button = children.find((child: any) => child?.type === "button");

  assertEquals(title?.props?.children, "Custom Error Title");
  assertEquals(
    message?.props?.children,
    "Invalid email: Test validation error",
  );
  assertEquals(errorIdElement?.props?.children, "Error ID: test-error-123");
  assertEquals(button?.props?.children, "Try Again");
  assertEquals(button?.props?.onClick, resetError);
});

Deno.test("React Error Handling - createDefaultErrorFallback with minimal config", () => {
  const fallbackCreator = createDefaultErrorFallback();

  const error = new Error("Simple error");
  const fallbackComponent = fallbackCreator({
    error,
    errorInfo: null,
    resetError: () => {},
    errorId: "simple-error",
  });

  assertEquals(fallbackComponent.type, "div");
  assert(fallbackComponent.props.children.length >= 3); // Title, message, button at minimum
});
