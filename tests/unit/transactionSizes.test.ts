import { assertEquals } from "@std/assert";
import {
  calculateTransactionFee,
  estimateTransactionSize,
} from "$lib/utils/minting/transactionSizes.ts";

Deno.test("calculateTransactionFee - calculates fee correctly", () => {
  // Basic calculations
  assertEquals(calculateTransactionFee(100, 10), 1000); // 100 vbytes * 10 sats/vB = 1000 sats
  assertEquals(calculateTransactionFee(250, 5), 1250); // 250 vbytes * 5 sats/vB = 1250 sats
  assertEquals(calculateTransactionFee(141, 1), 141); // 141 vbytes * 1 sat/vB = 141 sats

  // Test rounding up
  assertEquals(calculateTransactionFee(100, 10.5), 1050); // 100 * 10.5 = 1050
  assertEquals(calculateTransactionFee(100, 10.1), 1010); // 100 * 10.1 = 1010
  assertEquals(calculateTransactionFee(100, 10.9), 1090); // 100 * 10.9 = 1090

  // Edge cases
  assertEquals(calculateTransactionFee(0, 10), 0); // 0 vbytes
  assertEquals(calculateTransactionFee(100, 0), 0); // 0 fee rate
});

Deno.test("estimateTransactionSize - simple P2PKH transaction", () => {
  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: true,
    changeOutputType: "P2PKH",
  });

  // P2PKH input: ~148 bytes, P2PKH output: ~34 bytes
  // With overhead and change output, actual size is around 349 bytes
  assertEquals(size > 300, true);
  assertEquals(size < 400, true);
});

Deno.test("estimateTransactionSize - P2WPKH transaction", () => {
  const size = estimateTransactionSize({
    inputs: [{ type: "P2WPKH", isWitness: true }],
    outputs: [{ type: "P2WPKH" }],
    includeChangeOutput: true,
    changeOutputType: "P2WPKH",
  });

  // P2WPKH actual size is around 310 bytes
  assertEquals(size > 250, true);
  assertEquals(size < 350, true);
});

Deno.test("estimateTransactionSize - mixed input types", () => {
  const size = estimateTransactionSize({
    inputs: [
      { type: "P2PKH" },
      { type: "P2WPKH", isWitness: true },
    ],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: true,
    changeOutputType: "P2WPKH",
  });

  // Mixed inputs actual size is around 417 bytes
  assertEquals(size > 350, true);
  assertEquals(size < 450, true);
});

Deno.test("estimateTransactionSize - no change output", () => {
  const withChange = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: true,
    changeOutputType: "P2PKH",
  });

  const withoutChange = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  // Without change should be smaller
  assertEquals(withChange > withoutChange, true);
  // Difference should be roughly the size of one output (actual: 116)
  assertEquals(withChange - withoutChange > 100, true);
  assertEquals(withChange - withoutChange < 130, true);
});

Deno.test("estimateTransactionSize - P2TR transaction", () => {
  const size = estimateTransactionSize({
    inputs: [{ type: "P2TR", isWitness: true }],
    outputs: [{ type: "P2TR" }],
    includeChangeOutput: true,
    changeOutputType: "P2TR",
  });

  // P2TR actual size is around 216 bytes
  assertEquals(size > 200, true);
  assertEquals(size < 250, true);
});

Deno.test("estimateTransactionSize - multiple outputs", () => {
  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [
      { type: "P2PKH" },
      { type: "P2PKH" },
      { type: "P2WPKH" },
    ],
    includeChangeOutput: true,
    changeOutputType: "P2PKH",
  });

  // More outputs means larger transaction (actual: 581)
  assertEquals(size > 550, true);
  assertEquals(size < 600, true);
});

// Mock console to suppress warnings
const originalWarn = console.warn;
function suppressWarnings() {
  console.warn = () => {};
}
function restoreWarnings() {
  console.warn = originalWarn;
}

Deno.test("estimateTransactionSize - handles unknown types gracefully", () => {
  suppressWarnings();

  const size = estimateTransactionSize({
    inputs: [{ type: "UNKNOWN" as any }],
    outputs: [{ type: "OP_RETURN" }],
    includeChangeOutput: true,
    changeOutputType: "P2PKH",
  });

  // Should still return a reasonable size using defaults
  assertEquals(size > 0, true);

  restoreWarnings();
});
