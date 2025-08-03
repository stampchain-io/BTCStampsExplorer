/**
 * @fileoverview Comprehensive unit tests for summary.ts functions
 * Tests the summarize_issuances function with various scenarios
 * Ensures CI compatibility with proper fixtures and no external dependencies
 */

import { summarize_issuances } from "$server/database/summary.ts";
import { assertEquals } from "@std/assert";
import type { StampRow } from "$types/stamp.d.ts";

// Helper function to create mock StampRow data
function createMockStampRow(overrides: Partial<StampRow> = {}): StampRow {
  return {
    stamp: 1,
    block_index: 875000,
    cpid: "A123456789012345678",
    creator: "bc1qtest123",
    creator_name: "Test Creator",
    divisible: false,
    keyburn: null,
    locked: 0,
    stamp_url: "https://example.com/stamp.png",
    stamp_mimetype: "image/png",
    supply: 1,
    block_time: new Date("2025-07-10T10:00:00.000Z"),
    tx_hash: "tx123hash",
    ident: "STAMP",
    stamp_hash: "stamphash123",
    file_hash: "filehash123",
    stamp_base64: "base64data",
    unbound_quantity: 1,
    ...overrides,
  };
}

Deno.test("summarize_issuances", async (t) => {
  await t.step(
    "returns single issuance unchanged when array has one item",
    () => {
      const singleIssuance = createMockStampRow({
        stamp: 42,
        supply: 100,
        locked: 0,
        creator: "bc1qsingle",
      });

      const result = summarize_issuances([singleIssuance]);

      // Should return the same object (spread copy)
      assertEquals(result.stamp, 42);
      assertEquals(result.supply, 100);
      assertEquals(result.locked, 0);
      assertEquals(result.creator, "bc1qsingle");
      assertEquals(result.cpid, singleIssuance.cpid);
    },
  );

  await t.step("aggregates supply from multiple issuances", () => {
    const issuances = [
      createMockStampRow({ stamp: 1, supply: 10, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 20, locked: 0 }),
      createMockStampRow({ stamp: 3, supply: 30, locked: 0 }),
    ];

    const result = summarize_issuances(issuances);

    // Should sum all supplies: 10 + 20 + 30 = 60
    assertEquals(result.supply, 60);
    // Should keep properties from first issuance
    assertEquals(result.stamp, 1);
    assertEquals(result.locked, 0);
  });

  await t.step("sets locked to 1 if any issuance is locked", () => {
    const issuances = [
      createMockStampRow({ stamp: 1, supply: 10, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 20, locked: 1 }), // This one is locked
      createMockStampRow({ stamp: 3, supply: 30, locked: 0 }),
    ];

    const result = summarize_issuances(issuances);

    assertEquals(result.supply, 60);
    assertEquals(result.locked, 1); // Should be set to 1 because one issuance was locked
    assertEquals(result.stamp, 1); // Should keep first issuance's stamp number
  });

  await t.step("handles multiple locked issuances correctly", () => {
    const issuances = [
      createMockStampRow({ stamp: 1, supply: 5, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 15, locked: 1 }),
      createMockStampRow({ stamp: 3, supply: 25, locked: 1 }),
      createMockStampRow({ stamp: 4, supply: 35, locked: 0 }),
    ];

    const result = summarize_issuances(issuances);

    assertEquals(result.supply, 80); // 5 + 15 + 25 + 35
    assertEquals(result.locked, 1); // Should be 1 because multiple issuances are locked
    assertEquals(result.stamp, 1); // Should preserve first issuance's stamp
  });

  await t.step("preserves all other properties from first issuance", () => {
    const firstIssuance = createMockStampRow({
      stamp: 100,
      cpid: "AFIRSTCPID123456789",
      creator: "bc1qfirstcreator",
      creator_name: "First Creator",
      stamp_url: "https://first.com/stamp.png",
      stamp_mimetype: "image/jpeg",
      supply: 1,
      locked: 0,
      tx_hash: "firsttxhash",
      block_index: 800000,
    });

    const secondIssuance = createMockStampRow({
      stamp: 200,
      cpid: "ASECONDCPID123456789",
      creator: "bc1qsecondcreator",
      creator_name: "Second Creator",
      stamp_url: "https://second.com/stamp.gif",
      stamp_mimetype: "image/gif",
      supply: 50,
      locked: 1,
      tx_hash: "secondtxhash",
      block_index: 900000,
    });

    const result = summarize_issuances([firstIssuance, secondIssuance]);

    // Should preserve first issuance's properties (except supply and locked)
    assertEquals(result.stamp, 100);
    assertEquals(result.cpid, "AFIRSTCPID123456789");
    assertEquals(result.creator, "bc1qfirstcreator");
    assertEquals(result.creator_name, "First Creator");
    assertEquals(result.stamp_url, "https://first.com/stamp.png");
    assertEquals(result.stamp_mimetype, "image/jpeg");
    assertEquals(result.tx_hash, "firsttxhash");
    assertEquals(result.block_index, 800000);

    // Should aggregate supply and update locked status
    assertEquals(result.supply, 51); // 1 + 50
    assertEquals(result.locked, 1); // Set to 1 because second issuance is locked
  });

  await t.step("handles edge case with zero supply issuances", () => {
    const issuances = [
      createMockStampRow({ stamp: 1, supply: 0, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 0, locked: 0 }),
      createMockStampRow({ stamp: 3, supply: 10, locked: 1 }),
    ];

    const result = summarize_issuances(issuances);

    assertEquals(result.supply, 10); // 0 + 0 + 10
    assertEquals(result.locked, 1);
    assertEquals(result.stamp, 1);
  });

  await t.step("handles large supply numbers correctly", () => {
    const issuances = [
      createMockStampRow({ stamp: 1, supply: 1000000, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 2000000, locked: 0 }),
      createMockStampRow({ stamp: 3, supply: 3000000, locked: 1 }),
    ];

    const result = summarize_issuances(issuances);

    assertEquals(result.supply, 6000000); // 1M + 2M + 3M
    assertEquals(result.locked, 1);
    assertEquals(result.stamp, 1);
  });

  await t.step("works with different stamp identities", () => {
    const issuances = [
      createMockStampRow({
        stamp: 1,
        supply: 10,
        locked: 0,
        ident: "STAMP",
        divisible: false,
      }),
      createMockStampRow({
        stamp: 2,
        supply: 20,
        locked: 0,
        ident: "SRC-20",
        divisible: true,
      }),
    ];

    const result = summarize_issuances(issuances);

    assertEquals(result.supply, 30);
    assertEquals(result.locked, 0);
    assertEquals(result.ident, "STAMP"); // Should preserve first issuance's ident
    assertEquals(result.divisible, false); // Should preserve first issuance's divisible
  });

  await t.step("modifies original array by removing processed elements", () => {
    const original = [
      createMockStampRow({ stamp: 1, supply: 10, locked: 0 }),
      createMockStampRow({ stamp: 2, supply: 20, locked: 1 }),
      createMockStampRow({ stamp: 3, supply: 30, locked: 0 }),
    ];
    const originalFirstSupply = original[0].supply;

    const result = summarize_issuances(original);

    // The function uses splice(1) which removes elements from index 1 onwards
    // So the original array should only have the first element left
    assertEquals(original.length, 1);
    assertEquals(original[0].supply, originalFirstSupply); // First element properties unchanged
    assertEquals(original[0].stamp, 1); // First element should remain

    // The result should have aggregated values from all original elements
    assertEquals(result.supply, 60); // 10 + 20 + 30
    assertEquals(result.locked, 1); // Set to 1 because second element was locked
    assertEquals(result.stamp, 1); // From first issuance
  });
});
