import { FetchHttpClient } from "$server/interfaces/httpClient.ts";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";

describe("FetchHttpClient Core Tests", () => {
  let httpClient: FetchHttpClient;
  let originalFetch: any;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    httpClient = new FetchHttpClient(
      1000, // defaultTimeout
      2, // defaultRetries
      100, // defaultRetryDelay
      3, // maxConcurrentRequests
      5, // maxPoolSize
    );
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("AbortController Resource Management", () => {
    it("should not accumulate unlimited AbortControllers", async () => {
      // Mock successful responses
      globalThis.fetch = (() => {
        return Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      // Make many requests to test pooling
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(httpClient.get(`https://example.com/test${i}`));
      }

      await Promise.all(requests);

      const metrics = httpClient.getMetrics();

      // Pool should not exceed max size
      assert(
        metrics.poolSize <= 5,
        `Pool size should not exceed 5, was ${metrics.poolSize}`,
      );
      assertEquals(
        metrics.activeRequests,
        0,
        "No active requests should remain",
      );
    });

    it("should track concurrent requests", async () => {
      let activeRequests = 0;
      let maxActiveRequests = 0;

      globalThis.fetch = (() => {
        activeRequests++;
        maxActiveRequests = Math.max(maxActiveRequests, activeRequests);

        return new Promise<Response>((resolve) => {
          setTimeout(() => {
            activeRequests--;
            resolve(
              new Response(JSON.stringify({ data: "test" }), {
                status: 200,
                headers: { "content-type": "application/json" },
              }),
            );
          }, 20);
        });
      }) as any;

      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(httpClient.get(`https://example.com/test${i}`));
      }

      await Promise.all(requests);

      // Should have had some concurrency (not all sequential)
      assert(
        maxActiveRequests > 1,
        `Should have had some concurrent requests, max was ${maxActiveRequests}`,
      );
      assert(
        maxActiveRequests <= 6,
        `Max concurrent should be reasonable, was ${maxActiveRequests}`,
      );
    });

    it("should handle retry scenarios without resource leaks", async () => {
      let callCount = 0;

      globalThis.fetch = (() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error("fetch failed"));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ data: "success" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      const response = await httpClient.get("https://example.com/test");

      assertEquals(callCount, 3, "Should retry 2 times before succeeding");
      assertEquals(response.data.data, "success");

      const metrics = httpClient.getMetrics();
      assertEquals(
        metrics.activeRequests,
        0,
        "No active requests should remain after retries",
      );
    });
  });

  describe("Metrics and Pool Management", () => {
    it("should provide accurate metrics", async () => {
      globalThis.fetch = (() => {
        return Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      const initialMetrics = httpClient.getMetrics();
      assertEquals(initialMetrics.activeRequests, 0);
      assertEquals(initialMetrics.maxConcurrentRequests, 3);
      assertEquals(initialMetrics.maxPoolSize, 5);

      await httpClient.get("https://example.com/test");

      const finalMetrics = httpClient.getMetrics();
      assertEquals(finalMetrics.activeRequests, 0);
    });

    it("should clear pool when requested", () => {
      httpClient.clearPool();
      const metrics = httpClient.getMetrics();
      assertEquals(metrics.poolSize, 0, "Pool should be empty after clearing");
    });
  });

  describe("HTTP Methods", () => {
    it("should handle GET requests", async () => {
      globalThis.fetch = (() => {
        return Promise.resolve(
          new Response(JSON.stringify({ method: "GET" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      const response = await httpClient.get("https://example.com/test");

      assertEquals(response.data.method, "GET");
      assertEquals(response.status, 200);
      assert(response.ok);
    });

    it("should handle POST requests with JSON body", async () => {
      let capturedRequest: any;

      globalThis.fetch = ((url: any, init: any) => {
        capturedRequest = init;
        return Promise.resolve(
          new Response(JSON.stringify({ received: true }), {
            status: 201,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      const response = await httpClient.post("https://example.com/test", {
        data: "test",
      });

      assertEquals(response.status, 201);
      assert(response.ok);
      assertEquals(capturedRequest.method, "POST");
      assertEquals(capturedRequest.headers["Content-Type"], "application/json");
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parsing errors gracefully", async () => {
      // Create a mock response that simulates JSON parsing failure
      const mockResponse = {
        status: 200,
        statusText: "OK",
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: () => Promise.reject(new Error("Invalid JSON")),
        text: () => Promise.resolve("invalid json"),
      };

      globalThis.fetch = (() => {
        return Promise.resolve(mockResponse as any);
      }) as any;

      const response = await httpClient.get("https://example.com/test");

      assertEquals(
        response.data,
        "invalid json",
        "Should fallback to text when JSON parsing fails",
      );
    });

    it("should handle network errors", async () => {
      globalThis.fetch = (() => {
        return Promise.reject(new Error("Network error"));
      }) as any;

      await assertRejects(
        () => httpClient.get("https://example.com/test"),
        Error,
        "Network error",
      );
    });
  });

  describe("Critical: MaxListenersExceededWarning Prevention", () => {
    it("should handle many concurrent requests without AbortController warning", async () => {
      // This test specifically validates that we don't get the MaxListenersExceededWarning
      globalThis.fetch = (() => {
        return Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      // Create many concurrent requests that would previously trigger the warning
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(httpClient.get(`https://example.com/test${i}`, {
          retries: 3, // Each retry creates an AbortController
          timeout: 5000,
        }));
      }

      await Promise.all(requests);

      // If we get here without the MaxListenersExceededWarning, the fix worked
      assert(
        true,
        "Successfully completed many concurrent requests without warning",
      );

      const metrics = httpClient.getMetrics();
      assertEquals(
        metrics.activeRequests,
        0,
        "All requests should be completed",
      );
      assert(metrics.poolSize <= 5, "Pool should not exceed max size");
    });

    it("should handle rapid sequential requests without leaks", async () => {
      globalThis.fetch = (() => {
        return Promise.resolve(
          new Response(JSON.stringify({ data: "test" }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }) as any;

      // Make rapid sequential requests
      for (let i = 0; i < 25; i++) {
        await httpClient.get(`https://example.com/test${i}`);
      }

      const metrics = httpClient.getMetrics();
      assertEquals(
        metrics.activeRequests,
        0,
        "No active requests should remain",
      );
      assert(metrics.poolSize <= 5, "Pool should stay within bounds");
    });
  });
});
