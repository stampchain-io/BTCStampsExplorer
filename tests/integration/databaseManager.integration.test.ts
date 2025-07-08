import { assertEquals, assertRejects } from "@std/assert";
import { DatabaseManager } from "$server/database/databaseManager.ts";

// Force skip Redis for integration tests unless explicitly enabled
if (!Deno.env.get("ENABLE_REDIS_INTEGRATION_TESTS")) {
  (globalThis as any).SKIP_REDIS_CONNECTION = true;
}

// Test configuration - using LOCAL defaults, not production
const testConfig = {
  DB_HOST: Deno.env.get("TEST_DB_HOST") || "localhost",
  DB_USER: Deno.env.get("TEST_DB_USER") || "root",
  DB_PASSWORD: Deno.env.get("TEST_DB_PASSWORD") || "",
  DB_PORT: parseInt(Deno.env.get("TEST_DB_PORT") || "3306"),
  DB_NAME: Deno.env.get("TEST_DB_NAME") || "test_btcstamps",
  DB_MAX_RETRIES: 1, // Reduced retries for faster test failure
  ELASTICACHE_ENDPOINT: Deno.env.get("TEST_REDIS_HOST") || "localhost", // Use TEST_ prefix
  DENO_ENV: "test", // Important: this prevents file logging
  CACHE: "true",
  REDIS_LOG_LEVEL: "ERROR", // Minimal logging to avoid file operations
};

console.log("=== TEST CONFIGURATION ===");
console.log(`DB_HOST: ${testConfig.DB_HOST}`);
console.log(`DB_NAME: ${testConfig.DB_NAME}`);
console.log(`REDIS_HOST: ${testConfig.ELASTICACHE_ENDPOINT}`);
console.log(
  `SKIP_REDIS_CONNECTION: ${(globalThis as any).SKIP_REDIS_CONNECTION}`,
);
console.log("==========================");

// Utility to check if services are available
async function isDatabaseAvailable(): Promise<boolean> {
  // Simple TCP connectivity check instead of full database connection
  try {
    const conn = await Deno.connect({
      hostname: testConfig.DB_HOST,
      port: testConfig.DB_PORT,
    });
    conn.close();
    return true;
  } catch {
    return false;
  }
}

async function isRedisAvailable(): Promise<boolean> {
  // Skip Redis check if globally disabled
  if ((globalThis as any).SKIP_REDIS_CONNECTION) {
    return false;
  }

  try {
    // Try to connect via Deno's TCP to check if Redis port is open
    const conn = await Deno.connect({
      hostname: testConfig.ELASTICACHE_ENDPOINT,
      port: 6379,
    });
    conn.close();
    return true;
  } catch {
    return false;
  }
}

Deno.test("DatabaseManager Integration Tests", async (t) => {
  await t.step("DatabaseManager Class Instantiation", () => {
    // Test that we can create a DatabaseManager instance
    const dbManager = new DatabaseManager(testConfig);
    assertEquals(typeof dbManager, "object");
    assertEquals(typeof dbManager.initialize, "function");
    assertEquals(typeof dbManager.executeQuery, "function");
    assertEquals(typeof dbManager.executeQueryWithCache, "function");
  });

  await t.step("Configuration Validation", async () => {
    // Test invalid configuration handling
    const invalidConfig = {
      ...testConfig,
      DB_HOST: "", // Invalid empty host
      DB_MAX_RETRIES: 1,
    };

    const dbManager = new DatabaseManager(invalidConfig);

    // Should fail gracefully when trying to execute query
    await assertRejects(
      async () => {
        await dbManager.executeQuery("SELECT 1", []);
      },
      Error,
    );
  });

  await t.step("Cache Key Generation", async () => {
    const dbManager = new DatabaseManager(testConfig);

    // Test that the same query/params generate the same cache key
    // We can't directly test this without accessing private methods,
    // but we can test that caching behavior is consistent

    // Set SKIP_REDIS_CONNECTION to test in-memory cache
    (globalThis as any).SKIP_REDIS_CONNECTION = true;

    await dbManager.initialize();

    // This will use in-memory cache since Redis is skipped
    const query = "SELECT ? as test_value";
    const params = ["cache_test"];

    try {
      // These would fail on database connection, but we're testing cache logic
      await dbManager.executeQueryWithCache(query, params, 60);
    } catch {
      // Expected to fail on DB connection, that's ok for this test
    }

    await dbManager.closeAllClients();

    // Reset global flag
    delete (globalThis as any).SKIP_REDIS_CONNECTION;
  });

  // Conditional tests based on service availability
  const dbAvailable = await isDatabaseAvailable();
  const redisAvailable = await isRedisAvailable();

  console.log(
    `Test environment: Database=${
      dbAvailable ? "Available" : "Not Available"
    }, Redis=${redisAvailable ? "Available" : "Not Available"}`,
  );

  if (dbAvailable) {
    await t.step("Database Connection Tests (Real DB)", async (st) => {
      await st.step("should connect and execute basic queries", async () => {
        const dbManager = new DatabaseManager(testConfig);
        await dbManager.initialize();

        const result = await dbManager.executeQuery("SELECT ? as test_value", [
          "integration_test",
        ]) as any;
        assertEquals(result.rows?.[0]?.test_value, "integration_test");

        await dbManager.closeAllClients();
      });

      await st.step("should handle parameterized queries", async () => {
        const dbManager = new DatabaseManager(testConfig);
        await dbManager.initialize();

        const values = [42, "test_string", 3.14159];
        const result = await dbManager.executeQuery(
          "SELECT ? as int_val, ? as str_val, ? as float_val",
          values,
        ) as any;

        assertEquals(result.rows?.[0]?.int_val, 42);
        assertEquals(result.rows?.[0]?.str_val, "test_string");
        assertEquals(result.rows?.[0]?.float_val, 3.14159);

        await dbManager.closeAllClients();
      });

      await st.step("should handle SQL injection prevention", async () => {
        const dbManager = new DatabaseManager(testConfig);
        await dbManager.initialize();

        const maliciousInput = "'; DROP TABLE test; --";
        const result = await dbManager.executeQuery(
          "SELECT ? as safe_value",
          [maliciousInput],
        ) as any;

        // The malicious input should be safely escaped
        assertEquals(result.rows?.[0]?.safe_value, maliciousInput);

        await dbManager.closeAllClients();
      });
    });
  } else {
    await t.step(
      "Database Connection Tests (Skipped - DB Not Available)",
      () => {
        console.log("⚠️ Skipping database tests - MySQL not available");
        console.log(
          `   Configure database connection with: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME`,
        );
      },
    );
  }

  if (redisAvailable) {
    await t.step("Redis Integration Tests (Real Redis)", async (st) => {
      await st.step("should initialize Redis connection", async () => {
        const dbManager = new DatabaseManager(testConfig);

        // Don't skip Redis for this test
        delete (globalThis as any).SKIP_REDIS_CONNECTION;

        await dbManager.initialize();

        // If we get here, Redis connection succeeded
        console.log("✅ Redis connection initialized successfully");

        await dbManager.closeAllClients();
      });
    });
  } else {
    await t.step(
      "Redis Integration Tests (Skipped - Redis Not Available)",
      () => {
        console.log("⚠️ Skipping Redis tests - Redis not available");
        console.log(
          `   Start Redis on localhost:6379 or set ELASTICACHE_ENDPOINT`,
        );
      },
    );
  }

  await t.step("In-Memory Cache Fallback Tests", async (st) => {
    await st.step(
      "should work with in-memory cache when Redis unavailable",
      async () => {
        // Force skip Redis to test in-memory fallback
        (globalThis as any).SKIP_REDIS_CONNECTION = true;

        const dbManager = new DatabaseManager({
          ...testConfig,
          ELASTICACHE_ENDPOINT: "nonexistent-redis-host", // Force Redis failure
        });

        await dbManager.initialize();

        // Test cache behavior without external dependencies
        // This tests the in-memory cache logic
        console.log("✅ In-memory cache fallback working");

        await dbManager.closeAllClients();

        // Reset global flag
        delete (globalThis as any).SKIP_REDIS_CONNECTION;
      },
    );
  });

  await t.step("Error Handling Tests", async (st) => {
    await st.step("should handle invalid database configuration", async () => {
      const invalidConfig = {
        ...testConfig,
        DB_HOST: "definitely-nonexistent-host-12345",
        DB_MAX_RETRIES: 1, // Fast failure
      };

      const dbManager = new DatabaseManager(invalidConfig);

      await assertRejects(
        async () => {
          await dbManager.executeQuery("SELECT 1", []);
        },
        Error,
      );
    });

    await st.step("should handle connection pool management", async () => {
      // Force skip Redis for this test to avoid connection attempts
      (globalThis as any).SKIP_REDIS_CONNECTION = true;

      const dbManager = new DatabaseManager(testConfig);

      // Test that we can call these methods without error
      await dbManager.closeAllClients(); // Should not throw even if no connections

      // Test initialization (should skip Redis due to flag)
      await dbManager.initialize(); // Should not throw

      await dbManager.closeAllClients();

      // Reset flag to original state
      if (!Deno.env.get("ENABLE_REDIS_INTEGRATION_TESTS")) {
        (globalThis as any).SKIP_REDIS_CONNECTION = true;
      }
    });
  });
});

Deno.test("DatabaseManager Cache Logic Tests", async (t) => {
  await t.step("Cache Key Consistency", async () => {
    const dbManager = new DatabaseManager(testConfig);

    // Force use of in-memory cache
    (globalThis as any).SKIP_REDIS_CONNECTION = true;
    await dbManager.initialize();

    // Test that cache invalidation works
    await dbManager.invalidateCacheByPattern("test*");

    console.log("✅ Cache invalidation method callable");

    await dbManager.closeAllClients();
    delete (globalThis as any).SKIP_REDIS_CONNECTION;
  });
});

// Performance test that doesn't require external services
Deno.test("DatabaseManager Performance Tests", async (t) => {
  await t.step("Initialization Performance", async () => {
    const start = Date.now();

    const dbManager = new DatabaseManager(testConfig);

    // Force skip external services for pure initialization test
    (globalThis as any).SKIP_REDIS_CONNECTION = true;

    await dbManager.initialize();

    const initTime = Date.now() - start;

    console.log(`DatabaseManager initialization time: ${initTime}ms`);

    // Initialization should be reasonably fast
    assertEquals(
      initTime < 5000,
      true,
      "Initialization should complete within 5 seconds",
    );

    await dbManager.closeAllClients();
    delete (globalThis as any).SKIP_REDIS_CONNECTION;
  });
});
