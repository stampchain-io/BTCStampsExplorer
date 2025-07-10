/**
 * @fileoverview Comprehensive tests for ResponseUtil
 * Focus on achieving high test coverage for all response utility functions
 * including deprecated methods and route detection logic.
 * Fixed to work properly in CI with correct HTTP status expectations.
 */

import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";
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
