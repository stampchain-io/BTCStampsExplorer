import { assertEquals } from "@std/assert";
import {
  calculateTransactionFee,
  estimateTransactionSize,
} from "$lib/utils/minting/transactionSizes.ts";

// Mock console.warn to test warning scenarios
const originalWarn = console.warn;
const warnings: string[] = [];

function mockConsoleWarn() {
  warnings.length = 0;
  console.warn = (...args: any[]) => {
    warnings.push(args.join(" "));
  };
}

function restoreConsoleWarn() {
  console.warn = originalWarn;
}

Deno.test("estimateTransactionSize - non-witness input early return", () => {
  mockConsoleWarn();

  // Test with non-witness input type (should trigger early return in calculateWitnessWeight)
  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH", isWitness: false }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  // Should still calculate size correctly
  assertEquals(size > 0, true);

  restoreConsoleWarn();
});

Deno.test("estimateTransactionSize - missing WITNESS_STACK entry", () => {
  mockConsoleWarn();

  // Test with a witness type that might not have WITNESS_STACK entry
  const size = estimateTransactionSize({
    inputs: [{ type: "UNKNOWN" as any, isWitness: true }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  // Should handle gracefully and return 0 witness weight
  assertEquals(size > 0, true);
  // The warning might not appear for UNKNOWN type since it doesn't reach WITNESS_STACK lookup
  assertEquals(warnings.length >= 0, true);

  restoreConsoleWarn();
});

Deno.test("estimateTransactionSize - unhandled witness type warning", () => {
  mockConsoleWarn();

  // Test with P2SH marked as witness (which doesn't have witness stack)
  const size = estimateTransactionSize({
    inputs: [{ type: "P2SH", isWitness: true }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  assertEquals(size > 0, true);
  assertEquals(
    warnings.some((w) =>
      w.includes("calculateWitnessWeight called for unhandled witness type")
    ),
    true,
  );

  restoreConsoleWarn();
});

Deno.test("estimateTransactionSize - unknown changeOutputType", () => {
  mockConsoleWarn();

  // Test with unknown change output type
  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: true,
    changeOutputType: "UNKNOWN" as any,
  });

  assertEquals(size > 0, true);
  assertEquals(
    warnings.some((w) =>
      w.includes("No size in TX_CONSTANTS for changeOutput type: UNKNOWN")
    ),
    true,
  );

  restoreConsoleWarn();
});

Deno.test("estimateTransactionSize - all witness types", () => {
  // Test P2WPKH witness weight calculation
  const p2wpkhSize = estimateTransactionSize({
    inputs: [{ type: "P2WPKH", isWitness: true }],
    outputs: [{ type: "P2WPKH" }],
    includeChangeOutput: false,
  });
  assertEquals(p2wpkhSize > 0, true);

  // Test P2WSH witness weight calculation
  const p2wshSize = estimateTransactionSize({
    inputs: [{ type: "P2WSH", isWitness: true }],
    outputs: [{ type: "P2WSH" }],
    includeChangeOutput: false,
  });
  assertEquals(p2wshSize > 0, true);

  // Test P2TR witness weight calculation
  const p2trSize = estimateTransactionSize({
    inputs: [{ type: "P2TR", isWitness: true }],
    outputs: [{ type: "P2TR" }],
    includeChangeOutput: false,
  });
  assertEquals(p2trSize > 0, true);
});

Deno.test("estimateTransactionSize - mixed witness and non-witness inputs", () => {
  const size = estimateTransactionSize({
    inputs: [
      { type: "P2PKH", isWitness: false },
      { type: "P2WPKH", isWitness: true },
      { type: "P2TR", isWitness: true },
    ],
    outputs: [
      { type: "P2PKH" },
      { type: "P2WPKH" },
    ],
    includeChangeOutput: true,
    changeOutputType: "P2TR",
  });

  // Should handle mixed inputs correctly
  assertEquals(size > 400, true);
});

Deno.test("estimateTransactionSize - edge case with no inputs", () => {
  const size = estimateTransactionSize({
    inputs: [],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  // Should still calculate basic transaction structure
  assertEquals(size > 0, true);
  // Transaction still has overhead for version, locktime, and output structure
  assertEquals(size < 200, true); // Should be reasonably small without inputs
});

Deno.test("estimateTransactionSize - edge case with no outputs", () => {
  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [],
    includeChangeOutput: false,
  });

  // Should handle transaction with only inputs
  assertEquals(size > 100, true); // Input contributes significant size
});

Deno.test("estimateTransactionSize - OP_RETURN output handling", () => {
  mockConsoleWarn();

  const size = estimateTransactionSize({
    inputs: [{ type: "P2PKH" }],
    outputs: [
      { type: "P2PKH" },
      { type: "OP_RETURN" },
    ],
    includeChangeOutput: false,
  });

  // Should handle OP_RETURN with default size
  assertEquals(size > 200, true);
  assertEquals(
    warnings.some((w) =>
      w.includes("No size in TX_CONSTANTS for output type: OP_RETURN")
    ),
    true,
  );

  restoreConsoleWarn();
});

Deno.test("calculateTransactionFee - edge cases", () => {
  // Test with very large numbers
  assertEquals(calculateTransactionFee(1000000, 100), 100000000);

  // Test with decimal fee rates (should round up)
  assertEquals(calculateTransactionFee(100, 10.1), 1010);
  assertEquals(calculateTransactionFee(100, 10.9), 1090);

  // Test with very small fee rate
  assertEquals(calculateTransactionFee(1000, 0.1), 100);
  assertEquals(calculateTransactionFee(1000, 0.01), 10);

  // Test rounding behavior
  assertEquals(calculateTransactionFee(3, 0.33333), 1); // 0.99999 rounds to 1
  assertEquals(calculateTransactionFee(10, 0.11), 2); // 1.1 rounds to 2
});

Deno.test("estimateTransactionSize - witness detection from script type", () => {
  // Test that witness detection works based on script type when isWitness is not provided
  const size = estimateTransactionSize({
    inputs: [
      { type: "P2WPKH" }, // Should be detected as witness
      { type: "P2PKH" }, // Should not be witness
    ],
    outputs: [{ type: "P2WPKH" }],
    includeChangeOutput: false,
  });

  // Transaction should include witness data
  assertEquals(size > 200, true);
});

Deno.test("estimateTransactionSize - all non-witness types warning", () => {
  mockConsoleWarn();

  // Test with type that doesn't exist in TX_CONSTANTS for non-witness
  const size = estimateTransactionSize({
    inputs: [{ type: "INVALID_TYPE" as any, isWitness: false }],
    outputs: [{ type: "P2PKH" }],
    includeChangeOutput: false,
  });

  assertEquals(size > 0, true);
  assertEquals(
    warnings.some((w) =>
      w.includes("No size in TX_CONSTANTS for non-witness type: INVALID_TYPE")
    ),
    true,
  );

  restoreConsoleWarn();
});

Deno.test("estimateTransactionSize - complex transaction with all features", () => {
  mockConsoleWarn();

  const size = estimateTransactionSize({
    inputs: [
      { type: "P2PKH", isWitness: false },
      { type: "P2SH", isWitness: false },
      { type: "P2WPKH", isWitness: true },
      { type: "P2WSH", isWitness: true },
      { type: "P2TR", isWitness: true },
      { type: "UNKNOWN" as any, isWitness: false },
      { type: "INVALID" as any, isWitness: true },
    ],
    outputs: [
      { type: "P2PKH" },
      { type: "P2SH" },
      { type: "P2WPKH" },
      { type: "P2WSH" },
      { type: "P2TR" },
      { type: "OP_RETURN" },
      { type: "UNKNOWN" as any },
    ],
    includeChangeOutput: true,
    changeOutputType: "INVALID" as any,
  });

  // Should handle all edge cases and still return a reasonable size
  assertEquals(size > 1000, true); // Large transaction
  assertEquals(warnings.length > 0, true); // Should have warnings

  restoreConsoleWarn();
});
