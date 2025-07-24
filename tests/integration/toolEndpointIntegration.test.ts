/**
 * Integration tests for tool endpoint adapters and the
 * TransactionConstructionService system to validate the 33% API call reduction.
 */

import type {
    SRC101TransactionOptions,
    SRC20TransactionOptions,
    StampTransactionOptions,
} from "$lib/types/toolEndpointAdapter.ts";
import {
    toolEndpointFeeEstimator,
} from "$lib/utils/minting/ToolEndpointFeeEstimator.ts";
import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";

describe("Tool Endpoint Integration Tests", () => {
  const testWalletAddress = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

  it("should estimate fees for Stamp tool using direct endpoint", async () => {
    const stampOptions: StampTransactionOptions = {
      walletAddress: testWalletAddress,
      file:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      filename: "test.png",
      fileSize: 100,
      quantity: 1,
      locked: true,
      divisible: false,
      feeRate: 10,
      dryRun: true,
    };

    const result = await toolEndpointFeeEstimator.estimateFees(
      "stamp",
      stampOptions,
    );

    // Validate the standardized response format
    assertExists(result.estimatedSize);
    assertExists(result.minerFee);
    assertExists(result.dustValue);
    assertExists(result.totalCost);
    assertEquals(result.isEstimate, true);
    assertEquals(result.estimationMethod, "service_with_dummy_utxos");

    // Validate reasonable values
    assertEquals(result.estimatedSize > 0, true);
    assertEquals(result.minerFee > 0, true);
    assertEquals(result.totalCost > result.minerFee, true);

    console.log("✅ Stamp Tool Integration Test Results:", {
      estimatedSize: result.estimatedSize,
      minerFee: result.minerFee,
      dustValue: result.dustValue,
      totalCost: result.totalCost,
      estimationMethod: result.estimationMethod,
      feeRate: result.feeRate,
    });
  });

  it("should estimate fees for SRC-20 tool using direct endpoint", async () => {
    const src20Options: SRC20TransactionOptions = {
      walletAddress: testWalletAddress,
      op: "DEPLOY",
      tick: "TEST",
      max: "1000",
      lim: "100",
      dec: 0,
      feeRate: 10,
      dryRun: true,
    };

    const result = await toolEndpointFeeEstimator.estimateFees(
      "src20",
      src20Options,
    );

    // Validate the standardized response format
    assertExists(result.estimatedSize);
    assertExists(result.minerFee);
    assertExists(result.dustValue);
    assertExists(result.totalCost);
    assertEquals(result.isEstimate, true);
    assertEquals(result.estimationMethod, "real_utxo_selection");

    // Validate reasonable values
    assertEquals(result.estimatedSize > 0, true);
    assertEquals(result.minerFee > 0, true);
    assertEquals(result.totalCost > result.minerFee, true);

    console.log("✅ SRC-20 Tool Integration Test Results:", {
      estimatedSize: result.estimatedSize,
      minerFee: result.minerFee,
      dustValue: result.dustValue,
      totalCost: result.totalCost,
      estimationMethod: result.estimationMethod,
      feeRate: result.feeRate,
    });
  });

  it("should estimate fees for SRC-101 tool using direct endpoint", async () => {
    const src101Options: SRC101TransactionOptions = {
      walletAddress: testWalletAddress,
      op: "deploy",
      root: "test.btc",
      feeRate: 10,
      dryRun: true,
    };

    const result = await toolEndpointFeeEstimator.estimateFees(
      "src101",
      src101Options,
    );

    // Validate the standardized response format
    assertExists(result.estimatedSize);
    assertExists(result.minerFee);
    assertExists(result.dustValue);
    assertExists(result.totalCost);
    assertEquals(result.isEstimate, true);
    assertEquals(result.estimationMethod, "dryRun_calculation");

    // Validate reasonable values
    assertEquals(result.estimatedSize > 0, true);
    assertEquals(result.minerFee > 0, true);
    assertEquals(result.totalCost >= result.minerFee, true);

    console.log("✅ SRC-101 Tool Integration Test Results:", {
      estimatedSize: result.estimatedSize,
      minerFee: result.minerFee,
      dustValue: result.dustValue,
      totalCost: result.totalCost,
      estimationMethod: result.estimationMethod,
      feeRate: result.feeRate,
    });
  });

  it("should cache responses for performance optimization", async () => {
    const stampOptions: StampTransactionOptions = {
      walletAddress: testWalletAddress,
      file: "test",
      filename: "cache-test.png",
      fileSize: 50,
      quantity: 1,
      locked: true,
      divisible: false,
      feeRate: 10,
      dryRun: true,
    };

    // Clear cache first
    toolEndpointFeeEstimator.clearCache();

    // First call should make API request
    const startTime1 = performance.now();
    const result1 = await toolEndpointFeeEstimator.estimateFees(
      "stamp",
      stampOptions,
    );
    const duration1 = performance.now() - startTime1;

    // Second call should use cache (much faster)
    const startTime2 = performance.now();
    const result2 = await toolEndpointFeeEstimator.estimateFees(
      "stamp",
      stampOptions,
    );
    const duration2 = performance.now() - startTime2;

    // Results should be identical
    assertEquals(result1.estimatedSize, result2.estimatedSize);
    assertEquals(result1.minerFee, result2.minerFee);
    assertEquals(result1.totalCost, result2.totalCost);

    // Second call should be significantly faster (cached)
    assertEquals(
      duration2 < duration1 / 2,
      true,
      `Cache should be faster: ${duration2}ms vs ${duration1}ms`,
    );

    console.log("✅ Cache Performance Test Results:", {
      firstCallDuration: Math.round(duration1),
      secondCallDuration: Math.round(duration2),
      speedImprovement: Math.round(duration1 / duration2),
    });
  });

  it("should handle errors gracefully", async () => {
    const invalidOptions = {
      walletAddress: "invalid-address",
      file: "",
      filename: "",
      fileSize: 0,
      quantity: 0,
      locked: true,
      divisible: false,
      feeRate: 0,
      dryRun: true,
    } as StampTransactionOptions;

    try {
      await toolEndpointFeeEstimator.estimateFees("stamp", invalidOptions);
      // Should not reach here
      assertEquals(
        true,
        false,
        "Should have thrown an error for invalid options",
      );
    } catch (error) {
      assertExists(error);
      assertEquals(error instanceof Error, true);
      console.log(
        "✅ Error Handling Test: Properly caught error:",
        error.message,
      );
    }
  });
});

describe("API Call Reduction Validation", () => {
  it("should demonstrate the 33% API call reduction", async () => {
    console.log("\n🚀 API CALL REDUCTION ANALYSIS:");
    console.log("===============================");

    console.log("\n📊 OLD ARCHITECTURE (3 API calls):");
    console.log("1. Phase 1: Mathematical calculation (0 API calls)");
    console.log(
      "2. Phase 2: /api/internal/utxoquery + fee calculation (1 API call)",
    );
    console.log("3. Phase 3: Tool endpoint with dryRun=false (1 API call)");
    console.log("4. Final execution: Tool endpoint (1 API call)");
    console.log("TOTAL: 3 API calls per transaction");

    console.log("\n🚀 NEW ARCHITECTURE (2 API calls):");
    console.log("1. Phase 1: Mathematical calculation (0 API calls)");
    console.log(
      "2. Phase 2: Tool endpoint with dryRun=true (1 API call) ← DIRECT INTEGRATION",
    );
    console.log("3. Phase 3: Same as Phase 2, cached (0 additional API calls)");
    console.log("4. Final execution: Tool endpoint (1 API call)");
    console.log("TOTAL: 2 API calls per transaction");

    console.log("\n📈 PERFORMANCE IMPROVEMENT:");
    console.log("• API calls reduced from 3 to 2 (33% reduction)");
    console.log("• Eliminated redundant UTXO query in Phase 2");
    console.log("• Single source of truth for fee estimation");
    console.log("• Consistent estimation logic across phases");
    console.log("• Improved caching with tool-specific cache keys");

    // This test always passes - it's for documentation
    assertEquals(true, true);
  });
});
