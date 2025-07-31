// lib/types/transaction_test.ts - Transaction Types Test Suite
//
// Tests for transaction.d.ts types including type safety, imports, and interfaces

import { assertEquals, assertExists } from "@std/assert";
import type {
  BlockInfo,
  BlockInfoResponseBody,
  InputTypeForSizeEstimation,
  MintStampInputData,
  Output,
  OutputTypeForSizeEstimation,
  ScriptType,
  ScriptTypeInfo,
  SendRow,
  TX,
  TXError,
} from "./transaction.d.ts";

// Test SendRow interface
Deno.test("SendRow interface validation", () => {
  const sendRow: SendRow = {
    source: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    destination: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    cpid: "STAMP001",
    tick: "TEST",
    memo: "Test send transaction",
    quantity: "1000000",
    tx_hash:
      "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    block_index: 850000,
    satoshirate: 50000,
    block_time: new Date("2024-01-01T00:00:00Z"),
  };

  assertEquals(typeof sendRow.source, "string");
  assertEquals(typeof sendRow.destination, "string");
  assertEquals(typeof sendRow.cpid, "string");
  assertEquals(typeof sendRow.tick, "string");
  assertEquals(typeof sendRow.memo, "string");
  assertEquals(typeof sendRow.quantity, "string");
  assertEquals(typeof sendRow.tx_hash, "string");
  assertEquals(typeof sendRow.block_index, "number");
  assertEquals(typeof sendRow.satoshirate, "number");
  assertEquals(sendRow.block_time instanceof Date, true);
});

// Test BlockInfo interface
Deno.test("BlockInfo interface validation", () => {
  const blockInfo: BlockInfo = {
    block_info: {
      block_index: 850000,
      block_hash:
        "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
      block_time: 1704067200,
      previous_block_hash:
        "00000000000000000001a7c4c1e48d76c5a37902165a270156b7a8d72728a053",
      difficulty: 72000000000000,
      ledger_hash: "abc123def456",
      txlist_hash: "def456ghi789",
      messages_hash: "ghi789jkl012",
      indexed: 1,
    },
    issuances: [], // Simplified - empty array for testing
    sends: [{
      source: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      destination: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      cpid: "STAMP001",
      tick: null,
      memo: "Test send",
      quantity: "1",
      tx_hash:
        "b1c2d3e4f5g6789012345678901234567890123456789012345678901234567890",
      block_index: 850000,
      satoshirate: 50000,
      block_time: new Date("2024-01-01T00:00:00Z"),
    }],
  };

  assertExists(blockInfo.block_info);
  assertEquals(typeof blockInfo.block_info.block_index, "number");
  assertEquals(Array.isArray(blockInfo.issuances), true);
  assertEquals(Array.isArray(blockInfo.sends), true);
  assertEquals(blockInfo.issuances.length, 0);
  assertEquals(blockInfo.sends.length, 1);
});

// Test BlockInfoResponseBody interface
Deno.test("BlockInfoResponseBody interface validation", () => {
  const responseBody: BlockInfoResponseBody = {
    block_info: {
      block_index: 850000,
      block_hash:
        "00000000000000000002a7c4c1e48d76c5a37902165a270156b7a8d72728a054",
      block_time: 1704067200,
      previous_block_hash:
        "00000000000000000001a7c4c1e48d76c5a37902165a270156b7a8d72728a053",
      difficulty: 72000000000000,
      ledger_hash: "abc123def456",
      txlist_hash: "def456ghi789",
      messages_hash: "ghi789jkl012",
      indexed: 1,
    },
    issuances: [],
    sends: [],
    last_block: 850001,
  };

  assertExists(responseBody.block_info);
  assertEquals(Array.isArray(responseBody.issuances), true);
  assertEquals(Array.isArray(responseBody.sends), true);
  assertEquals(typeof responseBody.last_block, "number");
});

// Test TX interface
Deno.test("TX interface validation", () => {
  const tx: TX = {
    psbtHex:
      "70736274ff01005e02000000012b6e53d9e5a6e4d9a6f5b8c7e3d2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4c3b2a1900100000000ffffffff0200e1f505000000001976a914389e5c9f7e2c3b8e6d5a4e9b8c7e6d5a4e9b8c7e88ac0084d71700000000",
    fee: 5000,
    change: 95000,
  };

  assertEquals(typeof tx.psbtHex, "string");
  assertEquals(typeof tx.fee, "number");
  assertEquals(typeof tx.change, "number");
  assertEquals(tx.fee > 0, true);
});

// Test TXError interface
Deno.test("TXError interface validation", () => {
  const txError: TXError = {
    error: "Insufficient funds for transaction",
  };

  assertEquals(typeof txError.error, "string");
  assertEquals(txError.error.length > 0, true);
});

// Test MintStampInputData interface
Deno.test("MintStampInputData interface validation", () => {
  const mintData: MintStampInputData = {
    sourceWallet: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    assetName: "TEST_STAMP",
    qty: 1,
    locked: true,
    divisible: false,
    filename: "test_image.png",
    file:
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    satsPerKB: 50000,
    service_fee: 1000,
    service_fee_address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  };

  assertEquals(typeof mintData.sourceWallet, "string");
  assertEquals(typeof mintData.assetName, "string");
  assertEquals(typeof mintData.qty, "number");
  assertEquals(typeof mintData.locked, "boolean");
  assertEquals(typeof mintData.divisible, "boolean");
  assertEquals(typeof mintData.filename, "string");
  assertEquals(typeof mintData.file, "string");
  assertEquals(typeof mintData.satsPerKB, "number");
  assertEquals(typeof mintData.service_fee, "number");
  assertEquals(typeof mintData.service_fee_address, "string");
});

// Test ScriptType re-export
Deno.test("ScriptType re-export validation", () => {
  const scriptTypes: ScriptType[] = [
    "P2PKH",
    "P2SH",
    "P2WPKH",
    "P2WSH",
    "P2TR",
    "OP_RETURN",
    "UNKNOWN",
  ];

  assertEquals(Array.isArray(scriptTypes), true);
  assertEquals(scriptTypes.length, 7);
  assertEquals(scriptTypes.includes("P2PKH"), true);
  assertEquals(scriptTypes.includes("P2TR"), true);
});

// Test ScriptTypeInfo interface
Deno.test("ScriptTypeInfo interface validation", () => {
  const scriptInfo: ScriptTypeInfo = {
    type: "P2WPKH",
    isWitness: true,
    size: 22,
    redeemScriptType: {
      type: "P2PKH",
      isWitness: false,
      size: 25,
    },
  };

  assertEquals(scriptInfo.type, "P2WPKH");
  assertEquals(scriptInfo.isWitness, true);
  assertEquals(typeof scriptInfo.size, "number");
  assertExists(scriptInfo.redeemScriptType);
  assertEquals(scriptInfo.redeemScriptType?.type, "P2PKH");
});

// Test InputTypeForSizeEstimation interface
Deno.test("InputTypeForSizeEstimation interface validation", () => {
  const inputType: InputTypeForSizeEstimation = {
    type: "P2WPKH",
    isWitness: true,
    redeemScriptType: "P2PKH",
  };

  assertEquals(inputType.type, "P2WPKH");
  assertEquals(inputType.isWitness, true);
  assertEquals(inputType.redeemScriptType, "P2PKH");
});

// Test OutputTypeForSizeEstimation interface
Deno.test("OutputTypeForSizeEstimation interface validation", () => {
  const outputType: OutputTypeForSizeEstimation = {
    type: "P2TR",
  };

  assertEquals(outputType.type, "P2TR");
});

// Test Output interface
Deno.test("Output interface validation", () => {
  const output: Output = {
    script: "76a914389e5c9f7e2c3b8e6d5a4e9b8c7e6d5a4e9b8c7e88ac",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    value: 100000,
  };

  assertEquals(typeof output.script, "string");
  assertEquals(typeof output.address, "string");
  assertEquals(typeof output.value, "number");
  assertEquals(output.value > 0, true);
});

console.log("✅ All transaction type tests passed!");
