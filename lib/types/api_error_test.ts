/**
 * Tests for standardized API error response types
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  ApiErrorCode,
  HttpStatusCodes,
  HttpStatusToErrorCode,
} from "./api_constants.ts";
import type {
  ApiErrorResponse,
  AuthenticationErrorResponse,
  BaseErrorResponse,
  BlockchainErrorResponse,
  ErrorHandlerContext,
  FieldError,
  HttpStatusCode,
  RateLimitErrorResponse,
  ResourceErrorResponse,
  ValidationErrorResponse,
} from "./api.d.ts";

Deno.test("HttpStatusCodes - contains all standard codes", () => {
  // Test 2xx codes
  assertEquals(HttpStatusCodes.OK, 200);
  assertEquals(HttpStatusCodes.CREATED, 201);
  assertEquals(HttpStatusCodes.NO_CONTENT, 204);

  // Test 4xx codes
  assertEquals(HttpStatusCodes.BAD_REQUEST, 400);
  assertEquals(HttpStatusCodes.UNAUTHORIZED, 401);
  assertEquals(HttpStatusCodes.FORBIDDEN, 403);
  assertEquals(HttpStatusCodes.NOT_FOUND, 404);
  assertEquals(HttpStatusCodes.UNPROCESSABLE_ENTITY, 422);
  assertEquals(HttpStatusCodes.TOO_MANY_REQUESTS, 429);

  // Test 5xx codes
  assertEquals(HttpStatusCodes.INTERNAL_SERVER_ERROR, 500);
  assertEquals(HttpStatusCodes.SERVICE_UNAVAILABLE, 503);
});

Deno.test("ApiErrorCode - contains all error categories", () => {
  // General errors
  assertExists(ApiErrorCode.UNKNOWN_ERROR);
  assertExists(ApiErrorCode.INTERNAL_ERROR);
  assertExists(ApiErrorCode.SERVICE_UNAVAILABLE);

  // Request errors
  assertExists(ApiErrorCode.INVALID_REQUEST);
  assertExists(ApiErrorCode.MISSING_PARAMETER);
  assertExists(ApiErrorCode.INVALID_PARAMETER);

  // Auth errors
  assertExists(ApiErrorCode.AUTHENTICATION_REQUIRED);
  assertExists(ApiErrorCode.INVALID_CREDENTIALS);
  assertExists(ApiErrorCode.INSUFFICIENT_PERMISSIONS);

  // Resource errors
  assertExists(ApiErrorCode.RESOURCE_NOT_FOUND);
  assertExists(ApiErrorCode.RESOURCE_CONFLICT);

  // Bitcoin/Stamp specific
  assertExists(ApiErrorCode.INVALID_ADDRESS);
  assertExists(ApiErrorCode.INVALID_STAMP);
  assertExists(ApiErrorCode.INVALID_TICK);
});

Deno.test("BaseErrorResponse - structure validation", () => {
  const baseError: BaseErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: "An internal error occurred",
      timestamp: new Date().toISOString(),
      path: "/api/stamps/123",
      method: "GET",
      correlationId: "req-123-456",
    },
  };

  assertEquals(baseError.success, false);
  assertEquals(baseError.error.code, ApiErrorCode.INTERNAL_ERROR);
  assertExists(baseError.error.message);
  assertExists(baseError.error.timestamp);
});

Deno.test("ValidationErrorResponse - field error details", () => {
  const fieldError: FieldError = {
    field: "amount",
    code: "INVALID_RANGE",
    message: "Amount must be between 1 and 1000",
    value: 5000,
    constraints: {
      min: 1,
      max: 1000,
    },
  };

  const validationError: ValidationErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.VALIDATION_FAILED,
      message: "Validation failed",
      timestamp: new Date().toISOString(),
      fieldErrors: [fieldError],
    },
  };

  assertEquals(validationError.error.code, ApiErrorCode.VALIDATION_FAILED);
  assertEquals(validationError.error.fieldErrors?.length, 1);
  assertEquals(validationError.error.fieldErrors?.[0].field, "amount");
});

Deno.test("RateLimitErrorResponse - retry information", () => {
  const rateLimitError: RateLimitErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Rate limit exceeded",
      timestamp: new Date().toISOString(),
      retryAfter: 60,
      limit: 100,
      remaining: 0,
      reset: new Date(Date.now() + 60000).toISOString(),
    },
  };

  assertEquals(rateLimitError.error.code, ApiErrorCode.RATE_LIMIT_EXCEEDED);
  assertEquals(rateLimitError.error.retryAfter, 60);
  assertEquals(rateLimitError.error.limit, 100);
  assertEquals(rateLimitError.error.remaining, 0);
});

Deno.test("AuthenticationErrorResponse - auth details", () => {
  const authError: AuthenticationErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.AUTHENTICATION_REQUIRED,
      message: "Authentication required",
      timestamp: new Date().toISOString(),
      realm: "BTCStampsExplorer API",
      authenticationScheme: "Bearer",
    },
  };

  assertEquals(authError.error.code, ApiErrorCode.AUTHENTICATION_REQUIRED);
  assertEquals(authError.error.realm, "BTCStampsExplorer API");
  assertEquals(authError.error.authenticationScheme, "Bearer");
});

Deno.test("ResourceErrorResponse - resource details", () => {
  const resourceError: ResourceErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.RESOURCE_NOT_FOUND,
      message: "Stamp not found",
      timestamp: new Date().toISOString(),
      resourceType: "stamp",
      resourceId: "12345",
    },
  };

  assertEquals(resourceError.error.code, ApiErrorCode.RESOURCE_NOT_FOUND);
  assertEquals(resourceError.error.resourceType, "stamp");
  assertEquals(resourceError.error.resourceId, "12345");
});

Deno.test("BlockchainErrorResponse - blockchain details", () => {
  const blockchainError: BlockchainErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.INSUFFICIENT_FUNDS,
      message: "Insufficient funds for transaction",
      timestamp: new Date().toISOString(),
      address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      requiredAmount: 50000,
      availableAmount: 30000,
    },
  };

  assertEquals(blockchainError.error.code, ApiErrorCode.INSUFFICIENT_FUNDS);
  assertEquals(blockchainError.error.requiredAmount, 50000);
  assertEquals(blockchainError.error.availableAmount, 30000);
  assertExists(blockchainError.error.address);
});

Deno.test("ErrorHandlerContext - complete context", () => {
  const context: ErrorHandlerContext = {
    request: {
      method: "POST",
      path: "/api/stamps",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer token123",
      },
      query: {
        limit: 10,
        offset: 0,
      },
      body: {
        cpid: "A123456789",
      },
    },
    response: {
      statusCode: 400 as HttpStatusCode,
      headers: {
        "content-type": "application/json",
      },
    },
    error: new Error("Invalid CPID format"),
  };

  assertEquals(context.request.method, "POST");
  assertEquals(context.request.path, "/api/stamps");
  assertEquals(context.response.statusCode, 400);
  assertExists(context.error);
});

Deno.test("ApiErrorResponse - discriminated union", () => {
  // Test that different error types can be assigned to ApiErrorResponse
  const errors: ApiErrorResponse[] = [
    // Base error
    {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: "Internal error",
        timestamp: new Date().toISOString(),
      },
    },
    // Validation error
    {
      success: false,
      error: {
        code: ApiErrorCode.VALIDATION_FAILED,
        message: "Validation failed",
        timestamp: new Date().toISOString(),
        fieldErrors: [
          {
            field: "stamp",
            code: "REQUIRED",
            message: "Stamp is required",
          },
        ],
      },
    },
    // Rate limit error
    {
      success: false,
      error: {
        code: ApiErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded",
        timestamp: new Date().toISOString(),
        retryAfter: 60,
      },
    },
  ];

  assertEquals(errors.length, 3);
  assertEquals(errors[0].error.code, ApiErrorCode.INTERNAL_ERROR);
  assertEquals(errors[1].error.code, ApiErrorCode.VALIDATION_FAILED);
  assertEquals(errors[2].error.code, ApiErrorCode.RATE_LIMIT_EXCEEDED);
});

Deno.test("HttpStatusToErrorCode mapping", () => {
  // Test the actual mapping values
  assertEquals(HttpStatusToErrorCode[400], ApiErrorCode.INVALID_REQUEST);
  assertEquals(
    HttpStatusToErrorCode[401],
    ApiErrorCode.AUTHENTICATION_REQUIRED,
  );
  assertEquals(
    HttpStatusToErrorCode[403],
    ApiErrorCode.INSUFFICIENT_PERMISSIONS,
  );
  assertEquals(HttpStatusToErrorCode[404], ApiErrorCode.RESOURCE_NOT_FOUND);
  assertEquals(HttpStatusToErrorCode[409], ApiErrorCode.RESOURCE_CONFLICT);
  assertEquals(HttpStatusToErrorCode[422], ApiErrorCode.VALIDATION_FAILED);
  assertEquals(HttpStatusToErrorCode[429], ApiErrorCode.RATE_LIMIT_EXCEEDED);
  assertEquals(HttpStatusToErrorCode[500], ApiErrorCode.INTERNAL_ERROR);
  assertEquals(HttpStatusToErrorCode[503], ApiErrorCode.SERVICE_UNAVAILABLE);
});
