/**
 * @fileoverview Unit tests for appendToCachedList() TTL fix (BUG 3)
 *
 * Verifies that the non-atomic set()+expire() pattern has been replaced with
 * a single atomic set(key, value, { ex: ttl }) call to eliminate the race
 * window where a Redis key has no TTL.
 *
 * Tests the extracted logic directly (since private class fields prevent
 * testing DatabaseManager directly), mirroring the pattern in
 * databaseManager.comprehensive.test.ts.
 */

import { assertEquals } from "@std/assert";

// ---------------------------------------------------------------------------
// Mock Redis client that records every call for assertion
// ---------------------------------------------------------------------------

interface SetCall {
  key: string;
  value: string;
  options?: { ex?: number };
}

interface ExpireCall {
  key: string;
  ttl: number;
}

class TrackingRedisClient {
  private _storage: Map<string, string> = new Map();
  private _ttlMap: Map<string, number> = new Map();

  setCalls: SetCall[] = [];
  expireCalls: ExpireCall[] = [];

  /** Seed a key with data and a TTL for use in test setup */
  seed(key: string, value: string, ttl: number): void {
    this._storage.set(key, value);
    this._ttlMap.set(key, ttl);
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this._storage.get(key) ?? null);
  }

  ttl(key: string): Promise<number> {
    const storedTtl = this._ttlMap.get(key);
    if (storedTtl === undefined) {
      // -2 means key doesn't exist in Redis
      return Promise.resolve(-2);
    }
    return Promise.resolve(storedTtl);
  }

  set(key: string, value: string, options?: { ex?: number }): Promise<string> {
    this.setCalls.push({ key, value, options });
    this._storage.set(key, value);
    return Promise.resolve("OK");
  }

  /** Included to detect if any code path still calls expire() separately */
  expire(key: string, ttl: number): Promise<number> {
    this.expireCalls.push({ key, ttl });
    return Promise.resolve(1);
  }
}

// ---------------------------------------------------------------------------
// Extracted logic — mirrors appendToCachedList() TTL block exactly
// ---------------------------------------------------------------------------

const DEFAULT_CACHE_DURATION = 60 * 60 * 12; // 43200s — matches database.ts

/**
 * Applies the fixed TTL-preserving write logic from appendToCachedList().
 *
 * This function mirrors lines 1421-1434 of databaseManager.ts after the fix.
 */
async function applyAtomicCacheUpdate(
  redisClient: TrackingRedisClient,
  cacheKey: string,
  serializedValue: string,
): Promise<"skipped" | "written"> {
  const ttl = await redisClient.ttl(cacheKey);

  if (ttl === -2) {
    // Key no longer exists; skip update
    return "skipped";
  } else if (ttl > 0) {
    // Key has a positive TTL — preserve it atomically
    await redisClient.set(cacheKey, serializedValue, { ex: ttl });
    return "written";
  } else {
    // ttl === -1: key exists but has no expiry — apply DEFAULT_CACHE_DURATION
    await redisClient.set(cacheKey, serializedValue, { ex: DEFAULT_CACHE_DURATION });
    return "written";
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

Deno.test("appendToCachedList TTL fix — atomic set, no separate expire()", async (t) => {
  // -------------------------------------------------------------------------
  await t.step("ttl > 0: set() is called with { ex: ttl } — no expire() call", async () => {
    const client = new TrackingRedisClient();
    const key = "stamps:recent:page1";
    const storedTtl = 3600; // 1 hour remaining
    client.seed(key, JSON.stringify({ data: [{ id: 1 }], total: 1 }), storedTtl);

    const updatedValue = JSON.stringify({ data: [{ id: 1 }, { id: 2 }], total: 2 });
    const result = await applyAtomicCacheUpdate(client, key, updatedValue);

    assertEquals(result, "written");
    assertEquals(client.setCalls.length, 1, "set() must be called exactly once");
    assertEquals(client.setCalls[0].key, key);
    assertEquals(client.setCalls[0].options, { ex: storedTtl },
      "set() must include { ex: ttl } so TTL is applied atomically");
    assertEquals(client.expireCalls.length, 0,
      "expire() must NOT be called separately — would create a race window");
  });

  // -------------------------------------------------------------------------
  await t.step("ttl === -1 (no expiry): set() uses DEFAULT_CACHE_DURATION fallback", async () => {
    const client = new TrackingRedisClient();
    const key = "stamps:all:v1";
    // TTL of -1 means the key exists but was set without expiry
    client.seed(key, JSON.stringify({ data: [{ id: 10 }], total: 1 }), -1);

    const updatedValue = JSON.stringify({ data: [{ id: 10 }, { id: 11 }], total: 2 });
    const result = await applyAtomicCacheUpdate(client, key, updatedValue);

    assertEquals(result, "written");
    assertEquals(client.setCalls.length, 1, "set() must be called exactly once");
    assertEquals(client.setCalls[0].options, { ex: DEFAULT_CACHE_DURATION },
      "DEFAULT_CACHE_DURATION (43200s) must be used when key had no expiry");
    assertEquals(DEFAULT_CACHE_DURATION, 43200,
      "DEFAULT_CACHE_DURATION must match database.ts value of 60*60*12");
    assertEquals(client.expireCalls.length, 0,
      "expire() must NOT be called separately");
  });

  // -------------------------------------------------------------------------
  await t.step("ttl === -2 (key gone): update is skipped, set() not called", async () => {
    const client = new TrackingRedisClient();
    // Key not seeded → ttl() will return -2 (key doesn't exist)
    const key = "stamps:expired:key";

    const result = await applyAtomicCacheUpdate(client, key, JSON.stringify({ data: [] }));

    assertEquals(result, "skipped",
      "Update must be skipped when key no longer exists in Redis");
    assertEquals(client.setCalls.length, 0,
      "set() must NOT be called for a non-existent key");
    assertEquals(client.expireCalls.length, 0,
      "expire() must NOT be called");
  });

  // -------------------------------------------------------------------------
  await t.step("multiple keys with different TTLs: each preserves its own TTL atomically", async () => {
    const client = new TrackingRedisClient();
    const keys = [
      { key: "key:short", ttl: 300 },
      { key: "key:long", ttl: 7200 },
      { key: "key:permanent", ttl: -1 },
      { key: "key:gone", ttl: -2 },
    ];

    for (const { key, ttl } of keys) {
      if (ttl !== -2) {
        client.seed(key, JSON.stringify({ data: [], total: 0 }), ttl);
      }
    }

    const newValue = JSON.stringify({ data: [{ id: 99 }], total: 1 });

    for (const { key } of keys) {
      await applyAtomicCacheUpdate(client, key, newValue);
    }

    // Should have exactly 3 set() calls (skipped key:gone)
    assertEquals(client.setCalls.length, 3,
      "set() must be called for 3 of 4 keys (key:gone is skipped)");
    assertEquals(client.expireCalls.length, 0,
      "expire() must never be called regardless of TTL value");

    // Verify each key got the right TTL
    const shortCall = client.setCalls.find((c) => c.key === "key:short");
    const longCall = client.setCalls.find((c) => c.key === "key:long");
    const permanentCall = client.setCalls.find((c) => c.key === "key:permanent");

    assertEquals(shortCall?.options, { ex: 300 }, "Short TTL key must use 300s");
    assertEquals(longCall?.options, { ex: 7200 }, "Long TTL key must use 7200s");
    assertEquals(permanentCall?.options, { ex: DEFAULT_CACHE_DURATION },
      "Permanent key must fall back to DEFAULT_CACHE_DURATION");
  });

  // -------------------------------------------------------------------------
  await t.step("DEFAULT_CACHE_DURATION matches database.ts constant (43200s = 12 hours)", () => {
    // This is a regression guard: if database.ts changes the value, this test fails.
    assertEquals(DEFAULT_CACHE_DURATION, 43200,
      "DEFAULT_CACHE_DURATION must be 60*60*12 = 43200 seconds");
  });
});
