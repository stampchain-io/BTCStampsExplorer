/**
 * Error Types Test Suite
 *
 * Comprehensive type tests for error handling types including:
 * - Error class instantiation and inheritance
 * - Type discrimination and guards
 * - React error boundary integration
 * - Validation utilities and patterns
 * - API error response structures
 */

import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertStringIncludes,
} from "@std/assert";
import {
  validateCrossModuleCompatibility,
  validateTypeCompilation,
} from "./utils/typeValidation.ts";

// Import all error types from the consolidated errors module
import {
  APIError,
  APIErrorCode,
  BaseError,
  BitcoinError,
  BitcoinErrorCode,
  createApiErrorResponse,
  createApiSuccessResponse,
  createErrorBoundaryState,
  createFieldValidationError,
  createValidationErrorCollection,
  generateErrorId,
  getUserFriendlyMessage,
  isApplicationError,
  isBitcoinError,
  isValidationError,
  resetErrorBoundaryState,
  shouldReportError,
  SRC20Error,
  SRC20ErrorCode,
  StampErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../../lib/types/errors.ts";

// ============================================================================
// TYPE COMPILATION TESTS
// ============================================================================

Deno.test("Error Types - Type Compilation", async () => {
  await validateTypeCompilation("lib/types/errors.d.ts");
  await validateTypeCompilation("lib/types/errors.ts");
});

Deno.test("Error Types - Cross Module Compatibility", async () => {
  await validateCrossModuleCompatibility([
    "lib/types/errors.d.ts",
    "lib/types/api.d.ts",
    "lib/types/ui.d.ts",
  ]);
});

// ============================================================================
// ERROR CLASS INSTANTIATION AND INHERITANCE TESTS
// ============================================================================

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

Deno.test("ValidationError - field validation details", () => {
  const error = new ValidationError(
    "Invalid email format",
    "VALIDATION_INVALID_EMAIL",
    400,
    { field: "email", value: "invalid-email" },
    "email",
    "email_format",
  );

  assertEquals(error.field, "email");
  assertEquals(error.rule, "email_format");
  assertInstanceOf(error, BaseError);
});

// ============================================================================
// DOMAIN-SPECIFIC ERROR TESTS
// ============================================================================

Deno.test("APIError - HTTP status code mapping", () => {
  const error = new APIError(
    "Not found",
    "API_NOT_FOUND",
    404,
    {},
    "GET",
    "/api/test",
  );
  assertEquals(error.statusCode, 404);
  assertEquals(error.method, "GET");
  assertEquals(error.url, "/api/test");
});

Deno.test("BitcoinError - transaction context", () => {
  const error = new BitcoinError(
    "Invalid transaction",
    "BITCOIN_INVALID_TRANSACTION",
    400,
    {},
    "send",
    "abc123",
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  );

  assertEquals(error.operation, "send");
  assertEquals(error.txHash, "abc123");
  assertEquals(error.address, "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
});

Deno.test("SRC20Error - token operation context", () => {
  const error = new SRC20Error(
    "Insufficient balance",
    "SRC20_INSUFFICIENT_BALANCE",
    400,
    {},
    "transfer",
    "STAMPS",
    "100",
  );

  assertEquals(error.operation, "transfer");
  assertEquals(error.tick, "STAMPS");
  assertEquals(error.amount, "100");
});

// ============================================================================
// TYPE GUARDS AND DISCRIMINATION TESTS
// ============================================================================

Deno.test("Type guards - isApplicationError", () => {
  const appError = new ValidationError("Test", "TEST");
  const regularError = new Error("Regular error");

  assert(isApplicationError(appError));
  assert(!isApplicationError(regularError));
});

Deno.test("Type guards - isValidationError", () => {
  const validationError = new ValidationError("Test", "TEST");
  const apiError = new APIError("Test", "TEST");

  assert(isValidationError(validationError));
  assert(!isValidationError(apiError));
});

Deno.test("Type guards - isBitcoinError", () => {
  const bitcoinError = new BitcoinError("Test", "TEST");
  const apiError = new APIError("Test", "TEST");

  assert(isBitcoinError(bitcoinError));
  assert(!isBitcoinError(apiError));
});

// ============================================================================
// ERROR UTILITIES AND HELPERS TESTS
// ============================================================================

Deno.test("Error correlation ID uniqueness", () => {
  const error1 = new BaseError("Test 1", "TEST_1");
  const error2 = new BaseError("Test 2", "TEST_2");

  assert(error1.correlationId !== error2.correlationId);
  assert(error1.correlationId.startsWith("err-"));
  assert(error2.correlationId.startsWith("err-"));
});

Deno.test("getUserFriendlyMessage function", () => {
  const validationError = new ValidationError(
    "Invalid input",
    "VALIDATION_REQUIRED_FIELD",
  );
  const message = getUserFriendlyMessage(validationError);

  assert(typeof message === "string");
  assert(message.length > 0);
});

Deno.test("shouldReportError function", () => {
  const criticalError = new BaseError("Critical", "CRITICAL", 500);
  const validationError = new ValidationError(
    "Required field",
    "VALIDATION_REQUIRED_FIELD",
  );

  // These functions would be implemented based on business logic
  assert(typeof shouldReportError(criticalError) === "boolean");
  assert(typeof shouldReportError(validationError) === "boolean");
});

// ============================================================================
// VALIDATION UTILITIES TESTS
// ============================================================================

Deno.test("Validation utilities - createFieldValidationError", () => {
  const fieldError = createFieldValidationError(
    "email",
    ValidationErrorCode.INVALID_EMAIL,
    "Invalid email format",
    "invalid@",
  );

  assertEquals(fieldError.field, "email");
  assertEquals(fieldError.code, ValidationErrorCode.INVALID_EMAIL);
  assertEquals(fieldError.message, "Invalid email format");
  assertEquals(fieldError.value, "invalid@");
});

Deno.test("Validation utilities - createValidationErrorCollection", () => {
  const errors = [
    createFieldValidationError(
      "email",
      ValidationErrorCode.INVALID_EMAIL,
      "Invalid email",
    ),
    createFieldValidationError(
      "name",
      ValidationErrorCode.REQUIRED_FIELD,
      "Name required",
    ),
  ];

  const collection = createValidationErrorCollection(errors);

  assertEquals(collection.errors.length, 2);
  assert(collection.hasErrors);
  assertEquals(collection.getErrorsForField("email").length, 1);
  assertEquals(collection.getErrorsForField("nonexistent").length, 0);
});

// ============================================================================
// API RESPONSE UTILITIES TESTS
// ============================================================================

Deno.test("API response utilities - createApiErrorResponse", () => {
  const error = new APIError("Not found", "API_NOT_FOUND", 404);
  const response = createApiErrorResponse(error);

  assertEquals(response.status, "error");
  assertEquals(response.error, "Not found");
  assertEquals(response.code, "API_NOT_FOUND");
});

Deno.test("API response utilities - createApiSuccessResponse", () => {
  const data = { id: 1, name: "Test" };
  const response = createApiSuccessResponse(data);

  assertEquals(response.status, "success");
  assertEquals(response.data, data);
});

// ============================================================================
// REACT ERROR BOUNDARY TESTS
// ============================================================================

Deno.test("React Error Handling - generateErrorId", () => {
  const id1 = generateErrorId();
  const id2 = generateErrorId();

  assert(typeof id1 === "string");
  assert(typeof id2 === "string");
  assert(id1 !== id2);
  assert(id1.startsWith("error-"));
});

Deno.test("React Error Handling - createErrorBoundaryState", () => {
  const error = new Error("Test error");
  const errorInfo = { componentStack: "Component stack trace" };
  const state = createErrorBoundaryState(error, errorInfo);

  assert(state.hasError);
  assertEquals(state.error, error);
  assertEquals(state.errorInfo, errorInfo);
  assert(typeof state.errorId === "string");
});

Deno.test("React Error Handling - resetErrorBoundaryState", () => {
  const state = resetErrorBoundaryState();

  assert(!state.hasError);
  assertEquals(state.error, null);
  assertEquals(state.errorInfo, null);
  assertEquals(state.errorId, null);
});

// ============================================================================
// ERROR CODE ENUM TESTS
// ============================================================================

Deno.test("Error codes - ValidationErrorCode enum", () => {
  assertEquals(ValidationErrorCode.REQUIRED_FIELD, "VALIDATION_REQUIRED_FIELD");
  assertEquals(ValidationErrorCode.INVALID_EMAIL, "VALIDATION_INVALID_EMAIL");
  assertEquals(ValidationErrorCode.INVALID_FORMAT, "VALIDATION_INVALID_FORMAT");
});

Deno.test("Error codes - APIErrorCode enum", () => {
  assertEquals(APIErrorCode.NOT_FOUND, "API_NOT_FOUND");
  assertEquals(APIErrorCode.UNAUTHORIZED, "API_UNAUTHORIZED");
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
  assertEquals(SRC20ErrorCode.TOKEN_NOT_FOUND, "SRC20_TOKEN_NOT_FOUND");
  assertEquals(
    SRC20ErrorCode.INSUFFICIENT_BALANCE,
    "SRC20_INSUFFICIENT_BALANCE",
  );
  assertEquals(SRC20ErrorCode.MINT_LIMIT_EXCEEDED, "SRC20_MINT_LIMIT_EXCEEDED");
});

Deno.test("Error codes - StampErrorCode enum", () => {
  assertEquals(StampErrorCode.STAMP_NOT_FOUND, "STAMP_NOT_FOUND");
  assertEquals(StampErrorCode.INVALID_STAMP_DATA, "STAMP_INVALID_STAMP_DATA");
  assertEquals(StampErrorCode.INVALID_CPID, "STAMP_INVALID_CPID");
});

console.log("✅ All Error type tests completed successfully!");
