import { assert, assertEquals, assertExists } from "@std/assert";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "jsr:@std/testing@1.0.14/bdd";
import { Stub, stub } from "@std/testing@1.0.14/mock";

import {
  calculateTransactionFee,
  estimateTransactionSize,
  estimateTransactionSizeForType,
  type TransactionSizeOptions,
} from "../../lib/utils/bitcoin/transactions/transactionSizeEstimator.ts";

import type { ScriptType } from "$types/index.d.ts";

describe("Transaction Size Estimator", () => {
  let loggerStub: Stub;

  beforeEach(() => {
    // Mock the logger to avoid console output during tests
    loggerStub = stub(console, "warn");
  });

  afterEach(() => {
    loggerStub.restore();
  });

  describe("estimateTransactionSize", () => {
    it("should estimate basic P2WPKH transaction size", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const result = estimateTransactionSize(options);

      // P2WPKH tx should be around 140-170 vBytes
      assert(result > 100);
      assert(result < 200);
      assert(Number.isInteger(result));
    });

    it("should estimate basic P2PKH transaction size", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2PKH", isWitness: false }],
        outputs: [{ type: "P2PKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2PKH",
      };

      const result = estimateTransactionSize(options);

      // P2PKH tx should be larger than P2WPKH due to no witness discount
      assert(result > 150);
      assert(result < 400);
      assert(Number.isInteger(result));
    });

    it("should handle witness transactions correctly", () => {
      const witnessOptions: TransactionSizeOptions = {
        inputs: [
          { type: "P2WPKH", isWitness: true },
          { type: "P2WPKH", isWitness: true },
        ],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const nonWitnessOptions: TransactionSizeOptions = {
        inputs: [
          { type: "P2PKH", isWitness: false },
          { type: "P2PKH", isWitness: false },
        ],
        outputs: [{ type: "P2PKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2PKH",
      };

      const witnessResult = estimateTransactionSize(witnessOptions);
      const nonWitnessResult = estimateTransactionSize(nonWitnessOptions);

      // Witness transactions should be smaller due to witness discount
      assert(witnessResult < nonWitnessResult);
    });

    it("should handle mixed input types", () => {
      const options: TransactionSizeOptions = {
        inputs: [
          { type: "P2WPKH", isWitness: true },
          { type: "P2PKH", isWitness: false },
          { type: "P2WSH", isWitness: true },
        ],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const result = estimateTransactionSize(options);

      // Should handle mixed types without errors
      assert(result > 300);
      assert(result < 600);
      assert(Number.isInteger(result));
    });

    it("should handle multiple output types", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [
          { type: "P2WPKH" },
          { type: "P2PKH" },
          { type: "P2WSH" },
          { type: "OP_RETURN" },
        ],
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Multiple outputs should increase size
      assert(result > 200);
      assert(result < 400);
      assert(Number.isInteger(result));
    });

    it("should handle P2TR (Taproot) inputs", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2TR", isWitness: true }],
        outputs: [{ type: "P2TR" }],
        includeChangeOutput: true,
        changeOutputType: "P2TR",
      };

      const result = estimateTransactionSize(options);

      // P2TR should be efficient
      assert(result > 100);
      assert(result < 200);
      assert(Number.isInteger(result));
    });

    it("should handle P2SH inputs", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2SH", isWitness: false }],
        outputs: [{ type: "P2SH" }],
        includeChangeOutput: true,
        changeOutputType: "P2SH",
      };

      const result = estimateTransactionSize(options);

      // P2SH should be larger due to complex scripts
      assert(result > 250);
      assert(result < 500);
      assert(Number.isInteger(result));
    });

    it("should exclude change output when requested", () => {
      const withChange: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const withoutChange: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false,
      };

      const withChangeResult = estimateTransactionSize(withChange);
      const withoutChangeResult = estimateTransactionSize(withoutChange);

      // With change should be larger
      assert(withChangeResult > withoutChangeResult);

      // Difference should be approximately one P2WPKH output (31 bytes)
      const difference = withChangeResult - withoutChangeResult;
      assert(difference > 25);
      assert(difference < 40);
    });

    it("should handle empty inputs array", () => {
      const options: TransactionSizeOptions = {
        inputs: [],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Should still calculate base tx + outputs
      assert(result > 25);
      assert(result < 150);
      assert(Number.isInteger(result));
    });

    it("should handle empty outputs array", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [],
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Should calculate base tx + inputs only
      assert(result > 50);
      assert(result < 200);
      assert(Number.isInteger(result));
    });

    it("should handle large number of inputs", () => {
      const manyInputs = Array(20).fill({ type: "P2WPKH", isWitness: true });
      const options: TransactionSizeOptions = {
        inputs: manyInputs,
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const result = estimateTransactionSize(options);

      // Should scale with inputs
      assert(result > 1000);
      assert(result < 3000);
      assert(Number.isInteger(result));
    });

    it("should handle large number of outputs", () => {
      const manyOutputs = Array(50).fill({ type: "P2WPKH" });
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: manyOutputs,
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Should scale with outputs
      assert(result > 1500);
      assert(result < 3000);
      assert(Number.isInteger(result));
    });

    it("should infer witness property from script type when not specified", () => {
      const optionsWithoutWitnessFlag: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH" }], // No isWitness specified
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const optionsWithWitnessFlag: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const resultWithoutFlag = estimateTransactionSize(
        optionsWithoutWitnessFlag,
      );
      const resultWithFlag = estimateTransactionSize(optionsWithWitnessFlag);

      // Should produce same result when witness is inferred
      assertEquals(resultWithoutFlag, resultWithFlag);
    });

    it("should handle unknown input types gracefully", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "UNKNOWN" as ScriptType, isWitness: false }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const result = estimateTransactionSize(options);

      // Should use defaults and not crash
      assert(result > 100);
      assert(result < 300);
      assert(Number.isInteger(result));
    });

    it("should handle unknown output types gracefully", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "UNKNOWN" as ScriptType }],
        includeChangeOutput: true,
        changeOutputType: "P2WPKH",
      };

      const result = estimateTransactionSize(options);

      // Should use defaults and not crash
      assert(result > 100);
      assert(result < 200);
      assert(Number.isInteger(result));
    });
  });

  describe("calculateTransactionFee", () => {
    it("should calculate fee correctly", () => {
      const vsize = 140;
      const feeRate = 10; // 10 sats/vB

      const result = calculateTransactionFee(vsize, feeRate);

      assertEquals(result, 1400);
    });

    it("should round up fractional fees", () => {
      const vsize = 141;
      const feeRate = 10.5; // Fractional fee rate

      const result = calculateTransactionFee(vsize, feeRate);

      // Should ceil(141 * 10.5) = ceil(1480.5) = 1481
      assertEquals(result, 1481);
    });

    it("should handle zero fee rate", () => {
      const vsize = 140;
      const feeRate = 0;

      const result = calculateTransactionFee(vsize, feeRate);

      assertEquals(result, 0);
    });

    it("should handle high fee rates", () => {
      const vsize = 140;
      const feeRate = 1000; // High fee rate

      const result = calculateTransactionFee(vsize, feeRate);

      assertEquals(result, 140000);
    });

    it("should handle fractional vsize", () => {
      const vsize = 140.5;
      const feeRate = 10;

      const result = calculateTransactionFee(vsize, feeRate);

      // Should ceil(140.5 * 10) = ceil(1405) = 1405
      assertEquals(result, 1405);
    });
  });

  describe("estimateTransactionSizeForType", () => {
    it("should estimate stamp transaction size", () => {
      const result = estimateTransactionSizeForType("stamp", 100);

      // Stamp with ~100 bytes should have OP_RETURN + data outputs
      assert(result > 200);
      assert(result < 500);
      assert(Number.isInteger(result));
    });

    it("should estimate stamp transaction with large file", () => {
      const smallFile = estimateTransactionSizeForType("stamp", 32);
      const largeFile = estimateTransactionSizeForType("stamp", 1000);

      // Larger file should result in larger transaction
      assert(largeFile > smallFile);
      assert(largeFile > 1000);
    });

    it("should estimate SRC20 transaction size", () => {
      const result = estimateTransactionSizeForType("src20", 100);

      // SRC20 should have data outputs but no OP_RETURN
      assert(result > 150);
      assert(result < 400);
      assert(Number.isInteger(result));
    });

    it("should estimate SRC101 transaction size", () => {
      const result = estimateTransactionSizeForType("src101", 100);

      // Should be similar to SRC20
      assert(result > 150);
      assert(result < 400);
      assert(Number.isInteger(result));
    });

    it("should cap data chunks for SRC20/SRC101", () => {
      const result = estimateTransactionSizeForType("src20", 10000);

      // Should cap at 5 chunks regardless of file size
      assert(result < 1000); // Should not be enormous
      assert(Number.isInteger(result));
    });

    it("should estimate send transaction size", () => {
      const result = estimateTransactionSizeForType("send");

      // Simple send: input -> recipient + change
      assert(result > 100);
      assert(result < 200);
      assert(Number.isInteger(result));
    });

    it("should estimate dispense transaction size", () => {
      const result = estimateTransactionSizeForType("dispense");

      // Dispense: input -> OP_RETURN + recipient + change
      assert(result > 150);
      assert(result < 250);
      assert(Number.isInteger(result));
    });

    it("should handle default case", () => {
      const result = estimateTransactionSizeForType("unknown" as any);

      // Should default to simple 2-output transaction
      assert(result > 100);
      assert(result < 200);
      assert(Number.isInteger(result));
    });

    it("should handle undefined file size", () => {
      const result = estimateTransactionSizeForType("stamp");

      // Should use default file size (100 bytes)
      assert(result > 200);
      assert(result < 500);
      assert(Number.isInteger(result));
    });

    it("should be consistent for same inputs", () => {
      const result1 = estimateTransactionSizeForType("stamp", 256);
      const result2 = estimateTransactionSizeForType("stamp", 256);

      assertEquals(result1, result2);
    });

    it("should scale with file size for stamp transactions", () => {
      const sizes = [32, 64, 128, 256, 512];
      const results = sizes.map((size) =>
        estimateTransactionSizeForType("stamp", size)
      );

      // Each result should be larger than the previous
      for (let i = 1; i < results.length; i++) {
        assert(
          results[i] > results[i - 1],
          `Size ${results[i]} should be larger than ${
            results[i - 1]
          } for file size ${sizes[i]} vs ${sizes[i - 1]}`,
        );
      }
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle negative input counts gracefully", () => {
      // This is more of a type safety test - inputs array can't be negative length
      const options: TransactionSizeOptions = {
        inputs: [],
        outputs: [{ type: "P2WPKH" }],
      };

      const result = estimateTransactionSize(options);
      assert(result > 0);
    });

    it("should handle extreme input/output combinations", () => {
      const options: TransactionSizeOptions = {
        inputs: Array(100).fill({ type: "P2WPKH", isWitness: true }),
        outputs: Array(100).fill({ type: "P2WPKH" }),
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Should handle large transactions without overflow
      assert(result > 5000);
      assert(result < 50000);
      assert(Number.isInteger(result));
      assert(result === Math.floor(result)); // Ensure no floating point issues
    });

    it("should maintain precision with complex calculations", () => {
      const options: TransactionSizeOptions = {
        inputs: [
          { type: "P2WPKH", isWitness: true },
          { type: "P2PKH", isWitness: false },
          { type: "P2WSH", isWitness: true },
          { type: "P2SH", isWitness: false },
        ],
        outputs: [
          { type: "P2WPKH" },
          { type: "P2PKH" },
          { type: "P2WSH" },
          { type: "OP_RETURN" },
        ],
        includeChangeOutput: true,
        changeOutputType: "P2TR",
      };

      const result = estimateTransactionSize(options);

      // Verify result is reasonable and precise
      assert(Number.isInteger(result));
      assert(result > 400);
      assert(result < 1000);
    });

    it("should handle minimum viable transaction", () => {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false,
      };

      const result = estimateTransactionSize(options);

      // Minimum viable transaction should be around 100-120 vBytes
      assert(result >= 100);
      assert(result <= 140);
      assert(Number.isInteger(result));
    });
  });
});
