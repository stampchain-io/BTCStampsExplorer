// deno-lint-ignore-file no-explicit-any
import { Src20Controller } from "../server/controller/src20Controller.ts";
import { ResponseUtil } from "../lib/utils/responseUtil.ts";
import {
  emojiToUnicodeEscape,
  unicodeEscapeToEmoji,
} from "../lib/utils/emojiUtils.ts";
import { SRC20Repository } from "../server/database/src20Repository.ts";

// Import Deno types
declare global {
  interface ImportMeta {
    url: string;
    resolve(specifier: string): string;
  }

  const Deno: {
    exit(code: number): never;
  };
}

// Define interfaces
interface TestCase {
  name: string;
  address: string;
  tick?: string;
}

interface ExpectedResponse {
  last_block: number;
  data: Record<string, unknown> | unknown[];
}

// Expected response formats for comparison
const EXPECTED_EMPTY_RESPONSE: ExpectedResponse = {
  last_block: 878663,
  data: {},
};

const EXPECTED_DB_RESPONSE = {
  address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
  p: "SRC-20",
  tick: "luffy",
  amt: "12567227.300520010000000000",
  block_time: "2025-01-08T18:14:04.000Z",
  last_update: 878377,
  deploy_tx: "e90e6608c68a3264b202fb2f2e7abf780be454b98aa107b75e9c7ab9dc94244e",
  deploy_img:
    "https://stampchain.io/stamps/e90e6608c68a3264b202fb2f2e7abf780be454b98aa107b75e9c7ab9dc94244e.svg",
};

async function testBalanceEndpoint() {
  // Enable debug logging
  const DEBUG = true;
  console.log("\n=== Starting API Debug Test ===\n");

  const testCases: TestCase[] = [
    {
      name: "Luffy Balance Test",
      address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
      tick: "luffy",
    },
    {
      name: "No Tick Test (Known Working Case)",
      address: "bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y",
      tick: undefined,
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n=== Running ${testCase.name} ===`);
    console.log("Test Parameters:", {
      address: testCase.address,
      tick: testCase.tick,
    });

    if (testCase.tick) {
      console.log("Tick parameter (passing raw to database):");
      console.log("Raw tick:", testCase.tick);
      console.log("Note: Emoji conversion happens at database layer");
    }

    try {
      // Simulate route handler logic
      const balanceParams = {
        address: testCase.address,
        tick: testCase.tick || undefined, // Pass raw emoji to database layer
        includePagination: true,
        limit: 50,
        page: 1,
      };

      console.log("\nMaking request with params:", balanceParams);

      // First test direct database query
      if (DEBUG && testCase.tick) {
        console.log("\nTesting direct database query:");
        const dbResult = await SRC20Repository.getSrc20BalanceFromDb({
          address: testCase.address,
          tick: testCase.tick,
        });
        console.log(
          "Database Query Result:",
          JSON.stringify(dbResult, null, 2),
        );
      }

      // Then test controller layer
      console.log("\nTesting controller layer:");
      const result = await Src20Controller.handleSrc20BalanceRequest(
        balanceParams,
      );
      console.log("Controller Response:", JSON.stringify(result, null, 2));

      // Compare with expected format
      if (testCase.tick === "luffy") {
        console.log("\nComparing with expected formats:");
        console.log(
          "Expected empty response format:",
          JSON.stringify(EXPECTED_EMPTY_RESPONSE, null, 2),
        );
        console.log(
          "Expected DB response format:",
          JSON.stringify(EXPECTED_DB_RESPONSE, null, 2),
        );

        // Log database layer emoji handling note
        console.log("\nDatabase Layer Emoji Handling:");
        console.log("- Raw emoji is passed through route layer");
        console.log(
          "- Conversion to Unicode escape format happens in database layer",
        );
        console.log(
          "- Conversion back to emoji happens when returning from database",
        );
      }

      // Simulate actual API response
      const apiResponse = ResponseUtil.success(result);
      console.log("\nFinal API Response Status:", apiResponse.status);
      console.log(
        "Response Headers:",
        Object.fromEntries(apiResponse.headers.entries()),
      );

      const responseBody = await apiResponse.json();
      console.log("Response Body:", JSON.stringify(responseBody, null, 2));
    } catch (error) {
      console.error("\nError in test case:", error);
      console.error("Stack trace:", error.stack);
    }
  }

  console.log("\n=== API Debug Test Complete ===\n");
}

// Instructions for manual testing
// Only run if this is the main module
if (import.meta.url.endsWith("api_debug_test.ts")) {
  console.log(`
Manual Testing Instructions:
1. Make sure you're in the BTCStampsExplorer directory
2. Run this test with: deno run -A scripts/api_debug_test.ts
3. Check the output for detailed request/response information
4. Look for any parameter transformation issues
5. Compare the response format with the production API

Note: This test directly uses the controller layer to simulate API requests.
For comparison with production, use:
curl -v "https://stampchain.io/api/v2/src20/balance/bc1qay74nc2djs2g5acqp72eyvlqp3ku7sj97jft8y/luffy"
`);

  // Run the test
  testBalanceEndpoint()
    .catch((error) => {
      console.error("Fatal error running tests:", error);
      Deno.exit(1);
    });
}
