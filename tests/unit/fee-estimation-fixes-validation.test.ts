/**
 * Validation tests for Task 23: Critical StampingTool Bug Fixes
 *
 * Tests validate fixes for:
 * 1. UTXO API endpoint integration (23.2) ✅ FIXED
 * 2. Phase progression logic (23.1)
 * 3. Negative fee calculations (23.3) ✅ FIXED
 * 4. End-to-end wallet flow (23.4)
 */

import { TransactionConstructionService } from "$lib/utils/minting/TransactionConstructionService.ts";
import { assertEquals, assertExists, assertGreaterOrEqual } from "@std/assert";

// Test wallet with known UTXO for validation
const TEST_WALLET = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

Deno.test("Task 23.2: UTXO API Integration Fix", async (t) => {
  const estimator = new TransactionConstructionService();

  await t.step("should use tool endpoint for smart estimation", async () => {
    // Mock fetch to verify tool endpoint is called
    const originalFetch = globalThis.fetch;
    let capturedUrl = "";

    globalThis.fetch = async (url: string | URL) => {
      capturedUrl = url.toString();
      // Return tool endpoint response format for stamp endpoint
      return new Response(
        JSON.stringify({
          est_tx_size: 250,
          est_miner_fee: 500,
          total_dust_value: 333,
          total_output_value: 833,
          is_estimate: true,
          estimation_method: "service_with_dummy_utxos",
          change_value: 0,
          input_value: 1000,
        }),
        { status: 200 },
      );
    };

    try {
      const result = await estimator.estimateSmart({
        toolType: "stamp",
        feeRate: 1.0,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      // Smart estimation uses tool endpoints now
      assertEquals(
        capturedUrl.includes("/api/v2/olga/mint"),
        true,
        "Should use tool endpoint for smart estimation",
      );
      assertEquals(result.phase, "smart", "Should be smart phase");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.step("should handle tool endpoint response correctly", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          est_tx_size: 250,
          est_miner_fee: 500,
          total_dust_value: 333,
          total_output_value: 833,
          is_estimate: true,
          estimation_method: "service_with_dummy_utxos",
          change_value: 0,
          input_value: 1000,
        }),
        { status: 200 },
      );
    };

    try {
      const result = await estimator.estimateSmart({
        toolType: "stamp",
        feeRate: 1.0,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      assertExists(result, "Should return estimation result");
      assertEquals(result.phase, "smart", "Should be smart phase result");
      assertEquals(result.minerFee, 500, "Should use tool endpoint miner fee");
      assertEquals(
        result.totalValue,
        833,
        "Should use tool endpoint total cost",
      );
      assertEquals(
        result.dustValue,
        333,
        "Should use tool endpoint dust value",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

Deno.test("Task 23.3: Negative Fee Calculation Fix", async (t) => {
  const estimator = new TransactionConstructionService();

  await t.step("should prevent negative fees with low fee rates", async () => {
    const result = await estimator.estimateInstant({
      toolType: "stamp",
      feeRate: 0.01, // Very low fee rate that could cause negatives
      walletAddress: TEST_WALLET,
      isConnected: true,
      isSubmitting: false,
      quantity: 1,
      locked: true,
      divisible: false,
    });

    assertGreaterOrEqual(
      result.minerFee,
      1,
      "Miner fee should be at least 1 sat",
    );
    assertGreaterOrEqual(
      result.totalValue,
      1,
      "Total value should be positive",
    );
    assertGreaterOrEqual(
      result.dustValue,
      0,
      "Dust value should be non-negative",
    );
  });

  await t.step("should prevent negative fees with zero fee rate", async () => {
    const result = await estimator.estimateInstant({
      toolType: "stamp",
      feeRate: 0, // Zero fee rate
      walletAddress: TEST_WALLET,
      isConnected: true,
      isSubmitting: false,
      quantity: 1,
      locked: true,
      divisible: false,
    });

    assertGreaterOrEqual(
      result.minerFee,
      1,
      "Should enforce minimum 1 sat fee",
    );
    assertGreaterOrEqual(result.totalValue, 1, "Total should be positive");
  });

  await t.step(
    "should validate fee calculations in smart estimation",
    async () => {
      const originalFetch = globalThis.fetch;

      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({
            utxos: [{
              txid: "test-txid",
              vout: 0,
              value: 5000,
              scriptType: "P2WPKH",
            }],
          }),
          { status: 200 },
        );
      };

      try {
        const result = await estimator.estimateSmart({
          toolType: "stamp",
          feeRate: 0.05, // Low fee rate
          walletAddress: TEST_WALLET,
          isConnected: true,
          isSubmitting: false,
          quantity: 1,
          locked: true,
          divisible: false,
        });

        assertGreaterOrEqual(
          result.minerFee,
          1,
          "Smart estimation should prevent negative fees",
        );
        assertGreaterOrEqual(
          result.totalValue,
          result.minerFee,
          "Total should include miner fee",
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    },
  );
});

Deno.test("Task 23.4: End-to-End Flow Validation", async (t) => {
  await t.step("should handle complete estimation flow", async () => {
    const estimator = new TransactionConstructionService();

    // Phase 1: Instant estimation
    const instantResult = await estimator.estimateInstant({
      toolType: "stamp",
      feeRate: 2.0,
      walletAddress: TEST_WALLET,
      isConnected: true,
      isSubmitting: false,
      quantity: 1,
      locked: true,
      divisible: false,
    });

    assertEquals(instantResult.phase, "instant", "Phase 1 should be instant");
    assertEquals(
      instantResult.hasExactFees,
      false,
      "Phase 1 should not have exact fees",
    );
    assertGreaterOrEqual(
      instantResult.minerFee,
      1,
      "Phase 1 should have positive fees",
    );

    // Mock successful tool endpoint for Phase 2
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          est_tx_size: 300,
          est_miner_fee: 600,
          total_dust_value: 333,
          total_output_value: 933,
          is_estimate: true,
          estimation_method: "service_with_dummy_utxos",
          change_value: 0,
          input_value: 1200,
        }),
        { status: 200 },
      );
    };

    try {
      // Phase 2: Smart estimation
      const cachedResult = await estimator.estimateSmart({
        toolType: "stamp",
        feeRate: 2.0,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      assertEquals(cachedResult.phase, "smart", "Phase 2 should be smart");
      assertEquals(
        cachedResult.hasExactFees,
        false,
        "Phase 2 should not have exact fees yet",
      );
      assertGreaterOrEqual(
        cachedResult.minerFee,
        1,
        "Phase 2 should have positive fees",
      );

      // Phase 2 should potentially be more accurate than Phase 1
      assertExists(cachedResult.cacheHit, "Phase 2 should report cache status");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.step("should handle test wallet UTXO correctly", async () => {
    // This test validates that our test wallet's 5000 sat UTXO is sufficient
    const estimator = new TransactionConstructionService();

    const result = await estimator.estimateInstant({
      toolType: "stamp",
      feeRate: 2.0,
      walletAddress: TEST_WALLET,
      isConnected: true,
      isSubmitting: false,
      quantity: 1,
      locked: true,
      divisible: false,
    });

    // With 5000 sats available, the fees should be reasonable
    assertGreaterOrEqual(
      5000,
      result.totalValue,
      "Test wallet should have sufficient funds",
    );
    assertGreaterOrEqual(
      result.totalValue,
      1,
      "Should calculate reasonable total fees",
    );
  });
});

Deno.test("Task 23: Integration Validation", async (t) => {
  await t.step("should validate all fixes work together", async () => {
    const estimator = new TransactionConstructionService();

    // Test the complete flow with all fixes applied
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: string | URL) => {
      const urlStr = url.toString();

      if (urlStr.includes("/api/v2/olga/mint")) {
        return new Response(
          JSON.stringify({
            est_tx_size: 300,
            est_miner_fee: 450,
            total_dust_value: 333,
            total_output_value: 783,
            is_estimate: true,
            estimation_method: "service_with_dummy_utxos",
            change_value: 0,
            input_value: 1000,
          }),
          { status: 200 },
        );
      }

      return new Response("Not found", { status: 404 });
    };

    try {
      // Test instant estimation (should work without API calls)
      const instant = await estimator.estimateInstant({
        toolType: "stamp",
        feeRate: 1.5,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      // Test smart estimation (should use tool endpoint)
      const smart = await estimator.estimateSmart({
        toolType: "stamp",
        feeRate: 1.5,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      // Validate both phases work correctly
      assertEquals(instant.phase, "instant", "Instant phase should work");
      assertEquals(smart.phase, "smart", "Smart phase should work");

      assertGreaterOrEqual(
        instant.minerFee,
        1,
        "Instant fees should be positive",
      );
      assertGreaterOrEqual(
        smart.minerFee,
        1,
        "Smart fees should be positive",
      );

      assertGreaterOrEqual(
        instant.totalValue,
        instant.minerFee,
        "Instant total should be valid",
      );
      assertGreaterOrEqual(
        smart.totalValue,
        smart.minerFee,
        "Smart total should be valid",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
