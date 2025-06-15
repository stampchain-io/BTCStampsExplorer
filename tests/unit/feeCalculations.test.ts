import { assertEquals } from "@std/assert";
import {
  calculateDust,
  calculateMiningFee,
  calculateP2WSHMiningFee,
  estimateFee,
} from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";

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
