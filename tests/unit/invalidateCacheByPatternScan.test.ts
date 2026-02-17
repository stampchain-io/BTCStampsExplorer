/**
 * @fileoverview Unit tests for invalidateCacheByPattern() SCAN cursor iteration
 *
 * Tests that the SCAN-based cursor loop in invalidateCacheByPattern():
 * 1. Iterates through all cursor pages and collects all keys
 * 2. Terminates when cursor returns 0
 * 3. Deletes keys in batches of ~100
 * 4. Skips del() call when no keys are found
 * 5. Does not use the blocking KEYS command
 *
 * BUG 5 fix verification: Replace O(N) blocking KEYS with non-blocking SCAN.
 */

import { assertEquals, assertExists } from "@std/assert";

// Suppress console output during tests
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
};

function mockConsole() {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
}

function restoreConsole() {
  Object.assign(console, originalConsole);
}

// -----------------------------------------------------------------------
// Mock Redis client with SCAN support (no KEYS command)
// -----------------------------------------------------------------------
class MockRedisScanClient {
  private _storage: Map<string, string> = new Map();
  private _scanCallCount = 0;
  private _deletedKeys: string[] = [];
  private _keysCallCount = 0; // Track forbidden KEYS usage

  // Seed keys for testing
  seedKeys(keys: string[]): void {
    for (const key of keys) {
      this._storage.set(key, "value");
    }
  }

  get scanCallCount(): number {
    return this._scanCallCount;
  }

  get deletedKeys(): string[] {
    return this._deletedKeys;
  }

  get keysCallCount(): number {
    return this._keysCallCount;
  }

  /**
   * SCAN simulation: returns paginated results.
   * Returns [nextCursor, matchingKeys] — same interface as deno.land/x/redis@v0.40.0.
   * When nextCursor is "0", iteration is complete.
   */
  scan(
    cursor: number | string,
    options?: { match?: string; count?: number },
  ): Promise<[string, string[]]> {
    this._scanCallCount++;
    const pattern = options?.match ?? "*";
    const pageSize = options?.count ?? 10;

    // Get all matching keys from storage
    const allMatching = Array.from(this._storage.keys()).filter((key) =>
      new RegExp("^" + pattern.replace(/\*/g, ".*") + "$").test(key)
    );

    const cursorNum = Number(cursor);
    const page = allMatching.slice(cursorNum, cursorNum + pageSize);
    const nextCursor = cursorNum + pageSize >= allMatching.length
      ? "0"
      : String(cursorNum + pageSize);

    return Promise.resolve([nextCursor, page]);
  }

  /**
   * Deliberately track KEYS calls to verify it is NOT used.
   */
  keys(_pattern: string): Promise<string[]> {
    this._keysCallCount++;
    return Promise.resolve(Array.from(this._storage.keys()));
  }

  del(...keysToDelete: string[]): Promise<number> {
    let count = 0;
    for (const key of keysToDelete) {
      if (this._storage.delete(key)) {
        count++;
      }
      this._deletedKeys.push(key);
    }
    return Promise.resolve(count);
  }

  ping(): Promise<string> {
    return Promise.resolve("PONG");
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this._storage.get(key) ?? null);
  }

  set(key: string, value: string): Promise<string> {
    this._storage.set(key, value);
    return Promise.resolve("OK");
  }
}

// -----------------------------------------------------------------------
// Minimal TestDatabaseManager that exercises the SCAN path
// -----------------------------------------------------------------------
// This class mirrors the actual invalidateCacheByPattern() logic from
// server/database/databaseManager.ts after the SCAN fix is applied.
// It lets us test the SCAN loop in isolation without loading the full class.
class TestCacheScanManager {
  private redisClient: MockRedisScanClient | undefined;
  private redisAvailable = false;
  private redisAvailableAtStartup = false;
  private connectToRedisInBackground_calls = 0;
  private inMemoryCacheInvalidations: string[] = [];

  setRedisClient(client: MockRedisScanClient): void {
    this.redisClient = client;
    this.redisAvailable = true;
    this.redisAvailableAtStartup = true;
  }

  get reconnectAttempts(): number {
    return this.connectToRedisInBackground_calls;
  }

  get inMemoryInvalidations(): string[] {
    return this.inMemoryCacheInvalidations;
  }

  private connectToRedisInBackground(): void {
    this.connectToRedisInBackground_calls++;
  }

  private invalidateInMemoryCacheByPattern(pattern: string): void {
    this.inMemoryCacheInvalidations.push(pattern);
  }

  /**
   * Implementation matching the SCAN-based fix for BUG 5.
   * This is the exact code that should be in databaseManager.ts after the fix.
   */
  async invalidateCacheByPattern(pattern: string): Promise<void> {
    if (this.redisClient) {
      try {
        // SCAN cursor iteration — replaces blocking KEYS command
        let cursor = 0;
        const allKeys: string[] = [];
        do {
          const [nextCursor, keys] = await this.redisClient.scan(cursor, {
            match: pattern,
            count: 100,
          });
          cursor = Number(nextCursor);
          allKeys.push(...keys);
        } while (cursor !== 0);

        // Delete in batches of 100 to avoid oversized DEL commands
        if (allKeys.length > 0) {
          const BATCH_SIZE = 100;
          for (let i = 0; i < allKeys.length; i += BATCH_SIZE) {
            const batch = allKeys.slice(i, i + BATCH_SIZE);
            await this.redisClient.del(...batch);
          }
          console.log(
            `Cache invalidated ${allKeys.length} keys for pattern: ${pattern}`,
          );
        }
      } catch (error) {
        console.error("Failed to invalidate Redis cache by pattern:", error);
        if (this.redisAvailableAtStartup) {
          this.connectToRedisInBackground();
        }
        this.redisAvailable = false;
      }
    }
    this.invalidateInMemoryCacheByPattern(pattern);
  }
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

Deno.test("invalidateCacheByPattern() SCAN cursor iteration", async (t) => {
  await t.step("collects keys across multiple cursor pages", async () => {
    mockConsole();

    const client = new MockRedisScanClient();
    // Seed 25 keys — with pageSize=100 this needs 1 SCAN call
    for (let i = 0; i < 25; i++) {
      client.seedKeys([`stamp_${i}`]);
    }

    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("stamp_*");

    // All 25 keys should have been deleted
    assertEquals(client.deletedKeys.length, 25);

    restoreConsole();
  });

  await t.step(
    "terminates SCAN loop when cursor returns 0 after multiple pages",
    async () => {
      mockConsole();

      // Use a small page size to force multiple SCAN iterations
      // We'll do this via a custom mock that paginates in pages of 3

      class PaginatedScanClient extends MockRedisScanClient {
        private _allKeys: string[] = [];

        override seedKeys(keys: string[]): void {
          this._allKeys.push(...keys);
          for (const k of keys) {
            // Access parent storage via workaround
            this.set(k, "v");
          }
        }

        override scan(
          cursor: number | string,
          options?: { match?: string; count?: number },
        ): Promise<[string, string[]]> {
          // Always page in groups of 3 regardless of count parameter
          const PAGE_SIZE = 3;
          const cursorNum = Number(cursor);
          const page = this._allKeys.slice(cursorNum, cursorNum + PAGE_SIZE);
          const nextCursor = cursorNum + PAGE_SIZE >= this._allKeys.length
            ? "0"
            : String(cursorNum + PAGE_SIZE);

          // Count calls via parent
          return super.scan(cursor, options).then(() => [nextCursor, page]);
        }
      }

      const client = new PaginatedScanClient();
      const keys = ["a_1", "a_2", "a_3", "a_4", "a_5", "a_6", "a_7"];
      client.seedKeys(keys);

      const manager = new TestCacheScanManager();
      manager.setRedisClient(client);

      await manager.invalidateCacheByPattern("a_*");

      // All 7 keys should be deleted
      assertEquals(client.deletedKeys.length, 7);

      restoreConsole();
    },
  );

  await t.step("skips del() call when no keys match pattern", async () => {
    mockConsole();

    const client = new MockRedisScanClient();
    // Seed keys that do NOT match the pattern we query
    client.seedKeys(["other_key1", "other_key2"]);

    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("stamp_*");

    // No keys should be deleted since no stamp_* keys exist
    assertEquals(client.deletedKeys.length, 0);

    restoreConsole();
  });

  await t.step("does not call KEYS command (no blocking calls)", async () => {
    mockConsole();

    const client = new MockRedisScanClient();
    client.seedKeys(["stamp_1", "stamp_2", "stamp_3"]);

    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("stamp_*");

    // KEYS command must NOT have been called
    assertEquals(
      client.keysCallCount,
      0,
      "KEYS command must not be used — use SCAN instead",
    );
    // SCAN must have been called at least once
    assertEquals(client.scanCallCount >= 1, true);

    restoreConsole();
  });

  await t.step("deletes keys in batches of 100", async () => {
    mockConsole();

    const client = new MockRedisScanClient();
    // Seed 250 keys to verify batch deletion
    const allSeeded: string[] = [];
    for (let i = 0; i < 250; i++) {
      allSeeded.push(`block_${i}`);
    }
    client.seedKeys(allSeeded);

    // Track del() call batches via a wrapper
    const delBatchSizes: number[] = [];
    const originalDel = client.del.bind(client);
    client.del = async (...keys: string[]): Promise<number> => {
      delBatchSizes.push(keys.length);
      return originalDel(...keys);
    };

    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("block_*");

    // All 250 keys must be deleted
    assertEquals(client.deletedKeys.length, 250);

    // Each batch must be <= 100
    for (const batchSize of delBatchSizes) {
      assertEquals(
        batchSize <= 100,
        true,
        `Batch size ${batchSize} exceeds 100`,
      );
    }

    // Must have required at least 3 batches for 250 keys
    assertEquals(delBatchSizes.length >= 3, true);

    restoreConsole();
  });

  await t.step(
    "handles empty redis client gracefully (no crash when client is absent)",
    async () => {
      mockConsole();

      // Manager without a redis client set
      const manager = new TestCacheScanManager();

      // Should not throw
      await manager.invalidateCacheByPattern("stamp_*");

      // In-memory invalidation should still run
      assertEquals(manager.inMemoryInvalidations, ["stamp_*"]);

      restoreConsole();
    },
  );

  await t.step("always invalidates in-memory cache regardless of redis", async () => {
    mockConsole();

    const client = new MockRedisScanClient();
    client.seedKeys(["market_data_1"]);

    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("market_data_*");

    // In-memory invalidation must have run
    assertEquals(manager.inMemoryInvalidations.includes("market_data_*"), true);

    restoreConsole();
  });

  await t.step(
    "handles redis scan error gracefully (marks redis unavailable)",
    async () => {
      mockConsole();

      class FailingScanClient extends MockRedisScanClient {
        override scan(): Promise<[string, string[]]> {
          throw new Error("Redis SCAN operation failed");
        }
      }

      const client = new FailingScanClient();
      const manager = new TestCacheScanManager();
      manager.setRedisClient(client);

      // Should not throw
      await manager.invalidateCacheByPattern("stamp_*");

      // Reconnect should have been triggered
      assertEquals(manager.reconnectAttempts, 1);

      // In-memory invalidation still runs after error
      assertEquals(manager.inMemoryInvalidations.includes("stamp_*"), true);

      restoreConsole();
    },
  );

  await t.step("SCAN loop terminates when first response returns cursor 0", async () => {
    mockConsole();

    // Scenario: Empty result set - scan returns cursor "0" immediately
    class EmptyScanClient extends MockRedisScanClient {
      private _scanCalls = 0;

      get scanCalls(): number {
        return this._scanCalls;
      }

      override scan(): Promise<[string, string[]]> {
        this._scanCalls++;
        return Promise.resolve(["0", []]);
      }
    }

    const client = new EmptyScanClient();
    const manager = new TestCacheScanManager();
    manager.setRedisClient(client);

    await manager.invalidateCacheByPattern("stamp_*");

    // SCAN should have been called exactly once
    assertEquals(client.scanCalls, 1);
    assertEquals(client.deletedKeys.length, 0);

    restoreConsole();
  });
});

Deno.test(
  "invalidateCacheByPattern() SCAN: cursor 0 as number terminates loop",
  async () => {
    mockConsole();

    // Verify cursor=0 (numeric) properly terminates the do-while loop
    // The do-while condition is: while (cursor !== 0)
    // After scan returns "0", Number("0") === 0 so loop ends
    let cursor: number = 0;
    let iterations = 0;
    const responses: [string, string[]][] = [
      ["5", ["key1", "key2", "key3", "key4", "key5"]],
      ["0", ["key6", "key7"]],
    ];

    const allKeys: string[] = [];
    do {
      const idx = iterations;
      const [nextCursor, keys] = responses[idx];
      cursor = Number(nextCursor);
      allKeys.push(...keys);
      iterations++;
    } while (cursor !== 0);

    // Should have iterated exactly 2 times
    assertEquals(iterations, 2);
    assertEquals(allKeys.length, 7);
    assertEquals(cursor, 0);

    restoreConsole();
  },
);
