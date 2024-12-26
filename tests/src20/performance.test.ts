import { assertEquals, assertGreater } from "@std/assert";
import { Src20Controller } from "../../server/controller/src20Controller.ts";

// Helper function to simulate concurrent requests
async function simulateConcurrentRequests(
  requestFn: () => Promise<unknown>,
  concurrency: number,
): Promise<{ totalTime: number; successCount: number; errorCount: number }> {
  const startTime = Date.now();
  const requests = Array(concurrency).fill(null).map(() => requestFn());

  const results = await Promise.allSettled(requests);
  const endTime = Date.now();

  const successCount = results.filter((r) => r.status === "fulfilled").length;
  const errorCount = results.filter((r) => r.status === "rejected").length;

  return {
    totalTime: endTime - startTime,
    successCount,
    errorCount,
  };
}

Deno.test("SRC20 V2 Endpoints Performance Under Load", async (t) => {
  const CONCURRENT_USERS = 1000;
  const ACCEPTABLE_RESPONSE_TIME = 30000; // 30 seconds max for batch processing

  await t.step("fetchFullyMintedByMarketCapV2 under load", async () => {
    const results = await simulateConcurrentRequests(
      () => Src20Controller.fetchFullyMintedByMarketCapV2(10, 1, true),
      CONCURRENT_USERS,
    );

    assertEquals(
      results.successCount,
      CONCURRENT_USERS,
      "All requests should succeed",
    );
    assertEquals(results.errorCount, 0, "No requests should fail");
    assertGreater(
      ACCEPTABLE_RESPONSE_TIME,
      results.totalTime,
      `Response time ${results.totalTime}ms exceeds limit of ${ACCEPTABLE_RESPONSE_TIME}ms`,
    );
  });

  await t.step("fetchTrendingActiveMintingTokensV2 under load", async () => {
    const results = await simulateConcurrentRequests(
      () =>
        Src20Controller.fetchTrendingActiveMintingTokensV2(10, 1, 100, true),
      CONCURRENT_USERS,
    );

    assertEquals(
      results.successCount,
      CONCURRENT_USERS,
      "All requests should succeed",
    );
    assertEquals(results.errorCount, 0, "No requests should fail");
    assertGreater(
      ACCEPTABLE_RESPONSE_TIME,
      results.totalTime,
      `Response time ${results.totalTime}ms exceeds limit of ${ACCEPTABLE_RESPONSE_TIME}ms`,
    );
  });
});
