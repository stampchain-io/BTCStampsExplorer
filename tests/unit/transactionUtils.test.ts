import { assertEquals } from "@std/assert";
import { arc4 } from "$lib/utils/minting/transactionUtils.ts";

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
