/**
 * Tests to demonstrate fixture-enhanced factory functions
 */

import { assertEquals, assertNotEquals } from "@std/assert";
import {
  createMockCollection,
  createMockSRC20MarketData,
  createMockStampMarketData,
  createMockStampRow,
  createMockUTXO,
} from "./testFactories.ts";

Deno.test("Factory functions with fixture data", async (t) => {
  await t.step("createMockStampRow with fixture data", () => {
    const stampWithFixtures = createMockStampRow({}, true);
    const stampWithoutFixtures = createMockStampRow({}, false);

    // Should have different data when using fixtures
    assertNotEquals(stampWithFixtures.cpid, stampWithoutFixtures.cpid);
    assertEquals(typeof stampWithFixtures.cpid, "string");
    assertEquals(typeof stampWithFixtures.stamp, "number");
  });

  await t.step("createMockStampMarketData with fixture data", () => {
    const marketDataWithFixtures = createMockStampMarketData({}, true);
    const marketDataWithoutFixtures = createMockStampMarketData({}, false);

    // Should have different cpid when using fixtures
    assertNotEquals(
      marketDataWithFixtures.cpid,
      marketDataWithoutFixtures.cpid,
    );
    assertEquals(typeof marketDataWithFixtures.cpid, "string");
    assertEquals(typeof marketDataWithFixtures.holderCount, "number");
  });

  await t.step("createMockCollection with fixture data", () => {
    const collectionWithFixtures = createMockCollection({}, true);
    const collectionWithoutFixtures = createMockCollection({}, false);

    // Should have different collection data when using fixtures
    assertNotEquals(
      collectionWithFixtures.collection_id,
      collectionWithoutFixtures.collection_id,
    );
    assertEquals(typeof collectionWithFixtures.collection_name, "string");
  });

  await t.step("createMockUTXO with fixture data", () => {
    const utxoWithFixtures = createMockUTXO({}, true);
    const utxoWithoutFixtures = createMockUTXO({}, false);

    // Should potentially have different txid when using fixtures
    assertEquals(typeof utxoWithFixtures.txid, "string");
    assertEquals(utxoWithFixtures.txid.length, 64);
    assertEquals(typeof utxoWithFixtures.address, "string");
  });

  await t.step("createMockSRC20MarketData with fixture data", () => {
    const src20WithFixtures = createMockSRC20MarketData({}, true);
    const src20WithoutFixtures = createMockSRC20MarketData({}, false);

    // Should potentially have different tick when using fixtures
    assertEquals(typeof src20WithFixtures.tick, "string");
    assertEquals(typeof src20WithFixtures.holderCount, "number");
  });
});

Deno.test("Factory functions preserve overrides with fixture data", async (t) => {
  await t.step("overrides work with fixture data", () => {
    const customStamp = createMockStampRow({ stamp: 99999 }, true);
    assertEquals(customStamp.stamp, 99999);

    const customMarketData = createMockStampMarketData({
      cpid: "CUSTOM_CPID",
      holderCount: 42,
    }, true);
    assertEquals(customMarketData.cpid, "CUSTOM_CPID");
    assertEquals(customMarketData.holderCount, 42);
  });
});
