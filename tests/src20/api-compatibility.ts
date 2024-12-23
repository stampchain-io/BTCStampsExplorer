import { assertEquals } from "@std/assert";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20TrxRequestParams } from "$lib/types/src20.d.ts";

// Test cases for API compatibility verification
const TEST_CASES = [
  {
    name: "Trending minting tokens",
    params: { limit: 5, page: 1 },
    type: "minting"
  },
  {
    name: "Top market cap tokens",
    params: { limit: 5, page: 1 },
    type: "market"
  }
];

Deno.test("SRC20 API V1 vs V2 Response Compatibility", async (t) => {
  for (const testCase of TEST_CASES) {
    await t.step(testCase.name, async () => {
      const params: SRC20TrxRequestParams = {
        ...testCase.params
      };

      let v1Result, v2Result;

      if (testCase.type === "market") {
        v1Result = await Src20Controller.fetchFullyMintedByMarketCap(params);
        v2Result = await Src20Controller.fetchFullyMintedByMarketCapV2(params);
      } else {
        v1Result = await Src20Controller.fetchTrendingMints(params);
        v2Result = await Src20Controller.fetchTrendingMintsV2(params);
      }

      // Compare response structure
      assertEquals(
        Object.keys(v1Result).sort(),
        Object.keys(v2Result).sort(),
        `Response structure mismatch for ${testCase.name}`
      );

      // Compare data length if paginated
      if (Array.isArray(v1Result.data) && Array.isArray(v2Result.data)) {
        assertEquals(
          v1Result.data.length,
          v2Result.data.length,
          `Data length mismatch for ${testCase.name}`
        );

        // Compare essential data properties
        v1Result.data.forEach((v1Item, index) => {
          const v2Item = v2Result.data[index];
          assertEquals(
            Object.keys(v1Item).sort(),
            Object.keys(v2Item).sort(),
            `Data item structure mismatch at index ${index}`
          );
        });
      }

      console.log(`✓ ${testCase.name} - Response compatibility verified`);
    });
  }
});
