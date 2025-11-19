import { assertEquals, assertExists } from "@std/assert";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  it,
} from "@std/testing/bdd";
import { StampRepository } from "$server/database/stampRepository.ts";
import { StampService } from "$server/services/stampService.ts";
import { dbManager } from "$server/database/databaseManager.ts";

describe("Recent Sales Integration Tests", () => {
  // Test data
  const testStamps = [
    {
      stamp: 1001,
      cpid: "A123456789",
      stamp_url: "https://example.com/stamp1.png",
      stamp_mimetype: "image/png",
      creator: "1TestAddress1",
      tx_hash: "tx_hash_1",
      block_index: 800000,
      block_time: new Date("2024-01-01"),
      ident: "STAMP",
      supply: 100,
      divisible: 0,
      locked: 1,
    },
    {
      stamp: 1002,
      cpid: "A987654321",
      stamp_url: "https://example.com/stamp2.png",
      stamp_mimetype: "image/png",
      creator: "1TestAddress2",
      tx_hash: "tx_hash_2",
      block_index: 800100,
      block_time: new Date("2024-01-02"),
      ident: "STAMP",
      supply: 50,
      divisible: 0,
      locked: 1,
    },
  ];

  const testMarketData = [
    {
      cpid: "A123456789",
      recent_sale_price_btc: 0.005,
      floor_price_btc: 0.004,
      last_price_update: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      last_sale_block_index: 850000,
      volume_24h_btc: 0.1,
      volume_7d_btc: 0.5,
      holder_count: 25,
      data_quality_score: 8.5,
    },
    {
      cpid: "A987654321",
      recent_sale_price_btc: 0.01,
      floor_price_btc: 0.009,
      last_price_update: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      last_sale_block_index: 849000,
      volume_24h_btc: 0.05,
      volume_7d_btc: 0.2,
      holder_count: 15,
      data_quality_score: 9.0,
    },
  ];

  // Clean up after tests - close database connections
  afterAll(async () => {
    // Close all database connections to prevent TCP leaks
    await dbManager.closeAllClients();
  });

  beforeEach(async () => {
    // Insert test stamps
    for (const stamp of testStamps) {
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

    // Insert test market data
    for (const data of testMarketData) {
      await dbManager.executeQuery(
        `INSERT INTO stamp_market_data (cpid, recent_sale_price_btc, floor_price_btc, last_price_update, 
         last_sale_block_index, volume_24h_btc, volume_7d_btc, holder_count, data_quality_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.cpid,
          data.recent_sale_price_btc,
          data.floor_price_btc,
          data.last_price_update,
          data.last_sale_block_index,
          data.volume_24h_btc,
          data.volume_7d_btc,
          data.holder_count,
          data.data_quality_score,
        ],
      );
    }
  });

  afterEach(async () => {
    // Clean up test data
    await dbManager.executeQuery(
      "DELETE FROM stamp_market_data WHERE cpid IN (?, ?)",
      ["A123456789", "A987654321"],
    );
    await dbManager.executeQuery(
      "DELETE FROM StampTableV4 WHERE stamp IN (?, ?)",
      [1001, 1002],
    );
  });

  describe("StampRepository.getRecentlyActiveSold", () => {
    it("should return stamps with recent sales within 30 days", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
        includeMarketData: true,
      });

      assertEquals(result.stamps.length, 2);
      assertEquals(result.total, 2);

      // Check first stamp (most recent sale)
      const firstStamp = result.stamps[0];
      assertEquals(firstStamp.cpid, "A123456789");
      assertExists(firstStamp.marketData);
      assertEquals(firstStamp.marketData.recentSalePriceBTC, 0.005);
      assertEquals(firstStamp.marketData.lastSaleBlockIndex, 850000);
    });

    it("should order by most recent sales first", async () => {
      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      // First stamp should be the one sold 1 hour ago
      assertEquals(result.stamps[0].cpid, "A123456789");
      // Second stamp should be the one sold 5 days ago
      assertEquals(result.stamps[1].cpid, "A987654321");
    });

    it("should respect pagination", async () => {
      const page1 = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 1,
      });

      const page2 = await StampRepository.getRecentlyActiveSold({
        page: 2,
        limit: 1,
      });

      assertEquals(page1.stamps.length, 1);
      assertEquals(page2.stamps.length, 1);
      assertEquals(page1.stamps[0].cpid, "A123456789");
      assertEquals(page2.stamps[0].cpid, "A987654321");
    });

    it("should filter out old sales beyond 30 days", async () => {
      // Update one stamp to have a sale 40 days ago
      await dbManager.executeQuery(
        `UPDATE stamp_market_data SET last_price_update = DATE_SUB(NOW(), INTERVAL 40 DAY) WHERE cpid = ?`,
        ["A987654321"],
      );

      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      // Should only return 1 stamp now
      assertEquals(result.stamps.length, 1);
      assertEquals(result.stamps[0].cpid, "A123456789");
    });

    it("should filter out low quality data", async () => {
      // Update one stamp to have low data quality
      await dbManager.executeQuery(
        `UPDATE stamp_market_data SET data_quality_score = 5.0 WHERE cpid = ?`,
        ["A987654321"],
      );

      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      // Should only return 1 stamp with quality score >= 7
      assertEquals(result.stamps.length, 1);
      assertEquals(result.stamps[0].cpid, "A123456789");
    });

    it("should exclude stamps without sales data", async () => {
      // Add a stamp without market data
      await dbManager.executeQuery(
        `INSERT INTO StampTableV4 (stamp, cpid, stamp_url, creator, tx_hash, block_index, ident) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          1003,
          "A111111111",
          "https://example.com/stamp3.png",
          "1TestAddress3",
          "tx_hash_3",
          800200,
          "STAMP",
        ],
      );

      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 10,
      });

      // Should not include stamp without market data
      assertEquals(result.stamps.length, 2);
      assertEquals(result.stamps.every((s) => s.cpid !== "A111111111"), true);

      // Clean up
      await dbManager.executeQuery("DELETE FROM StampTableV4 WHERE stamp = ?", [
        1003,
      ]);
    });
  });

  describe("StampService.getRecentSales", () => {
    it("should transform data to match expected sale_data format", async () => {
      const result = await StampService.getRecentSales(1, 10);

      assertExists(result.recentSales);
      assertEquals(result.recentSales.length, 2);

      // Check sale_data structure
      const firstSale = result.recentSales[0];
      assertExists(firstSale.sale_data);
      assertEquals(firstSale.sale_data.btc_amount, 0.005);
      assertEquals(firstSale.sale_data.block_index, 850000);
      assertExists(firstSale.sale_data.tx_hash); // Will be stamp's tx_hash
    });

    it("should filter out stamps without market data", async () => {
      // Remove market data for one stamp
      await dbManager.executeQuery(
        "DELETE FROM stamp_market_data WHERE cpid = ?",
        ["A987654321"],
      );

      const result = await StampService.getRecentSales(1, 10);

      assertEquals(result.recentSales.length, 1);
      assertEquals(result.recentSales[0].cpid, "A123456789");
    });
  });

  describe("Data Completeness Limitations", () => {
    it("should NOT show historical sales beyond what's in market data", async () => {
      // This test documents the limitation that we only see the MOST RECENT sale per stamp
      // Unlike the old approach which showed last 500 individual transactions

      const result = await StampService.getRecentSales();

      // Each stamp appears only once with its most recent sale
      const cpidCounts = new Map<string, number>();
      result.recentSales.forEach((sale) => {
        const count = cpidCounts.get(sale.cpid) || 0;
        cpidCounts.set(sale.cpid, count + 1);
      });

      // Each CPID should appear exactly once
      cpidCounts.forEach((count, cpid) => {
        assertEquals(count, 1, `CPID ${cpid} should only appear once`);
      });
    });

    it("demonstrates we cannot get transaction-level history", async () => {
      // The market data table only stores summary data, not individual transactions
      // This is a fundamental architectural difference from fetching dispense events

      const result = await StampRepository.getRecentlyActiveSold({
        page: 1,
        limit: 100,
      });

      // We only get one record per stamp, not multiple sales per stamp
      const uniqueCpids = new Set(result.stamps.map((s) => s.cpid));
      assertEquals(uniqueCpids.size, result.stamps.length);
    });
  });
});
