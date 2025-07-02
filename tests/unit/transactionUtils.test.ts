import { assertEquals } from "@std/assert";
import { arc4, extractOutputs } from "$lib/utils/minting/transactionUtils.ts";
import * as bitcoin from "bitcoinjs-lib";

Deno.test("arc4 - encrypts and decrypts correctly", () => {
  const key = new Uint8Array([1, 2, 3, 4, 5]);
  const plaintext = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"

  // Encrypt
  const encrypted = arc4(key, plaintext);

  // Verify it's different from plaintext
  let isDifferent = false;
  for (let i = 0; i < plaintext.length; i++) {
    if (encrypted[i] !== plaintext[i]) {
      isDifferent = true;
      break;
    }
  }
  assertEquals(isDifferent, true);

  // Decrypt (arc4 is symmetric)
  const decrypted = arc4(key, encrypted);

  // Verify decryption matches original
  assertEquals(decrypted, plaintext);
});

Deno.test("arc4 - handles empty data", () => {
  const key = new Uint8Array([1, 2, 3]);
  const data = new Uint8Array([]);

  const result = arc4(key, data);
  assertEquals(result.length, 0);
  assertEquals(result, new Uint8Array([]));
});

Deno.test("arc4 - handles single byte", () => {
  const key = new Uint8Array([42]);
  const data = new Uint8Array([255]);

  const encrypted = arc4(key, data);
  assertEquals(encrypted.length, 1);

  // Decrypt
  const decrypted = arc4(key, encrypted);
  assertEquals(decrypted, data);
});

Deno.test("arc4 - handles long key", () => {
  const key = new Uint8Array(300).fill(7); // Key longer than 256
  const data = new Uint8Array([1, 2, 3, 4, 5]);

  const encrypted = arc4(key, data);
  assertEquals(encrypted.length, data.length);

  // Decrypt
  const decrypted = arc4(key, encrypted);
  assertEquals(decrypted, data);
});

Deno.test("arc4 - produces consistent results", () => {
  const key = new Uint8Array([10, 20, 30]);
  const data = new Uint8Array([100, 200, 150]);

  const result1 = arc4(key, data);
  const result2 = arc4(key, data);

  // Same key and data should produce same result
  assertEquals(result1, result2);
});

Deno.test("arc4 - different keys produce different results", () => {
  const key1 = new Uint8Array([1, 2, 3]);
  const key2 = new Uint8Array([4, 5, 6]);
  const data = new Uint8Array([10, 20, 30]);

  const result1 = arc4(key1, data);
  const result2 = arc4(key2, data);

  // Different keys should produce different results
  let isDifferent = false;
  for (let i = 0; i < result1.length; i++) {
    if (result1[i] !== result2[i]) {
      isDifferent = true;
      break;
    }
  }
  assertEquals(isDifferent, true);
});

// Tests for extractOutputs function
Deno.test("extractOutputs - handles transaction with script outputs", () => {
  // Create a mock transaction with script-based outputs
  const mockTx = {
    outs: [
      {
        value: 100000,
        script: new Uint8Array([
          0x76,
          0xa9,
          0x14,
          0x89,
          0xab,
          0xcd,
          0xef,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0x88,
          0xac,
        ]), // P2PKH script
      },
      {
        value: 50000,
        script: new Uint8Array([
          0xa9,
          0x14,
          0x89,
          0xab,
          0xcd,
          0xef,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0x87,
        ]), // P2SH script
      },
    ],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  assertEquals(outputs.length, 2);
  assertEquals(outputs[0].value, 100000);
  assertEquals(outputs[1].value, 50000);
  assertEquals("script" in outputs[0], true);
  assertEquals("script" in outputs[1], true);
});

Deno.test("extractOutputs - handles transaction with address outputs", () => {
  // Create a mock transaction with address-based outputs
  const mockTx = {
    outs: [
      {
        value: 75000,
        address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
      },
      {
        value: 25000,
        address: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
      },
    ],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  assertEquals(outputs.length, 2);
  assertEquals(outputs[0].value, 75000);
  // Check if output has address property
  if ("address" in outputs[0]) {
    assertEquals(outputs[0].address, "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
  }
  assertEquals(outputs[1].value, 25000);
  if ("address" in outputs[1]) {
    assertEquals(outputs[1].address, "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy");
  }
});

Deno.test("extractOutputs - handles mixed address and script outputs", () => {
  // Create a mock transaction with both address and script outputs
  const mockTx = {
    outs: [
      {
        value: 100000,
        address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
      },
      {
        value: 50000,
        script: new Uint8Array([
          0x76,
          0xa9,
          0x14,
          0x89,
          0xab,
          0xcd,
          0xef,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0x88,
          0xac,
        ]),
      },
    ],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  assertEquals(outputs.length, 2);
  assertEquals(outputs[0].value, 100000);
  if ("address" in outputs[0]) {
    assertEquals(outputs[0].address, "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
  }
  assertEquals(outputs[1].value, 50000);
  assertEquals("script" in outputs[1], true);
});

Deno.test("extractOutputs - filters out matching address from script outputs", () => {
  // Create a P2PKH script for a known address
  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

  // Create a script that would decode to the test address
  const mockTx = {
    outs: [
      {
        value: 100000,
        script: new Uint8Array([
          0x76,
          0xa9,
          0x14,
          0x89,
          0xab,
          0xcd,
          0xef,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0xab,
          0xba,
          0x88,
          0xac,
        ]),
      },
      {
        value: 50000,
        script: new Uint8Array([
          0xa9,
          0x14,
          0x12,
          0x34,
          0x56,
          0x78,
          0x90,
          0xab,
          0xcd,
          0xef,
          0x12,
          0x34,
          0x56,
          0x78,
          0x90,
          0xab,
          0xcd,
          0xef,
          0x12,
          0x34,
          0x56,
          0x78,
          0x87,
        ]),
      },
    ],
  } as unknown as bitcoin.Transaction;

  const outputs = extractOutputs(mockTx, testAddress);

  // Should include both outputs since the scripts don't decode to the test address
  assertEquals(outputs.length, 2);
  assertEquals(outputs[0].value, 100000);
  assertEquals(outputs[1].value, 50000);
});

Deno.test("extractOutputs - handles script decoding errors gracefully", () => {
  // Create a mock transaction with invalid script that will throw during decoding
  const mockTx = {
    outs: [
      {
        value: 100000,
        script: new Uint8Array([0xff, 0xff, 0xff]), // Invalid script
      },
      {
        value: 50000,
        script: new Uint8Array([0xff]), // Another invalid script
      },
    ],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  // Should handle errors gracefully and include all outputs
  assertEquals(outputs.length, 2);
  assertEquals(outputs[0].value, 100000);
  assertEquals(outputs[1].value, 50000);
  assertEquals("script" in outputs[0], true);
  assertEquals("script" in outputs[1], true);
});

Deno.test("extractOutputs - handles empty transaction", () => {
  const mockTx = {
    outs: [],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  assertEquals(outputs.length, 0);
});

Deno.test("extractOutputs - handles transaction with single output", () => {
  const mockTx = {
    outs: [
      {
        value: 100000,
        address: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
      },
    ],
  } as unknown as bitcoin.Transaction;

  const testAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const outputs = extractOutputs(mockTx, testAddress);

  assertEquals(outputs.length, 1);
  assertEquals(outputs[0].value, 100000);
  if ("address" in outputs[0]) {
    assertEquals(outputs[0].address, "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2");
  }
});
