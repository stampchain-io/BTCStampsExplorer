/**
 * Comprehensive Unit Tests for Transaction Size Estimator
 *
 * Tests transaction size calculations, fee estimation, input/output analysis,
 * witness data handling, and various transaction types.
 */

import { TX_CONSTANTS } from "$lib/constants/index.ts";
import {
  calculateTransactionFee,
  estimateTransactionSize,
  estimateTransactionSizeForType,
  TransactionSizeOptions
} from "$lib/utils/bitcoin/transactions/transactionSizeEstimator.ts";
import { logger } from "$lib/utils/logger.ts";
import { assertEquals } from "@std/assert";
import { restore, stub } from "@std/testing@1.0.14/mock";

Deno.test("Transaction Size Estimator - Basic Size Calculation", async (t) => {
  await t.step("should estimate size for simple P2WPKH transaction", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }, { type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
    assertEquals(vsize < 1000, true); // Reasonable size for simple tx
  });

  await t.step("should estimate size for P2PKH legacy transaction", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2PKH", isWitness: false }],
      outputs: [{ type: "P2PKH" }, { type: "P2PKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // P2PKH should be larger than P2WPKH due to no segwit discount
    const witnessOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }, { type: "P2WPKH" }],
      includeChangeOutput: false
    };
    const witnessVsize = estimateTransactionSize(witnessOptions);
    assertEquals(vsize > witnessVsize, true);
  });

  await t.step("should estimate size for P2WSH transaction", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WSH", isWitness: true }],
      outputs: [{ type: "P2WSH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should estimate size for P2TR (Taproot) transaction", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2TR", isWitness: true }],
      outputs: [{ type: "P2TR" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should estimate size for mixed input types", () => {
    const options: TransactionSizeOptions = {
      inputs: [
        { type: "P2WPKH", isWitness: true },
        { type: "P2PKH", isWitness: false },
        { type: "P2WSH", isWitness: true }
      ],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });
});

Deno.test("Transaction Size Estimator - Witness Data Handling", async (t) => {
  await t.step("should include witness marker and flag for witness transactions", () => {
    const witnessOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const nonWitnessOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2PKH", isWitness: false }],
      outputs: [{ type: "P2PKH" }],
      includeChangeOutput: false
    };

    const witnessVsize = estimateTransactionSize(witnessOptions);
    const nonWitnessVsize = estimateTransactionSize(nonWitnessOptions);

    // Both should be positive but different due to witness overhead
    assertEquals(witnessVsize > 0, true);
    assertEquals(nonWitnessVsize > 0, true);
    assertEquals(witnessVsize !== nonWitnessVsize, true);
  });

  await t.step("should auto-detect witness from input type", () => {
    const autoDetectOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH" }], // No explicit isWitness flag
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const explicitOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const autoVsize = estimateTransactionSize(autoDetectOptions);
    const explicitVsize = estimateTransactionSize(explicitOptions);

    // Should be the same whether detected or explicit
    assertEquals(autoVsize, explicitVsize);
  });

  await t.step("should handle mixed witness and non-witness inputs", () => {
    const mixedOptions: TransactionSizeOptions = {
      inputs: [
        { type: "P2WPKH", isWitness: true },
        { type: "P2PKH", isWitness: false }
      ],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(mixedOptions);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });
});

Deno.test("Transaction Size Estimator - Output Types", async (t) => {
  await t.step("should handle P2PKH outputs", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2PKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);
    assertEquals(vsize > 0, true);
  });

  await t.step("should handle P2SH outputs", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2SH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);
    assertEquals(vsize > 0, true);
  });

  await t.step("should handle OP_RETURN outputs", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "OP_RETURN" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);
    assertEquals(vsize > 0, true);
  });

  await t.step("should handle unknown output types with warning", () => {
    const loggerStub = stub(logger, "warn");

    try {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "UNKNOWN" as any }],
        includeChangeOutput: false
      };

      const vsize = estimateTransactionSize(options);

      assertEquals(vsize > 0, true); // Should still work with default
      assertEquals(loggerStub.calls.length, 1); // Should log warning
    } finally {
      restore();
    }
  });

  await t.step("should calculate different sizes for different output types", () => {
    const p2wpkhOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const p2wshOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WSH" }],
      includeChangeOutput: false
    };

    const p2wpkhVsize = estimateTransactionSize(p2wpkhOptions);
    const p2wshVsize = estimateTransactionSize(p2wshOptions);

    // P2WSH output should be larger than P2WPKH
    assertEquals(p2wshVsize > p2wpkhVsize, true);
  });
});

Deno.test("Transaction Size Estimator - Change Output Handling", async (t) => {
  await t.step("should include change output by default", () => {
    const withChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }]
      // includeChangeOutput defaults to true
    };

    const withoutChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const withChangeVsize = estimateTransactionSize(withChangeOptions);
    const withoutChangeVsize = estimateTransactionSize(withoutChangeOptions);

    assertEquals(withChangeVsize > withoutChangeVsize, true);
  });

  await t.step("should use custom change output type", () => {
    const p2wpkhChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: true,
      changeOutputType: "P2WPKH"
    };

    const p2wshChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: true,
      changeOutputType: "P2WSH"
    };

    const p2wpkhVsize = estimateTransactionSize(p2wpkhChangeOptions);
    const p2wshVsize = estimateTransactionSize(p2wshChangeOptions);

    // P2WSH change output should make transaction larger
    assertEquals(p2wshVsize > p2wpkhVsize, true);
  });

  await t.step("should default to P2WPKH change output type", () => {
    const defaultChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: true
      // changeOutputType not specified
    };

    const explicitChangeOptions: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: true,
      changeOutputType: "P2WPKH"
    };

    const defaultVsize = estimateTransactionSize(defaultChangeOptions);
    const explicitVsize = estimateTransactionSize(explicitChangeOptions);

    assertEquals(defaultVsize, explicitVsize);
  });
});

Deno.test("Transaction Size Estimator - Fee Calculation", async (t) => {
  await t.step("should calculate fee correctly", () => {
    const vsize = 250;
    const feeRate = 10; // sats/vB

    const fee = calculateTransactionFee(vsize, feeRate);

    assertEquals(fee, 2500); // 250 * 10
  });

  await t.step("should round up fractional fees", () => {
    const vsize = 225;
    const feeRate = 10.5; // sats/vB

    const fee = calculateTransactionFee(vsize, feeRate);

    assertEquals(fee, 2363); // Math.ceil(225 * 10.5) = Math.ceil(2362.5) = 2363
  });

  await t.step("should handle zero fee rate", () => {
    const vsize = 250;
    const feeRate = 0;

    const fee = calculateTransactionFee(vsize, feeRate);

    assertEquals(fee, 0);
  });

  await t.step("should handle high fee rates", () => {
    const vsize = 250;
    const feeRate = 1000; // Very high fee rate

    const fee = calculateTransactionFee(vsize, feeRate);

    assertEquals(fee, 250000);
  });
});

Deno.test("Transaction Size Estimator - Transaction Type Estimates", async (t) => {
  await t.step("should estimate stamp transaction size", () => {
    const vsize = estimateTransactionSizeForType("stamp", 1000);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // Stamp transactions should be larger due to data outputs
    const sendVsize = estimateTransactionSizeForType("send");
    assertEquals(vsize > sendVsize, true);
  });

  await t.step("should estimate stamp size based on file size", () => {
    const smallFileVsize = estimateTransactionSizeForType("stamp", 100);
    const largeFileVsize = estimateTransactionSizeForType("stamp", 2000);

    // Larger files should require more data outputs, hence larger transaction
    assertEquals(largeFileVsize > smallFileVsize, true);
  });

  await t.step("should estimate SRC20 transaction size", () => {
    const vsize = estimateTransactionSizeForType("src20", 500);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should estimate SRC101 transaction size", () => {
    const vsize = estimateTransactionSizeForType("src101", 300);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should estimate send transaction size", () => {
    const vsize = estimateTransactionSizeForType("send");

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // Send should be smallest (just recipient + change)
    const stampVsize = estimateTransactionSizeForType("stamp", 100);
    assertEquals(vsize < stampVsize, true);
  });

  await t.step("should estimate dispense transaction size", () => {
    const vsize = estimateTransactionSizeForType("dispense");

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // Dispense should include OP_RETURN
    const sendVsize = estimateTransactionSizeForType("send");
    assertEquals(vsize > sendVsize, true);
  });

  await t.step("should handle unknown transaction types", () => {
    const vsize = estimateTransactionSizeForType("unknown" as any);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // Should default to basic send transaction
    const sendVsize = estimateTransactionSizeForType("send");
    assertEquals(vsize, sendVsize);
  });

  await t.step("should cap data chunks for SRC20/SRC101", () => {
    // Very large file size should be capped
    const vsize = estimateTransactionSizeForType("src20", 10000);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);

    // Should not be excessively large due to capping
    assertEquals(vsize < 10000, true); // Reasonable upper bound
  });
});

Deno.test("Transaction Size Estimator - Error Handling and Edge Cases", async (t) => {
  await t.step("should handle empty inputs array", () => {
    const options: TransactionSizeOptions = {
      inputs: [],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    // Should still calculate base transaction size
    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should handle empty outputs array", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
  });

  await t.step("should handle unknown input types with warning", () => {
    const loggerStub = stub(logger, "warn");

    try {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "UNKNOWN" as any, isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false
      };

      const vsize = estimateTransactionSize(options);

      assertEquals(vsize > 0, true); // Should still work with default
      assertEquals(loggerStub.calls.length, 1); // Should log warning
    } finally {
      restore();
    }
  });

  await t.step("should handle missing TX_CONSTANTS entries", () => {
    const loggerStub = stub(logger, "warn");

    // Temporarily modify TX_CONSTANTS to missing entry
    const originalConstants = TX_CONSTANTS.WITNESS_STACK.P2WPKH;
    delete (TX_CONSTANTS.WITNESS_STACK as any).P2WPKH;

    try {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false
      };

      const vsize = estimateTransactionSize(options);

      assertEquals(vsize > 0, true); // Should still work
      assertEquals(loggerStub.calls.length, 1); // Should log warning
    } finally {
      // Restore constants
      (TX_CONSTANTS.WITNESS_STACK as any).P2WPKH = originalConstants;
      restore();
    }
  });

  await t.step("should handle very large transactions", () => {
    const options: TransactionSizeOptions = {
      inputs: Array(100).fill({ type: "P2WPKH", isWitness: true }),
      outputs: Array(100).fill({ type: "P2WPKH" }),
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
    assertEquals(vsize > 5000, true); // Should be large
  });

  await t.step("should handle minimum transaction", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    assertEquals(typeof vsize, "number");
    assertEquals(vsize > 0, true);
    assertEquals(vsize < 200, true); // Should be reasonably small
  });
});

Deno.test("Transaction Size Estimator - Weight Calculation Accuracy", async (t) => {
  await t.step("should calculate weight correctly for witness transactions", () => {
    const options: TransactionSizeOptions = {
      inputs: [{ type: "P2WPKH", isWitness: true }],
      outputs: [{ type: "P2WPKH" }],
      includeChangeOutput: false
    };

    const vsize = estimateTransactionSize(options);

    // vsize should be weight / 4 rounded up
    assertEquals(typeof vsize, "number");
    assertEquals(vsize % 1, 0); // Should be integer
  });

  await t.step("should use weightToVsize function from TX_CONSTANTS", () => {
    // Mock the weightToVsize function to test it's being used
    const originalWeightToVsize = TX_CONSTANTS.weightToVsize;
    let called = false;

    TX_CONSTANTS.weightToVsize = (weight: number) => {
      called = true;
      return originalWeightToVsize(weight);
    };

    try {
      const options: TransactionSizeOptions = {
        inputs: [{ type: "P2WPKH", isWitness: true }],
        outputs: [{ type: "P2WPKH" }],
        includeChangeOutput: false
      };

      estimateTransactionSize(options);

      assertEquals(called, true);
    } finally {
      TX_CONSTANTS.weightToVsize = originalWeightToVsize;
    }
  });

  await t.step("should handle script type constants correctly", () => {
    // Ensure all script types have correct constants
    const scriptTypes = ["P2WPKH", "P2WSH", "P2TR", "P2PKH", "P2SH"];

    for (const scriptType of scriptTypes) {
      const options: TransactionSizeOptions = {
        inputs: [{ type: scriptType as any, isWitness: scriptType.startsWith("P2W") || scriptType === "P2TR" }],
        outputs: [{ type: scriptType as any }],
        includeChangeOutput: false
      };

      const vsize = estimateTransactionSize(options);

      assertEquals(typeof vsize, "number");
      assertEquals(vsize > 0, true);
    }
  });
});
