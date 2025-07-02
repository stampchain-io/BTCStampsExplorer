import { assertEquals, assertRejects } from "@std/assert";
import {
  clearCSRFTokenCache,
  getCSRFToken,
} from "$lib/utils/clientSecurityUtils.ts";

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
