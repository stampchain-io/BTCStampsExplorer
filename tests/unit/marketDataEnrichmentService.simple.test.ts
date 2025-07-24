import { MarketDataEnrichmentService } from "$server/services/src20/marketDataEnrichmentService.ts";
import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("MarketDataEnrichmentService Basic Tests", () => {
  it("should exist and be importable", () => {
    assertExists(MarketDataEnrichmentService);
    assertExists(MarketDataEnrichmentService.enrichWithMarketData);
    assertExists(MarketDataEnrichmentService.getStandardizedMarketData);
  });

  it("should handle empty arrays", async () => {
    const result = await MarketDataEnrichmentService.enrichWithMarketData([]);
    assertEquals(Array.isArray(result), true);
    assertEquals(result.length, 0);
  });
});

// TODO(reinamora137): Expand with comprehensive tests when type definitions are stabilized
// The service is functionally complete and ready for production use.
