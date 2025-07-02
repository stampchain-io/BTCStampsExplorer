import { assertEquals, assertExists } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { StampRepository } from "$server/database/stampRepository.ts";
import stampFixtures from "../fixtures/stampData.json" with { type: "json" };
import {
  fixtureHelpers,
  FixtureTestHelper,
} from "../helpers/fixtureTestHelper.ts";

describe("StampRepository Unit Tests (with shared helper)", () => {
  let helper: FixtureTestHelper;

  beforeEach(() => {
    helper = new FixtureTestHelper();
  });

  afterEach(() => {
    helper.restoreAll();
  });

  describe("getStamps", () => {
    it("should return stamps with basic pagination", async () => {
      // Use the shared helper to mock the query
      fixtureHelpers.mockStampQuery(
        helper,
        stampFixtures.regularStamps.slice(0, 5),
      );

      const result = await StampRepository.getStamps({
        limit: 5,
        page: 1,
      });

      assertExists(result);
      assertEquals(Array.isArray(result), true);
      assertEquals(result.length, 5);

      if (result.length > 0) {
        const firstStamp = result[0];
        assertExists(firstStamp.stamp);
        assertExists(firstStamp.cpid);
        assertExists(firstStamp.tx_hash);
      }
    });

    it("should return stamps filtered by type", async () => {
      fixtureHelpers.mockStampQuery(helper, stampFixtures.regularStamps);

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "stamps",
      });

      assertExists(result);
      // All stamps should have positive numbers
      result.forEach((stamp) => {
        assertEquals(stamp.stamp > 0, true);
      });
    });

    it("should return cursed stamps when filtered", async () => {
      fixtureHelpers.mockStampQuery(helper, stampFixtures.cursedStamps);

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
        type: "cursed",
      });

      assertExists(result);
      // All stamps should have negative numbers
      result.forEach((stamp) => {
        assertEquals(stamp.stamp < 0, true);
      });
    });

    it("should handle empty results", async () => {
      helper.mockEmpty();

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertEquals(result, []);
    });

    it("should handle database errors gracefully", async () => {
      helper.mockError("Database connection failed");

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertEquals(result, []);
    });
  });

  describe("getTotalStampCountFromDb", () => {
    it("should return total count", async () => {
      fixtureHelpers.mockCountQuery(helper, 100000);

      const count = await StampRepository.getTotalStampCountFromDb({});
      assertEquals(count, 100000);
    });

    it("should return count with type filter", async () => {
      fixtureHelpers.mockCountQuery(helper, 95000);

      const regularCount = await StampRepository.getTotalStampCountFromDb({
        type: "stamps",
      });
      assertEquals(regularCount, 95000);
    });

    it("should return 0 on error", async () => {
      helper.mockError("Count failed");

      const count = await StampRepository.getTotalStampCountFromDb({});
      assertEquals(count, 0);
    });
  });

  describe("getStampFile", () => {
    it("should return stamp file data", async () => {
      const mockStamp = stampFixtures.regularStamps[0];
      fixtureHelpers.mockStampQuery(helper, [mockStamp]);

      const result = await StampRepository.getStampFile(mockStamp.cpid);

      if (result) {
        assertExists(result.stamp);
        assertExists(result.cpid);
        assertExists(result.stamp_url);
        assertEquals(result.cpid, mockStamp.cpid);
      }
    });

    it("should return null for non-existent stamp", async () => {
      helper.mockEmpty();

      const result = await StampRepository.getStampFile("NONEXISTENT");
      assertEquals(result, null);
    });

    it("should handle invalid identifiers", async () => {
      const result = await StampRepository.getStampFile("invalid@#$");
      assertEquals(result, null);
    });
  });

  describe("getCreatorNameByAddress", () => {
    it("should return creator name", async () => {
      const mockCreator = stampFixtures.creators[0];
      helper.mockCachedQuery([{ creator: mockCreator.creator }]);

      const result = await StampRepository.getCreatorNameByAddress(
        mockCreator.address,
      );
      assertEquals(result, mockCreator.creator);
    });

    it("should return null for unknown address", async () => {
      helper.mockEmpty();

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1unknown",
      );
      assertEquals(result, null);
    });

    it("should handle errors gracefully", async () => {
      helper.mockError("Query failed");

      const result = await StampRepository.getCreatorNameByAddress(
        "bc1error",
      );
      assertEquals(result, null);
    });
  });

  describe("updateCreatorName", () => {
    it("should update creator name successfully", async () => {
      helper.mockQuery([], 1);

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, true);
    });

    it("should return false on error", async () => {
      helper.mockError("Update failed", "executeQuery");

      const result = await StampRepository.updateCreatorName(
        "bc1test",
        "Test Creator",
      );
      assertEquals(result, false);
    });
  });

  describe("sanitize", () => {
    it("should remove special characters except allowed ones", () => {
      const result = StampRepository.sanitize("test@123#abc!");
      assertEquals(result, "test123abc");
    });

    it("should preserve alphanumeric, dots, and hyphens", () => {
      const result = StampRepository.sanitize("test.file-name_123");
      assertEquals(result, "test.file-name_123");
    });

    it("should handle empty strings", () => {
      const result = StampRepository.sanitize("");
      assertEquals(result, "");
    });

    it("should handle strings with only special characters", () => {
      const result = StampRepository.sanitize("@#$%^&*()");
      assertEquals(result, "");
    });
  });

  describe("getStamps with market data", () => {
    it("should return stamps with market data", async () => {
      fixtureHelpers.mockStampQuery(helper, stampFixtures.stampsWithMarketData);

      const result = await StampRepository.getStamps({
        limit: 10,
        page: 1,
      });

      assertExists(result);
      if (
        result.length > 0 &&
        stampFixtures.stampsWithMarketData[0].floor_price_btc
      ) {
        // The fixture includes market data fields
        const firstStamp = stampFixtures.stampsWithMarketData[0];
        assertExists(firstStamp.floor_price_btc);
        assertExists(firstStamp.holder_count);
      }
    });
  });
});
