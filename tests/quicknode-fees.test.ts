import { assertEquals, assertExists } from "@std/assert";
import { QuicknodeService } from "../server/services/quicknode/quicknodeService.ts";

// Mock QuickNode service for testing
const originalFetchQuicknode = QuicknodeService.fetchQuicknode;

Deno.test("QuickNode Fee Estimation Service", async (t) => {
  await t.step("should convert BTC/kB to sats/vB correctly", async () => {
    // Test various conversion scenarios
    const testCases = [
      { btcPerKb: 0.00001, expectedSatsPerVb: 1 }, // Minimum case
      { btcPerKb: 0.00010, expectedSatsPerVb: 10 }, // Normal case
      { btcPerKb: 0.00050, expectedSatsPerVb: 50 }, // High fee case
      { btcPerKb: 0.00000001, expectedSatsPerVb: 1 }, // Below minimum (should be 1)
    ];

    for (const testCase of testCases) {
      const mockResponse = {
        result: {
          feerate: testCase.btcPerKb,
          blocks: 6,
        },
      };

      QuicknodeService.fetchQuicknode = () => Promise.resolve(mockResponse);

      const result = await QuicknodeService.estimateSmartFee(6);

      assertExists(result);
      assertEquals(
        result.feeRateSatsPerVB,
        testCase.expectedSatsPerVb,
        `Failed for ${testCase.btcPerKb} BTC/kB`,
      );
    }
  });

  await t.step(
    "should handle different confirmation targets with correct confidence",
    async () => {
      const testCases = [
        { confTarget: 1, expectedConfidence: "high" },
        { confTarget: 2, expectedConfidence: "high" },
        { confTarget: 3, expectedConfidence: "medium" },
        { confTarget: 6, expectedConfidence: "medium" },
        { confTarget: 12, expectedConfidence: "low" },
        { confTarget: 144, expectedConfidence: "low" },
      ];

      for (const testCase of testCases) {
        const mockResponse = {
          result: {
            feerate: 0.00015,
            blocks: testCase.confTarget,
          },
        };

        QuicknodeService.fetchQuicknode = () => Promise.resolve(mockResponse);

        const result = await QuicknodeService.estimateSmartFee(
          testCase.confTarget,
        );

        assertExists(result);
        assertEquals(result.confidence, testCase.expectedConfidence);
        assertEquals(result.blocks, testCase.confTarget);
        assertEquals(result.source, "quicknode");
      }
    },
  );

  await t.step("should handle API errors gracefully", async () => {
    // Test network error
    QuicknodeService.fetchQuicknode = () => {
      return Promise.reject(new Error("Network timeout"));
    };

    let result = await QuicknodeService.estimateSmartFee(6);
    assertEquals(result, null);

    // Test empty response
    QuicknodeService.fetchQuicknode = () => Promise.resolve(null);

    result = await QuicknodeService.estimateSmartFee(6);
    assertEquals(result, null);

    // Test response without result
    QuicknodeService.fetchQuicknode = () => Promise.resolve({});

    result = await QuicknodeService.estimateSmartFee(6);
    assertEquals(result, null);
  });

  await t.step("should handle Bitcoin Core errors in response", async () => {
    // Test response with errors array
    const mockResponseWithErrors = {
      result: {
        feerate: 0.00015,
        blocks: 6,
        errors: ["Insufficient data for fee estimation"],
      },
    };

    QuicknodeService.fetchQuicknode = () =>
      Promise.resolve(mockResponseWithErrors);

    const result = await QuicknodeService.estimateSmartFee(6);
    assertEquals(result, null);
  });

  await t.step("should handle invalid feerate values", async () => {
    const invalidCases = [
      { feerate: 0 }, // Zero fee
      { feerate: -0.00001 }, // Negative fee
      { feerate: null }, // Null fee
      { feerate: undefined }, // Undefined fee
      { feerate: "invalid" }, // String fee
    ];

    for (const invalidCase of invalidCases) {
      const mockResponse = {
        result: {
          ...invalidCase,
          blocks: 6,
        },
      };

      QuicknodeService.fetchQuicknode = () => Promise.resolve(mockResponse);

      const result = await QuicknodeService.estimateSmartFee(6);
      assertEquals(
        result,
        null,
        `Should handle invalid feerate: ${invalidCase.feerate}`,
      );
    }
  });

  await t.step("should use correct estimate modes", async () => {
    const modes = ["economical", "conservative"] as const;

    for (const mode of modes) {
      let capturedParams: any[] = [];

      QuicknodeService.fetchQuicknode = (
        _method: string,
        params: any[],
      ) => {
        capturedParams = params;
        return Promise.resolve({
          result: {
            feerate: 0.00015,
            blocks: 6,
          },
        });
      };

      await QuicknodeService.estimateSmartFee(6, mode);

      assertEquals(capturedParams[0], 6); // confTarget
      assertEquals(capturedParams[1], mode); // estimateMode
    }
  });

  await t.step("should get multiple fee estimates", async () => {
    let callCount = 0;
    const expectedCalls = [
      { confTarget: 1, mode: "conservative" },
      { confTarget: 6, mode: "economical" },
      { confTarget: 144, mode: "economical" },
    ];

    QuicknodeService.fetchQuicknode = (
      _method: string,
      params: any[],
    ) => {
      const expectedCall = expectedCalls[callCount];
      assertEquals(params[0], expectedCall.confTarget);
      assertEquals(params[1], expectedCall.mode);

      callCount++;

      return Promise.resolve({
        result: {
          feerate: 0.00015,
          blocks: params[0],
        },
      });
    };

    const result = await QuicknodeService.getMultipleFeeEstimates();

    assertExists(result.fast);
    assertExists(result.normal);
    assertExists(result.economy);

    assertEquals(result.fast?.blocks, 1);
    assertEquals(result.normal?.blocks, 6);
    assertEquals(result.economy?.blocks, 144);

    assertEquals(callCount, 3);
  });

  await t.step(
    "should handle partial failures in multiple estimates",
    async () => {
      let callCount = 0;

      QuicknodeService.fetchQuicknode = (
        _method: string,
        params: any[],
      ) => {
        callCount++;

        // Fail the first call (fast estimate)
        if (callCount === 1) {
          return Promise.reject(new Error("Network error"));
        }

        return Promise.resolve({
          result: {
            feerate: 0.00015,
            blocks: params[0],
          },
        });
      };

      const result = await QuicknodeService.getMultipleFeeEstimates();

      assertEquals(result.fast, null); // Should fail
      assertExists(result.normal); // Should succeed
      assertExists(result.economy); // Should succeed
    },
  );
});

// Cleanup after tests
Deno.test("QuickNode Tests Cleanup", () => {
  // Restore original fetchQuicknode method
  QuicknodeService.fetchQuicknode = originalFetchQuicknode;
});
