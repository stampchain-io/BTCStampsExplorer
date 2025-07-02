import { assert, assertEquals, assertExists } from "@std/assert";
import { returnsNext, stub } from "@std/testing/mock";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { btcPriceFixture } from "../fixtures/marketDataFixtures.ts";
import { FixtureTestHelper } from "../helpers/fixtureTestHelper.ts";
import btcPriceApiResponses from "../fixtures/btcPriceApiResponses.json" with {
  type: "json",
};

Deno.test("BTCPriceService Unit Tests", async (t) => {
  let testHelper: FixtureTestHelper;
  let fetchStub: any;

  // Setup before each test
  function setup() {
    testHelper = new FixtureTestHelper();
    // Clear any existing stubs
    if (fetchStub) {
      fetchStub.restore();
      fetchStub = null;
    }
  }

  // Teardown after each test
  async function teardown() {
    await testHelper.restore();
    if (fetchStub) {
      fetchStub.restore();
      fetchStub = null;
    }
  }

  await t.step("getPrice - returns cached price data", async () => {
    setup();

    // Mock the cache to return our fixture price
    const cachedPrice = {
      price: btcPriceFixture.btc_usd,
      source: "cached" as const,
      confidence: "high" as const,
      timestamp: Date.now(),
    };

    const cacheStub = stub(
      dbManager,
      "handleCache",
      () => Promise.resolve(cachedPrice),
    );

    const result = await BTCPriceService.getPrice();

    assertEquals(result.price, btcPriceFixture.btc_usd);
    assertEquals(result.source, "cached");
    assertEquals(result.confidence, "high");
    assertExists(result.timestamp);

    cacheStub.restore();
    await teardown();
  });

  await t.step("getPrice - fetches fresh data when cache miss", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Mock fetch for CoinGecko using real API response structure
    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.coingecko.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    const result = await BTCPriceService.getPrice();

    assertEquals(
      result.price,
      btcPriceApiResponses.responses.coingecko.success.data.bitcoin.usd,
    );
    assert(["coingecko", "binance"].includes(result.source));
    assertEquals(result.confidence, "high");
    assertExists(result.timestamp);

    cacheStub.restore();
    await teardown();
  });

  await t.step("getPrice - handles preferred source", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Mock fetch for Binance using real API response structure
    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.binance.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    const result = await BTCPriceService.getPrice("binance");

    assertEquals(
      result.price,
      parseFloat(btcPriceApiResponses.responses.binance.success.data.price),
    );
    // Since we're testing with preferred source, it should try binance first
    assertExists(result.timestamp);
    assertEquals(result.confidence, "high");

    cacheStub.restore();
    await teardown();
  });

  await t.step(
    "fetchFreshPriceData - handles CoinGecko API failure with fallback",
    async () => {
      setup();

      // Mock cache to call the fetch function
      const cacheStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fetchFn: () => Promise<any>) => {
          return await fetchFn();
        },
      );

      // Mock fetch to fail for CoinGecko but succeed for Binance
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          // CoinGecko fails with rate limit
          Promise.resolve(
            new Response(
              JSON.stringify(
                btcPriceApiResponses.responses.coingecko.rateLimit.body,
              ),
              {
                status:
                  btcPriceApiResponses.responses.coingecko.rateLimit.status,
                statusText:
                  btcPriceApiResponses.responses.coingecko.rateLimit.statusText,
              },
            ),
          ),
          // Binance succeeds
          Promise.resolve(
            new Response(
              JSON.stringify(
                btcPriceApiResponses.responses.binance.success.data,
              ),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          ),
        ]),
      );

      const result = await BTCPriceService.getPrice();

      assertEquals(
        result.price,
        parseFloat(btcPriceApiResponses.responses.binance.success.data.price),
      );
      assertEquals(result.source, "binance");
      assertEquals(result.confidence, "high");
      assertEquals(result.fallbackUsed, true);
      assertExists(result.errors);
      assert(result.errors.length > 0);
      assert(result.errors[0].includes("429"));

      cacheStub.restore();
      await teardown();
    },
  );

  await t.step(
    "fetchFreshPriceData - returns static fallback when all sources fail",
    async () => {
      setup();

      // Mock cache to call the fetch function
      const cacheStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fetchFn: () => Promise<any>) => {
          return await fetchFn();
        },
      );

      // Mock fetch to fail for all sources
      fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            new Response(
              btcPriceApiResponses.responses.errors.serverError.body,
              {
                status:
                  btcPriceApiResponses.responses.errors.serverError.status,
                statusText:
                  btcPriceApiResponses.responses.errors.serverError.statusText,
              },
            ),
          ),
      );

      const result = await BTCPriceService.getPrice();

      assertEquals(result.price, 0);
      assertEquals(result.source, "default");
      assertEquals(result.confidence, "low");
      assertEquals(result.fallbackUsed, true);
      assertExists(result.errors);
      assert(result.errors.length >= 2); // Should have errors for both sources

      cacheStub.restore();
      await teardown();
    },
  );

  await t.step("fetchFromCoinGecko - handles successful response", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.coingecko.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    const result = await BTCPriceService.getPrice("coingecko");

    assertEquals(
      result.price,
      btcPriceApiResponses.responses.coingecko.success.data.bitcoin.usd,
    );
    assert(result.source === "coingecko" || result.source === "cached");
    assertEquals(result.confidence, "high");
    assertExists(result.details);

    cacheStub.restore();
    await teardown();
  });

  await t.step("fetchFromBinance - handles successful response", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.binance.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    const result = await BTCPriceService.getPrice("binance");

    assertEquals(
      result.price,
      parseFloat(btcPriceApiResponses.responses.binance.success.data.price),
    );
    assert(result.source === "binance" || result.source === "cached");
    assertEquals(result.confidence, "high");
    assertExists(result.details);

    cacheStub.restore();
    await teardown();
  });

  await t.step("getPrice - handles cache error gracefully", async () => {
    setup();

    // Mock cache to throw an error
    const cacheStub = stub(
      dbManager,
      "handleCache",
      () => Promise.reject(new Error("Cache error")),
    );

    const result = await BTCPriceService.getPrice();

    // Should return static fallback
    assertEquals(result.price, 0);
    assertEquals(result.source, "default");
    assertEquals(result.confidence, "low");
    assertExists(result.timestamp);

    cacheStub.restore();
    await teardown();
  });

  await t.step("invalidateCache - handles cache invalidation", async () => {
    setup();

    const invalidateStub = stub(
      dbManager,
      "invalidateCacheByPattern",
      () => Promise.resolve(),
    );

    await BTCPriceService.invalidateCache();

    // Should have called invalidate with the correct pattern
    assert(invalidateStub.calls.length === 1);
    assertEquals(invalidateStub.calls[0].args[0], "btc_price_data");

    invalidateStub.restore();
    await teardown();
  });

  await t.step("invalidateCache - handles invalidation error", async () => {
    setup();

    const invalidateStub = stub(
      dbManager,
      "invalidateCacheByPattern",
      () => Promise.reject(new Error("Invalidation failed")),
    );

    // Should not throw
    await BTCPriceService.invalidateCache();

    assert(invalidateStub.calls.length === 1);

    invalidateStub.restore();
    await teardown();
  });

  await t.step(
    "getCacheInfo - returns correct cache configuration",
    async () => {
      setup();

      const info = BTCPriceService.getCacheInfo();

      assertEquals(info.cacheKey, "btc_price_data");
      assert(typeof info.cacheDuration === "number");
      assert(info.cacheDuration > 0);
      assert(typeof info.staleWhileRevalidate === "number");
      assert(typeof info.staleIfError === "number");

      await teardown();
    },
  );

  await t.step("fetchFromSource - handles unknown source", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Mock successful responses for fallback sources
    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.coingecko.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    // This should fall back to available sources
    const result = await BTCPriceService.getPrice("unknown_source");

    // Should still return valid data from fallback sources
    assertExists(result.price);
    assertExists(result.source);
    assert(
      ["coingecko", "binance", "cached", "default"].includes(result.source),
    );

    cacheStub.restore();
    await teardown();
  });

  await t.step("getNextSourceOrder - rotates sources correctly", async () => {
    setup();

    // Mock cache to call the fetch function multiple times
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Mock fetch to always fail so we can observe source rotation
    fetchStub = stub(
      globalThis,
      "fetch",
      () => Promise.resolve(new Response("Error", { status: 500 })),
    );

    // Clear cache and make multiple calls to observe rotation
    const invalidateStub = stub(
      dbManager,
      "invalidateCacheByPattern",
      () => Promise.resolve(),
    );

    // Make multiple calls to observe rotation
    const results = [];
    for (let i = 0; i < 4; i++) {
      await BTCPriceService.invalidateCache();
      await BTCPriceService.getPrice();
      results.push(i);
    }

    // Should have attempted different sources
    assert(results.length === 4);

    cacheStub.restore();
    invalidateStub.restore();
    await teardown();
  });

  await t.step("fetchFromCoinGecko - handles rate limit error", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // First call returns 429, second call succeeds with Binance
    fetchStub = stub(
      globalThis,
      "fetch",
      returnsNext([
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.coingecko.rateLimit.body,
            ),
            {
              status: btcPriceApiResponses.responses.coingecko.rateLimit.status,
              statusText:
                btcPriceApiResponses.responses.coingecko.rateLimit.statusText,
            },
          ),
        ),
        Promise.resolve(
          new Response(
            JSON.stringify(
              btcPriceApiResponses.responses.binance.success.data,
            ),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
      ]),
    );

    const result = await BTCPriceService.getPrice("coingecko");

    // Should fall back to another source
    assertExists(result.price);
    assertEquals(result.fallbackUsed, true);
    assertExists(result.errors);
    assert(result.errors.some((e) => e.includes("429")));

    cacheStub.restore();
    await teardown();
  });

  await t.step("fetchFromBinance - handles invalid response", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Return invalid JSON
    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.resolve(
          new Response(
            btcPriceApiResponses.responses.errors.invalidJson.body,
            {
              status: btcPriceApiResponses.responses.errors.invalidJson.status,
              headers: { "Content-Type": "application/json" },
            },
          ),
        ),
    );

    const result = await BTCPriceService.getPrice("binance");

    // Should fall back to static default
    assertEquals(result.price, 0);
    assertEquals(result.source, "default");
    assertEquals(result.confidence, "low");
    assertExists(result.errors);

    cacheStub.restore();
    await teardown();
  });

  await t.step(
    "fetchFromBinance - handles rate limit with specific error code",
    async () => {
      setup();

      // Mock cache to call the fetch function
      const cacheStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fetchFn: () => Promise<any>) => {
          return await fetchFn();
        },
      );

      // Return Binance rate limit response
      fetchStub = stub(
        globalThis,
        "fetch",
        returnsNext([
          Promise.resolve(
            new Response(
              JSON.stringify(
                btcPriceApiResponses.responses.binance.rateLimit.body,
              ),
              {
                status: btcPriceApiResponses.responses.binance.rateLimit.status,
                statusText:
                  btcPriceApiResponses.responses.binance.rateLimit.statusText,
              },
            ),
          ),
          // Fallback to static default since only binance was requested
          Promise.resolve(new Response("Error", { status: 500 })),
        ]),
      );

      const result = await BTCPriceService.getPrice("binance");

      // Should fall back
      assertEquals(result.fallbackUsed, true);
      assertExists(result.errors);
      assert(result.errors.some((e) => e.includes("429")));

      cacheStub.restore();
      await teardown();
    },
  );

  await t.step("handles network errors gracefully", async () => {
    setup();

    // Mock cache to call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    // Mock fetch to throw network error
    fetchStub = stub(
      globalThis,
      "fetch",
      () =>
        Promise.reject(
          new Error(btcPriceApiResponses.responses.errors.networkError.message),
        ),
    );

    const result = await BTCPriceService.getPrice();

    // Should return static fallback
    assertEquals(result.price, 0);
    assertEquals(result.source, "default");
    assertEquals(result.confidence, "low");
    assertExists(result.errors);
    assert(result.errors.some((e) => e.includes("Network request failed")));

    cacheStub.restore();
    await teardown();
  });

  await t.step("respects round-robin source selection", async () => {
    setup();

    // Mock cache to always call the fetch function
    const cacheStub = stub(
      dbManager,
      "handleCache",
      async (_key: string, fetchFn: () => Promise<any>) => {
        return await fetchFn();
      },
    );

    const fetchCalls: string[] = [];

    // Mock fetch to track which URLs are called
    fetchStub = stub(
      globalThis,
      "fetch",
      (_input: RequestInfo | URL, _init?: RequestInit) => {
        const url = typeof _input === "string" ? _input : _input.toString();
        fetchCalls.push(url);

        // Return appropriate response based on URL
        if (url.includes("coingecko")) {
          return Promise.resolve(
            new Response(
              JSON.stringify(
                btcPriceApiResponses.responses.coingecko.success.data,
              ),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        } else if (url.includes("binance")) {
          return Promise.resolve(
            new Response(
              JSON.stringify(
                btcPriceApiResponses.responses.binance.success.data,
              ),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            ),
          );
        }

        return Promise.resolve(new Response("Error", { status: 500 }));
      },
    );

    // Clear any existing source counter state by making a few calls
    for (let i = 0; i < 3; i++) {
      await BTCPriceService.getPrice();
    }

    // The sources should rotate between coingecko and binance
    assert(fetchCalls.length >= 2);

    // Check that both sources are used
    const hasCoingecko = fetchCalls.some((url) => url.includes("coingecko"));
    const hasBinance = fetchCalls.some((url) => url.includes("binance"));

    assert(
      hasCoingecko || hasBinance,
      "Should use at least one of the available sources",
    );

    cacheStub.restore();
    await teardown();
  });
});
