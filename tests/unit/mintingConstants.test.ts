import { assertEquals } from "@std/assert";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";

Deno.test("TX_CONSTANTS - base sizes", () => {
  assertEquals(TX_CONSTANTS.VERSION, 4);
  assertEquals(TX_CONSTANTS.MARKER, 1);
  assertEquals(TX_CONSTANTS.FLAG, 1);
  assertEquals(TX_CONSTANTS.LOCKTIME, 4);
});

Deno.test("TX_CONSTANTS - script sizes", () => {
  // P2PKH
  assertEquals(TX_CONSTANTS.P2PKH.size, 107);
  assertEquals(TX_CONSTANTS.P2PKH.isWitness, false);

  // P2SH
  assertEquals(TX_CONSTANTS.P2SH.size, 260);
  assertEquals(TX_CONSTANTS.P2SH.isWitness, false);

  // P2WPKH
  assertEquals(TX_CONSTANTS.P2WPKH.size, 107);
  assertEquals(TX_CONSTANTS.P2WPKH.isWitness, true);

  // P2WSH
  assertEquals(TX_CONSTANTS.P2WSH.size, 235);
  assertEquals(TX_CONSTANTS.P2WSH.isWitness, true);

  // P2TR
  assertEquals(TX_CONSTANTS.P2TR.size, 65);
  assertEquals(TX_CONSTANTS.P2TR.isWitness, true);
});

Deno.test("TX_CONSTANTS - witness stack details", () => {
  // P2WPKH witness stack
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2WPKH.itemsCount, 1);
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2WPKH.lengthBytes, 2);
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2WPKH.signature, 72);
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2WPKH.pubkey, 33);

  // P2WSH witness stack
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2WSH.size, 235);

  // P2TR witness stack
  assertEquals(TX_CONSTANTS.WITNESS_STACK.P2TR.size, 65);
});

Deno.test("TX_CONSTANTS - dust thresholds", () => {
  assertEquals(TX_CONSTANTS.DUST_SIZE, 333);
  assertEquals(TX_CONSTANTS.SRC20_DUST, 420);
});

Deno.test("TX_CONSTANTS - weightToVsize function", () => {
  // Test exact division
  assertEquals(TX_CONSTANTS.weightToVsize(4), 1);
  assertEquals(TX_CONSTANTS.weightToVsize(8), 2);
  assertEquals(TX_CONSTANTS.weightToVsize(100), 25);

  // Test with remainder (should ceil)
  assertEquals(TX_CONSTANTS.weightToVsize(5), 2);
  assertEquals(TX_CONSTANTS.weightToVsize(7), 2);
  assertEquals(TX_CONSTANTS.weightToVsize(9), 3);
  assertEquals(TX_CONSTANTS.weightToVsize(101), 26);

  // Edge cases
  assertEquals(TX_CONSTANTS.weightToVsize(0), 0);
  assertEquals(TX_CONSTANTS.weightToVsize(1), 1);
  assertEquals(TX_CONSTANTS.weightToVsize(3), 1);
});
