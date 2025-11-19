import { assertEquals, assertRejects } from "@std/assert";
import {
  clearCSRFTokenCache,
  getCSRFToken,
  makeAuthenticatedRequest,
} from "$lib/utils/security/clientSecurityUtils.ts";
import { FakeTime } from "@std/testing/time";

// Mock fetch for testing
function mockFetch(response: any, ok = true, status = 200) {
  globalThis.fetch = () => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(response),
    } as Response);
  };
}

// Save original values
const originalFetch = globalThis.fetch;
const originalLocation = globalThis.location;

// Mock location for testing
function mockLocation(hostname = "example.com") {
  Object.defineProperty(globalThis, "location", {
    value: { hostname },
    writable: true,
    configurable: true,
  });
}

// Setup function to run before each test
function setup() {
  clearCSRFTokenCache(); // Clear any cached tokens
}

// Cleanup function
function cleanup() {
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
}

Deno.test("clientSecurityUtils - getCSRFToken success", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "test-csrf-token-123";
  mockFetch({ token: mockToken });

  const token = await getCSRFToken();
  assertEquals(token, mockToken);

  cleanup();
});

Deno.test("clientSecurityUtils - getCSRFToken caches token", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "cached-token-456";
  let fetchCallCount = 0;

  globalThis.fetch = () => {
    fetchCallCount++;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: mockToken }),
    } as Response);
  };

  // First call should fetch
  const token1 = await getCSRFToken();
  assertEquals(token1, mockToken);
  assertEquals(fetchCallCount, 1);

  // Second call should use cache
  const token2 = await getCSRFToken();
  assertEquals(token2, mockToken);
  assertEquals(fetchCallCount, 1); // No additional fetch

  cleanup();
});

Deno.test("clientSecurityUtils - getCSRFToken cache expires after 30 minutes", async () => {
  const time = new FakeTime();

  try {
    setup();
    mockLocation("example.com");
    let fetchCallCount = 0;
    let tokenCounter = 0;

    globalThis.fetch = () => {
      fetchCallCount++;
      tokenCounter++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: `token-${tokenCounter}` }),
      } as Response);
    };

    // First call
    const token1 = await getCSRFToken();
    assertEquals(token1, "token-1");
    assertEquals(fetchCallCount, 1);

    // Call within cache duration (29 minutes)
    time.tick(29 * 60 * 1000);
    const token2 = await getCSRFToken();
    assertEquals(token2, "token-1"); // Still cached
    assertEquals(fetchCallCount, 1);

    // Call after cache expires (31 minutes total)
    time.tick(2 * 60 * 1000);
    const token3 = await getCSRFToken();
    assertEquals(token3, "token-2"); // New token
    assertEquals(fetchCallCount, 2);
  } finally {
    time.restore();
    cleanup();
  }
});

Deno.test("clientSecurityUtils - getCSRFToken handles HTTP error", async () => {
  setup();
  mockLocation("example.com");
  mockFetch({}, false, 403);

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "HTTP error! status: 403",
  );

  cleanup();
});

Deno.test("clientSecurityUtils - getCSRFToken handles missing token", async () => {
  setup();
  mockLocation("example.com");
  mockFetch({ someOtherField: "value" });

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "No token received from server",
  );

  cleanup();
});

Deno.test("clientSecurityUtils - getCSRFToken handles network error", async () => {
  setup();
  mockLocation("example.com");
  globalThis.fetch = () => {
    throw new Error("Network error");
  };

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "Network error",
  );

  cleanup();
});

Deno.test("clientSecurityUtils - getCSRFToken returns dummy token on localhost error", async () => {
  setup();
  mockLocation("localhost");
  mockFetch({}, false, 403);

  const token = await getCSRFToken();
  assertEquals(token, "dev-csrf-token");

  cleanup();
});

Deno.test("clientSecurityUtils - clearCSRFTokenCache clears cached token", async () => {
  setup();
  mockLocation("example.com");
  let fetchCallCount = 0;

  globalThis.fetch = () => {
    fetchCallCount++;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: `token-${fetchCallCount}` }),
    } as Response);
  };

  // Get token (should cache)
  const token1 = await getCSRFToken();
  assertEquals(token1, "token-1");
  assertEquals(fetchCallCount, 1);

  // Clear cache
  clearCSRFTokenCache();

  // Get token again (should fetch new one)
  const token2 = await getCSRFToken();
  assertEquals(token2, "token-2");
  assertEquals(fetchCallCount, 2);

  cleanup();
});

Deno.test("makeAuthenticatedRequest - adds CSRF token to headers", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "auth-token-789";
  let capturedHeaders: Headers | undefined;

  // Mock getCSRFToken fetch
  let fetchCallCount = 0;
  globalThis.fetch = (_url: string | URL | Request, options?: RequestInit) => {
    fetchCallCount++;

    if (fetchCallCount === 1) {
      // First call is getCSRFToken
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: mockToken }),
      } as Response);
    } else {
      // Second call is the actual authenticated request
      capturedHeaders = options?.headers as Headers;
      return Promise.resolve(new Response("Success"));
    }
  };

  const response = await makeAuthenticatedRequest("/api/test");

  assertEquals(fetchCallCount, 2);
  assertEquals(capturedHeaders?.get("X-CSRF-Token"), mockToken);
  assertEquals(await response.text(), "Success");

  cleanup();
});

Deno.test("makeAuthenticatedRequest - preserves existing headers", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "auth-token-123";
  let capturedHeaders: Headers | undefined;

  let fetchCallCount = 0;
  globalThis.fetch = (_url: string | URL | Request, options?: RequestInit) => {
    fetchCallCount++;

    if (fetchCallCount === 1) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: mockToken }),
      } as Response);
    } else {
      capturedHeaders = options?.headers as Headers;
      return Promise.resolve(new Response("Success"));
    }
  };

  await makeAuthenticatedRequest("/api/test", {
    headers: {
      "Content-Type": "application/json",
      "X-Custom-Header": "custom-value",
    },
  });

  assertEquals(capturedHeaders?.get("X-CSRF-Token"), mockToken);
  assertEquals(capturedHeaders?.get("Content-Type"), "application/json");
  assertEquals(capturedHeaders?.get("X-Custom-Header"), "custom-value");

  cleanup();
});

Deno.test("makeAuthenticatedRequest - handles getCSRFToken error on non-localhost", async () => {
  setup();
  mockLocation("example.com");

  globalThis.fetch = () => {
    throw new Error("CSRF fetch failed");
  };

  await assertRejects(
    async () => await makeAuthenticatedRequest("/api/test"),
    Error,
    "CSRF fetch failed",
  );

  cleanup();
});

Deno.test("makeAuthenticatedRequest - fallback on localhost when CSRF fails", async () => {
  setup();
  mockLocation("localhost");
  let fetchCallCount = 0;

  globalThis.fetch = (_url: string | URL | Request) => {
    fetchCallCount++;

    if (fetchCallCount === 1) {
      // First call fails (CSRF token fetch)
      throw new Error("CSRF fetch failed");
    } else {
      // Second call succeeds (direct request without CSRF)
      return Promise.resolve(new Response("Fallback success"));
    }
  };

  const response = await makeAuthenticatedRequest("/api/test", {
    headers: { "X-Test": "value" },
  });

  assertEquals(fetchCallCount, 2);
  assertEquals(await response.text(), "Fallback success");

  cleanup();
});

Deno.test("makeAuthenticatedRequest - passes through all request options", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "token-options";
  let capturedUrl: string | URL | Request | undefined;
  let capturedOptions: RequestInit | undefined;

  let fetchCallCount = 0;
  globalThis.fetch = (_url: string | URL | Request, options?: RequestInit) => {
    fetchCallCount++;

    if (fetchCallCount === 1) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: mockToken }),
      } as Response);
    } else {
      capturedUrl = _url;
      capturedOptions = options;
      return Promise.resolve(new Response("Success"));
    }
  };

  const requestOptions: RequestInit = {
    method: "POST",
    body: JSON.stringify({ data: "test" }),
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  };

  await makeAuthenticatedRequest("/api/data", requestOptions);

  assertEquals(capturedUrl, "/api/data");
  assertEquals(capturedOptions?.method, "POST");
  assertEquals(capturedOptions?.body, JSON.stringify({ data: "test" }));
  assertEquals(capturedOptions?.credentials, "include");
  assertEquals(
    (capturedOptions?.headers as Headers).get("X-CSRF-Token"),
    mockToken,
  );
  assertEquals(
    (capturedOptions?.headers as Headers).get("Content-Type"),
    "application/json",
  );

  cleanup();
});
