import { assertEquals } from "@std/assert";
import { Src20Controller } from "../../server/controller/src20Controller.ts";

interface TestParams {
  limit: number;
  page: number;
}

interface TestCase {
  name: string;
  params: TestParams;
  type: "minting" | "market";
  transactionCount?: number;
}

// Test cases for API compatibility verification
const TEST_CASES: TestCase[] = [
  {
    name: "Trending minting tokens",
    params: { limit: 5, page: 1 },
    type: "minting",
    transactionCount: 100 // Default transaction count for trending tokens
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
      const params: TestParams = {
        ...testCase.params
      };

      let v1Result, v2Result;

      if (testCase.type === "market") {
        // For market cap tokens, we use the V2 method with useV2 flag
        v1Result = await Src20Controller.fetchFullyMintedByMarketCapV2(
          params.limit,
          params.page,
          false // useV2 = false for V1 compatibility
        );
        v2Result = await Src20Controller.fetchFullyMintedByMarketCapV2(
          params.limit,
          params.page,
          true // useV2 = true for V2
        );
      } else {
        // For trending tokens, we need to pass transactionCount
        const txCount = testCase.transactionCount || 100; // Default to 100 if not specified
        v1Result = await Src20Controller.fetchTrendingActiveMintingTokensV2(
          params.limit,
          params.page,
          txCount,
          false // useV2 = false for V1 compatibility
        );
        v2Result = await Src20Controller.fetchTrendingActiveMintingTokensV2(
          params.limit,
          params.page,
          txCount,
          true // useV2 = true for V2
        );
      }

      // Compare response structure
      assertEquals(typeof v1Result, typeof v2Result, "Response types should match");
      assertEquals(Object.keys(v1Result).sort(), Object.keys(v2Result).sort(), "Response keys should match");
      
      // Verify data array structure
      assertEquals(Array.isArray(v1Result.data), Array.isArray(v2Result.data), "Data property should be consistently array or object");
      
      if (Array.isArray(v1Result.data) && Array.isArray(v2Result.data)) {
        assertEquals(v1Result.data.length, v2Result.data.length, "Data arrays should have same length");
        
        // Compare first item structure if available
        if (v1Result.data.length > 0 && v2Result.data.length > 0) {
          const v1Keys = Object.keys(v1Result.data[0]).sort();
          const v2Keys = Object.keys(v2Result.data[0]).sort();
          assertEquals(v1Keys, v2Keys, "Data item structure should match");
        }
      }
      
      // Verify pagination structure
      assertEquals(typeof v1Result.total, typeof v2Result.total, "Total property type should match");
      assertEquals(typeof v1Result.page, typeof v2Result.page, "Page property type should match");
      assertEquals(typeof v1Result.limit, typeof v2Result.limit, "Limit property type should match");
      assertEquals(typeof v1Result.totalPages, typeof v2Result.totalPages, "TotalPages property type should match");

      // Verify response maintains backward compatibility
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
