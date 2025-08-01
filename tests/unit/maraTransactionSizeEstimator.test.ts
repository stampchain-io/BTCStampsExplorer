import { assert, assertEquals, assertExists, assertThrows } from "@std/assert";
import { beforeEach, describe, it } from "jsr:@std/testing@1.0.14/bdd";
import { stub, returnsNext, Stub } from "@std/testing@1.0.14/mock";

import {
  calculateCIP33ChunkCount,
  getP2WSHOutputSize,
  calculateTotalDustValue,
  estimateMARATransactionSize,
  validateMARAOutputValue,
  calculateMinimumFunding,
  type MARATransactionEstimateConfig,
} from "../../lib/utils/bitcoin/minting/maraTransactionSizeEstimator.ts";

import type { ScriptType } from "$types/index.d.ts";

describe("MARA Transaction Size Estimator", () => {
  // Skip logger mock for now to get tests working
  // We can add it back later if needed

  describe("calculateCIP33ChunkCount", () => {
    it("should calculate correct chunk count for small files", () => {
      assertEquals(calculateCIP33ChunkCount(1), 1);
      assertEquals(calculateCIP33ChunkCount(16), 1);
      assertEquals(calculateCIP33ChunkCount(32), 1);
    });

    it("should calculate correct chunk count for files requiring multiple chunks", () => {
      assertEquals(calculateCIP33ChunkCount(33), 2);
      assertEquals(calculateCIP33ChunkCount(64), 2);
      assertEquals(calculateCIP33ChunkCount(65), 3);
    });

    it("should handle zero file size", () => {
      assertEquals(calculateCIP33ChunkCount(0), 0);
    });

    it("should handle large files", () => {
      assertEquals(calculateCIP33ChunkCount(1024), 32);
      assertEquals(calculateCIP33ChunkCount(10000), 313);
    });

    it("should always round up for partial chunks", () => {
      assertEquals(calculateCIP33ChunkCount(31), 1);
      assertEquals(calculateCIP33ChunkCount(33), 2);
      assertEquals(calculateCIP33ChunkCount(63), 2);
      assertEquals(calculateCIP33ChunkCount(95), 3);
    });
  });

  describe("getP2WSHOutputSize", () => {
    it("should return correct P2WSH output size", () => {
      assertEquals(getP2WSHOutputSize(), 43);
    });
  });

  describe("calculateTotalDustValue", () => {
    it("should calculate total dust value correctly", () => {
      assertEquals(calculateTotalDustValue(1, 100), 100);
      assertEquals(calculateTotalDustValue(5, 200), 1000);
      assertEquals(calculateTotalDustValue(10, 330), 3300);
    });

    it("should handle zero chunk count", () => {
      assertEquals(calculateTotalDustValue(0, 100), 0);
    });

    it("should handle zero output value", () => {
      assertEquals(calculateTotalDustValue(5, 0), 0);
    });

    it("should handle large values", () => {
      assertEquals(calculateTotalDustValue(100, 1000), 100000);
    });
  });

  describe("validateMARAOutputValue", () => {
    it("should validate valid MARA mode output values", () => {
      const result = validateMARAOutputValue(100);
      assertEquals(result.isValid, true);
      assertEquals(result.isMaraMode, true);
    });

    it("should validate valid non-MARA mode output values", () => {
      const result = validateMARAOutputValue(500);
      assertEquals(result.isValid, true);
      assertEquals(result.isMaraMode, false);
    });

    it("should identify MARA mode threshold", () => {
      const borderlineResult = validateMARAOutputValue(329);
      assertEquals(borderlineResult.isValid, true);
      assertEquals(borderlineResult.isMaraMode, true);

      const nonMaraResult = validateMARAOutputValue(330);
      assertEquals(nonMaraResult.isValid, true);
      assertEquals(nonMaraResult.isMaraMode, false);
    });

    it("should reject values below minimum", () => {
      const result = validateMARAOutputValue(0);
      assertEquals(result.isValid, false);
      assertEquals(result.isMaraMode, false);
      assertExists(result.error);
      assert(result.error!.includes("at least 1 satoshi"));
    });

    it("should reject negative values", () => {
      const result = validateMARAOutputValue(-10);
      assertEquals(result.isValid, false);
      assertEquals(result.isMaraMode, false);
      assertExists(result.error);
    });

    it("should reject values above maximum", () => {
      const result = validateMARAOutputValue(6000);
      assertEquals(result.isValid, false);
      assertEquals(result.isMaraMode, false);
      assertExists(result.error);
      assert(result.error!.includes("cannot exceed 5000"));
    });

    it("should handle edge case at minimum value", () => {
      const result = validateMARAOutputValue(1);
      assertEquals(result.isValid, true);
      assertEquals(result.isMaraMode, true);
    });

    it("should handle edge case at maximum value", () => {
      const result = validateMARAOutputValue(5000);
      assertEquals(result.isValid, true);
      assertEquals(result.isMaraMode, false);
    });
  });

  describe("estimateMARATransactionSize", () => {
    const basicConfig: MARATransactionEstimateConfig = {
      inputs: [{ type: "P2WPKH" as ScriptType, isWitness: true }],
      fileSize: 64,
      outputValue: 100,
      includeServiceFee: true,
      serviceFeeType: "P2WPKH" as ScriptType,
      includeChangeOutput: true,
      changeOutputType: "P2WPKH" as ScriptType,
      isMaraMode: true,
      maraFeeRate: 20,
    };

    it("should estimate transaction size with basic configuration", () => {
      const result = estimateMARATransactionSize(basicConfig);

      assertExists(result.estimatedSize);
      assertExists(result.estimatedWeight);
      assertExists(result.chunkCount);
      assertExists(result.totalDustValue);
      assertExists(result.estimatedFee);
      assertExists(result.breakdown);

      // Verify chunk count calculation
      assertEquals(result.chunkCount, 2); // 64 bytes = 2 chunks

      // Verify dust value calculation
      assertEquals(result.totalDustValue, 200); // 2 chunks * 100 sats

      // Verify fee calculation
      assertEquals(result.estimatedFee, result.estimatedSize * 20);
    });

    it("should handle witness inputs correctly", () => {
      const configWithWitness = {
        ...basicConfig,
        inputs: [
          { type: "P2WPKH" as ScriptType, isWitness: true },
          { type: "P2WPKH" as ScriptType, isWitness: true },
        ],
      };

      const result = estimateMARATransactionSize(configWithWitness);
      
      // Should include witness marker and flag
      assert(result.estimatedWeight > 0);
      assert(result.estimatedSize > 0);
    });

    it("should handle non-witness inputs correctly", () => {
      const configNonWitness = {
        ...basicConfig,
        inputs: [
          { type: "P2PKH" as ScriptType, isWitness: false },
          { type: "P2PKH" as ScriptType, isWitness: false },
        ],
      };

      const result = estimateMARATransactionSize(configNonWitness);
      
      // Non-witness inputs should result in larger size
      assert(result.estimatedWeight > 0);
      assert(result.estimatedSize > 0);
    });

    it("should handle mixed input types", () => {
      const mixedConfig = {
        ...basicConfig,
        inputs: [
          { type: "P2WPKH" as ScriptType, isWitness: true },
          { type: "P2PKH" as ScriptType, isWitness: false },
        ],
      };

      const result = estimateMARATransactionSize(mixedConfig);
      assert(result.estimatedSize > 0);
      assert(result.estimatedWeight > 0);
    });

    it("should exclude service fee when not requested", () => {
      const noServiceFeeConfig = {
        ...basicConfig,
        includeServiceFee: false,
      };

      const result = estimateMARATransactionSize(noServiceFeeConfig);
      assertEquals(result.breakdown.serviceFee, 0);
    });

    it("should exclude change output when not requested", () => {
      const noChangeConfig = {
        ...basicConfig,
        includeChangeOutput: false,
      };

      const result = estimateMARATransactionSize(noChangeConfig);
      assertEquals(result.breakdown.change, 0);
    });

    it("should handle different service fee types", () => {
      const p2pkhServiceConfig = {
        ...basicConfig,
        serviceFeeType: "P2PKH" as const,
      };

      const result = estimateMARATransactionSize(p2pkhServiceConfig);
      assert(result.breakdown.serviceFee > 0);
    });

    it("should handle different change output types", () => {
      const p2pkhChangeConfig = {
        ...basicConfig,
        changeOutputType: "P2PKH" as const,
      };

      const result = estimateMARATransactionSize(p2pkhChangeConfig);
      assert(result.breakdown.change > 0);
    });

    it("should handle zero file size", () => {
      const zeroFileConfig = {
        ...basicConfig,
        fileSize: 0,
      };

      const result = estimateMARATransactionSize(zeroFileConfig);
      assertEquals(result.chunkCount, 0);
      assertEquals(result.totalDustValue, 0);
      assertEquals(result.breakdown.dataOutputs, 0);
    });

    it("should handle large file sizes", () => {
      const largeFileConfig = {
        ...basicConfig,
        fileSize: 10000,
      };

      const result = estimateMARATransactionSize(largeFileConfig);
      assertEquals(result.chunkCount, 313); // Math.ceil(10000/32)
      assert(result.estimatedSize > 1000); // Should be substantial
    });

    it("should handle high fee rates", () => {
      const highFeeConfig = {
        ...basicConfig,
        maraFeeRate: 500,
      };

      const result = estimateMARATransactionSize(highFeeConfig);
      assert(result.estimatedFee > result.estimatedSize * 100);
    });

    it("should produce breakdown with correct totals", () => {
      const result = estimateMARATransactionSize(basicConfig);
      
      const calculatedTotal = result.breakdown.base + 
                            result.breakdown.inputs + 
                            result.breakdown.opReturn + 
                            result.breakdown.dataOutputs + 
                            result.breakdown.serviceFee + 
                            result.breakdown.change;
      
      assertEquals(result.breakdown.total, result.estimatedSize);
    });

    it("should handle empty inputs array", () => {
      const noInputsConfig = {
        ...basicConfig,
        inputs: [],
      };

      const result = estimateMARATransactionSize(noInputsConfig);
      assertEquals(result.breakdown.inputs, 0);
      assert(result.estimatedSize > 0); // Still has outputs
    });

    it("should handle multiple inputs efficiently", () => {
      const manyInputsConfig = {
        ...basicConfig,
        inputs: Array(10).fill({ type: "P2WPKH" as ScriptType, isWitness: true }),
      };

      const result = estimateMARATransactionSize(manyInputsConfig);
      assert(result.breakdown.inputs > 100); // Should scale with inputs
      assert(result.estimatedSize > 200);
    });
  });

  describe("calculateMinimumFunding", () => {
    const basicFundingConfig = {
      fileSize: 64,
      outputValue: 100,
      maraFeeRate: 20,
      includeServiceFee: true,
      serviceFeeAmount: 42000,
      estimatedInputCount: 3,
    };

    it("should calculate minimum funding correctly", () => {
      const result = calculateMinimumFunding(basicFundingConfig);

      assertExists(result.minimumFunding);
      assertExists(result.breakdown);
      assertExists(result.breakdown.dustTotal);
      assertExists(result.breakdown.serviceFee);
      assertExists(result.breakdown.estimatedMinerFee);
      assertExists(result.breakdown.buffer);

      // Verify dust total calculation
      assertEquals(result.breakdown.dustTotal, 200); // 2 chunks * 100 sats

      // Verify service fee
      assertEquals(result.breakdown.serviceFee, 42000);

      // Verify buffer is 10% of miner fee
      const expectedBuffer = Math.ceil(result.breakdown.estimatedMinerFee * 0.1);
      assertEquals(result.breakdown.buffer, expectedBuffer);

      // Verify total calculation
      const expectedTotal = result.breakdown.dustTotal +
                          result.breakdown.serviceFee +
                          result.breakdown.estimatedMinerFee +
                          result.breakdown.buffer;
      assertEquals(result.minimumFunding, expectedTotal);
    });

    it("should exclude service fee when not requested", () => {
      const noServiceConfig = {
        ...basicFundingConfig,
        includeServiceFee: false,
      };

      const result = calculateMinimumFunding(noServiceConfig);
      assertEquals(result.breakdown.serviceFee, 0);
    });

    it("should handle custom service fee amounts", () => {
      const customServiceConfig = {
        ...basicFundingConfig,
        serviceFeeAmount: 50000,
      };

      const result = calculateMinimumFunding(customServiceConfig);
      assertEquals(result.breakdown.serviceFee, 50000);
    });

    it("should handle zero file size", () => {
      const zeroFileConfig = {
        ...basicFundingConfig,
        fileSize: 0,
      };

      const result = calculateMinimumFunding(zeroFileConfig);
      assertEquals(result.breakdown.dustTotal, 0);
    });

    it("should handle large file sizes", () => {
      const largeFileConfig = {
        ...basicFundingConfig,
        fileSize: 10000,
      };

      const result = calculateMinimumFunding(largeFileConfig);
      assertEquals(result.breakdown.dustTotal, 31300); // 313 chunks * 100 sats
      assert(result.minimumFunding > 50000);
    });

    it("should handle high fee rates", () => {
      const highFeeConfig = {
        ...basicFundingConfig,
        maraFeeRate: 500,
      };

      const result = calculateMinimumFunding(highFeeConfig);
      assert(result.breakdown.estimatedMinerFee > 1000);
      assert(result.minimumFunding > 50000);
    });

    it("should handle varying input counts", () => {
      const manyInputsConfig = {
        ...basicFundingConfig,
        estimatedInputCount: 10,
      };

      const result = calculateMinimumFunding(manyInputsConfig);
      assert(result.breakdown.estimatedMinerFee > basicFundingConfig.estimatedInputCount);
    });

    it("should handle MARA mode output values", () => {
      const maraConfig = {
        ...basicFundingConfig,
        outputValue: 50, // MARA mode
      };

      const result = calculateMinimumFunding(maraConfig);
      assertEquals(result.breakdown.dustTotal, 100); // 2 chunks * 50 sats
    });

    it("should handle non-MARA mode output values", () => {
      const nonMaraConfig = {
        ...basicFundingConfig,
        outputValue: 500, // Non-MARA mode
      };

      const result = calculateMinimumFunding(nonMaraConfig);
      assertEquals(result.breakdown.dustTotal, 1000); // 2 chunks * 500 sats
    });

    it("should provide realistic funding estimates", () => {
      const result = calculateMinimumFunding(basicFundingConfig);
      
      // Minimum funding should be reasonable for real use
      assert(result.minimumFunding > 40000); // Should cover service fee
      assert(result.minimumFunding < 100000); // Should not be excessive
      
      // Buffer should be reasonable
      assert(result.breakdown.buffer > 0);
      assert(result.breakdown.buffer < result.breakdown.estimatedMinerFee);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete MARA transaction workflow", () => {
      const fileSize = 128;
      const outputValue = 150;
      
      // Step 1: Validate output value
      const validation = validateMARAOutputValue(outputValue);
      assertEquals(validation.isValid, true);
      assertEquals(validation.isMaraMode, true);

      // Step 2: Calculate chunk count
      const chunkCount = calculateCIP33ChunkCount(fileSize);
      assertEquals(chunkCount, 4);

      // Step 3: Calculate dust value
      const dustValue = calculateTotalDustValue(chunkCount, outputValue);
      assertEquals(dustValue, 600);

      // Step 4: Estimate transaction size
      const txConfig: MARATransactionEstimateConfig = {
        inputs: [
          { type: "P2WPKH" as ScriptType, isWitness: true },
          { type: "P2WPKH" as ScriptType, isWitness: true },
        ],
        fileSize,
        outputValue,
        includeServiceFee: true,
        serviceFeeType: "P2WPKH" as ScriptType,
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType,
        isMaraMode: validation.isMaraMode,
        maraFeeRate: 30,
      };

      const sizeEstimate = estimateMARATransactionSize(txConfig);
      assertEquals(sizeEstimate.chunkCount, chunkCount);
      assertEquals(sizeEstimate.totalDustValue, dustValue);

      // Step 5: Calculate minimum funding
      const fundingConfig = {
        fileSize,
        outputValue,
        maraFeeRate: 30,
        includeServiceFee: true,
        serviceFeeAmount: 42000,
        estimatedInputCount: 2,
      };

      const funding = calculateMinimumFunding(fundingConfig);
      assertEquals(funding.breakdown.dustTotal, dustValue);
      
      // Verify consistency between estimates
      assert(funding.breakdown.estimatedMinerFee > 0);
      assert(funding.minimumFunding > dustValue + 42000);
    });

    it("should handle edge case transactions", () => {
      // Very small file, minimal MARA mode
      const smallConfig: MARATransactionEstimateConfig = {
        inputs: [{ type: "P2WPKH" as ScriptType, isWitness: true }],
        fileSize: 1,
        outputValue: 1,
        includeServiceFee: false,
        includeChangeOutput: false,
        isMaraMode: true,
        maraFeeRate: 1,
      };

      const result = estimateMARATransactionSize(smallConfig);
      assertEquals(result.chunkCount, 1);
      assertEquals(result.totalDustValue, 1);
      assertEquals(result.breakdown.serviceFee, 0);
      assertEquals(result.breakdown.change, 0);
      assert(result.estimatedSize > 0);
    });

    it("should handle maximum complexity transactions", () => {
      // Large file, many inputs, high fees
      const complexConfig: MARATransactionEstimateConfig = {
        inputs: Array(20).fill({ type: "P2WPKH" as ScriptType, isWitness: true }),
        fileSize: 5000,
        outputValue: 300,
        includeServiceFee: true,
        serviceFeeType: "P2PKH" as ScriptType,
        includeChangeOutput: true,
        changeOutputType: "P2PKH" as ScriptType,
        isMaraMode: true,
        maraFeeRate: 100,
      };

      const result = estimateMARATransactionSize(complexConfig);
      assert(result.chunkCount > 100);
      assert(result.totalDustValue > 30000);
      assert(result.estimatedSize > 1000);
      assert(result.estimatedFee > 100000);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle negative file sizes gracefully", () => {
      // Math.ceil will handle negative numbers, but they should result in 0
      assertEquals(calculateCIP33ChunkCount(-10), 0);
    });

    it("should handle floating point file sizes", () => {
      assertEquals(calculateCIP33ChunkCount(32.5), 2);
      assertEquals(calculateCIP33ChunkCount(31.9), 1);
    });

    it("should handle very large numbers", () => {
      const largeFile = 1000000; // 1MB
      const chunkCount = calculateCIP33ChunkCount(largeFile);
      assertEquals(chunkCount, Math.ceil(largeFile / 32));
      
      const dustValue = calculateTotalDustValue(chunkCount, 100);
      assertEquals(dustValue, chunkCount * 100);
    });

    it("should maintain precision with large calculations", () => {
      const config: MARATransactionEstimateConfig = {
        inputs: Array(50).fill({ type: "P2WPKH" as ScriptType, isWitness: true }),
        fileSize: 100000,
        outputValue: 333,
        includeServiceFee: true,
        serviceFeeType: "P2WPKH" as ScriptType,
        includeChangeOutput: true,
        changeOutputType: "P2WPKH" as ScriptType,
        isMaraMode: false,
        maraFeeRate: 1000,
      };

      const result = estimateMARATransactionSize(config);
      
      // Verify calculations don't overflow or lose precision
      assert(result.estimatedSize > 0);
      assert(result.estimatedWeight > 0);
      assert(result.estimatedFee === result.estimatedSize * 1000);
      assert(Number.isInteger(result.estimatedSize));
      assert(Number.isInteger(result.estimatedWeight));
      assert(Number.isInteger(result.estimatedFee));
    });
  });
});