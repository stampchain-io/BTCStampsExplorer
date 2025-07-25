import { logger } from "$lib/utils/logger.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import {
  type ComposeAttachOptions,
  type ComposeDetachOptions,
  CounterpartyDispenserService,
  fetchXcpV2WithCache,
  type IssuanceOptions,
  normalizeFeeRate,
  xcp_v2_nodes,
  type XcpBalanceOptions,
  CounterpartyApiManager,
} from "$server/services/counterpartyApiService.ts";
import { SATS_PER_KB_MULTIPLIER } from "$lib/utils/constants.ts";
import {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { assertSpyCalls, restore, stub } from "@std/testing/mock";
import {
  xcpServiceFixtures,
  xcpTestHelpers,
} from "@tests/fixtures/xcpServiceFixtures.ts";

describe("xcpService", () => {
  let fetchStub: any;
  let dbManagerStub: any;
  let loggerStub: any;

  beforeEach(() => {
    // Stub logger methods
    loggerStub = {
      info: stub(logger, "info", () => Promise.resolve()),
      debug: stub(logger, "debug", () => Promise.resolve()),
      warn: stub(logger, "warn", () => Promise.resolve()),
      error: stub(logger, "error", () => Promise.resolve()),
    };
  });

  afterEach(() => {
    restore();
  });

  describe("normalizeFeeRate", () => {
    it("should normalize satsPerVB correctly", () => {
      const result = normalizeFeeRate({ satsPerVB: 10 });
      assertEquals(result.normalizedSatsPerVB, 10);
      assertEquals(result.normalizedSatsPerKB, 10000);
    });

    it("should convert satsPerKB to satsPerVB", () => {
      const result = normalizeFeeRate({ satsPerKB: 10000 });
      assertEquals(result.normalizedSatsPerVB, 10);
      assertEquals(result.normalizedSatsPerKB, 10000);
    });

    it("should handle low satsPerKB as satsPerVB", () => {
      const result = normalizeFeeRate({ satsPerKB: 10 });
      assertEquals(result.normalizedSatsPerVB, 10);
      assertEquals(result.normalizedSatsPerKB, 10000);
    });

    it("should throw error when no fee rate provided", () => {
      // ISSUE: normalizeFeeRate throws a string instead of an Error object (line 64)
      // This should be fixed to throw proper Error objects
      assertThrows(
        () => normalizeFeeRate({}),
        undefined,
        "Either satsPerKB or satsPerVB must be provided",
      );
    });

    it("should throw error when fee rate too low", () => {
      // ISSUE: normalizeFeeRate throws a string instead of an Error object (line 64)
      // This should be fixed to throw proper Error objects
      assertThrows(
        () => normalizeFeeRate({ satsPerVB: 0.05 }),
        undefined,
        "Fee rate must be at least 0.1 sat/vB",
      );
    });

    // Edge cases
    it("should handle very large fee rates", () => {
      const result = normalizeFeeRate({ satsPerVB: 999999 });
      assertEquals(result.normalizedSatsPerVB, 999999);
      assertEquals(result.normalizedSatsPerKB, 999999000);
    });

    it("should handle decimal fee rates", () => {
      const result = normalizeFeeRate({ satsPerVB: 12.5 });
      assertEquals(result.normalizedSatsPerVB, 12.5);
      assertEquals(result.normalizedSatsPerKB, 12500);
    });

    it("should handle edge case where satsPerKB equals SATS_PER_KB_MULTIPLIER", () => {
      const result = normalizeFeeRate({ satsPerKB: SATS_PER_KB_MULTIPLIER });
      assertEquals(result.normalizedSatsPerVB, 1);
      assertEquals(result.normalizedSatsPerKB, 1000);
    });

    it("should handle minimum allowed fee rate (0.1 sat/vB)", () => {
      const result = normalizeFeeRate({ satsPerVB: 0.1 });
      assertEquals(result.normalizedSatsPerVB, 0.1);
      assertEquals(result.normalizedSatsPerKB, 100);
    });
  });

  describe("fetchXcpV2WithCache", () => {
    beforeEach(() => {
      // Stub dbManager.handleCache to pass through the function
      dbManagerStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fn: () => Promise<any>) => {
          return await fn();
        },
      );
    });

    it("should fetch data successfully from first node", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            new Response(JSON.stringify(xcpServiceFixtures.assets.stamps[0]), {
              status: 200,
            }),
          ),
      );

      const result = await fetchXcpV2WithCache("/test", new URLSearchParams());

      assertEquals(result, xcpServiceFixtures.assets.stamps[0]);
      assertSpyCalls(fetchStub, 1);
      assertSpyCalls(loggerStub.info, 1); // 1 info call at start
      assertSpyCalls(loggerStub.debug, 3); // 3 debug calls: attempting, response received, successful
    });

    it("should fallback to second node when first fails", async () => {
      let callCount = 0;
      fetchStub = stub(
        globalThis,
        "fetch",
        () => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(new Response("Error", { status: 500 }));
          }
          return Promise.resolve(
            new Response(JSON.stringify(xcpServiceFixtures.assets.stamps[0]), {
              status: 200,
            }),
          );
        },
      );

      const result = await fetchXcpV2WithCache("/test", new URLSearchParams());

      assertEquals(result, xcpServiceFixtures.assets.stamps[0]);
      assertSpyCalls(fetchStub, 2);
      assertSpyCalls(loggerStub.error, 1);
    });

    it("should return minimal structure when all nodes fail", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response("Error", { status: 500 })),
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result, {
        result: [],
        next_cursor: null,
        result_count: 0,
        error: "Error",
      });
      assertSpyCalls(fetchStub, xcp_v2_nodes.length);
      assertSpyCalls(loggerStub.warn, 1);
    });

    it("should use custom cache timeout", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            new Response(JSON.stringify(xcpServiceFixtures.assets.stamps[0]), {
              status: 200,
            }),
          ),
      );

      await fetchXcpV2WithCache("/test", new URLSearchParams(), 600);

      assertSpyCalls(dbManagerStub, 1);
      assertEquals(dbManagerStub.calls[0].args[2], 600);
    });

    // Edge cases
    it("should handle network timeouts", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.reject(new Error("Network timeout")),
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result.result, []);
      assertEquals(result.error, "Network timeout");
      assertSpyCalls(loggerStub.error, 2); // One for each node
    });

    it("should handle malformed JSON responses", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response("Invalid JSON", { status: 200 })),
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result.result, []);
      assertSpyCalls(loggerStub.error, 2);
    });

    it("should handle partial node failures", async () => {
      let callCount = 0;
      fetchStub = stub(
        globalThis,
        "fetch",
        () => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error("Connection refused"));
          }
          return Promise.resolve(
            new Response(JSON.stringify(xcpServiceFixtures.assets.stamps[0]), {
              status: 200,
            }),
          );
        },
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result, xcpServiceFixtures.assets.stamps[0]);
      assertSpyCalls(fetchStub, 2);
    });

    it("should handle empty response bodies", async () => {
      fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response("", { status: 200 })),
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result.result, []);
      assertSpyCalls(loggerStub.error, 2);
    });

    it("should handle very large query parameters", async () => {
      const params = new URLSearchParams();
      for (let i = 0; i < 100; i++) {
        params.append(`param${i}`, `value${i}`);
      }

      fetchStub = stub(
        globalThis,
        "fetch",
        () =>
          Promise.resolve(
            new Response(JSON.stringify({ result: [] }), { status: 200 }),
          ),
      );

      const result = await fetchXcpV2WithCache<any>("/test", params);

      assertEquals(result.result, []);
      assertSpyCalls(fetchStub, 1);
    });

    it("should handle circular reference in error objects", async () => {
      const circularError: any = { message: "Error" };
      circularError.self = circularError;

      fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.reject(circularError),
      );

      const result = await fetchXcpV2WithCache<any>(
        "/test",
        new URLSearchParams(),
      );

      assertEquals(result.result, []);
      assertSpyCalls(loggerStub.error, 2);
    });
  });

  describe("CounterpartyDispenserService", () => {
    beforeEach(() => {
      // Stub dbManager.handleCache to pass through the function
      dbManagerStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fn: () => Promise<any>) => {
          return await fn();
        },
      );
    });

    describe("getDispensersByCpid", () => {
      it("should fetch dispensers with pagination", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [xcpServiceFixtures.dispensers.open],
                  next_cursor: null,
                  result_count: 1,
                }),
                {
                  status: 200,
                },
              ),
            ),
        );

        const result = await CounterpartyDispenserService.getDispensersByCpid(
          "A4399874976698242000",
          1,
          10,
        );

        assertEquals(result.dispensers.length, 1);
        assertEquals(result.total, 1);
        assertEquals(result.dispensers[0].cpid, "A4399874976698242000");
        assertEquals(result.dispensers[0].status, "open");
        assertExists(result.dispensers[0].btcrate);
      });

      it("should filter by dispenser status", async () => {
        const openDispenser = {
          ...xcpServiceFixtures.dispensers.open,
          give_remaining: 10,
        };
        const closedDispenser = {
          ...xcpServiceFixtures.dispensers.open,
          give_remaining: 0,
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [openDispenser, closedDispenser],
                  next_cursor: null,
                  result_count: 2,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyDispenserService.getDispensersByCpid(
          "A4399874976698242000",
          1,
          10,
          undefined,
          "open",
        );

        assertEquals(result.dispensers.length, 1);
        assertEquals(result.dispensers[0].status, "open");
      });

      it("should handle cursor pagination", async () => {
        let callCount = 0;
        fetchStub = stub(
          globalThis,
          "fetch",
          () => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve(
                new Response(
                  JSON.stringify({
                    result: [xcpServiceFixtures.dispensers.open],
                    next_cursor: "cursor123",
                    result_count: 1,
                  }),
                  { status: 200 },
                ),
              );
            }
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [xcpServiceFixtures.dispensers.open],
                  next_cursor: null,
                  result_count: 1,
                }),
                {
                  status: 200,
                },
              ),
            );
          },
        );

        const result = await CounterpartyDispenserService.getDispensersByCpid(
          "A4399874976698242000",
          1,
          100,
        );

        assertSpyCalls(fetchStub, 2);
        assertEquals(result.total, 2);
      });

      it("should handle dispensers with extreme values", async () => {
        const extremeDispenser = {
          ...xcpServiceFixtures.dispensers.open,
          give_quantity: Number.MAX_SAFE_INTEGER,
          satoshirate: 1, // Minimum possible rate
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [extremeDispenser],
                  next_cursor: null,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyDispenserService.getDispensersByCpid(
          "A4399874976698242000",
        );

        assertEquals(
          result.dispensers[0].give_quantity,
          Number.MAX_SAFE_INTEGER,
        );
        assertEquals(result.dispensers[0].satoshirate, 1);
      });
    });

    describe("getDispensesByCpid", () => {
      it("should fetch dispenses with pagination", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [xcpServiceFixtures.dispenses.recent[0]],
                  next_cursor: null,
                  result_count: 1,
                }),
                {
                  status: 200,
                },
              ),
            ),
        );

        const result = await CounterpartyDispenserService.getDispensesByCpid(
          "A4399874976698242000",
          1,
          10,
        );

        assertEquals(result.dispenses.length, 1);
        assertEquals(result.total, 1);
        assertEquals(result.dispenses[0].cpid, "A4399874976698242000");
        assertEquals(result.dispenses[0].block_time, 1700000000000); // Converted to milliseconds
      });

      it("should handle dispenses with null block_time", async () => {
        const dispense = {
          ...xcpServiceFixtures.dispenses.recent[0],
          block_time: null,
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({ result: [dispense], next_cursor: null }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyDispenserService.getDispensesByCpid(
          "A4399874976698242000",
        );

        assertEquals(result.dispenses[0].block_time, null);
      });
    });
  });

  describe("CounterpartyApiManager", () => {
    beforeEach(() => {
      // Stub dbManager.handleCache to pass through the function
      dbManagerStub = stub(
        dbManager,
        "handleCache",
        async (_key: string, fn: () => Promise<any>) => {
          return await fn();
        },
      );
    });

    describe("getXcpAsset", () => {
      it("should fetch asset info", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify(xcpServiceFixtures.assets.stamps[0]),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getXcpAsset("A4399874976698242000");

        assertEquals(result, xcpServiceFixtures.assets.stamps[0]);
      });

      it("should throw error on invalid response", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () => Promise.resolve(new Response("null", { status: 200 })),
        );

        await assertRejects(
          () => CounterpartyApiManager.getXcpAsset("A4399874976698242000"),
          Error,
          "Invalid response for asset A4399874976698242000",
        );
      });
    });

    describe("getAllXcpHoldersByCpid", () => {
      it("should aggregate holders by address", async () => {
        const holders = [
          { address: "bc1q1", quantity: 5, utxo_address: null },
          { address: "bc1q1", quantity: 3, utxo_address: null },
          { address: "bc1q2", quantity: 10, utxo_address: null },
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: holders,
                  next_cursor: null,
                  result_count: 3,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getAllXcpHoldersByCpid(
          "A4399874976698242000",
          1,
          10,
        );

        assertEquals(result.holders.length, 2);
        assertEquals(result.holders[0].address, "bc1q2");
        assertEquals(result.holders[0].quantity, 10);
        assertEquals(result.holders[1].address, "bc1q1");
        assertEquals(result.holders[1].quantity, 8); // 5 + 3
      });

      it("should handle utxo_address fallback", async () => {
        const holders = [
          { address: null, quantity: 5, utxo_address: "bc1qutxo1" },
          { address: "bc1q1", quantity: 3, utxo_address: "bc1qutxo2" },
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: holders,
                  next_cursor: null,
                  result_count: 2,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getAllXcpHoldersByCpid(
          "A4399874976698242000",
          1,
          10,
        );

        assertEquals(result.holders.length, 2);
        assertEquals(result.holders[0].address, "bc1qutxo1");
        assertEquals(result.holders[1].address, "bc1q1");
      });
    });

    describe("getXcpBalancesByAddress", () => {
      it("should fetch balances for address", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [xcpServiceFixtures.balances.single],
                  next_cursor: null,
                  result_count: 1,
                  total: 1,
                }),
                {
                  status: 200,
                },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getXcpBalancesByAddress("bc1qtest123");

        assertEquals(result.balances.length, 1);
        assertEquals(result.balances[0].address, "bc1qtest123");
        assertEquals(result.balances[0].quantity, 10);
        assertEquals(result.total, 1);
      });

      it("should filter by UTXO only", async () => {
        const balances = [
          { ...xcpServiceFixtures.balances.single, utxo: "abc:0" },
          { ...xcpServiceFixtures.balances.single, utxo: "" },
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: balances,
                  next_cursor: null,
                  result_count: 2,
                  total: 2,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getXcpBalancesByAddress(
          "bc1qtest123",
          undefined,
          true,
        );

        assertEquals(result.balances.length, 1);
        assertEquals(result.balances[0].utxo, "abc:0");
      });

      it("should handle pagination options", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          (url: string | URL | Request) => {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  result: [xcpServiceFixtures.balances.single],
                  next_cursor: null,
                  result_count: 1,
                  total: 1,
                }),
                {
                  status: 200,
                },
              ),
            );
          },
        );

        const options: XcpBalanceOptions = {
          type: "send",
          limit: 100,
          cursor: "cursor123",
          verbose: true,
        };

        await CounterpartyApiManager.getXcpBalancesByAddress(
          "bc1qtest123",
          undefined,
          false,
          options,
        );

        const url = new URL(fetchStub.calls[0].args[0]);
        assertEquals(url.searchParams.get("type"), "send");
        assertEquals(url.searchParams.get("limit"), "100");
        assertEquals(url.searchParams.get("cursor"), "cursor123");
        assertEquals(url.searchParams.get("verbose"), "true");
      });

      it("should handle addresses with thousands of balances", async () => {
        const balances = xcpTestHelpers.generateBalances(5000);

        let callCount = 0;
        fetchStub = stub(
          globalThis,
          "fetch",
          () => {
            callCount++;
            const start = (callCount - 1) * 500;
            const end = callCount * 500;
            const hasMore = end < 5000;

            return Promise.resolve(
              new Response(
                JSON.stringify({
                  result: balances.slice(start, end),
                  next_cursor: hasMore ? `cursor${callCount}` : null,
                  total: 5000,
                }),
                { status: 200 },
              ),
            );
          },
        );

        const result = await CounterpartyApiManager.getAllXcpBalancesByAddress("bc1qwhale");

        assertEquals(result.balances.length, 5000);
        assertEquals(result.total, 5000);
      });

      it("should handle balances with duplicate entries", async () => {
        const duplicateBalances = [
          { address: "bc1q1", asset: "ASSET1", quantity: 5, utxo: "utxo1:0" },
          { address: "bc1q1", asset: "ASSET1", quantity: 3, utxo: "utxo2:0" },
          { address: "bc1q1", asset: "ASSET1", quantity: 2, utxo: "utxo3:0" },
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: duplicateBalances,
                  next_cursor: null,
                  total: 3,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getXcpBalancesByAddress("bc1q1");

        // Should maintain separate entries with unique keys
        assertEquals(result.balances.length, 3);
      });

      it("should handle zero quantity balances", async () => {
        const balances = [
          { address: "bc1q1", asset: "ASSET1", quantity: 0, utxo: "" },
          { address: "bc1q1", asset: "ASSET2", quantity: 10, utxo: "" },
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({ result: balances, next_cursor: null }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.getXcpBalancesByAddress("bc1q1");

        // Zero quantity balances should be filtered out
        assertEquals(result.balances.length, 1);
        assertEquals(result.balances[0].cpid, "ASSET2");
      });
    });

    describe("Transaction composition", () => {
      it("should handle very large quantities", async () => {
        const largeQuantityResponse = {
          result: {
            ...xcpServiceFixtures.compose.send,
            params: {
              ...xcpServiceFixtures.compose.send.params,
              quantity: Number.MAX_SAFE_INTEGER,
            },
          },
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify(largeQuantityResponse), {
                status: 200,
              }),
            ),
        );

        const result = await CounterpartyApiManager.createSend(
          "bc1qtest",
          "bc1qdest",
          "ASSET",
          Number.MAX_SAFE_INTEGER,
        );

        assertEquals(result.result.params.quantity, Number.MAX_SAFE_INTEGER);
      });

      it("should handle special characters in memo", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({ result: xcpServiceFixtures.compose.send }),
                { status: 200 },
              ),
            ),
        );

        const specialMemo = "Test 🚀 memo with émojis & special chars!";
        await CounterpartyApiManager.createSend(
          "bc1qtest",
          "bc1qdest",
          "ASSET",
          1,
          { memo: specialMemo },
        );

        const url = new URL(fetchStub.calls[0].args[0]);
        assertEquals(url.searchParams.get("memo"), specialMemo);
      });

      it("should handle issuance with empty description", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify(xcpServiceFixtures.compose.issuance),
                {
                  status: 200,
                },
              ),
            ),
        );

        await CounterpartyApiManager.createIssuance(
          "bc1qtest",
          "NEWASSET",
          100,
          { description: "" },
        );

        const url = new URL(fetchStub.calls[0].args[0]);
        assertEquals(url.searchParams.get("description"), "");
      });

      it("should handle dispenser with maximum escrow", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify(xcpServiceFixtures.compose.dispenser),
                {
                  status: 200,
                },
              ),
            ),
        );

        const maxEscrow = Number.MAX_SAFE_INTEGER;
        await CounterpartyApiManager.composeDispenser(
          "bc1qtest",
          "ASSET",
          1,
          maxEscrow,
          100000,
          0,
        );

        const url = new URL(fetchStub.calls[0].args[0]);
        assertEquals(
          url.searchParams.get("escrow_quantity"),
          maxEscrow.toString(),
        );
      });
    });

    describe("Asset info edge cases", () => {
      it("should handle assets with very long descriptions", async () => {
        const longDescription = "A".repeat(10000);
        const assetWithLongDesc = {
          result: {
            ...xcpServiceFixtures.assets.stamps[0],
            description: longDescription,
          },
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify(assetWithLongDesc), { status: 200 }),
            ),
        );

        const result = await CounterpartyApiManager.getAssetInfo("ASSET");

        assertEquals(result.description.length, 10000);
      });

      it("should handle numeric asset names", async () => {
        const numericAsset = {
          result: {
            asset: "A95428956661682177",
            asset_longname: null,
            owner: "bc1qtest",
            issuer: "bc1qtest",
            description: "Numeric asset",
            divisible: true,
            locked: false,
            supply: 1000000000,
          },
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify(numericAsset), { status: 200 }),
            ),
        );

        const result = await CounterpartyApiManager.getAssetInfo("A95428956661682177");

        assertEquals(result.asset, "A95428956661682177");
      });
    });

    describe("Event fetching edge cases", () => {
      it("should handle malformed dispense events", async () => {
        const events = [
          xcpServiceFixtures.dispenses.events[0],
          { event: "DISPENSE", params: {} }, // Missing required fields
          { ...xcpServiceFixtures.dispenses.events[0], event: "SEND" }, // Wrong event type
        ];

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({
                  result: events,
                  next_cursor: null,
                }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.fetchDispenseEvents();

        // Should only return valid events
        assertEquals(result.length, 1);
        assertEquals(result[0].event, "DISPENSE");
      });

      it("should handle events with extreme BTC amounts", async () => {
        const event = {
          ...xcpServiceFixtures.dispenses.events[0],
          params: {
            ...xcpServiceFixtures.dispenses.events[0].params,
            btc_amount: 2100000000000000, // 21 million BTC in satoshis
          },
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(
                JSON.stringify({ result: [event], next_cursor: null }),
                { status: 200 },
              ),
            ),
        );

        const result = await CounterpartyApiManager.fetchDispenseEvents();

        assertEquals(result[0].params.btc_amount, 21000000); // Converted to BTC
      });
    });

    describe("Health check", () => {
      it("should handle health check with missing fields", async () => {
        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify({ result: {} }), { status: 200 }),
            ),
        );

        const result = await CounterpartyApiManager.checkHealth();

        assertEquals(result, false);
      });

      it("should handle health check with extra fields", async () => {
        const healthWithExtras = {
          result: {
            status: "Healthy",
            extraField: "ignored",
            anotherField: 123,
          },
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify(healthWithExtras), { status: 200 }),
            ),
        );

        const result = await CounterpartyApiManager.checkHealth();

        assertEquals(result, true);
      });
    });

    describe("Error handling", () => {
      it("should handle non-standard error responses", async () => {
        const nonStandardError = {
          fault: "Invalid request",
          code: "ERR001",
        };

        fetchStub = stub(
          globalThis,
          "fetch",
          () =>
            Promise.resolve(
              new Response(JSON.stringify(nonStandardError), { status: 400 }),
            ),
        );

        await assertRejects(
          () => CounterpartyApiManager.createSend("bc1q", "bc1q", "ASSET", 1),
          Error,
        );
      });
    });
  });
});
