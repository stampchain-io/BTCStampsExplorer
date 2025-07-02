import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const API_BASE = "http://localhost:8000/api/v2";

Deno.test("Market Data Filter API Integration Tests", async (t) => {
  await t.step("Should accept new market data filter parameters", async () => {
    const params = new URLSearchParams({
      limit: "10",
      minHolderCount: "50",
      maxHolderCount: "500",
      minFloorPriceBTC: "0.01",
      minDistributionScore: "60",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data.data);
    assertEquals(Array.isArray(data.data), true);
  });

  await t.step("Should filter by data quality score", async () => {
    const params = new URLSearchParams({
      limit: "10",
      minDataQualityScore: "8",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data.data);
  });

  await t.step("Should filter by cache age", async () => {
    const params = new URLSearchParams({
      limit: "10",
      maxCacheAgeMinutes: "30",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data.data);
  });

  await t.step("Should filter by price source", async () => {
    const params = new URLSearchParams({
      limit: "10",
      priceSource: "counterparty,openstamp",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data.data);
  });

  await t.step("Should combine multiple filters", async () => {
    const params = new URLSearchParams({
      limit: "5",
      minHolderCount: "100",
      minFloorPriceBTC: "0.001",
      minDistributionScore: "70",
      maxTopHolderPercentage: "20",
      minDataQualityScore: "7",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    assertEquals(response.status, 200);
    assertExists(data.data);
    assertEquals(Array.isArray(data.data), true);
  });

  await t.step("Should handle invalid filter values gracefully", async () => {
    const params = new URLSearchParams({
      limit: "10",
      minHolderCount: "invalid",
      minFloorPriceBTC: "-1",
    });

    const response = await fetch(`${API_BASE}/stamps?${params}`);
    const data = await response.json();

    // Should still return results, filtering out invalid values
    assertEquals(response.status, 200);
    assertExists(data.data);
  });
});
