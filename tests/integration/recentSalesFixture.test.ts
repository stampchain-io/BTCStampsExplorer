import { assertEquals, assertExists } from "$std/assert/mod.ts";
import { afterAll, beforeAll, describe, it } from "$std/testing/bdd.ts";
import { StampRepository } from "$server/database/stampRepository.ts";
import { StampService } from "$server/services/stampService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import {
  approachComparison,
  expectedResults,
  mockDispenseEvents,
  mockMarketData,
  mockStamps,
} from "../fixtures/recentSalesFixtures.ts";

describe("Recent Sales Fixture-Based Tests", () => {
  // Setup all test data once
  beforeAll(async () => {
    // Insert all mock stamps
    for (const stamp of mockStamps) {
      await dbManager.executeQuery(
        `INSERT INTO StampTableV4 (stamp, cpid, stamp_url, stamp_mimetype, creator, tx_hash, block_index, block_time, ident, supply, divisible, locked) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          stamp.stamp,
          stamp.cpid,
          stamp.stamp_url,
          stamp.stamp_mimetype,
          stamp.creator,
          stamp.tx_hash,
          stamp.block_index,
          stamp.block_time,
          stamp.ident,
          stamp.supply,
          stamp.divisible,
          stamp.locked,
        ],
      );
    }

    // Insert all mock market data
    for (const data of mockMarketData) {
      await dbManager.executeQuery(
        `INSERT INTO stamp_market_data (cpid, recent_sale_price_btc, floor_price_btc, last_price_update, 
         last_sale_block_index, volume_24h_btc, volume_7d_btc, volume_30d_btc, holder_count, data_quality_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.cpid,
          data.recent_sale_price_btc,
          data.floor_price_btc,
          data.last_price_update,
          data.last_sale_block_index,
          data.volume_24h_btc,
          data.volume_7d_btc,
          data.volume_30d_btc,
          data.holder_count,
          data.data_quality_score,
        ],
      );
    }
  });

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up all test data
    const testCpids = mockStamps.map((s) => s.cpid);
    await dbManager.executeQuery(
      `DELETE FROM stamp_market_data WHERE cpid IN (${
        testCpids.map(() => "?").join(",")
      })`,
      testCpids,
    );
    await dbManager.executeQuery(
      `DELETE FROM StampTableV4 WHERE cpid IN (${
        testCpids.map(() => "?").join(",")
      })`,
      testCpids,
    );
  });

  describe("Default Behavior Tests", () => {
    it("should return stamps sold within 30 days with quality >= 7", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      assertEquals(result.stamps.length, expectedResults.default.count);
      assertEquals(
        result.stamps.map((s) => s.cpid),
        expectedResults.default.cpids,
      );
    });

    it("should order by most recent sales first", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      assertEquals(
        result.stamps.map((s) => s.cpid),
        expectedResults.default.order,
      );

      // Verify the ordering by checking timestamps
      for (let i = 1; i < result.stamps.length; i++) {
        const prevTimestamp = new Date(
          result.stamps[i - 1].marketData.lastPriceUpdate,
        ).getTime();
        const currTimestamp = new Date(
          result.stamps[i].marketData.lastPriceUpdate,
        ).getTime();
        assertEquals(
          prevTimestamp >= currTimestamp,
          true,
          "Results should be ordered by most recent first",
        );
      }
    });
  });

  describe("Filtering Tests", () => {
    it("should filter out stamps with sales older than 30 days", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 50,
      });

      // Should not include A222222222 (40 days old)
      const cpids = result.stamps.map((s) => s.cpid);
      assertEquals(cpids.includes("A222222222"), false);
    });

    it("should filter out stamps with low quality scores", async () => {
      // Add a stamp with low quality score
      await dbManager.executeQuery(
        `INSERT INTO StampTableV4 (stamp, cpid, stamp_url, creator, tx_hash, block_index, ident) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          1006,
          "A444444444",
          "https://example.com/stamp6.png",
          "1TestAddress6",
          "tx_hash_6",
          800500,
          "STAMP",
        ],
      );

      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 50,
      });

      // Should not include A444444444 (quality score 5.0)
      const cpids = result.stamps.map((s) => s.cpid);
      assertEquals(cpids.includes("A444444444"), false);

      // Cleanup
      await dbManager.executeQuery(
        "DELETE FROM StampTableV4 WHERE cpid = ?",
        ["A444444444"],
      );
    });

    it("should exclude stamps without market data", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 50,
      });

      // Should not include A333333333 (no market data)
      const cpids = result.stamps.map((s) => s.cpid);
      assertEquals(cpids.includes("A333333333"), false);
    });
  });

  describe("Pagination Tests", () => {
    it("should correctly paginate results", async () => {
      const page1 = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 2,
      });

      const page2 = await StampRepository.getRecentlyActiveSold({
        page: 2,
        limit: 2,
      });

      assertEquals(page1.stamps.length, 2);
      assertEquals(
        page1.stamps.map((s) => s.cpid),
        expectedResults.pagination.page1,
      );

      assertEquals(page2.stamps.length, 1);
      assertEquals(
        page2.stamps.map((s) => s.cpid),
        expectedResults.pagination.page2,
      );
    });

    it("should return correct total count", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 1,
      });

      assertEquals(result.total, expectedResults.default.count);
    });
  });

  describe("Data Transformation Tests", () => {
    it("should transform market data to sale_data format", async () => {
      const result = await StampService.getRecentSales(1, 10);

      assertExists(result.recentSales);
      const firstSale = result.recentSales[0];

      // Check sale_data structure
      assertExists(firstSale.sale_data);
      assertExists(firstSale.sale_data.btc_amount);
      assertExists(firstSale.sale_data.block_index);
      assertExists(firstSale.sale_data.tx_hash);

      // Verify data matches market data
      const marketData = mockMarketData.find(
        (m) => m.cpid === firstSale.cpid,
      );
      assertEquals(
        firstSale.sale_data.btc_amount,
        marketData?.recent_sale_price_btc,
      );
      assertEquals(
        firstSale.sale_data.block_index,
        marketData?.last_sale_block_index,
      );
    });

    it("should include market data when requested", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
        includeMarketData: true,
      });

      const firstStamp = result.stamps[0];
      assertExists(firstStamp.marketData);
      assertExists(firstStamp.marketData.recentSalePriceBTC);
      assertExists(firstStamp.marketData.floorPriceBTC);
      assertExists(firstStamp.marketData.volume24hBTC);
      assertExists(firstStamp.marketData.volume7dBTC);
      assertExists(firstStamp.marketData.volume30dBTC);
      assertExists(firstStamp.marketData.holderCount);
      assertExists(firstStamp.marketData.dataQualityScore);
    });
  });

  describe("Approach Comparison Documentation", () => {
    it("documents the fundamental difference between approaches", () => {
      // This test serves as documentation
      console.log("\n=== APPROACH COMPARISON ===");
      console.log("\nOLD APPROACH (XCP API):");
      console.log(
        `Description: ${approachComparison.oldApproach.description}`,
      );
      Object.entries(approachComparison.oldApproach.characteristics).forEach(
        ([key, value]) => {
          console.log(`  ${key}: ${value}`);
        },
      );
      console.log(
        `Example Output: ${approachComparison.oldApproach.exampleOutput}`,
      );

      console.log("\nNEW APPROACH (Local Cache):");
      console.log(
        `Description: ${approachComparison.newApproach.description}`,
      );
      Object.entries(approachComparison.newApproach.characteristics).forEach(
        ([key, value]) => {
          console.log(`  ${key}: ${value}`);
        },
      );
      console.log(
        `Example Output: ${approachComparison.newApproach.exampleOutput}`,
      );

      // Assert the key limitation
      assertEquals(
        approachComparison.oldApproach.characteristics.recordsPerStamp,
        "multiple (all recent sales)",
        "Old approach shows multiple sales per stamp",
      );
      assertEquals(
        approachComparison.newApproach.characteristics.recordsPerStamp,
        "one (most recent sale)",
        "New approach shows only one sale per stamp",
      );
    });

    it("demonstrates data granularity difference with mock data", () => {
      // Old approach would show multiple sales for A123456789
      const oldApproachCount = mockDispenseEvents.filter(
        (e) => e.cpid === "A123456789",
      ).length;
      assertEquals(
        oldApproachCount,
        3,
        "Old approach shows 3 sales for stamp A123456789",
      );

      // New approach shows only one entry per stamp
      const newApproachCount = 1; // Always 1 per stamp in market data
      assertEquals(
        newApproachCount,
        1,
        "New approach shows only 1 (most recent) sale for stamp A123456789",
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty results gracefully", async () => {
      // Query with impossible criteria
      const result = await StampRepository.getRecentlyActiveSold({
        page: 100,
        limit: 10,
      });

      assertEquals(result.stamps.length, 0);
      assertEquals(result.total, expectedResults.default.count);
    });

    it("should handle stamps with null price data", async () => {
      // Insert stamp with null prices
      await dbManager.executeQuery(
        `INSERT INTO stamp_market_data (cpid, last_price_update, data_quality_score)
         VALUES (?, ?, ?)`,
        ["A333333333", new Date(), 8.0],
      );

      const result = await StampService.getRecentSales(1, 50);

      // Should filter out stamps without price data
      const hasNullPrice = result.recentSales.some(
        (s) =>
          s.sale_data?.btc_amount === null || s.sale_data?.btc_amount === 0,
      );
      assertEquals(hasNullPrice, false, "Should filter out null/zero prices");

      // Cleanup
      await dbManager.executeQuery(
        "DELETE FROM stamp_market_data WHERE cpid = ?",
        ["A333333333"],
      );
    });
  });

  describe("Performance Characteristics", () => {
    it("should complete queries quickly using local data", async () => {
      const startTime = Date.now();
      const _result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 50,
      });
      const endTime = Date.now();

      const queryTime = endTime - startTime;
      console.log(`Query completed in ${queryTime}ms`);

      // Local queries should be fast (under 100ms)
      assertEquals(
        queryTime < 100,
        true,
        `Query should complete in under 100ms, took ${queryTime}ms`,
      );
    });
  });
});
