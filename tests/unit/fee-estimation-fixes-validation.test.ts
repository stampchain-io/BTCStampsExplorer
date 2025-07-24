/**
 * Validation tests for Task 23: Critical StampingTool Bug Fixes
 *
 * Tests validate fixes for:
 * 1. UTXO API endpoint integration (23.2) ✅ FIXED
 * 2. Phase progression logic (23.1)
 * 3. Negative fee calculations (23.3) ✅ FIXED
 * 4. End-to-end wallet flow (23.4)
 */

import { assertEquals, assertExists, assertGreaterOrEqual } from "@std/assert";
import { TransactionFeeEstimator } from "../../lib/utils/minting/TransactionFeeEstimator.ts";

// Test wallet with known UTXO for validation
const TEST_WALLET = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

Deno.test("Task 23.2: UTXO API Integration Fix", async (t) => {
  const estimator = TransactionFeeEstimator.getInstance();

  await t.step("should use correct UTXO endpoint", async () => {
    // Mock fetch to verify correct endpoint is called
    const originalFetch = globalThis.fetch;
    let capturedUrl = "";

    globalThis.fetch = async (url: string | URL) => {
      capturedUrl = url.toString();
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
      await estimator.estimateCached({
        toolType: "stamp",
        feeRate: 1.0,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      // Verify correct endpoint was called
      assertEquals(
        capturedUrl,
        `/api/v2/trx/utxoquery?address=${TEST_WALLET}&excludeAssets=true`,
        "Should use correct UTXO query endpoint",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  await t.step("should parse UTXO response format correctly", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          utxos: [
            {
              txid:
                "f6ecb5658a7cd93b42f5d251f01542daf491d42208f63fb548654dd3ebbf9e75",
              vout: 3,
              value: 5000,
              scriptType: "P2WPKH",
            },
          ],
        }),
        { status: 200 },
      );
    };

    try {
      const result = await estimator.estimateCached({
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
      assertEquals(result.phase, "cached", "Should be cached phase result");
      assertGreaterOrEqual(
        result.minerFee,
        1,
        "Should calculate positive miner fee",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

Deno.test("Task 23.3: Negative Fee Calculation Fix", async (t) => {
  const estimator = TransactionFeeEstimator.getInstance();

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
    "should validate fee calculations in cached estimation",
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
        const result = await estimator.estimateCached({
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
          "Cached estimation should prevent negative fees",
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
    const estimator = TransactionFeeEstimator.getInstance();

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

    // Mock successful UTXO fetch for Phase 2
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          utxos: [{
            txid:
              "f6ecb5658a7cd93b42f5d251f01542daf491d42208f63fb548654dd3ebbf9e75",
            vout: 3,
            value: 5000,
            scriptType: "P2WPKH",
          }],
        }),
        { status: 200 },
      );
    };

    try {
      // Phase 2: Cached estimation
      const cachedResult = await estimator.estimateCached({
        toolType: "stamp",
        feeRate: 2.0,
        walletAddress: TEST_WALLET,
        isConnected: true,
        isSubmitting: false,
        quantity: 1,
        locked: true,
        divisible: false,
      });

      assertEquals(cachedResult.phase, "cached", "Phase 2 should be cached");
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
    const estimator = TransactionFeeEstimator.getInstance();

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
    const estimator = TransactionFeeEstimator.getInstance();

    // Test the complete flow with all fixes applied
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url: string | URL) => {
      const urlStr = url.toString();

      if (urlStr.includes("/api/v2/trx/utxoquery")) {
        return new Response(
          JSON.stringify({
            utxos: [{
              txid:
                "f6ecb5658a7cd93b42f5d251f01542daf491d42208f63fb548654dd3ebbf9e75",
              vout: 3,
              value: 5000,
              scriptType: "P2WPKH",
            }],
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

      // Test cached estimation (should use fixed UTXO API)
      const cached = await estimator.estimateCached({
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
      assertEquals(cached.phase, "cached", "Cached phase should work");

      assertGreaterOrEqual(
        instant.minerFee,
        1,
        "Instant fees should be positive",
      );
      assertGreaterOrEqual(
        cached.minerFee,
        1,
        "Cached fees should be positive",
      );

      assertGreaterOrEqual(
        instant.totalValue,
        instant.minerFee,
        "Instant total should be valid",
      );
      assertGreaterOrEqual(
        cached.totalValue,
        cached.minerFee,
        "Cached total should be valid",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
