import { assertEquals, assertRejects } from "@std/assert";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";

// Mock fetch for testing
function mockFetch(response: any, ok = true, status = 200) {
  globalThis.fetch = async () => {
    return {
      ok,
      status,
      json: async () => response,
    } as Response;
  };
}

// Save original fetch
const originalFetch = globalThis.fetch;

Deno.test("clientSecurityUtils - getCSRFToken success", async () => {
  const mockToken = "test-csrf-token-123";
  mockFetch({ token: mockToken });

  const token = await getCSRFToken();
  assertEquals(token, mockToken, "Should return the token from response");

  // Restore original fetch
  globalThis.fetch = originalFetch;
});

Deno.test("clientSecurityUtils - getCSRFToken handles HTTP error", async () => {
  mockFetch({}, false, 403);

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "HTTP error! status: 403",
    "Should throw error for non-ok response",
  );

  // Restore original fetch
  globalThis.fetch = originalFetch;
});

Deno.test("clientSecurityUtils - getCSRFToken handles missing token", async () => {
  mockFetch({ someOtherField: "value" }); // Response without token

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "No token received from server",
    "Should throw error when token is missing",
  );

  // Restore original fetch
  globalThis.fetch = originalFetch;
});

Deno.test("clientSecurityUtils - getCSRFToken handles network error", async () => {
  // Mock fetch to throw network error
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "Network error",
    "Should propagate network errors",
  );

  // Restore original fetch
  globalThis.fetch = originalFetch;
});

Deno.test("clientSecurityUtils - getCSRFToken handles JSON parse error", async () => {
  // Mock fetch with invalid JSON response
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Response;
  };

  await assertRejects(
    async () => await getCSRFToken(),
    Error,
    "Invalid JSON",
    "Should propagate JSON parse errors",
  );

  // Restore original fetch
  globalThis.fetch = originalFetch;
});
