/**
 * @fileoverview Comprehensive tests for feeCalculations module
 * Aims to achieve 100% code coverage for lib/utils/minting/feeCalculations.ts
 * Tests all functions, branches, and edge cases
 */

import { TX_CONSTANTS } from "$lib/utils/bitcoin/minting/constants.ts";
import {
  calculateDust,
  calculateMiningFee,
  calculateP2WSHMiningFee,
  estimateFee,
} from "$lib/utils/bitcoin/minting/feeCalculations.ts";
import type {
  AncestorInfo,
  Output,
  ScriptType,
  TransactionInput,
  TransactionOutput,
} from "$lib/types/index.d.ts";
import { assertEquals, assertExists } from "@std/assert";

// Test fixtures
const VALID_ADDRESSES = {
  P2PKH: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  P2SH: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  P2WPKH: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  P2WSH: "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
  P2TR: "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
};

const VALID_SCRIPTS = {
  P2PKH: "76a914" + "a".repeat(40) + "88ac",
  P2SH: "a914" + "b".repeat(40) + "87",
  P2WPKH: "0014" + "c".repeat(40),
  P2WSH: "0020" + "d".repeat(64),
  P2TR: "5120" + "e".repeat(64),
};

Deno.test("calculateDust - comprehensive edge cases", () => {
  // Test zero
  assertEquals(calculateDust(0), 0);

  // Test boundaries around 32-byte chunks
  assertEquals(calculateDust(1), TX_CONSTANTS.DUST_SIZE);
  assertEquals(calculateDust(31), TX_CONSTANTS.DUST_SIZE);
  assertEquals(calculateDust(32), TX_CONSTANTS.DUST_SIZE);
  assertEquals(calculateDust(33), TX_CONSTANTS.DUST_SIZE * 2);
  assertEquals(calculateDust(63), TX_CONSTANTS.DUST_SIZE * 2);
  assertEquals(calculateDust(64), TX_CONSTANTS.DUST_SIZE * 2);
  assertEquals(calculateDust(65), TX_CONSTANTS.DUST_SIZE * 3);

  // Test larger values
  assertEquals(calculateDust(320), TX_CONSTANTS.DUST_SIZE * 10);
  assertEquals(calculateDust(1024), TX_CONSTANTS.DUST_SIZE * 32);

  // Test negative values (edge case)
  assertEquals(calculateDust(-1), 0); // Math.ceil(-1/32) = 0
});

Deno.test("determineOutputType - all script types via script property", () => {
  // Test P2PKH script
  const p2pkhOutput: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2PKH,
  };
  const p2pkhFee = estimateFee([p2pkhOutput], 1);
  assertEquals(p2pkhFee > 0, true);

  // Test P2SH script
  const p2shOutput: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2SH,
  };
  const p2shFee = estimateFee([p2shOutput], 1);
  assertEquals(p2shFee > 0, true);

  // Test P2WPKH script
  const p2wpkhOutput: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2WPKH,
  };
  const p2wpkhFee = estimateFee([p2wpkhOutput], 1);
  assertEquals(p2wpkhFee > 0, true);

  // Test P2WSH script
  const p2wshOutput: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2WSH,
  };
  const p2wshFee = estimateFee([p2wshOutput], 1);
  assertEquals(p2wshFee > 0, true);

  // Test P2TR script
  const p2trOutput: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2TR,
  };
  const p2trFee = estimateFee([p2trOutput], 1);
  assertEquals(p2trFee > 0, true);
});

Deno.test("determineOutputType - all address types", () => {
  // Test P2PKH address
  const p2pkhOutput: Output = {
    value: 1000,
    address: VALID_ADDRESSES.P2PKH,
  };
  const p2pkhFee = estimateFee([p2pkhOutput], 1);
  assertEquals(p2pkhFee > 0, true);

  // Test P2SH address
  const p2shOutput: Output = {
    value: 1000,
    address: VALID_ADDRESSES.P2SH,
  };
  const p2shFee = estimateFee([p2shOutput], 1);
  assertEquals(p2shFee > 0, true);

  // Test P2WPKH address
  const p2wpkhOutput: Output = {
    value: 1000,
    address: VALID_ADDRESSES.P2WPKH,
  };
  const p2wpkhFee = estimateFee([p2wpkhOutput], 1);
  assertEquals(p2wpkhFee > 0, true);

  // Test P2TR address
  const p2trOutput: Output = {
    value: 1000,
    address: VALID_ADDRESSES.P2TR,
  };
  const p2trFee = estimateFee([p2trOutput], 1);
  assertEquals(p2trFee > 0, true);
});

Deno.test("determineOutputType - fallback to P2WPKH", () => {
  // Test with invalid script (not matching any pattern)
  const invalidScriptOutput: Output = {
    value: 1000,
    script: "invalid_script_data",
  };
  const fee1 = estimateFee([invalidScriptOutput], 1);
  assertEquals(fee1 > 0, true);

  // Test with null address and script
  const nullOutput = {
    value: 1000,
    address: null,
    script: null,
  } as any;
  const fee2 = estimateFee([nullOutput], 1);
  assertEquals(fee2 > 0, true);

  // Test with undefined address and script
  const undefinedOutput = {
    value: 1000,
  } as Output;
  const fee3 = estimateFee([undefinedOutput], 1);
  assertEquals(fee3 > 0, true);

  // Test with empty string address
  const emptyAddressOutput: Output = {
    value: 1000,
    address: "",
  };
  const fee4 = estimateFee([emptyAddressOutput], 1);
  assertEquals(fee4 > 0, true);

  // Test with whitespace-only address
  const whitespaceOutput: Output = {
    value: 1000,
    address: "   ",
  };
  const fee5 = estimateFee([whitespaceOutput], 1);
  assertEquals(fee5 > 0, true);
});

Deno.test("estimateFee - mixed output types", () => {
  const mixedOutputs: Output[] = [
    { value: 1000, address: VALID_ADDRESSES.P2PKH },
    { value: 2000, script: VALID_SCRIPTS.P2WPKH },
    { value: 3000, address: VALID_ADDRESSES.P2TR },
    { value: 4000, script: "" }, // Fallback to P2WPKH
  ];

  const fee = estimateFee(mixedOutputs, 10, 2);
  assertEquals(fee > 0, true);

  // Verify fee increases with more outputs
  const feeWithLessOutputs = estimateFee([mixedOutputs[0]], 10, 2);
  assertEquals(fee > feeWithLessOutputs, true);
});

Deno.test("estimateFee - different input types", () => {
  const outputs: Output[] = [
    { value: 1000, address: VALID_ADDRESSES.P2WPKH },
  ];

  // Test with P2PKH input type (non-witness)
  const feeP2PKH = estimateFee(outputs, 1, 1, undefined);
  assertEquals(feeP2PKH > 0, true);

  // Test with multiple inputs of same type
  const fee3Inputs = estimateFee(outputs, 1, 3);
  assertEquals(fee3Inputs > feeP2PKH, true);
});

Deno.test("estimateFee - ancestor fee calculations", () => {
  const outputs: Output[] = [
    { value: 1000, address: VALID_ADDRESSES.P2WPKH },
  ];

  // Test with zero-fee ancestors
  const zeroFeeAncestors: AncestorInfo[] = [
    { fees: 0, vsize: 200, effectiveRate: 0 },
    { fees: 0, vsize: 150, effectiveRate: 0 },
  ];
  const feeWithZeroAncestors = estimateFee(outputs, 1, 1, zeroFeeAncestors);
  const baseFee = estimateFee(outputs, 1, 1);
  assertEquals(feeWithZeroAncestors, baseFee);

  // Test with mixed ancestors (some with fees, some without)
  const mixedAncestors: AncestorInfo[] = [
    { fees: 1000, vsize: 200, effectiveRate: 5 },
    { fees: 0, vsize: 150, effectiveRate: 0 },
    { fees: 500, vsize: 100, effectiveRate: 5 },
  ];
  const feeWithMixedAncestors = estimateFee(outputs, 1, 1, mixedAncestors);
  assertEquals(feeWithMixedAncestors, baseFee + 1500);

  // Test with high-fee ancestors
  const highFeeAncestors: AncestorInfo[] = [
    { fees: 10000, vsize: 200, effectiveRate: 50 },
    { fees: 5000, vsize: 150, effectiveRate: 33.33 },
  ];
  const feeWithHighAncestors = estimateFee(outputs, 1, 1, highFeeAncestors);
  assertEquals(feeWithHighAncestors, baseFee + 15000);
});

Deno.test("calculateMiningFee - basic scenarios with all input types", () => {
  const inputTypes: ScriptType[] = ["P2PKH", "P2SH", "P2WPKH", "P2WSH", "P2TR"];

  for (const inputType of inputTypes) {
    const typeInfo = TX_CONSTANTS[inputType as keyof typeof TX_CONSTANTS];
    const size =
      (typeInfo && typeof typeInfo === "object" && "size" in typeInfo)
        ? typeInfo.size
        : 107;
    const inputs: TransactionInput[] = [{
      type: inputType,
      size: size,
      isWitness: inputType === "P2WPKH" || inputType === "P2WSH" ||
        inputType === "P2TR",
    }];

    const outputs: TransactionOutput[] = [{
      type: "P2WPKH",
      size: 31,
      isWitness: true,
      value: 1000,
    }];

    const fee = calculateMiningFee(inputs, outputs, 1);
    assertEquals(
      fee > 0,
      true,
      `Fee should be positive for ${inputType} input`,
    );

    // Test without change output
    const feeNoChange = calculateMiningFee(inputs, outputs, 1, {
      includeChangeOutput: false,
      changeOutputType: "P2WPKH",
    });
    assertEquals(
      feeNoChange < fee,
      true,
      `Fee without change should be less for ${inputType}`,
    );
  }
});

Deno.test("calculateMiningFee - with ancestors (tests calculateActualFeeRate)", () => {
  // Test input with ancestors
  const inputsWithAncestors: TransactionInput[] = [
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: {
        fees: 2000,
        vsize: 200,
        effectiveRate: 10,
      },
    },
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: {
        fees: 1000,
        vsize: 150,
        effectiveRate: 6.67,
      },
    },
  ];

  const outputs: TransactionOutput[] = [{
    type: "P2WPKH",
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const feeWithAncestors = calculateMiningFee(inputsWithAncestors, outputs, 10);

  // Test without ancestors for comparison
  const inputsWithoutAncestors: TransactionInput[] = [
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
    },
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
    },
  ];

  const feeWithoutAncestors = calculateMiningFee(
    inputsWithoutAncestors,
    outputs,
    10,
  );

  // Fee calculation should consider ancestors
  assertEquals(feeWithAncestors >= feeWithoutAncestors, true);
});

Deno.test("calculateMiningFee - edge case with zero ancestor sizes", () => {
  // Test edge case where ancestors have zero vsize (should return base fee rate)
  const inputsWithZeroAncestorSize: TransactionInput[] = [
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: {
        fees: 1000,
        vsize: 0, // Edge case
        effectiveRate: 0,
      },
    },
  ];

  const outputs: TransactionOutput[] = [{
    type: "P2WPKH",
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const fee = calculateMiningFee(inputsWithZeroAncestorSize, outputs, 10);
  assertEquals(fee > 0, true);
});

Deno.test("calculateMiningFee - with different change output types", () => {
  const inputs: TransactionInput[] = [{
    type: "P2WPKH",
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const outputs: TransactionOutput[] = [{
    type: "P2WSH",
    size: TX_CONSTANTS.P2WSH.size,
    isWitness: true,
    value: TX_CONSTANTS.DUST_SIZE,
  }];

  const changeTypes: ScriptType[] = [
    "P2PKH",
    "P2SH",
    "P2WPKH",
    "P2WSH",
    "P2TR",
  ];

  for (const changeType of changeTypes) {
    const fee = calculateMiningFee(inputs, outputs, 1, {
      includeChangeOutput: true,
      changeOutputType: changeType,
    });
    assertEquals(
      fee > 0,
      true,
      `Fee should be positive with ${changeType} change output`,
    );
  }
});

Deno.test("calculateMiningFee - mixed witness and non-witness inputs", () => {
  const mixedInputs: TransactionInput[] = [
    {
      type: "P2PKH",
      size: TX_CONSTANTS.P2PKH.size,
      isWitness: false,
    },
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
    },
    {
      type: "P2SH",
      size: TX_CONSTANTS.P2SH.size,
      isWitness: false,
    },
    {
      type: "P2TR",
      size: TX_CONSTANTS.P2TR.size,
      isWitness: true,
    },
  ];

  const outputs: TransactionOutput[] = [
    {
      type: "P2WPKH",
      size: 31,
      isWitness: true,
      value: 1000,
    },
    {
      type: "P2PKH",
      size: 25,
      isWitness: false,
      value: 2000,
    },
  ];

  const fee = calculateMiningFee(mixedInputs, outputs, 5);
  assertEquals(fee > 0, true);
});

Deno.test("calculateP2WSHMiningFee - comprehensive tests", () => {
  // Test exact multiples of 32 bytes
  for (const fileSize of [32, 64, 96, 128, 256, 512, 1024]) {
    const fee = calculateP2WSHMiningFee(fileSize, 1);
    assertEquals(fee > 0, true, `Fee should be positive for ${fileSize} bytes`);
  }

  // Test non-multiples of 32 bytes
  for (const fileSize of [33, 65, 97, 129, 257]) {
    const fee = calculateP2WSHMiningFee(fileSize, 1);
    assertEquals(fee > 0, true, `Fee should be positive for ${fileSize} bytes`);
  }

  // Test different fee rates
  const testFileSize = 128;
  const fee1 = calculateP2WSHMiningFee(testFileSize, 1);
  const fee10 = calculateP2WSHMiningFee(testFileSize, 10);
  const fee50 = calculateP2WSHMiningFee(testFileSize, 50);

  assertEquals(fee10 > fee1, true);
  assertEquals(fee50 > fee10, true);
  assertEquals(
    Math.round(fee10 / fee1),
    10,
    "Fee should scale linearly with rate",
  );
});

Deno.test("calculateP2WSHMiningFee - with and without ancestors", () => {
  const fileSize = 128;
  const feeRate = 10;

  // Test without ancestors
  const feeWithoutAncestors = calculateP2WSHMiningFee(fileSize, feeRate, false);

  // Test with ancestors but no ancestor info (should be same as without)
  const feeWithAncestorsNoInfo = calculateP2WSHMiningFee(
    fileSize,
    feeRate,
    true,
  );
  assertEquals(feeWithAncestorsNoInfo, feeWithoutAncestors);

  // Test with actual ancestor info
  const ancestorInfo: AncestorInfo = {
    fees: 5000,
    vsize: 250,
    effectiveRate: 20,
  };
  const feeWithAncestors = calculateP2WSHMiningFee(
    fileSize,
    feeRate,
    true,
    ancestorInfo,
  );

  // Should consider ancestors in fee calculation
  assertEquals(feeWithAncestors >= feeWithoutAncestors, true);
});

Deno.test("calculateP2WSHMiningFee - edge cases", () => {
  // Test zero file size
  const fee0 = calculateP2WSHMiningFee(0, 1);
  assertEquals(fee0 > 0, true); // Still has base transaction size

  // Test very small file size
  const fee1 = calculateP2WSHMiningFee(1, 1);
  assertEquals(fee1 > 0, true);

  // Test very large file size
  const feeLarge = calculateP2WSHMiningFee(10000, 1);
  assertEquals(feeLarge > 0, true);

  // Test with zero fee rate (edge case)
  const feeZeroRate = calculateP2WSHMiningFee(64, 0);
  assertEquals(feeZeroRate, 0);
});

Deno.test("calculateBaseFee - various scenarios", () => {
  // Test through estimateFee which calls calculateBaseFee

  // Test with different numbers of outputs
  const outputs1: Output[] = [
    { value: 1000, address: VALID_ADDRESSES.P2WPKH },
  ];
  const outputs3: Output[] = [
    { value: 1000, address: VALID_ADDRESSES.P2WPKH },
    { value: 2000, address: VALID_ADDRESSES.P2PKH },
    { value: 3000, address: VALID_ADDRESSES.P2TR },
  ];

  const fee1Output = estimateFee(outputs1, 1);
  const fee3Outputs = estimateFee(outputs3, 1);
  assertEquals(fee3Outputs > fee1Output, true);

  // Test with different input counts
  const fee1Input = estimateFee(outputs1, 1, 1);
  const fee5Inputs = estimateFee(outputs1, 1, 5);
  assertEquals(fee5Inputs > fee1Input, true);

  // Test fee rate scaling
  const feeRate1 = estimateFee(outputs1, 1);
  const feeRate100 = estimateFee(outputs1, 100);
  assertEquals(feeRate100, feeRate1 * 100);
});

Deno.test("Integration test - complex transaction with all features", () => {
  // Create a complex transaction with multiple inputs, outputs, and ancestors
  const complexInputs: TransactionInput[] = [
    {
      type: "P2WPKH",
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: { fees: 1000, vsize: 200, effectiveRate: 5 },
    },
    {
      type: "P2PKH",
      size: TX_CONSTANTS.P2PKH.size,
      isWitness: false,
    },
    {
      type: "P2TR",
      size: TX_CONSTANTS.P2TR.size,
      isWitness: true,
      ancestor: { fees: 2000, vsize: 150, effectiveRate: 13.33 },
    },
  ];

  const complexOutputs: TransactionOutput[] = [
    { type: "P2WPKH", size: 31, isWitness: true, value: 1000 },
    {
      type: "P2WSH",
      size: TX_CONSTANTS.P2WSH.size,
      isWitness: true,
      value: TX_CONSTANTS.DUST_SIZE,
    },
    { type: "P2PKH", size: 25, isWitness: false, value: 5000 },
    {
      type: "P2TR",
      size: TX_CONSTANTS.P2TR.size,
      isWitness: true,
      value: 2000,
    },
  ];

  // Test with various fee rates
  for (const feeRate of [1, 5, 10, 50, 100]) {
    const fee = calculateMiningFee(complexInputs, complexOutputs, feeRate);
    assertEquals(
      fee > 0,
      true,
      `Complex transaction fee should be positive at ${feeRate} sat/vB`,
    );

    // Test without change output
    const feeNoChange = calculateMiningFee(
      complexInputs,
      complexOutputs,
      feeRate,
      {
        includeChangeOutput: false,
        changeOutputType: "P2WPKH",
      },
    );
    assertEquals(
      feeNoChange < fee,
      true,
      `Fee without change should be less at ${feeRate} sat/vB`,
    );
  }
});

// Test to ensure 100% coverage of all branches
Deno.test("Edge cases for complete coverage", () => {
  // Test estimateFee with outputs that have both script and address (script takes precedence)
  const outputWithBoth: Output = {
    value: 1000,
    script: VALID_SCRIPTS.P2WSH,
    address: VALID_ADDRESSES.P2WPKH, // Should be ignored
  };
  const fee = estimateFee([outputWithBoth], 1);
  assertEquals(fee > 0, true);

  // Test with valid ancestors array (the function expects all elements to be valid)
  const validAncestors = [
    { fees: 1000, vsize: 100, effectiveRate: 10 },
    { fees: 2000, vsize: 200, effectiveRate: 10 },
  ];
  const feeWithValidAncestors = estimateFee(
    [{ value: 1000, address: VALID_ADDRESSES.P2WPKH }],
    1,
    1,
    validAncestors,
  );
  assertExists(feeWithValidAncestors);
  assertEquals(feeWithValidAncestors > 0, true);

  // Test calculateMiningFee with edge case options
  const edgeCaseInputs: TransactionInput[] = [{
    type: "P2WPKH",
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const edgeCaseOutputs: TransactionOutput[] = [{
    type: "P2WPKH",
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  // Test with partial options object
  const feePartialOptions = calculateMiningFee(
    edgeCaseInputs,
    edgeCaseOutputs,
    1,
    {
      includeChangeOutput: true,
      // changeOutputType intentionally omitted to test default
    } as any,
  );
  assertEquals(feePartialOptions > 0, true);

  // Test with empty options object - cast to proper type
  const feeEmptyOptions = calculateMiningFee(
    edgeCaseInputs,
    edgeCaseOutputs,
    1,
    {} as { includeChangeOutput: boolean; changeOutputType: ScriptType },
  );
  assertEquals(feeEmptyOptions > 0, true);
});
