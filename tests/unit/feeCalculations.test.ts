import { TX_CONSTANTS } from "$lib/utils/bitcoin/minting/constants.ts";
import {
  calculateDust,
  calculateMiningFee,
  calculateP2WSHMiningFee,
  estimateFee,
} from "$lib/utils/bitcoin/minting/feeCalculations.ts";
import { assertEquals } from "@std/assert";

Deno.test("calculateDust - calculates dust based on file size", () => {
  // Each 32 bytes requires one output
  // Each output requires DUST_SIZE (333) satoshis

  // Exactly 32 bytes = 1 output
  assertEquals(calculateDust(32), TX_CONSTANTS.DUST_SIZE);

  // 64 bytes = 2 outputs
  assertEquals(calculateDust(64), TX_CONSTANTS.DUST_SIZE * 2);

  // 33 bytes = 2 outputs (ceil)
  assertEquals(calculateDust(33), TX_CONSTANTS.DUST_SIZE * 2);

  // 96 bytes = 3 outputs
  assertEquals(calculateDust(96), TX_CONSTANTS.DUST_SIZE * 3);

  // Edge cases
  assertEquals(calculateDust(0), 0);
  assertEquals(calculateDust(1), TX_CONSTANTS.DUST_SIZE);
  assertEquals(calculateDust(31), TX_CONSTANTS.DUST_SIZE);
});

Deno.test("estimateFee - basic fee estimation", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // With 1 sat/vB fee rate
  const fee1 = estimateFee(outputs, 1);
  assertEquals(fee1 > 0, true);

  // With 10 sat/vB fee rate
  const fee10 = estimateFee(outputs, 10);
  assertEquals(fee10 > fee1, true);
  assertEquals(fee10, fee1 * 10);
});

Deno.test("estimateFee - with multiple inputs", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  const fee1Input = estimateFee(outputs, 1, 1);
  const fee2Inputs = estimateFee(outputs, 1, 2);
  const fee3Inputs = estimateFee(outputs, 1, 3);

  // More inputs = higher fee
  assertEquals(fee2Inputs > fee1Input, true);
  assertEquals(fee3Inputs > fee2Inputs, true);
});

Deno.test("estimateFee - with ancestors", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  const ancestors = [
    { fees: 1000, vsize: 200, effectiveRate: 5 },
    { fees: 500, vsize: 150, effectiveRate: 3.33 },
  ];

  const feeWithoutAncestors = estimateFee(outputs, 1);
  const feeWithAncestors = estimateFee(outputs, 1, 1, ancestors);

  // Fee with ancestors should include ancestor fees
  assertEquals(feeWithAncestors, feeWithoutAncestors + 1500);
});

Deno.test("estimateFee - with undefined ancestors (covers line 36-38)", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Test with undefined ancestors - should fall back to 0 ancestor fees
  const feeWithUndefinedAncestors = estimateFee(outputs, 1, 1, undefined);
  const feeWithoutAncestors = estimateFee(outputs, 1, 1);

  // Should be the same since undefined ancestors defaults to 0 fees
  assertEquals(feeWithUndefinedAncestors, feeWithoutAncestors);
});

Deno.test("estimateFee - with null ancestors (covers line 36-38)", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Test with null ancestors - should fall back to 0 ancestor fees
  const feeWithNullAncestors = estimateFee(outputs, 1, 1, null as any);
  const feeWithoutAncestors = estimateFee(outputs, 1, 1);

  // Should be the same since null ancestors defaults to 0 fees
  assertEquals(feeWithNullAncestors, feeWithoutAncestors);
});

Deno.test("estimateFee - with empty ancestors array", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Test with empty ancestors array - should result in 0 ancestor fees
  const feeWithEmptyAncestors = estimateFee(outputs, 1, 1, []);
  const feeWithoutAncestors = estimateFee(outputs, 1, 1);

  // Should be the same since empty array reduces to 0 fees
  assertEquals(feeWithEmptyAncestors, feeWithoutAncestors);
});

Deno.test("estimateFee - with ancestors missing fees property (covers || 0 fallback)", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Test with ancestors that have missing or undefined fees property
  const ancestorsWithMissingFees = [
    { vsize: 200, effectiveRate: 5 }, // No fees property
    { fees: undefined, vsize: 150, effectiveRate: 3.33 }, // Undefined fees
    { fees: 1000, vsize: 100, effectiveRate: 10 }, // Normal fees
  ] as any;

  const feeWithMissingFees = estimateFee(
    outputs,
    1,
    1,
    ancestorsWithMissingFees,
  );
  const feeWithoutAncestors = estimateFee(outputs, 1, 1);

  // Should only include the 1000 from the third ancestor (others default to 0)
  assertEquals(feeWithMissingFees, feeWithoutAncestors + 1000);
});

Deno.test("estimateFee - with script-based outputs (covers line 19-21)", () => {
  // Test output with script property to trigger script detection fallback
  const outputsWithScript = [
    {
      value: 1000,
      script: "0014" + "a".repeat(40), // P2WPKH script as hex string
    },
  ];

  const fee = estimateFee(outputsWithScript, 1);
  assertEquals(fee > 0, true);
});

Deno.test("estimateFee - with outputs missing address and script (covers line 25)", () => {
  // Test output with neither address nor script to trigger default P2WPKH fallback
  const outputsWithoutAddressOrScript = [
    {
      value: 1000,
      script: "", // Empty script should trigger default
      address: undefined, // No address
    } as any, // Type assertion to allow testing edge case
  ];

  const fee = estimateFee(outputsWithoutAddressOrScript, 1);
  assertEquals(fee > 0, true);
});

Deno.test("estimateFee - with output having empty address (covers line 25)", () => {
  // Test output with empty address to trigger default P2WPKH fallback
  const outputsWithEmptyAddress = [
    {
      value: 1000,
      address: "", // Empty address should trigger default
    },
  ];

  const fee = estimateFee(outputsWithEmptyAddress, 1);
  assertEquals(fee > 0, true);
});

Deno.test("calculateMiningFee - basic calculation", () => {
  const inputs = [{
    type: "P2WPKH" as const,
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31, // Standard P2WPKH output size
    isWitness: true,
    value: 1000,
  }];

  const fee = calculateMiningFee(inputs, outputs, 1);
  assertEquals(fee > 0, true);

  // Higher fee rate = higher fee
  const fee10 = calculateMiningFee(inputs, outputs, 10);
  assertEquals(fee10, fee * 10);
});

Deno.test("calculateMiningFee - without change output", () => {
  const inputs = [{
    type: "P2WPKH" as const,
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const feeWithChange = calculateMiningFee(inputs, outputs, 1);
  const feeWithoutChange = calculateMiningFee(inputs, outputs, 1, {
    includeChangeOutput: false,
    changeOutputType: "P2WPKH",
  });

  // Without change output should be less
  assertEquals(feeWithoutChange < feeWithChange, true);
});

Deno.test("calculateP2WSHMiningFee - basic calculation", () => {
  // 64 bytes = 2 outputs
  const fee64 = calculateP2WSHMiningFee(64, 1);
  assertEquals(fee64 > 0, true);

  // 128 bytes = 4 outputs
  const fee128 = calculateP2WSHMiningFee(128, 1);
  assertEquals(fee128 > fee64, true);

  // Higher fee rate
  const fee64Rate10 = calculateP2WSHMiningFee(64, 10);
  assertEquals(fee64Rate10 > fee64, true);
});

Deno.test("calculateP2WSHMiningFee - with ancestors", () => {
  const ancestorInfo = {
    fees: 2000,
    vsize: 300,
    effectiveRate: 6.67,
  };

  const feeWithoutAncestors = calculateP2WSHMiningFee(64, 1, false);
  const feeWithAncestors = calculateP2WSHMiningFee(64, 1, true, ancestorInfo);

  // With ancestors should consider ancestor fees in rate calculation
  assertEquals(feeWithAncestors >= feeWithoutAncestors, true);
});

// Additional edge cases for better coverage
Deno.test("calculateDust - edge cases", () => {
  // Negative file size - Math.ceil(-1/32) = 0, Math.ceil(-100/32) = -3
  // The function doesn't handle negative numbers specially, so it returns negative results
  assertEquals(calculateDust(-1), 0); // Math.ceil(-1/32) = 0
  assertEquals(calculateDust(-100), -3 * TX_CONSTANTS.DUST_SIZE); // Math.ceil(-100/32) = -3

  // Very large file sizes
  assertEquals(calculateDust(1024), TX_CONSTANTS.DUST_SIZE * 32); // 1024 / 32 = 32 outputs
  assertEquals(calculateDust(1000000), TX_CONSTANTS.DUST_SIZE * 31250);
});

Deno.test("estimateFee - high fee rates", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Very high fee rate
  const highFee = estimateFee(outputs, 1000);
  assertEquals(highFee > 0, true);

  // Zero fee rate
  const zeroFee = estimateFee(outputs, 0);
  assertEquals(zeroFee, 0);

  // Negative fee rate - results in negative fee
  const negativeFee = estimateFee(outputs, -10);
  assertEquals(negativeFee < 0, true); // Negative fee rate produces negative fee
});

Deno.test("estimateFee - multiple outputs", () => {
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
    { value: 2000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
    { value: 3000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  const fee = estimateFee(outputs, 1);
  assertEquals(fee > 0, true);

  // Fee should be higher than single output
  const singleOutputFee = estimateFee([outputs[0]], 1);
  assertEquals(fee > singleOutputFee, true);
});

Deno.test("calculateMiningFee - different script types", () => {
  const p2pkhInputs = [{
    type: "P2PKH" as const,
    size: TX_CONSTANTS.P2PKH.size,
    isWitness: false,
  }];

  const p2shInputs = [{
    type: "P2SH" as const,
    size: TX_CONSTANTS.P2SH.size,
    isWitness: false,
  }];

  const p2trInputs = [{
    type: "P2TR" as const,
    size: TX_CONSTANTS.P2TR.size,
    isWitness: true,
  }];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const p2pkhFee = calculateMiningFee(p2pkhInputs, outputs, 1);
  const p2shFee = calculateMiningFee(p2shInputs, outputs, 1);
  const p2trFee = calculateMiningFee(p2trInputs, outputs, 1);

  // All should be valid fees
  assertEquals(p2pkhFee > 0, true);
  assertEquals(p2shFee > 0, true);
  assertEquals(p2trFee > 0, true);

  // Different script types should have different fees
  assertEquals(p2pkhFee !== p2shFee, true);
  assertEquals(p2shFee !== p2trFee, true);
});

Deno.test("calculateMiningFee - with multiple inputs having ancestors", () => {
  const inputs = [
    {
      type: "P2WPKH" as const,
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: {
        fees: 1000,
        vsize: 200,
        effectiveRate: 5,
      },
    },
    {
      type: "P2WPKH" as const,
      size: TX_CONSTANTS.P2WPKH.size,
      isWitness: true,
      ancestor: {
        fees: 2000,
        vsize: 400,
        effectiveRate: 5,
      },
    },
  ];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const fee = calculateMiningFee(inputs, outputs, 1);
  assertEquals(fee > 0, true);

  // Compare with no ancestors
  const inputsNoAncestors = inputs.map(({ ancestor: _ancestor, ...rest }) =>
    rest
  );
  const feeNoAncestors = calculateMiningFee(inputsNoAncestors, outputs, 1);

  // Fee with ancestors should consider ancestor data
  assertEquals(fee !== feeNoAncestors, true);
});

Deno.test("calculateMiningFee - different change output types", () => {
  const inputs = [{
    type: "P2WPKH" as const,
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  const feeP2WPKH = calculateMiningFee(inputs, outputs, 1, {
    includeChangeOutput: true,
    changeOutputType: "P2WPKH",
  });

  const feeP2PKH = calculateMiningFee(inputs, outputs, 1, {
    includeChangeOutput: true,
    changeOutputType: "P2PKH",
  });

  const feeP2TR = calculateMiningFee(inputs, outputs, 1, {
    includeChangeOutput: true,
    changeOutputType: "P2TR",
  });

  // All fees should be positive
  assertEquals(feeP2WPKH > 0, true);
  assertEquals(feeP2PKH > 0, true);
  assertEquals(feeP2TR > 0, true);
});

Deno.test("calculateP2WSHMiningFee - edge cases", () => {
  // Zero file size
  const zeroFee = calculateP2WSHMiningFee(0, 1);
  assertEquals(zeroFee > 0, true); // Still has base transaction cost

  // Very small file
  const smallFee = calculateP2WSHMiningFee(1, 1);
  assertEquals(smallFee > 0, true);

  // File size exactly divisible by 32
  const exactFee = calculateP2WSHMiningFee(32, 1);
  assertEquals(exactFee > 0, true);

  // File size not divisible by 32
  const oddFee = calculateP2WSHMiningFee(33, 1);
  assertEquals(oddFee > exactFee, true); // Should need one more output

  // With ancestors but undefined ancestorInfo
  const undefinedAncestorFee = calculateP2WSHMiningFee(64, 1, true, undefined);
  assertEquals(undefinedAncestorFee > 0, true);
});

Deno.test("estimateFee - coverage for calculateBaseFee internal paths", () => {
  // Test with different input counts to exercise calculateBaseFee
  const outputs = [
    { value: 1000, address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq" },
  ];

  // Test with 0 inputs (edge case)
  const zeroInputsFee = estimateFee(outputs, 1, 0);
  assertEquals(zeroInputsFee > 0, true);

  // Test with many inputs
  const manyInputsFee = estimateFee(outputs, 1, 10);
  assertEquals(manyInputsFee > zeroInputsFee, true);

  // Test with decimal fee rate
  const decimalFee = estimateFee(outputs, 1.5, 1);
  assertEquals(decimalFee > 0, true);
});

Deno.test("calculateMiningFee - options parameter edge cases", () => {
  const inputs = [{
    type: "P2WPKH" as const,
    size: TX_CONSTANTS.P2WPKH.size,
    isWitness: true,
  }];

  const outputs = [{
    type: "P2WPKH" as const,
    size: 31,
    isWitness: true,
    value: 1000,
  }];

  // Test with partial options
  const partialOptionsFee = calculateMiningFee(inputs, outputs, 1, {
    includeChangeOutput: false,
    // changeOutputType omitted
  } as any);
  assertEquals(partialOptionsFee > 0, true);

  // Test with empty options object
  const emptyOptionsFee = calculateMiningFee(inputs, outputs, 1, {} as any);
  assertEquals(emptyOptionsFee > 0, true);
});
