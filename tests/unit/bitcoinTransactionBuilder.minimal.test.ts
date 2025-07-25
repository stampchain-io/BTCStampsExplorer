// Minimal BitcoinTransactionBuilder Test Suite - Tests only public methods
// Tests formatting function with fixtures
// Uses bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m address fixtures

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { Buffer } from "node:buffer";
import { networks, Psbt } from "bitcoinjs-lib";
import { formatPsbtForLogging } from "../../server/services/transaction/bitcoinTransactionBuilder.ts";

// Test address
const TEST_ADDRESS = "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m";

describe("BitcoinTransactionBuilder - formatPsbtForLogging", () => {
  it("should format PSBT for logging correctly", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    // Add a mock input with witnessUtxo
    psbt.addInput({
      hash: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
      index: 0,
      witnessUtxo: {
        script: Buffer.from(
          "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
          "hex",
        ),
        value: 44089800n,
      },
    });

    // Add a mock output
    psbt.addOutput({
      address: TEST_ADDRESS,
      value: 44089800n,
    });

    const formatted = formatPsbtForLogging(psbt);

    assertEquals(formatted.inputs.length, 1);
    assertEquals(formatted.outputs.length, 1);
    assertEquals(formatted.inputs[0].witnessUtxo.value, 44089800);
    assertEquals(formatted.outputs[0].value, 44089800);
    assertEquals(formatted.outputs[0].address, TEST_ADDRESS);
  });

  it("should handle PSBT with no witnessUtxo", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    // Add input without witnessUtxo
    psbt.addInput({
      hash: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
      index: 0,
    });

    psbt.addOutput({
      address: TEST_ADDRESS,
      value: 1000000n,
    });

    const formatted = formatPsbtForLogging(psbt);

    assertEquals(formatted.inputs.length, 1);
    assertEquals(formatted.inputs[0].witnessUtxo, undefined);
    assertEquals(formatted.outputs.length, 1);
  });

  it("should handle PSBT with multiple inputs and outputs", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    // Add multiple inputs
    psbt.addInput({
      hash: "a0a34578b86c5ed1720083e0008e0578a744a9daa8c13124f64fb8ebbae9029b",
      index: 0,
      witnessUtxo: {
        script: Buffer.from(
          "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
          "hex",
        ),
        value: 44089800n,
      },
    });

    psbt.addInput({
      hash: "ee9ee0c0c1de2591dc5b04c528ba60b3609d5c78ca0303d81a17e81f908a962d",
      index: 1,
      witnessUtxo: {
        script: Buffer.from(
          "0014bd9b3a3dc6056392a498146692050e1719a5d70d",
          "hex",
        ),
        value: 546n,
      },
    });

    // Add multiple outputs
    psbt.addOutput({
      address: TEST_ADDRESS,
      value: 100000n,
    });

    psbt.addOutput({
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      value: 50000n,
    });

    const formatted = formatPsbtForLogging(psbt);

    assertEquals(formatted.inputs.length, 2);
    assertEquals(formatted.outputs.length, 2);
    assertEquals(formatted.inputs[0].witnessUtxo.value, 44089800);
    assertEquals(formatted.inputs[1].witnessUtxo.value, 546);
    assertEquals(formatted.outputs[0].value, 100000);
    assertEquals(formatted.outputs[1].value, 50000);
  });

  it("should handle empty PSBT", () => {
    const psbt = new Psbt({ network: networks.bitcoin });
    const formatted = formatPsbtForLogging(psbt);

    assertEquals(formatted.inputs.length, 0);
    assertEquals(formatted.outputs.length, 0);
  });

  it("should convert BigInt values to numbers", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    psbt.addInput({
      hash: "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234",
      index: 0,
      witnessUtxo: {
        script: Buffer.from("0014" + "00".repeat(20), "hex"),
        value: 2100000000000000n, // Large BigInt
      },
    });

    psbt.addOutput({
      script: Buffer.from("6a", "hex"), // OP_RETURN
      value: 0n,
    });

    const formatted = formatPsbtForLogging(psbt);

    assertEquals(typeof formatted.inputs[0].witnessUtxo.value, "number");
    assertEquals(formatted.inputs[0].witnessUtxo.value, 2100000000000000);
    assertEquals(formatted.outputs[0].value, 0);
    assertEquals(formatted.outputs[0].address, undefined);
  });

  it("should handle PSBT with witness script", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    psbt.addInput({
      hash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      index: 0,
      witnessUtxo: {
        script: Buffer.from("0020" + "00".repeat(32), "hex"), // P2WSH
        value: 100000000n,
      },
      witnessScript: Buffer.from("52" + "21".repeat(33) + "52ae", "hex"), // 2-of-2 multisig
    });

    const formatted = formatPsbtForLogging(psbt);
    assertEquals(formatted.inputs[0].witnessUtxo.value, 100000000);
  });

  it("should handle very large BigInt values", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    const maxSafeInteger = BigInt(Number.MAX_SAFE_INTEGER);
    const largerThanSafe = maxSafeInteger + 1n;

    psbt.addInput({
      hash: "ffff".repeat(16),
      index: 0,
      witnessUtxo: {
        script: Buffer.from("0014" + "ff".repeat(20), "hex"),
        value: largerThanSafe,
      },
    });

    psbt.addOutput({
      script: Buffer.from("6a", "hex"),
      value: 0n,
    });

    const formatted = formatPsbtForLogging(psbt);
    assertEquals(
      formatted.inputs[0].witnessUtxo.value > Number.MAX_SAFE_INTEGER,
      true,
    );
  });

  it("should handle PSBT with sighash types", () => {
    const psbt = new Psbt({ network: networks.bitcoin });

    psbt.addInput({
      hash: "abcd".repeat(16),
      index: 0,
      witnessUtxo: {
        script: Buffer.from("0014" + "00".repeat(20), "hex"),
        value: 100000n,
      },
      sighashType: 0x83, // SIGHASH_SINGLE | SIGHASH_ANYONECANPAY
    });

    const formatted = formatPsbtForLogging(psbt);
    assertEquals(formatted.inputs.length, 1);
    assertEquals(formatted.inputs[0].witnessUtxo.value, 100000);
  });
});
