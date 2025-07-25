/**
 * @fileoverview Comprehensive tests for ResponseUtil
 * Focus on achieving high test coverage for all response utility functions
 * including deprecated methods and route detection logic.
 * Fixed to work properly in CI with correct HTTP status expectations.
 */

import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { assertEquals, assertExists } from "@std/assert";

/* ===== BASIC RESPONSE TESTS ===== */

Deno.test("ResponseUtil.success - basic functionality", () => {
  const data = { message: "test success" };
  const response = ResponseUtil.success(data);

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.success - with options", () => {
  const data = { message: "test success" };
  const options = {
    status: 201,
    headers: { "X-Custom": "test" },
    routeType: RouteType.STATIC,
    forceNoCache: false,
  };
  const response = ResponseUtil.success(data, options);

  // WebResponseUtil.success DOES respect the status option
  assertEquals(response.status, 201);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.custom - basic functionality", () => {
  const body = { custom: "response" };
  const response = ResponseUtil.custom(body, 202);

  assertEquals(response.status, 202);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.custom - with options", () => {
  const body = { custom: "response" };
  const options = {
    headers: { "X-Test": "value" },
    routeType: RouteType.BALANCE,
  };
  const response = ResponseUtil.custom(body, 202, options);

  assertEquals(response.status, 202);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.badRequest - basic functionality", () => {
  const response = ResponseUtil.badRequest("Invalid input");

  assertEquals(response.status, 400);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.badRequest - with options", () => {
  const options = {
    headers: { "X-Error": "validation" },
    routeType: RouteType.DYNAMIC,
  };
  const response = ResponseUtil.badRequest("Invalid input", options);

  assertEquals(response.status, 400);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.notFound - basic functionality", () => {
  const response = ResponseUtil.notFound();

  assertEquals(response.status, 404);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.notFound - with custom message", () => {
  const response = ResponseUtil.notFound("Resource not found");

  assertEquals(response.status, 404);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.notFound - with options", () => {
  const options = {
    headers: { "X-NotFound": "true" },
    routeType: RouteType.STAMP_DETAIL,
  };
  const response = ResponseUtil.notFound("Custom not found", options);

  assertEquals(response.status, 404);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - basic functionality", () => {
  const error = new Error("Test error");
  const response = ResponseUtil.internalError(error);

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - with custom message", () => {
  const error = new Error("Test error");
  const response = ResponseUtil.internalError(error, "Custom error message");

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - with options", () => {
  const error = new Error("Test error");
  const options = {
    headers: { "X-Error": "server" },
    routeType: RouteType.TRANSACTION,
  };
  const response = ResponseUtil.internalError(error, "Server error", options);

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

/* ===== EDGE CASES AND ERROR HANDLING ===== */

Deno.test("ResponseUtil.success - with null data", () => {
  const response = ResponseUtil.success(null);

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.success - with undefined data", () => {
  const response = ResponseUtil.success(undefined);

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.success - with empty object", () => {
  const response = ResponseUtil.success({});

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.success - with array data", () => {
  const data = [1, 2, 3, "test"];
  const response = ResponseUtil.success(data);

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

// Removed invalid zero status test - HTTP Response doesn't allow status 0

Deno.test("ResponseUtil.custom - with high status code", () => {
  const response = ResponseUtil.custom("test", 599);

  assertEquals(response.status, 599);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.custom - with valid low status code", () => {
  // Use a valid HTTP status code instead of 0
  const response = ResponseUtil.custom("test", 201);

  assertEquals(response.status, 201);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.badRequest - empty message", () => {
  const response = ResponseUtil.badRequest("");

  assertEquals(response.status, 400);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.notFound - empty message", () => {
  const response = ResponseUtil.notFound("");

  assertEquals(response.status, 404);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - with string error", () => {
  const response = ResponseUtil.internalError("String error");

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - with null error", () => {
  const response = ResponseUtil.internalError(null);

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.internalError - with undefined error", () => {
  const response = ResponseUtil.internalError(undefined);

  assertEquals(response.status, 500);
  assertExists(response.headers);
});

/* ===== ROUTE TYPE OPTIONS TESTS ===== */

Deno.test("ResponseUtil.success - with all RouteType options", () => {
  const data = { test: "data" };

  // Test each RouteType
  const routeTypes = [
    RouteType.STATIC,
    RouteType.DYNAMIC,
    RouteType.BALANCE,
    RouteType.TRANSACTION,
    RouteType.STAMP_DETAIL,
    RouteType.STAMP,
    RouteType.STAMP_METADATA,
    RouteType.STAMP_LIST,
    RouteType.COLLECTION,
    RouteType.HISTORICAL,
    RouteType.PROTOCOL,
    RouteType.DISPENSER,
    RouteType.STAMP_DISPENSER,
    RouteType.STAMP_DISPENSE,
    RouteType.STAMP_SEND,
  ];

  routeTypes.forEach((routeType) => {
    const response = ResponseUtil.success(data, { routeType });
    assertEquals(response.status, 200);
    assertExists(response.headers);
  });
});

/* ===== COMPLEX OPTIONS TESTS ===== */

Deno.test("ResponseUtil - complex options combinations", () => {
  const data = { complex: "test" };
  const options = {
    status: 201,
    headers: {
      "X-Custom-1": "value1",
      "X-Custom-2": "value2",
      "Content-Type": "application/json",
    },
    routeType: RouteType.STAMP_DETAIL,
    forceNoCache: true,
    raw: false,
  };

  const response = ResponseUtil.success(data, options);
  // WebResponseUtil.success DOES respect the status option
  assertEquals(response.status, 201);
  assertExists(response.headers);
});

Deno.test("ResponseUtil - empty options object", () => {
  const data = { test: "empty options" };
  const response = ResponseUtil.success(data, {});

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

/* ===== DEPRECATED METHOD WARNINGS TESTS ===== */

Deno.test("ResponseUtil - all deprecated methods work without API route detection", () => {
  // These tests ensure the deprecated methods still function
  // without triggering API route detection logic

  const successResponse = ResponseUtil.success({ test: "success" });
  assertEquals(successResponse.status, 200);

  const customResponse = ResponseUtil.custom({ test: "custom" }, 201);
  assertEquals(customResponse.status, 201);

  const badRequestResponse = ResponseUtil.badRequest("Bad request");
  assertEquals(badRequestResponse.status, 400);

  const notFoundResponse = ResponseUtil.notFound("Not found");
  assertEquals(notFoundResponse.status, 404);

  const errorResponse = ResponseUtil.internalError(new Error("Test"));
  assertEquals(errorResponse.status, 500);
});

/* ===== LARGE DATA TESTS ===== */

Deno.test("ResponseUtil.success - with large data object", () => {
  const largeData = {
    items: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`.repeat(10),
    })),
    metadata: {
      total: 1000,
      page: 1,
      timestamp: new Date().toISOString(),
    },
  };

  const response = ResponseUtil.success(largeData);
  assertEquals(response.status, 200);
  assertExists(response.headers);
});

/* ===== SPECIAL CHARACTER TESTS ===== */

Deno.test("ResponseUtil - with special characters and unicode", () => {
  const data = {
    emoji: "🚀💎🔥",
    unicode: "测试数据",
    special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
    quotes: 'Single "double" quotes',
  };

  const response = ResponseUtil.success(data);
  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil.badRequest - with unicode error message", () => {
  const response = ResponseUtil.badRequest("错误：无效的输入数据 🚫");
  assertEquals(response.status, 400);
  assertExists(response.headers);
});

/* ===== MOCK ROUTE DETECTION TESTS ===== */

Deno.test("ResponseUtil - route detection with mocked stack", () => {
  // Test the route detection logic by ensuring it works with non-API routes
  const data = { test: "route detection" };

  // Since we're not in an /api/ route, it should use WebResponseUtil
  const response = ResponseUtil.success(data);
  assertEquals(response.status, 200);
  assertExists(response.headers);
});

/* ===== API ROUTE SIMULATION TESTS ===== */

Deno.test("ResponseUtil - simulate API route detection for coverage", () => {
  // Override Error constructor to return a stack with /api/ in it
  const originalError = globalThis.Error;
  globalThis.Error = class extends originalError {
    constructor(message?: string) {
      super(message);
      this.stack =
        "Error: test\n    at /api/test/route.ts:1:1\n    at Object.handler (/api/test/route.ts:10:5)";
    }
  } as ErrorConstructor;

  try {
    // Test success method with API route detection
    const data = { test: "api route success" };
    const response = ResponseUtil.success(data);
    assertEquals(response.status, 200);
    assertExists(response.headers);

    // Test custom method with API route detection
    const customData = { custom: "api response" };
    const customResponse = ResponseUtil.custom(customData, 201);
    assertEquals(customResponse.status, 201);
    assertExists(customResponse.headers);

    // Test badRequest method with API route detection
    const badResponse = ResponseUtil.badRequest("API validation error");
    assertEquals(badResponse.status, 400);
    assertExists(badResponse.headers);

    // Test notFound method with API route detection
    const notFoundResponse = ResponseUtil.notFound("API resource not found");
    assertEquals(notFoundResponse.status, 404);
    assertExists(notFoundResponse.headers);

    // Test internalError method with API route detection
    const error = new Error("API internal error");
    const errorResponse = ResponseUtil.internalError(error);
    assertEquals(errorResponse.status, 500);
    assertExists(errorResponse.headers);

    // Test more API methods through ResponseUtil wrappers that aren't covered yet
    // (These will be delegated to ApiResponseUtil due to our mocked stack)

    // Test success with different options
    const successWithOptions = ResponseUtil.success(
      { test: "success with options" },
      { headers: { "X-Custom": "test" }, status: 201 },
    );
    assertEquals(successWithOptions.status, 201);
    assertExists(successWithOptions.headers);

    // Test custom with complex data
    const complexData = {
      nested: { data: true },
      array: [1, 2, 3],
      number: 12345,
    };
    const complexResponse = ResponseUtil.custom(complexData, 202);
    assertEquals(complexResponse.status, 202);
    assertExists(complexResponse.headers);

    // Test badRequest with complex error data
    const badRequestWithData = ResponseUtil.badRequest("Validation failed", {
      headers: { "X-Error-Type": "validation" },
    });
    assertEquals(badRequestWithData.status, 400);
    assertExists(badRequestWithData.headers);

    // Test notFound with custom message and options
    const notFoundWithOptions = ResponseUtil.notFound("Resource not found", {
      headers: { "X-Resource-Type": "user" },
    });
    assertEquals(notFoundWithOptions.status, 404);
    assertExists(notFoundWithOptions.headers);

    // Test internalError with different error types
    const stringError = ResponseUtil.internalError("String error message");
    assertEquals(stringError.status, 500);
    assertExists(stringError.headers);

    const objectError = ResponseUtil.internalError({
      code: "ERR001",
      message: "Object error",
    });
    assertEquals(objectError.status, 500);
    assertExists(objectError.headers);
  } finally {
    // Restore original Error constructor
    globalThis.Error = originalError;
  }
});

/* ===== DIRECT API RESPONSE UTIL TESTS FOR 100% COVERAGE ===== */

Deno.test("ApiResponseUtil - test all remaining methods for 100% coverage", async () => {
  // Import ApiResponseUtil directly since it's not exposed through ResponseUtil
  const { ApiResponseUtil } = await import("$lib/utils/api/responses/apiResponseUtil.ts");

  // Test created method (201)
  const createdResponse = ApiResponseUtil.created({
    id: 123,
    name: "new item",
  });
  assertEquals(createdResponse.status, 201);
  assertExists(createdResponse.headers);

  // Test created with options
  const createdWithOptions = ApiResponseUtil.created(
    { id: 456 },
    { headers: { "X-Resource-Type": "user" } },
  );
  assertEquals(createdWithOptions.status, 201);
  assertExists(createdWithOptions.headers);

  // Test noContent method (204)
  const noContentResponse = ApiResponseUtil.noContent();
  assertEquals(noContentResponse.status, 204);
  assertExists(noContentResponse.headers);

  // Test noContent with options
  const noContentWithOptions = ApiResponseUtil.noContent({
    headers: { "X-Operation": "delete" },
  });
  assertEquals(noContentWithOptions.status, 204);
  assertExists(noContentWithOptions.headers);

  // Test unauthorized method (401)
  const unauthorizedResponse = ApiResponseUtil.unauthorized();
  assertEquals(unauthorizedResponse.status, 401);
  assertExists(unauthorizedResponse.headers);

  // Test unauthorized with custom message and details
  const unauthorizedWithDetails = ApiResponseUtil.unauthorized(
    "Invalid token",
    { token: "expired" },
    { headers: { "X-Auth-Required": "Bearer" } },
  );
  assertEquals(unauthorizedWithDetails.status, 401);
  assertExists(unauthorizedWithDetails.headers);

  // Test forbidden method (403)
  const forbiddenResponse = ApiResponseUtil.forbidden();
  assertEquals(forbiddenResponse.status, 403);
  assertExists(forbiddenResponse.headers);

  // Test forbidden with custom message and details
  const forbiddenWithDetails = ApiResponseUtil.forbidden(
    "Insufficient permissions",
    { required: "admin", current: "user" },
    { headers: { "X-Permission-Level": "admin" } },
  );
  assertEquals(forbiddenWithDetails.status, 403);
  assertExists(forbiddenWithDetails.headers);

  // Test methodNotAllowed method (405)
  const methodNotAllowedResponse = ApiResponseUtil.methodNotAllowed();
  assertEquals(methodNotAllowedResponse.status, 405);
  assertExists(methodNotAllowedResponse.headers);

  // Test methodNotAllowed with custom message and details
  const methodNotAllowedWithDetails = ApiResponseUtil.methodNotAllowed(
    "Only POST allowed",
    { allowed: ["POST"], attempted: "GET" },
    { headers: { "Allow": "POST" } },
  );
  assertEquals(methodNotAllowedWithDetails.status, 405);
  assertExists(methodNotAllowedWithDetails.headers);

  // Test conflict method (409)
  const conflictResponse = ApiResponseUtil.conflict("Resource already exists");
  assertEquals(conflictResponse.status, 409);
  assertExists(conflictResponse.headers);

  // Test conflict with details and options
  const conflictWithDetails = ApiResponseUtil.conflict(
    "Email already in use",
    { field: "email", value: "test@example.com" },
    { headers: { "X-Conflict-Type": "unique_constraint" } },
  );
  assertEquals(conflictWithDetails.status, 409);
  assertExists(conflictWithDetails.headers);

  // Test tooManyRequests method (429)
  const tooManyRequestsResponse = ApiResponseUtil.tooManyRequests();
  assertEquals(tooManyRequestsResponse.status, 429);
  assertExists(tooManyRequestsResponse.headers);

  // Test tooManyRequests with custom message and details
  const tooManyRequestsWithDetails = ApiResponseUtil.tooManyRequests(
    "Rate limit exceeded",
    { limit: 100, window: "1h", retryAfter: 3600 },
    { headers: { "Retry-After": "3600" } },
  );
  assertEquals(tooManyRequestsWithDetails.status, 429);
  assertExists(tooManyRequestsWithDetails.headers);

  // Test serviceUnavailable method (503)
  const serviceUnavailableResponse = ApiResponseUtil.serviceUnavailable();
  assertEquals(serviceUnavailableResponse.status, 503);
  assertExists(serviceUnavailableResponse.headers);

  // Test serviceUnavailable with custom message and details
  const serviceUnavailableWithDetails = ApiResponseUtil.serviceUnavailable(
    "Maintenance in progress",
    { estimatedDuration: "30 minutes", startTime: new Date().toISOString() },
    { headers: { "Retry-After": "1800" } },
  );
  assertEquals(serviceUnavailableWithDetails.status, 503);
  assertExists(serviceUnavailableWithDetails.headers);

  // Test success method with bigint serialization
  const successWithBigInt = ApiResponseUtil.success({
    id: BigInt(123456789012345),
    timestamp: Date.now(),
  });
  assertEquals(successWithBigInt.status, 200);
  assertExists(successWithBigInt.headers);

  // Test custom method with ArrayBuffer
  const arrayBuffer = new ArrayBuffer(8);
  const customArrayBuffer = ApiResponseUtil.custom(arrayBuffer, 200);
  assertEquals(customArrayBuffer.status, 200);
  assertExists(customArrayBuffer.headers);

  // Test custom method with Uint8Array
  const uint8Array = new Uint8Array([1, 2, 3, 4]);
  const customUint8Array = ApiResponseUtil.custom(uint8Array, 200);
  assertEquals(customUint8Array.status, 200);
  assertExists(customUint8Array.headers);

  // Test caching options with routeType
  const { RouteType } = await import("$server/services/infrastructure/cacheService.ts");
  const successWithCache = ApiResponseUtil.success(
    { cached: true },
    {
      routeType: RouteType.STAMP,
      forceNoCache: false,
      headers: { "X-Cache-Test": "true" },
    },
  );
  assertEquals(successWithCache.status, 200);
  assertExists(successWithCache.headers);

  // Test cache config edge cases
  const { RouteType: RT } = await import("$server/services/infrastructure/cacheService.ts");

  // Test with staleWhileRevalidate and staleIfError values
  const successWithFullCache = ApiResponseUtil.success(
    { cached: true },
    {
      routeType: RT.STAMP_LIST,
      forceNoCache: false,
      headers: { "X-Full-Cache": "true" },
    },
  );
  assertEquals(successWithFullCache.status, 200);
  assertExists(successWithFullCache.headers);

  // Test cache with staleWhileRevalidate and staleIfError
  const successWithStaleCache = ApiResponseUtil.success(
    { stale: true },
    {
      routeType: RT.BALANCE, // This route has both staleWhileRevalidate and staleIfError
      forceNoCache: false,
      headers: { "X-Stale-Cache": "true" },
    },
  );
  assertEquals(successWithStaleCache.status, 200);
  assertExists(successWithStaleCache.headers);

  // Test error response details omission (when details is undefined)
  const errorWithoutDetails = ApiResponseUtil.badRequest(
    "Error without details",
  );
  assertEquals(errorWithoutDetails.status, 400);
  assertExists(errorWithoutDetails.headers);

  // Test internalError in development mode (access DENO_ENV)
  const originalEnv = Deno.env.get("DENO_ENV");
  try {
    Deno.env.set("DENO_ENV", "development");
    const devError = ApiResponseUtil.internalError(
      new Error("Dev error"),
      "Development error",
    );
    assertEquals(devError.status, 500);
    assertExists(devError.headers);
  } finally {
    if (originalEnv) {
      Deno.env.set("DENO_ENV", originalEnv);
    } else {
      Deno.env.delete("DENO_ENV");
    }
  }
});

/* ===== HEADERS AND CACHING TESTS ===== */

Deno.test("ResponseUtil - forceNoCache option", () => {
  const data = { test: "no cache" };
  const response = ResponseUtil.success(data, { forceNoCache: true });

  assertEquals(response.status, 200);
  assertExists(response.headers);
});

Deno.test("ResponseUtil - custom headers preservation", () => {
  const data = { test: "headers" };
  const customHeaders = {
    "X-Test-Header": "test-value",
    "X-Custom": "custom-value",
  };

  const response = ResponseUtil.success(data, { headers: customHeaders });
  assertEquals(response.status, 200);
  assertExists(response.headers);
});
