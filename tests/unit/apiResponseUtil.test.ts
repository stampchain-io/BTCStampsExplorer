import { assertEquals, assertExists } from "@std/assert";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

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
    routeType: "static" as any, // RouteType enum is not imported
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
