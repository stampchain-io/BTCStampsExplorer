/**
 * Integration Tests for Fee Mapping Helpers with SRC-101 RegisterTool
 *
 * Tests the shared fee mapping utilities from Task 18 with the SRC-101 RegisterTool
 * to validate fee calculation accuracy, edge cases, and error handling.
 *
 * @module tests/integration/fee-utilities/fee-mapping/src101-register-fee-mapping
 */

import {
  assertEquals,
  assertExists,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.208.0/testing/bdd.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";
import {
  calculateFeeRate,
  createErrorFallbackFeeDetails,
  formatSatoshiAmount,
  mapProgressiveFeeDetailsForComponent,
  mapProgressiveFeeDetailsForProps,
  mapToolSpecificParams,
  validateFeeDetails,
} from "$lib/utils/fee-mapping-helpers.ts";
import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

describe("SRC-101 RegisterTool Fee Mapping Integration", () => {
  describe("mapProgressiveFeeDetails with SRC-101 data", () => {
    it("should correctly map basic fee details for SRC-101 registration", () => {
      const mockFeeDetails: ProgressiveFeeEstimationResult = {
        minerFee: 1500,
        dustValue: 546,
        totalValue: 2046,
        hasExactFees: true,
        estimatedSize: 250,
        phase: "exact",
        confidence: 0.95,
        timestamp: Date.now(),
      };

      const mapped = mapProgressiveFeeDetails(mockFeeDetails);

      assertExists(mapped);
      assertEquals(mapped.minerFee, 1500);
      assertEquals(mapped.dustValue, 546);
      assertEquals(mapped.totalValue, 2046);
      assertEquals(mapped.hasExactFees, true);
      assertEquals(mapped.estimatedSize, 250);
    });

    it("should handle null/undefined fee details gracefully", () => {
      const mappedNull = mapProgressiveFeeDetails(null);
      assertEquals(mappedNull, undefined);

      const mappedUndefined = mapProgressiveFeeDetails(undefined);
      assertEquals(mappedUndefined, undefined);
    });

    it("should handle partial fee details with defaults", () => {
      const partialDetails = {
        minerFee: 1000,
        totalValue: 1546,
      } as any;

      const mapped = mapProgressiveFeeDetails(partialDetails);

      assertExists(mapped);
      assertEquals(mapped.minerFee, 1000);
      assertEquals(mapped.totalValue, 1546);
      // Should provide defaults for missing values
      assertEquals(mapped.dustValue, 0);
      assertEquals(mapped.hasExactFees, false);
      assertEquals(mapped.estimatedSize, 300);
    });
  });

  describe("Fee calculation accuracy for SRC-101 operations", () => {
    it("should calculate fees accurately for typical bitname registration", () => {
      // Typical SRC-101 registration: ~250 bytes
      const typicalFeeRates = [1, 5, 10, 25, 50, 100, 500, 1000]; // sat/vB

      typicalFeeRates.forEach((feeRate) => {
        const estimatedSize = 250;
        const expectedMinerFee = feeRate * estimatedSize;
        const dustValue = 546; // Standard dust value

        const mockDetails: ProgressiveFeeEstimationResult = {
          minerFee: expectedMinerFee,
          dustValue: dustValue,
          totalValue: expectedMinerFee + dustValue,
          hasExactFees: true,
          estimatedSize: estimatedSize,
          phase: "exact",
          confidence: 0.95,
          timestamp: Date.now(),
        };

        const mapped = mapProgressiveFeeDetails(mockDetails);
        assertExists(mapped);
        assertEquals(mapped.minerFee, expectedMinerFee);
        assertEquals(mapped.totalValue, expectedMinerFee + dustValue);

        // Verify fee rate calculation
        const calculatedRate = calculateFeeRate(
          mapped.totalValue,
          estimatedSize,
        );
        assertEquals(
          Math.ceil(calculatedRate),
          feeRate + Math.ceil(dustValue / estimatedSize),
        );
      });
    });

    it("should handle edge case fee rates", () => {
      const edgeCases = [
        { rate: 0, desc: "zero fee rate" },
        { rate: 0.1, desc: "sub-satoshi fee rate" },
        { rate: 999999, desc: "extremely high fee rate" },
      ];

      edgeCases.forEach(({ rate, desc }) => {
        const estimatedSize = 250;
        const minerFee = Math.ceil(rate * estimatedSize);
        const dustValue = 546;

        const mockDetails: ProgressiveFeeEstimationResult = {
          minerFee: minerFee,
          dustValue: dustValue,
          totalValue: minerFee + dustValue,
          hasExactFees: true,
          estimatedSize: estimatedSize,
          phase: "cached",
          confidence: 0.8,
          timestamp: Date.now(),
        };

        const mapped = mapProgressiveFeeDetails(mockDetails);
        assertExists(mapped, `Failed to map fee details for ${desc}`);
        assertEquals(mapped.minerFee, minerFee);
        assertEquals(mapped.totalValue, minerFee + dustValue);
      });
    });
  });

  describe("mapProgressiveFeeDetailsForProps pattern (SRC-101 uses this)", () => {
    it("should map all phase results for Props pattern", () => {
      const phase1: ProgressiveFeeEstimationResult = {
        minerFee: 1000,
        dustValue: 546,
        totalValue: 1546,
        hasExactFees: false,
        estimatedSize: 250,
        phase: "instant",
        confidence: 0.7,
        timestamp: Date.now() - 2000,
      };

      const phase2: ProgressiveFeeEstimationResult = {
        minerFee: 1200,
        dustValue: 546,
        totalValue: 1746,
        hasExactFees: false,
        estimatedSize: 250,
        phase: "cached",
        confidence: 0.85,
        timestamp: Date.now() - 1000,
      };

      const phase3: ProgressiveFeeEstimationResult = {
        minerFee: 1250,
        dustValue: 546,
        totalValue: 1796,
        hasExactFees: true,
        estimatedSize: 250,
        phase: "exact",
        confidence: 0.95,
        timestamp: Date.now(),
      };

      const propsPattern = mapProgressiveFeeDetailsForProps(
        phase3, // Current fee details
        phase1,
        phase2,
        phase3,
        "exact",
        false, // isPreFetching
        false, // isEstimating
      );

      assertExists(propsPattern.feeDetails);
      assertEquals(propsPattern.feeDetails.minerFee, 1250);
      assertEquals(propsPattern.phase1Result, phase1);
      assertEquals(propsPattern.phase2Result, phase2);
      assertEquals(propsPattern.phase3Result, phase3);
      assertEquals(propsPattern.currentPhase, "exact");
    });

    it("should handle missing phase results gracefully", () => {
      const currentDetails: ProgressiveFeeEstimationResult = {
        minerFee: 1000,
        dustValue: 546,
        totalValue: 1546,
        hasExactFees: false,
        estimatedSize: 250,
        phase: "instant",
        confidence: 0.7,
        timestamp: Date.now(),
      };

      const propsPattern = mapProgressiveFeeDetailsForProps(
        currentDetails,
        currentDetails, // phase1
        null, // phase2 not yet available
        null, // phase3 not yet available
        "instant",
        true, // isPreFetching
        false, // isEstimating
      );

      assertExists(propsPattern.feeDetails);
      assertEquals(propsPattern.phase1Result, currentDetails);
      assertEquals(propsPattern.phase2Result, null);
      assertEquals(propsPattern.phase3Result, null);
      assertEquals(propsPattern.isPreFetching, true);
    });
  });

  describe("Tool-specific parameter mapping for SRC-101", () => {
    it("should correctly map SRC-101 specific parameters", () => {
      const formState = {
        fee: 10,
        toAddress: "testuser",
        root: ".btc",
        bitname: "testuser.btc",
        jsonSize: 150,
      };

      const params = mapToolSpecificParams("src101-create", formState);

      assertExists(params);
      assertEquals(params.bitname, "testuser.btc");
      assertEquals(params.root, ".btc");
    });

    it("should handle different TLD roots", () => {
      const tlds = [".btc", ".ord", ".gm", ".og", ".x"];

      tlds.forEach((tld) => {
        const formState = {
          toAddress: "username",
          root: tld,
        };

        const params = mapToolSpecificParams("src101-create", formState);
        assertEquals(params.bitname, `username${tld}`);
        assertEquals(params.root, tld);
      });
    });
  });

  describe("Fee formatting utilities", () => {
    it("should format satoshi amounts correctly", () => {
      const testCases = [
        { sats: 0, expected: "0 sats" },
        { sats: 1, expected: "1 sats" },
        { sats: 546, expected: "546 sats" },
        { sats: 9999, expected: "9999 sats" },
        { sats: 10000, expected: "0.000100 BTC" },
        { sats: 100000, expected: "0.001000 BTC" },
        { sats: 1000000, expected: "0.010000 BTC" },
        { sats: 10000000, expected: "0.100000 BTC" },
        { sats: 100000000, expected: "1.00000000 BTC" },
        { sats: 123456789, expected: "1.23456789 BTC" },
      ];

      testCases.forEach(({ sats, expected }) => {
        const formatted = formatSatoshiAmount(sats);
        assertEquals(formatted, expected, `Failed for ${sats} satoshis`);
      });
    });
  });

  describe("Fee validation for SRC-101 operations", () => {
    it("should validate complete fee details structure", () => {
      const validDetails = {
        minerFee: 1500,
        dustValue: 546,
        totalValue: 2046,
        hasExactFees: true,
        estimatedSize: 250,
      };

      const isValid = validateFeeDetails(validDetails);
      assertEquals(isValid, true);
    });

    it("should reject invalid fee details", () => {
      const invalidCases = [
        null,
        undefined,
        {},
        { minerFee: 1000 }, // Missing required fields
        {
          minerFee: "1000",
          dustValue: 546,
          totalValue: 1546,
          hasExactFees: true,
          estimatedSize: 250,
        }, // Wrong type
        {
          minerFee: NaN,
          dustValue: 546,
          totalValue: 1546,
          hasExactFees: true,
          estimatedSize: 250,
        },
      ];

      invalidCases.forEach((invalidDetails, index) => {
        const isValid = validateFeeDetails(invalidDetails);
        assertEquals(isValid, false, `Case ${index} should be invalid`);
      });
    });
  });

  describe("Error handling and fallbacks", () => {
    it("should create proper error fallback fee details", () => {
      const error = new Error("Network timeout");
      const fallback = createErrorFallbackFeeDetails(error);

      assertExists(fallback);
      assertEquals(fallback.minerFee, 0);
      assertEquals(fallback.dustValue, 0);
      assertEquals(fallback.totalValue, 0);
      assertEquals(fallback.hasExactFees, false);
      assertEquals(fallback.estimatedSize, 300);
      assertEquals(fallback.error, "Network timeout");
      assertEquals(fallback.phase, "instant");
    });

    it("should handle missing error message", () => {
      const fallback = createErrorFallbackFeeDetails();
      assertEquals(fallback.error, "Fee estimation failed");
    });
  });

  describe("Component pattern mapping for SRC-101", () => {
    it("should provide fallback values when fee details are null", () => {
      const mapped = mapProgressiveFeeDetailsForComponent(null, {
        minerFee: 1000,
        dustValue: 546,
        totalValue: 1546,
        estimatedSize: 250,
      });

      assertExists(mapped);
      assertEquals(mapped.minerFee, 1000);
      assertEquals(mapped.dustValue, 546);
      assertEquals(mapped.totalValue, 1546);
      assertEquals(mapped.estimatedSize, 250);
      assertEquals(mapped.hasExactFees, false);
    });

    it("should use fee details when available over fallbacks", () => {
      const feeDetails: ProgressiveFeeEstimationResult = {
        minerFee: 2000,
        dustValue: 600,
        totalValue: 2600,
        hasExactFees: true,
        estimatedSize: 300,
        phase: "exact",
        confidence: 0.95,
        timestamp: Date.now(),
      };

      const mapped = mapProgressiveFeeDetailsForComponent(feeDetails, {
        minerFee: 1000,
        dustValue: 546,
        totalValue: 1546,
        estimatedSize: 250,
      });

      assertEquals(mapped.minerFee, 2000);
      assertEquals(mapped.dustValue, 600);
      assertEquals(mapped.totalValue, 2600);
      assertEquals(mapped.estimatedSize, 300);
    });
  });

  describe("Edge cases and stress testing", () => {
    it("should handle extreme bitname lengths", () => {
      const extremeCases = [
        "", // Empty
        "a", // Single char
        "a".repeat(255), // Max reasonable length
      ];

      extremeCases.forEach((username) => {
        const formState = {
          toAddress: username,
          root: ".btc",
        };

        const params = mapToolSpecificParams("src101-create", formState);
        // Empty username won't set bitname
        if (username === "") {
          assertEquals(params.bitname, undefined);
        } else {
          assertEquals(params.bitname, `${username}.btc`);
        }
      });
    });

    it("should calculate fee rates with zero transaction size", () => {
      const rate = calculateFeeRate(1000, 0);
      assertEquals(rate, 0, "Should return 0 for zero size");
    });

    it("should handle negative values gracefully", () => {
      const rate = calculateFeeRate(-1000, 250);
      assertEquals(rate, 0, "Should return 0 for negative total value");
    });
  });
});

// Run all tests
if (import.meta.main) {
  console.log("Running SRC-101 RegisterTool Fee Mapping Integration Tests...");
}
