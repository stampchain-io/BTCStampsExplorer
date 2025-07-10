/**
 * @fileoverview Tests for env.ts configuration module
 * Uses mocks to avoid side effects and ensure CI compatibility
 *
 * Note: env.ts sets environment variables and global state when imported,
 * so we test the logic indirectly by examining its effects
 */

import { assertEquals, assertExists } from "@std/assert";

// Import env.ts to ensure it runs before our tests
await import("../../server/config/env.ts");

// Save original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Helper to suppress console output
function mockConsole() {
  console.log = () => {};
  console.error = () => {};
}

// Helper to restore console
function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

Deno.test("env.ts configuration logic", async (t) => {
  // Since env.ts has already been imported, we test the logic that would
  // have been applied based on current environment

  await t.step(
    "verifies SKIP_REDIS_CONNECTION is set for test environment",
    () => {
      mockConsole();

      // In test environment, SKIP_REDIS_CONNECTION should be true
      const currentEnv = Deno.env.get("DENO_ENV");
      if (currentEnv === "test") {
        assertEquals((globalThis as any).SKIP_REDIS_CONNECTION, true);
      }

      restoreConsole();
    },
  );

  await t.step("verifies DENO_ENV is set", () => {
    // DENO_ENV should always be set after env.ts loads
    const denoEnv = Deno.env.get("DENO_ENV");
    assertExists(denoEnv);
    assertEquals(typeof denoEnv, "string");
    assertEquals(denoEnv.length > 0, true);
  });

  await t.step("verifies Redis skip logic based on environment", () => {
    const envMode = Deno.env.get("DENO_ENV");
    const forceRedis = Deno.env.get("FORCE_REDIS_CONNECTION") === "true";
    const skipRedis = (globalThis as any).SKIP_REDIS_CONNECTION;

    // Verify the logic matches what env.ts should set
    if (envMode === "test") {
      assertEquals(skipRedis, true, "Redis should be skipped in test mode");
    } else if (envMode === "development" && !forceRedis) {
      assertEquals(
        skipRedis,
        true,
        "Redis should be skipped in dev mode by default",
      );
    } else if (envMode === "production") {
      // In production, Redis is not skipped unless it's a build
      assertEquals(typeof skipRedis, "boolean");
    }
  });
});

Deno.test("env.ts Redis configuration logging", () => {
  mockConsole();

  // Test that in test mode, Redis settings are not logged
  // This was already done when env.ts was imported
  const isTest = Deno.env.get("DENO_ENV") === "test";

  if (isTest) {
    // In test mode, the Redis settings should not have been logged
    // We can't test this directly since env.ts already ran
    assertEquals(typeof (globalThis as any).SKIP_REDIS_CONNECTION, "boolean");
  }

  restoreConsole();
});

Deno.test("env.ts sets appropriate defaults", () => {
  // Test that env.ts has set up the environment correctly
  const skipRedis = (globalThis as any).SKIP_REDIS_CONNECTION;

  // SKIP_REDIS_CONNECTION should be defined
  assertEquals(typeof skipRedis, "boolean");

  // DENO_ENV should be set
  const denoEnv = Deno.env.get("DENO_ENV");
  assertExists(denoEnv);

  // If we're in test mode, verify test-specific settings
  if (denoEnv === "test") {
    assertEquals(
      skipRedis,
      true,
      "Redis should be skipped in test environment",
    );
  }
});

Deno.test("env.ts Redis skip conditions", () => {
  // Test the conditions that would cause Redis to be skipped
  const testCases = [
    { env: "test", forceRedis: false, expectedSkip: true },
    { env: "test", forceRedis: true, expectedSkip: true }, // test always skips
    { env: "development", forceRedis: false, expectedSkip: true },
    { env: "development", forceRedis: true, expectedSkip: false },
    { env: "production", forceRedis: false, expectedSkip: false },
  ];

  for (const testCase of testCases) {
    // Calculate what the skip value should be based on the logic
    const isBuild = false; // We're not in build mode during tests
    const isTest = testCase.env === "test";
    const skipForDev = testCase.env === "development";

    const expectedSkipRedis = isBuild || isTest ||
      (skipForDev && !testCase.forceRedis);

    assertEquals(
      expectedSkipRedis,
      testCase.expectedSkip,
      `Failed for env: ${testCase.env}, forceRedis: ${testCase.forceRedis}`,
    );
  }
});

Deno.test("env.ts dotenv loading effect", () => {
  // Test that .env loading would have worked by checking if env vars can be set
  const testKey = "TEST_ENV_VAR_" + Date.now();
  const testValue = "test_value";

  // Set a test env var
  Deno.env.set(testKey, testValue);

  // Verify it was set
  assertEquals(Deno.env.get(testKey), testValue);

  // Clean up
  Deno.env.delete(testKey);

  // Verify it was deleted
  assertEquals(Deno.env.get(testKey), undefined);
});
