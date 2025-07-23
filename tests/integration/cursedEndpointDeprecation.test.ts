/**
 * Cursed Endpoint Deprecation Integration Test
 *
 * Validates that the /cursed endpoint is properly deprecated in v2.3
 * while remaining functional in v2.2, and that the alternative
 * /stamps?type=cursed endpoint works correctly.
 */

import { assertEquals, assertExists, assertMatch } from "@std/assert";

const BASE_URL = "http://localhost:8000";
const TIMEOUT_MS = 8000;

Deno.test("Cursed Endpoint Deprecation Integration Tests", async (t) => {
  await t.step(
    "v2.3 - Cursed endpoint returns deprecation notice",
    async () => {
      const response = await fetch(
        `${BASE_URL}/api/v2/cursed?limit=1`,
        {
          headers: { "X-API-Version": "2.3" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      assertEquals(response.status, 410); // Gone status for deprecated endpoint

      const data = await response.json();
      assertEquals(data.deprecated, true);
      assertExists(data.message);
      assertEquals(data.alternative, "/api/v2/stamps?type=cursed");
      assertExists(data.endOfLife);
      assertExists(data.supportedAlternative);

      // Check deprecation headers
      assertEquals(response.headers.get("Deprecation"), "true");
      assertExists(response.headers.get("Sunset"));
      assertEquals(
        response.headers.get("X-Alternative-Endpoint"),
        "/api/v2/stamps?type=cursed",
      );
    },
  );

  await t.step("v2.2 - Cursed endpoint still functional", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/cursed?limit=1`,
      {
        headers: { "X-API-Version": "2.2" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    assertEquals(response.status, 200);

    const data = await response.json();
    assertEquals(data.deprecated, undefined); // Should not have deprecation notice
    assertExists(data.data);
    assertEquals(Array.isArray(data.data), true);

    // Should return actual cursed stamp data
    if (data.data.length > 0) {
      assertExists(data.data[0].stamp);
      assertEquals(data.data[0].stamp < 0, true); // Cursed stamps have negative numbers
    }
  });

  await t.step(
    "v2.3 - Alternative stamps endpoint works correctly",
    async () => {
      const response = await fetch(
        `${BASE_URL}/api/v2/stamps?type=cursed&limit=2`,
        {
          headers: { "X-API-Version": "2.3" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      );

      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.deprecated, undefined); // Should not be deprecated
      assertExists(data.data);
      assertEquals(Array.isArray(data.data), true);

      // Should return cursed stamps only
      if (data.data.length > 0) {
        data.data.forEach((stamp: any) => {
          assertExists(stamp.stamp);
          assertEquals(stamp.stamp < 0, true); // All should be cursed (negative)
        });
      }
    },
  );

  await t.step("Cursed sub-endpoints also deprecated in v2.3", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/cursed/block`,
      {
        headers: { "X-API-Version": "2.3" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    assertEquals(response.status, 410); // Should also be deprecated

    const data = await response.json();
    assertEquals(data.deprecated, true);
    assertMatch(data.message, /deprecated/i);
  });

  await t.step("Version discovery shows cursed deprecation", async () => {
    const response = await fetch(
      `${BASE_URL}/api/v2/versions`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) },
    );

    assertEquals(response.status, 200);

    const data = await response.json();
    assertExists(data.versions);

    // Find v2.3 version info
    const v23 = data.versions.find((v: any) => v.version === "2.3");
    assertExists(v23);
    assertExists(v23.changes.deprecated);
    assertEquals(Array.isArray(v23.changes.deprecated), true);

    // Should mention cursed endpoint deprecation
    const hasCursedDeprecation = v23.changes.deprecated.some((item: string) =>
      item.includes("cursed") && item.includes("stamps")
    );
    assertEquals(hasCursedDeprecation, true);
  });

  await t.step("Alternative endpoint provides equivalent data", async () => {
    // Get data from v2.2 cursed endpoint (still functional)
    const cursedResponse = await fetch(
      `${BASE_URL}/api/v2/cursed?limit=3`,
      {
        headers: { "X-API-Version": "2.2" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    // Get data from v2.3 alternative endpoint
    const stampsResponse = await fetch(
      `${BASE_URL}/api/v2/stamps?type=cursed&limit=3`,
      {
        headers: { "X-API-Version": "2.3" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );

    assertEquals(cursedResponse.status, 200);
    assertEquals(stampsResponse.status, 200);

    const cursedData = await cursedResponse.json();
    const stampsData = await stampsResponse.json();

    // Both should return cursed stamps
    if (cursedData.data.length > 0 && stampsData.data.length > 0) {
      // First stamps should be the same (same ordering)
      assertEquals(cursedData.data[0].stamp, stampsData.data[0].stamp);

      // All stamps should be cursed (negative)
      cursedData.data.forEach((stamp: any) => {
        assertEquals(stamp.stamp < 0, true);
      });
      stampsData.data.forEach((stamp: any) => {
        assertEquals(stamp.stamp < 0, true);
      });
    }
  });
});
