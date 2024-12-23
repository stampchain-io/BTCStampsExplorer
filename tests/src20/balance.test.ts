import { assertEquals, assertExists } from "@std/assert";
import { Src20Controller } from "../../server/controller/src20Controller.ts";
import { SRC20Service } from "../../server/services/src20/index.ts";
import { BlockService } from "../../server/services/blockService.ts";

// Setup test data
const mockBalanceData = [{ tick: "TEST", balance: "1000" }];
const mockMintProgress = {
  max_supply: "1000",
  total_minted: "500",
  progress: "50",
};

// Create spy functions
const originalFetchBalance = SRC20Service.QueryService.fetchSrc20Balance;
const originalGetTotalCount =
  SRC20Service.QueryService.getTotalSrc20BalanceCount;
const originalFetchMintProgress =
  SRC20Service.QueryService.fetchSrc20MintProgress;
const originalGetLastBlock = BlockService.getLastBlock;

// Setup spy implementations
const spyFetchBalance = () => Promise.resolve(mockBalanceData);
const spyGetTotalCount = () => Promise.resolve(1);
const spyFetchMintProgress = () => Promise.resolve(mockMintProgress);
const spyGetLastBlock = () => Promise.resolve(100000);

// Test suite
Deno.test({
  name: "balance.test.ts",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    // Install spies
    SRC20Service.QueryService.fetchSrc20Balance = spyFetchBalance;
    SRC20Service.QueryService.getTotalSrc20BalanceCount = spyGetTotalCount;
    SRC20Service.QueryService.fetchSrc20MintProgress = spyFetchMintProgress;
    BlockService.getLastBlock = spyGetLastBlock;

    try {
      // Test basic functionality
      const basicResult = await Src20Controller.handleSrc20BalanceRequest({
        address: "bc1qtest",
        limit: 10,
        page: 1,
      });

      assertExists(basicResult.data);
      assertExists(basicResult.last_block);

      // Test mint data enrichment
      const mintDataResult = await Src20Controller.handleSrc20BalanceRequest({
        address: "bc1qtest",
        limit: 10,
        page: 1,
        includeMintData: true,
      });

      assertExists(mintDataResult.data);
      if (mintDataResult.data.length > 0) {
        assertExists(mintDataResult.data[0].mint_progress);
      }

      // Test pagination
      const paginationResult = await Src20Controller.handleSrc20BalanceRequest({
        address: "bc1qtest",
        limit: 10,
        page: 1,
        includePagination: true,
      });

      assertExists(paginationResult.page);
      assertExists(paginationResult.limit);
      assertExists(paginationResult.total);
      assertExists(paginationResult.totalPages);
      assertEquals(paginationResult.page, 1);
      assertEquals(paginationResult.limit, 10);

      // Test error handling
      const errorResult = await Src20Controller.handleSrc20BalanceRequest({
        address: "invalid_address",
        limit: -1,
        page: 0,
      });

      assertExists(errorResult.data);
      assertExists(errorResult.last_block);
      assertEquals(Array.isArray(errorResult.data), true);

      // Test specific tick query
      const tickResult = await Src20Controller.handleSrc20BalanceRequest({
        address: "bc1qtest",
        tick: "TEST",
      });

      assertExists(tickResult.data);
      if (Object.keys(tickResult.data).length > 0) {
        assertEquals(typeof tickResult.data, "object");
      }
    } finally {
      // Restore original method implementations
      SRC20Service.QueryService.fetchSrc20Balance = originalFetchBalance;
      SRC20Service.QueryService.getTotalSrc20BalanceCount =
        originalGetTotalCount;
      SRC20Service.QueryService.fetchSrc20MintProgress =
        originalFetchMintProgress;
      BlockService.getLastBlock = originalGetLastBlock;
    }
  },
});
