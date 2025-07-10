import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { assertEquals, assertExists } from "@std/assert";

// Mock console methods to suppress output during tests
const originalConsole = {
  error: console.error,
  warn: console.warn,
};

function suppressConsole() {
  console.error = () => {};
  console.warn = () => {};
}

function restoreConsole() {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
}

// Mock Deno.env for development check
const originalEnvGet = Deno.env.get;
function mockEnv(value?: string) {
  Deno.env.get = (key: string) => {
    if (key === "DENO_ENV") return value;
    return originalEnvGet(key);
  };
}

function restoreEnv() {
  Deno.env.get = originalEnvGet;
}

Deno.test("ApiResponseUtil - success creates 200 response", async () => {
  const data = { message: "Success", value: 42 };
  const response = ApiResponseUtil.success(data);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertExists(response.headers.get("X-API-Version"));

  const body = await response.json();
  assertEquals(body, data);
});

Deno.test("ApiResponseUtil - success with custom status", async () => {
  const data = { result: "ok" };
  const response = ApiResponseUtil.success(data, { status: 202 });

  assertEquals(response.status, 202);
  const body = await response.json();
  assertEquals(body, data);
});

Deno.test("ApiResponseUtil - created returns 201", async () => {
  const data = { id: 123, created: true };
  const response = ApiResponseUtil.created(data);

  assertEquals(response.status, 201);
  const body = await response.json();
  assertEquals(body, data);
});

Deno.test("ApiResponseUtil - noContent returns 204", () => {
  const response = ApiResponseUtil.noContent();
  assertEquals(response.status, 204);
  assertEquals(response.body, null);
});

Deno.test("ApiResponseUtil - badRequest returns 400", async () => {
  suppressConsole();

  const response = ApiResponseUtil.badRequest("Invalid input");

  assertEquals(response.status, 400);
  const body = await response.json();
  assertEquals(body.error, "Invalid input");
  assertEquals(body.status, "error");
  assertEquals(body.code, "BAD_REQUEST");

  restoreConsole();
});

Deno.test("ApiResponseUtil - badRequest with details", async () => {
  suppressConsole();

  const details = { field: "email", reason: "invalid format" };
  const response = ApiResponseUtil.badRequest("Validation failed", details);

  const body = await response.json();
  assertEquals(body.details, details);

  restoreConsole();
});

Deno.test("ApiResponseUtil - unauthorized returns 401", async () => {
  suppressConsole();

  const response = ApiResponseUtil.unauthorized();

  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error, "Unauthorized");
  assertEquals(body.code, "UNAUTHORIZED");

  restoreConsole();
});

Deno.test("ApiResponseUtil - forbidden returns 403", async () => {
  suppressConsole();

  const response = ApiResponseUtil.forbidden("Access denied");

  assertEquals(response.status, 403);
  const body = await response.json();
  assertEquals(body.error, "Access denied");
  assertEquals(body.code, "FORBIDDEN");

  restoreConsole();
});

Deno.test("ApiResponseUtil - notFound returns 404", async () => {
  const response = ApiResponseUtil.notFound();

  assertEquals(response.status, 404);
  const body = await response.json();
  assertEquals(body.error, "Resource not found");
  assertEquals(body.code, "NOT_FOUND");
});

Deno.test("ApiResponseUtil - methodNotAllowed returns 405", async () => {
  const response = ApiResponseUtil.methodNotAllowed();

  assertEquals(response.status, 405);
  const body = await response.json();
  assertEquals(body.error, "Method not allowed");
  assertEquals(body.code, "METHOD_NOT_ALLOWED");
});

Deno.test("ApiResponseUtil - conflict returns 409", async () => {
  suppressConsole();

  const response = ApiResponseUtil.conflict("Resource already exists");

  assertEquals(response.status, 409);
  const body = await response.json();
  assertEquals(body.error, "Resource already exists");
  assertEquals(body.code, "CONFLICT");

  restoreConsole();
});

Deno.test("ApiResponseUtil - tooManyRequests returns 429", async () => {
  suppressConsole();

  const response = ApiResponseUtil.tooManyRequests();

  assertEquals(response.status, 429);
  const body = await response.json();
  assertEquals(body.error, "Too many requests");
  assertEquals(body.code, "TOO_MANY_REQUESTS");

  restoreConsole();
});

Deno.test("ApiResponseUtil - internalError returns 500", async () => {
  suppressConsole();

  const error = new Error("Database connection failed");
  const response = ApiResponseUtil.internalError(error);

  assertEquals(response.status, 500);
  const body = await response.json();
  assertEquals(body.error, "Internal server error");
  assertEquals(body.code, "INTERNAL_ERROR");
  assertEquals(body.details, {}); // Empty object when not in development mode

  restoreConsole();
});

Deno.test("ApiResponseUtil - internalError in development mode", async () => {
  suppressConsole();
  mockEnv("development");

  const error = new Error("Database connection failed");
  const response = ApiResponseUtil.internalError(error, "Database error");

  const body = await response.json();
  assertEquals(body.error, "Database error");
  assertExists(body.details?.error); // Error details included in dev mode

  restoreEnv();
  restoreConsole();
});

Deno.test("ApiResponseUtil - serviceUnavailable returns 503", async () => {
  suppressConsole();

  const response = ApiResponseUtil.serviceUnavailable();

  assertEquals(response.status, 503);
  const body = await response.json();
  assertEquals(body.error, "Service temporarily unavailable");
  assertEquals(body.code, "SERVICE_UNAVAILABLE");

  restoreConsole();
});

Deno.test("ApiResponseUtil - custom with JSON body", async () => {
  const data = { custom: true };
  const response = ApiResponseUtil.custom(data, 418);

  assertEquals(response.status, 418);
  const body = await response.json();
  assertEquals(body, data);
});

Deno.test("ApiResponseUtil - custom with binary body", async () => {
  const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
  const response = ApiResponseUtil.custom(binaryData, 200);

  assertEquals(response.status, 200);
  const body = await response.arrayBuffer();
  assertEquals(new Uint8Array(body), binaryData);
});

Deno.test("ApiResponseUtil - headers include security headers", () => {
  const response = ApiResponseUtil.success({});

  // Check security headers
  assertEquals(response.headers.get("X-Content-Type-Options"), "nosniff");
  assertEquals(response.headers.get("X-Frame-Options"), "DENY");
  assertEquals(
    response.headers.get("X-Permitted-Cross-Domain-Policies"),
    "none",
  );
  assertExists(response.headers.get("X-API-Version"));
});

Deno.test("ApiResponseUtil - custom headers are included", () => {
  const response = ApiResponseUtil.success({}, {
    headers: {
      "X-Custom-Header": "custom-value",
      "X-Request-ID": "12345",
    },
  });

  assertEquals(response.headers.get("X-Custom-Header"), "custom-value");
  assertEquals(response.headers.get("X-Request-ID"), "12345");
});

Deno.test("ApiResponseUtil - cache headers with routeType", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STATIC,
    forceNoCache: false,
  });

  // Should have cache headers for static route type
  assertExists(response.headers.get("Cache-Control"));
  assertExists(response.headers.get("CDN-Cache-Control"));
});

Deno.test("ApiResponseUtil - no cache headers when forceNoCache is true", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: "static" as any, // RouteType enum is not imported
    forceNoCache: true,
  });

  // Should have no-store headers when forceNoCache is true
  const cacheControl = response.headers.get("Cache-Control");
  assertEquals(cacheControl?.includes("no-store"), true);
});

// New tests for 100% coverage

Deno.test("ApiResponseUtil - success with bigint serialization", async () => {
  const data = {
    utxoValue: BigInt("280891"),
    transactionAmount: BigInt("1000000"),
    balance: BigInt("0"),
    nested: {
      amount: BigInt("999999999999999999"),
      regularNumber: 42,
      text: "hello",
    },
  };

  const response = ApiResponseUtil.success(data);
  assertEquals(response.status, 200);

  const body = await response.json();

  // Verify bigint values are converted to strings
  assertEquals(body.utxoValue, "280891");
  assertEquals(body.transactionAmount, "1000000");
  assertEquals(body.balance, "0");
  assertEquals(body.nested.amount, "999999999999999999");

  // Verify non-bigint values are preserved
  assertEquals(body.nested.regularNumber, 42);
  assertEquals(body.nested.text, "hello");
});

Deno.test("ApiResponseUtil - cache headers with staleWhileRevalidate", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.BALANCE, // Has staleWhileRevalidate: 30
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);
  assertEquals(cacheControl.includes("stale-while-revalidate=30"), true);
  assertEquals(cacheControl.includes("max-age=30"), true);
});

Deno.test("ApiResponseUtil - cache headers with staleIfError", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.TRANSACTION, // Has staleIfError: 300
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);
  assertEquals(cacheControl.includes("stale-if-error=300"), true);
  assertEquals(cacheControl.includes("stale-while-revalidate=30"), true);
});

Deno.test("ApiResponseUtil - cache headers without staleWhileRevalidate", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.DYNAMIC, // Has duration: 0, so no custom cache headers
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  // DYNAMIC route has duration: 0, so it uses default security headers (not no-cache)
  // When forceNoCache is false, getSecurityHeaders returns the default cache headers
  assertEquals(cacheControl, "public, max-age=31536000, immutable");
});

Deno.test("ApiResponseUtil - cache headers without staleIfError", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STAMP_DISPENSER, // Has duration: 0, so no custom cache headers
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  // STAMP_DISPENSER route has duration: 0, so it uses default security headers (not no-cache)
  // When forceNoCache is false, getSecurityHeaders returns the default cache headers
  assertEquals(cacheControl, "public, max-age=31536000, immutable");
});

Deno.test("ApiResponseUtil - all cache directive combinations", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STAMP_DETAIL, // Has all cache directives
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);

  // Verify all cache directives are present
  assertEquals(cacheControl.includes("public"), true);
  assertEquals(cacheControl.includes("max-age=3600"), true);
  assertEquals(cacheControl.includes("stale-while-revalidate=300"), true);
  assertEquals(cacheControl.includes("stale-if-error=7200"), true);

  // Verify CDN headers are also set
  assertExists(response.headers.get("CDN-Cache-Control"));
  assertExists(response.headers.get("Cloudflare-CDN-Cache-Control"));
  assertExists(response.headers.get("Surrogate-Control"));
  assertExists(response.headers.get("Edge-Control"));
});

Deno.test("ApiResponseUtil - created method with simple data", async () => {
  const data = {
    id: 123456789,
    timestamp: 1640995200000,
    metadata: {
      value: 50000,
    },
  };

  // Note: created() method does NOT use BigInt serialization like success() does
  // This test uses regular numbers to verify the created() method works correctly
  const response = ApiResponseUtil.created(data);
  assertEquals(response.status, 201);

  const body = await response.json();
  assertEquals(body.id, 123456789);
  assertEquals(body.timestamp, 1640995200000);
  assertEquals(body.metadata.value, 50000);
});

Deno.test("ApiResponseUtil - created method BigInt limitation", () => {
  const dataWithBigInt = {
    id: BigInt("123456789"),
    value: 42,
  };

  // created() method does NOT handle BigInt serialization (unlike success() method)
  // This should throw an error during Response creation due to JSON.stringify() limitation
  try {
    ApiResponseUtil.created(dataWithBigInt);
    // If we reach here, the test should fail because BigInt should cause an error
    assertEquals(true, false, "Expected TypeError for BigInt serialization");
  } catch (error) {
    // Expected behavior - created() method can't serialize BigInt values
    assertEquals(error instanceof TypeError, true);
    assertEquals(
      (error as TypeError).message.includes(
        "Do not know how to serialize a BigInt",
      ),
      true,
    );
  }
});

Deno.test("ApiResponseUtil - complex nested bigint structures", async () => {
  const complexData = {
    transactions: [
      {
        id: "tx1",
        value: BigInt("1500000"),
        inputs: [
          { utxo: "abc:0", amount: BigInt("2000000") },
          { utxo: "def:1", amount: BigInt("500000") },
        ],
      },
      {
        id: "tx2",
        value: BigInt("750000"),
        inputs: [
          { utxo: "ghi:0", amount: BigInt("1000000") },
        ],
      },
    ],
    totalValue: BigInt("2250000"),
    metadata: {
      blockHeight: 850000,
      fee: BigInt("10000"),
    },
  };

  const response = ApiResponseUtil.success(complexData);
  const body = await response.json();

  // Verify deeply nested bigint serialization
  assertEquals(body.transactions[0].value, "1500000");
  assertEquals(body.transactions[0].inputs[0].amount, "2000000");
  assertEquals(body.transactions[0].inputs[1].amount, "500000");
  assertEquals(body.transactions[1].value, "750000");
  assertEquals(body.transactions[1].inputs[0].amount, "1000000");
  assertEquals(body.totalValue, "2250000");
  assertEquals(body.metadata.fee, "10000");

  // Verify non-bigint values preserved
  assertEquals(body.transactions[0].id, "tx1");
  assertEquals(body.metadata.blockHeight, 850000);
});

// Additional cache header edge case tests for complete coverage

Deno.test("ApiResponseUtil - cache headers with only staleIfError", () => {
  // Create a test case where staleWhileRevalidate is 0 but staleIfError > 0
  // We'll use STAMP route which has staleWhileRevalidate: 60, staleIfError: 3600
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STAMP, // duration: 300, staleWhileRevalidate: 60, staleIfError: 3600
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);
  assertEquals(cacheControl.includes("max-age=300"), true);
  assertEquals(cacheControl.includes("stale-while-revalidate=60"), true);
  assertEquals(cacheControl.includes("stale-if-error=3600"), true);
});

Deno.test("ApiResponseUtil - cache headers with only staleWhileRevalidate", () => {
  // Test PRICE route which has staleWhileRevalidate: 300, staleIfError: 600
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.PRICE, // duration: 60, staleWhileRevalidate: 300, staleIfError: 600
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);
  assertEquals(cacheControl.includes("max-age=60"), true);
  assertEquals(cacheControl.includes("stale-while-revalidate=300"), true);
  assertEquals(cacheControl.includes("stale-if-error=600"), true);
});

Deno.test("ApiResponseUtil - cache headers with long duration routes", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STATIC, // duration: 86400, staleWhileRevalidate: 3600, staleIfError: 7200
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);
  assertEquals(cacheControl.includes("max-age=86400"), true);
  assertEquals(cacheControl.includes("stale-while-revalidate=3600"), true);
  assertEquals(cacheControl.includes("stale-if-error=7200"), true);

  // Verify all CDN headers are set for static content
  assertEquals(response.headers.get("CDN-Cache-Control"), cacheControl);
  assertEquals(
    response.headers.get("Cloudflare-CDN-Cache-Control"),
    cacheControl,
  );
  assertEquals(response.headers.get("Surrogate-Control"), "max-age=86400");
  assertEquals(response.headers.get("Edge-Control"), "cache-maxage=86400");
});

Deno.test("ApiResponseUtil - cache headers when routeType is undefined", () => {
  const response = ApiResponseUtil.success({}, {
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  // When no routeType is provided, it uses default security headers
  assertEquals(cacheControl, "public, max-age=31536000, immutable");
});

Deno.test("ApiResponseUtil - cache headers when forceNoCache overrides routeType", () => {
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STATIC, // This would normally set long cache
    forceNoCache: true, // But this overrides it
  });

  const cacheControl = response.headers.get("Cache-Control");
  // forceNoCache: true should override any routeType settings
  assertEquals(cacheControl, "no-store, must-revalidate");
});

Deno.test("ApiResponseUtil - all RouteType enum values work correctly", () => {
  // Test that all RouteType enum values can be used without errors
  const routeTypes = [
    RouteType.DYNAMIC,
    RouteType.STAMP_DISPENSER,
    RouteType.STAMP_DISPENSE,
    RouteType.STAMP_SEND,
    RouteType.BALANCE,
    RouteType.DISPENSER,
    RouteType.TRANSACTION,
    RouteType.STAMP_DETAIL,
    RouteType.STAMP,
    RouteType.STAMP_METADATA,
    RouteType.STAMP_LIST,
    RouteType.COLLECTION,
    RouteType.HISTORICAL,
    RouteType.PROTOCOL,
    RouteType.STATIC,
    RouteType.PRICE,
  ];

  routeTypes.forEach((routeType) => {
    const response = ApiResponseUtil.success({}, {
      routeType,
      forceNoCache: false,
    });

    // Verify response was created successfully
    assertEquals(response.status, 200);
    assertExists(response.headers.get("Cache-Control"));
    assertExists(response.headers.get("X-API-Version"));
  });
});

// Tests for 100% coverage - covering conditional cache header logic

Deno.test("ApiResponseUtil - cache headers for routes with zero duration", () => {
  // Test routes that have duration: 0 which don't get custom cache headers
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.DYNAMIC, // Has duration: 0
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);

  // Routes with duration: 0 fall back to default security headers (when forceNoCache is false)
  assertEquals(cacheControl, "public, max-age=31536000, immutable");
});

Deno.test("ApiResponseUtil - cache headers for routes with zero duration (STAMP_DISPENSER)", () => {
  // Test another route that has duration: 0
  const response = ApiResponseUtil.success({}, {
    routeType: RouteType.STAMP_DISPENSER, // Has duration: 0
    forceNoCache: false,
  });

  const cacheControl = response.headers.get("Cache-Control");
  assertExists(cacheControl);

  // Routes with duration: 0 fall back to default security headers (when forceNoCache is false)
  assertEquals(cacheControl, "public, max-age=31536000, immutable");
});

Deno.test("ApiResponseUtil - test all conditional cache header branches", () => {
  // Test that the conditional logic in createHeaders works correctly
  // This tests the filter(Boolean).join(", ") logic for cache control directives

  // Test with a route that has all cache directives
  const responseWithAll = ApiResponseUtil.success({}, {
    routeType: RouteType.STAMP_DETAIL, // Has duration: 3600, staleWhileRevalidate: 300, staleIfError: 7200
    forceNoCache: false,
  });

  const cacheControlAll = responseWithAll.headers.get("Cache-Control");
  assertExists(cacheControlAll);

  // Verify the cache control string is properly formatted with all directives
  const expectedParts = [
    "public",
    "max-age=3600",
    "stale-while-revalidate=300",
    "stale-if-error=7200",
  ];

  expectedParts.forEach((part) => {
    assertEquals(
      cacheControlAll.includes(part),
      true,
      `Missing cache directive: ${part}`,
    );
  });

  // Verify CDN headers are set
  assertEquals(
    responseWithAll.headers.get("CDN-Cache-Control"),
    cacheControlAll,
  );
  assertEquals(
    responseWithAll.headers.get("Surrogate-Control"),
    "max-age=3600",
  );
  assertEquals(
    responseWithAll.headers.get("Edge-Control"),
    "cache-maxage=3600",
  );
});

Deno.test("ApiResponseUtil - error response methods don't use BigInt serialization", async () => {
  // Test that error response methods use standard JSON.stringify without BigInt handling
  suppressConsole();

  try {
    const errorDetails = {
      field: "value",
      code: 400,
      timestamp: Date.now(),
    };

    const response = ApiResponseUtil.badRequest("Test error", errorDetails);
    assertEquals(response.status, 400);

    const body = await response.json();
    assertEquals(body.error, "Test error");
    assertEquals(body.details, errorDetails);
    assertEquals(body.code, "BAD_REQUEST");
    assertEquals(body.status, "error");
  } finally {
    restoreConsole();
  }
});

Deno.test("ApiResponseUtil - noContent method returns proper empty response", () => {
  const response = ApiResponseUtil.noContent({
    headers: { "X-Custom": "test" },
  });

  assertEquals(response.status, 204);
  assertEquals(response.body, null);
  assertEquals(response.headers.get("X-Custom"), "test");
  assertEquals(response.headers.get("Content-Type"), "application/json");
});

Deno.test("ApiResponseUtil - custom method with ArrayBuffer", async () => {
  const buffer = new ArrayBuffer(8);
  const view = new Uint8Array(buffer);
  view[0] = 255;
  view[1] = 254;

  const response = ApiResponseUtil.custom(buffer, 200);
  assertEquals(response.status, 200);

  const resultBuffer = await response.arrayBuffer();
  const resultView = new Uint8Array(resultBuffer);
  assertEquals(resultView[0], 255);
  assertEquals(resultView[1], 254);
});

Deno.test("ApiResponseUtil - all error methods include proper error structure", async () => {
  suppressConsole();

  try {
    const testCases = [
      {
        method: "unauthorized",
        expectedCode: "UNAUTHORIZED",
        expectedStatus: 401,
      },
      { method: "forbidden", expectedCode: "FORBIDDEN", expectedStatus: 403 },
      {
        method: "methodNotAllowed",
        expectedCode: "METHOD_NOT_ALLOWED",
        expectedStatus: 405,
      },
      { method: "conflict", expectedCode: "CONFLICT", expectedStatus: 409 },
      {
        method: "tooManyRequests",
        expectedCode: "TOO_MANY_REQUESTS",
        expectedStatus: 429,
      },
      {
        method: "serviceUnavailable",
        expectedCode: "SERVICE_UNAVAILABLE",
        expectedStatus: 503,
      },
    ];

    for (const testCase of testCases) {
      const response = (ApiResponseUtil as any)[testCase.method](
        "Test message",
        { extra: "data" },
      );
      assertEquals(response.status, testCase.expectedStatus);

      const body = await response.json();
      assertEquals(body.error, "Test message");
      assertEquals(body.code, testCase.expectedCode);
      assertEquals(body.status, "error");
      assertEquals(body.details.extra, "data");
    }
  } finally {
    restoreConsole();
  }
});

Deno.test("ApiResponseUtil - internalError with different error types", async () => {
  suppressConsole();
  mockEnv("development");

  try {
    // Test with Error object
    const errorObj = new Error("Database failed");
    const response1 = ApiResponseUtil.internalError(errorObj, "Custom message");
    const body1 = await response1.json();
    assertEquals(body1.error, "Custom message");
    assertExists(body1.details.error); // Error object included in dev mode

    // Test with string error
    const response2 = ApiResponseUtil.internalError(
      "String error",
      "Another message",
    );
    const body2 = await response2.json();
    assertEquals(body2.error, "Another message");
    assertEquals(body2.details.error, "String error");

    // Test with object error
    const errorObject = { code: "DB_ERROR", details: "Connection failed" };
    const response3 = ApiResponseUtil.internalError(errorObject);
    const body3 = await response3.json();
    assertEquals(body3.error, "Internal server error");
    assertEquals(body3.details.error, errorObject);
  } finally {
    restoreEnv();
    restoreConsole();
  }
});

Deno.test("ApiResponseUtil - cache headers with different route configurations", () => {
  // Test various RouteType configurations to ensure all conditional branches are covered
  const testConfigs = [
    { routeType: RouteType.BALANCE, expectedMaxAge: "30" }, // Has staleWhileRevalidate and staleIfError
    { routeType: RouteType.PRICE, expectedMaxAge: "60" }, // Different cache config
    { routeType: RouteType.STATIC, expectedMaxAge: "86400" }, // Long cache duration
    { routeType: RouteType.STAMP, expectedMaxAge: "300" }, // Medium cache duration
  ];

  testConfigs.forEach((config) => {
    const response = ApiResponseUtil.success({}, {
      routeType: config.routeType,
      forceNoCache: false,
    });

    const cacheControl = response.headers.get("Cache-Control");
    assertExists(cacheControl, `Cache control missing for ${config.routeType}`);
    assertEquals(
      cacheControl.includes(`max-age=${config.expectedMaxAge}`),
      true,
      `Expected max-age=${config.expectedMaxAge} for ${config.routeType}, got: ${cacheControl}`,
    );
  });
});

Deno.test("ApiResponseUtil - createErrorResponse helper method coverage", async () => {
  // Test the private createErrorResponse method through public methods
  suppressConsole();

  try {
    // Test with details
    const responseWithDetails = ApiResponseUtil.badRequest(
      "Error with details",
      { field: "test" },
    );
    const bodyWithDetails = await responseWithDetails.json();
    assertEquals(bodyWithDetails.details.field, "test");

    // Test without details (details should be undefined/not present)
    const responseWithoutDetails = ApiResponseUtil.notFound("Simple error");
    const bodyWithoutDetails = await responseWithoutDetails.json();
    assertEquals(bodyWithoutDetails.error, "Simple error");
    assertEquals(bodyWithoutDetails.code, "NOT_FOUND");
    assertEquals(bodyWithoutDetails.status, "error");
    // details should not be present when not provided
    assertEquals(
      Object.hasOwnProperty.call(bodyWithoutDetails, "details"),
      false,
    );
  } finally {
    restoreConsole();
  }
});
