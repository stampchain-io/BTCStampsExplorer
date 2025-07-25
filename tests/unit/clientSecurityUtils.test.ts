import { assertEquals, assertRejects } from "@std/assert";
import {
  clearCSRFTokenCache,
  getCSRFToken,
  makeAuthenticatedRequest,
} from "$lib/utils/security/clientSecurityUtils.ts";

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

// Mock location for testing (set to non-localhost to ensure errors are thrown)
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

Deno.test("clientSecurityUtils - getCSRFToken success", async () => {
  setup();
  mockLocation("example.com"); // Non-localhost
  const mockToken = "test-csrf-token-123";
  mockFetch({ token: mockToken });

  const token = await getCSRFToken();
  assertEquals(token, mockToken, "Should return the token from response");

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - getCSRFToken handles HTTP error", async () => {
  setup();
  mockLocation("example.com"); // Non-localhost to ensure error is thrown
  mockFetch({}, false, 403);

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "HTTP error! status: 403",
    "Should throw error for non-ok response",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - getCSRFToken handles missing token", async () => {
  setup();
  mockLocation("example.com"); // Non-localhost
  mockFetch({ someOtherField: "value" }); // Response without token

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "No token received from server",
    "Should throw error when token is missing",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - getCSRFToken handles network error", async () => {
  setup();
  mockLocation("example.com"); // Non-localhost
  // Mock fetch to throw network error
  globalThis.fetch = () => {
    throw new Error("Network error");
  };

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "Network error",
    "Should propagate network errors",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - getCSRFToken handles JSON parse error", async () => {
  setup();
  mockLocation("example.com"); // Non-localhost
  // Mock fetch with invalid JSON response
  globalThis.fetch = () => {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Response);
  };

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "Invalid JSON",
    "Should propagate JSON parse errors",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

// Add a test for localhost behavior
Deno.test("clientSecurityUtils - getCSRFToken returns dummy token on localhost", async () => {
  setup();
  mockLocation("localhost"); // Set to localhost
  mockFetch({}, false, 403); // Simulate an error

  const token = await getCSRFToken();
  assertEquals(
    token,
    "dev-csrf-token",
    "Should return dummy token in development mode",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

// Test token caching functionality
Deno.test("clientSecurityUtils - getCSRFToken uses cached token", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "cached-csrf-token-123";

  let fetchCallCount = 0;
  globalThis.fetch = () => {
    fetchCallCount++;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: mockToken }),
    } as Response);
  };

  // First call should fetch token
  const token1 = await getCSRFToken();
  assertEquals(token1, mockToken, "Should return token from first fetch");
  assertEquals(fetchCallCount, 1, "Should have made one fetch call");

  // Second call should use cached token
  const token2 = await getCSRFToken();
  assertEquals(token2, mockToken, "Should return cached token");
  assertEquals(fetchCallCount, 1, "Should not make additional fetch calls");

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

// Test makeAuthenticatedRequest function
Deno.test("clientSecurityUtils - makeAuthenticatedRequest success", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "test-auth-token";
  const mockResponseData = { success: true };

  let csrfFetchCalled = false;
  let authRequestCalled = false;
  let authHeaders: Headers | undefined;

  globalThis.fetch = (url: string | URL | Request, options?: RequestInit) => {
    if (typeof url === "string" && url.includes("/api/internal/csrfToken")) {
      csrfFetchCalled = true;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: mockToken }),
      } as Response);
    } else {
      authRequestCalled = true;
      authHeaders = options?.headers as Headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponseData),
      } as Response);
    }
  };

  const response = await makeAuthenticatedRequest("/api/test", {
    method: "POST",
    body: JSON.stringify({ data: "test" }),
  });

  assertEquals(csrfFetchCalled, true, "Should fetch CSRF token");
  assertEquals(authRequestCalled, true, "Should make authenticated request");
  assertEquals(
    authHeaders?.get("X-CSRF-Token"),
    mockToken,
    "Should include CSRF token in headers",
  );

  const responseData = await response.json();
  assertEquals(responseData, mockResponseData, "Should return response data");

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - makeAuthenticatedRequest with existing headers", async () => {
  setup();
  mockLocation("example.com");
  const mockToken = "test-auth-token";

  let authHeaders: Headers | undefined;

  globalThis.fetch = (url: string | URL | Request, options?: RequestInit) => {
    if (typeof url === "string" && url.includes("/api/internal/csrfToken")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ token: mockToken }),
      } as Response);
    } else {
      authHeaders = options?.headers as Headers;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
      } as Response);
    }
  };

  await makeAuthenticatedRequest("/api/test", {
    headers: {
      "Content-Type": "application/json",
      "Custom-Header": "test-value",
    },
  });

  assertEquals(
    authHeaders?.get("X-CSRF-Token"),
    mockToken,
    "Should include CSRF token",
  );
  assertEquals(
    authHeaders?.get("Content-Type"),
    "application/json",
    "Should preserve existing headers",
  );
  assertEquals(
    authHeaders?.get("Custom-Header"),
    "test-value",
    "Should preserve custom headers",
  );

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});

Deno.test("clientSecurityUtils - makeAuthenticatedRequest fails on production, succeeds on localhost", async () => {
  setup();

  // Test production failure
  mockLocation("example.com");
  globalThis.fetch = () => {
    throw new Error("CSRF token fetch failed");
  };

  await assertRejects(
    async () => await makeAuthenticatedRequest("/api/test"),
    Error,
    "CSRF token fetch failed",
    "Should propagate CSRF token errors in production",
  );

  // Test localhost fallback
  setup();
  mockLocation("localhost");

  let fallbackRequestCalled = false;
  globalThis.fetch = (url: string | URL | Request) => {
    if (typeof url === "string" && url.includes("/api/internal/csrfToken")) {
      throw new Error("CSRF token fetch failed");
    } else {
      fallbackRequestCalled = true;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }
  };

  const response = await makeAuthenticatedRequest("/api/test");
  assertEquals(
    fallbackRequestCalled,
    true,
    "Should make request without CSRF token on localhost",
  );
  assertEquals(response.ok, true, "Should return successful response");

  // Restore original values
  globalThis.fetch = originalFetch;
  globalThis.location = originalLocation;
});
