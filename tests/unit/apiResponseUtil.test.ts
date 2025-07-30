/**
 * @fileoverview Tests for ApiResponseUtil with mocked headers
 * Tests API response generation including cache control headers
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";

describe("ApiResponseUtil", () => {
  describe("success", () => {
    it("should create success response with default options", () => {
      const data = { message: "Success", value: 42 };
      const response = ApiResponseUtil.success(data);

      assertEquals(response.status, 200);
      assertEquals(response.headers.get("Content-Type"), "application/json");
      assertExists(response.headers.get("X-API-Version"));
    });

    it("should handle bigint serialization", async () => {
      const data = { bigNumber: BigInt("9007199254740993") };
      const response = ApiResponseUtil.success(data);

      const parsed = await response.json();
      assertEquals(parsed.bigNumber, "9007199254740993");
    });

    it("should apply custom status and headers", () => {
      const data = { result: "custom" };
      const response = ApiResponseUtil.success(data, {
        status: 202,
        headers: { "X-Custom": "test" },
      });

      assertEquals(response.status, 202);
      assertEquals(response.headers.get("X-Custom"), "test");
    });
  });

  describe("created", () => {
    it("should create 201 response", async () => {
      const data = { id: 1, created: true };
      const response = ApiResponseUtil.created(data);

      assertEquals(response.status, 201);
      const parsed = await response.json();
      assertEquals(parsed, data);
    });
  });

  describe("noContent", () => {
    it("should create 204 response with no body", () => {
      const response = ApiResponseUtil.noContent();

      assertEquals(response.status, 204);
      assertEquals(response.body, null);
    });
  });

  describe("custom", () => {
    it("should handle JSON body", async () => {
      const data = { custom: "data" };
      const response = ApiResponseUtil.custom(data, 202);

      assertEquals(response.status, 202);
      const parsed = await response.json();
      assertEquals(parsed, data);
    });
  });

  describe("cache control headers", () => {
    it("should add cache headers with staleWhileRevalidate", () => {
      const response = ApiResponseUtil.success({ data: "test" }, {
        routeType: RouteType.STAMP,
        forceNoCache: false,
      });

      const cacheControl = response.headers.get("Cache-Control");
      assertEquals(
        cacheControl,
        "public, max-age=86400, stale-while-revalidate=60, stale-if-error=3600",
      );
      assertEquals(response.headers.get("CDN-Cache-Control"), cacheControl);
      assertEquals(
        response.headers.get("Cloudflare-CDN-Cache-Control"),
        cacheControl,
      );
      assertEquals(response.headers.get("Surrogate-Control"), "max-age=86400");
      assertEquals(response.headers.get("Edge-Control"), "cache-maxage=86400");
    });

    it("should not add cache headers when forceNoCache is true", () => {
      const response = ApiResponseUtil.success({ data: "test" }, {
        routeType: RouteType.STAMP,
        forceNoCache: true,
      });

      const cacheControl = response.headers.get("Cache-Control");
      assertEquals(
        cacheControl,
        "no-store, must-revalidate",
      );
    });

    it("should not add cache headers for dynamic routes", () => {
      const response = ApiResponseUtil.success({ data: "test" }, {
        routeType: RouteType.DYNAMIC,
        forceNoCache: false,
      });

      const cacheControl = response.headers.get("Cache-Control");
      // Dynamic routes have duration: 0, so no cache headers are added
      // Default security headers apply
      assertEquals(
        cacheControl,
        "public, max-age=31536000, immutable",
      );
    });
  });

  describe("error responses", () => {
    it("should create badRequest response", async () => {
      const response = ApiResponseUtil.badRequest("Invalid input", {
        field: "email",
      });

      assertEquals(response.status, 400);
      const parsed = await response.json();
      assertEquals(parsed.error, "Invalid input");
      assertEquals(parsed.code, "BAD_REQUEST");
      assertEquals(parsed.details, { field: "email" });
    });

    it("should create unauthorized response", async () => {
      const response = ApiResponseUtil.unauthorized("Invalid token");

      assertEquals(response.status, 401);
      const parsed = await response.json();
      assertEquals(parsed.error, "Invalid token");
      assertEquals(parsed.code, "UNAUTHORIZED");
    });

    it("should create forbidden response", async () => {
      const response = ApiResponseUtil.forbidden("Access denied", {
        role: "user",
      });

      assertEquals(response.status, 403);
      const parsed = await response.json();
      assertEquals(parsed.error, "Access denied");
      assertEquals(parsed.code, "FORBIDDEN");
      assertEquals(parsed.details, { role: "user" });
    });

    it("should create notFound response", async () => {
      const response = ApiResponseUtil.notFound("Resource not found", {
        id: 123,
      });

      assertEquals(response.status, 404);
      const parsed = await response.json();
      assertEquals(parsed.error, "Resource not found");
      assertEquals(parsed.code, "NOT_FOUND");
      assertEquals(parsed.details, { id: 123 });
    });

    it("should create methodNotAllowed response", async () => {
      const response = ApiResponseUtil.methodNotAllowed("POST not allowed", {
        allowed: ["GET", "PUT"],
      });

      assertEquals(response.status, 405);
      const parsed = await response.json();
      assertEquals(parsed.error, "POST not allowed");
      assertEquals(parsed.code, "METHOD_NOT_ALLOWED");
      assertEquals(parsed.details, { allowed: ["GET", "PUT"] });
    });

    it("should create conflict response", async () => {
      const response = ApiResponseUtil.conflict("Resource already exists", {
        id: "duplicate",
      });

      assertEquals(response.status, 409);
      const parsed = await response.json();
      assertEquals(parsed.error, "Resource already exists");
      assertEquals(parsed.code, "CONFLICT");
      assertEquals(parsed.details, { id: "duplicate" });
    });

    it("should create tooManyRequests response", async () => {
      const response = ApiResponseUtil.tooManyRequests("Rate limit exceeded", {
        retryAfter: 60,
      });

      assertEquals(response.status, 429);
      const parsed = await response.json();
      assertEquals(parsed.error, "Rate limit exceeded");
      assertEquals(parsed.code, "TOO_MANY_REQUESTS");
      assertEquals(parsed.details, { retryAfter: 60 });
    });

    it("should create internalError response", async () => {
      // Mock Deno.env.get to avoid permission error
      const originalEnvGet = Deno.env.get;
      Deno.env.get = (key: string) => {
        if (key === "DENO_ENV") return "test";
        return originalEnvGet(key);
      };

      const error = new Error("Database connection failed");
      const response = ApiResponseUtil.internalError(
        error,
        "Internal server error",
      );

      assertEquals(response.status, 500);
      const parsed = await response.json();
      assertEquals(parsed.error, "Internal server error");
      assertEquals(parsed.code, "INTERNAL_ERROR");
      // Error details only included in development

      // Restore original
      Deno.env.get = originalEnvGet;
    });

    it("should create serviceUnavailable response", async () => {
      const response = ApiResponseUtil.serviceUnavailable("Maintenance mode", {
        eta: "30 minutes",
      });

      assertEquals(response.status, 503);
      const parsed = await response.json();
      assertEquals(parsed.error, "Maintenance mode");
      assertEquals(parsed.code, "SERVICE_UNAVAILABLE");
      assertEquals(parsed.details, { eta: "30 minutes" });
    });

    it("should create custom response with ArrayBuffer", () => {
      const buffer = new Uint8Array([1, 2, 3, 4]);
      const response = ApiResponseUtil.custom(buffer, 200, {
        headers: { "Content-Type": "application/octet-stream" },
      });

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("Content-Type"),
        "application/octet-stream",
      );
    });
  });
});
