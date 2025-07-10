import { assert, assertEquals } from "@std/assert";
import {
  detectScriptType,
  getScriptTypeInfo,
  isP2SH,
  isP2TR,
  isP2WPKH,
  isP2WSH,
  isValidBitcoinAddress,
  validateWalletAddressForMinting,
} from "$lib/utils/scriptTypeUtils.ts";

// Test toHexString function indirectly through script detection functions
Deno.test("scriptTypeUtils - isP2SH with Uint8Array", () => {
  // Test with valid P2SH Uint8Array
  const validP2SHBytes = new Uint8Array([
    0xa9,
    0x14, // OP_HASH160, push 20 bytes
    ...Array(20).fill(0xbb), // 20 bytes of script hash
    0x87, // OP_EQUAL
  ]);
  assert(isP2SH(validP2SHBytes), "Should detect valid P2SH from Uint8Array");

  // Test with invalid Uint8Array
  const invalidBytes = new Uint8Array([0x00, 0x01, 0x02]);
  assert(!isP2SH(invalidBytes), "Should not detect invalid bytes as P2SH");
});

Deno.test("scriptTypeUtils - isP2WPKH with Uint8Array", () => {
  // Test with valid P2WPKH Uint8Array
  const validP2WPKHBytes = new Uint8Array([
    0x00,
    0x14, // version 0, push 20 bytes
    ...Array(20).fill(0xcc), // 20 bytes of pubkey hash
  ]);
  assert(
    isP2WPKH(validP2WPKHBytes),
    "Should detect valid P2WPKH from Uint8Array",
  );

  // Test with P2WSH bytes (should not match)
  const p2wshBytes = new Uint8Array([
    0x00,
    0x20, // version 0, push 32 bytes
    ...Array(32).fill(0xdd), // 32 bytes
  ]);
  assert(!isP2WPKH(p2wshBytes), "Should not detect P2WSH bytes as P2WPKH");
});

Deno.test("scriptTypeUtils - isP2WSH with Uint8Array", () => {
  // Test with valid P2WSH Uint8Array
  const validP2WSHBytes = new Uint8Array([
    0x00,
    0x20, // version 0, push 32 bytes
    ...Array(32).fill(0xdd), // 32 bytes of script hash
  ]);
  assert(isP2WSH(validP2WSHBytes), "Should detect valid P2WSH from Uint8Array");

  // Test with wrong size bytes
  const wrongSizeBytes = new Uint8Array([
    0x00,
    0x14, // version 0, push 20 bytes (P2WPKH)
    ...Array(20).fill(0xaa),
  ]);
  assert(!isP2WSH(wrongSizeBytes), "Should not detect P2WPKH bytes as P2WSH");
});

Deno.test("scriptTypeUtils - isP2TR with Uint8Array", () => {
  // Test with valid P2TR Uint8Array
  const validP2TRBytes = new Uint8Array([
    0x51,
    0x20, // OP_1, push 32 bytes
    ...Array(32).fill(0xee), // 32 bytes of taproot output
  ]);
  assert(isP2TR(validP2TRBytes), "Should detect valid P2TR from Uint8Array");

  // Test with non-P2TR bytes
  const nonP2TRBytes = new Uint8Array([
    0x00,
    0x20, // P2WSH prefix
    ...Array(32).fill(0xff),
  ]);
  assert(!isP2TR(nonP2TRBytes), "Should not detect P2WSH bytes as P2TR");
});

Deno.test("scriptTypeUtils - detectScriptType edge cases", () => {
  // Test with whitespace-only string
  assertEquals(
    detectScriptType("   \t\n  "),
    "P2WPKH",
    "Should return default for whitespace-only string",
  );

  // Test with Uint8Array that doesn't match any pattern
  const unknownBytes = new Uint8Array([0x99, 0x88, 0x77, 0x66]);
  assertEquals(
    detectScriptType(unknownBytes),
    "P2WPKH",
    "Should return default for unknown Uint8Array pattern",
  );

  // Test with empty Uint8Array
  const emptyBytes = new Uint8Array(0);
  assertEquals(
    detectScriptType(emptyBytes),
    "P2WPKH",
    "Should return default for empty Uint8Array",
  );

  // Test with hex string that doesn't match any pattern
  const invalidHex = "abcdef1234567890";
  assertEquals(
    detectScriptType(invalidHex),
    "P2WPKH",
    "Should return default for hex string with no matching pattern",
  );

  // Test mixed case hex detection - hex validation is case insensitive but doesn't match patterns
  const mixedCaseP2PKH = "76A914" + "A".repeat(40) + "88AC";
  assertEquals(
    detectScriptType(mixedCaseP2PKH),
    "P2WPKH", // Mixed case doesn't match the lowercase regex patterns
    "Should return default for mixed case hex",
  );
});

Deno.test("scriptTypeUtils - getScriptTypeInfo with unsupported types", () => {
  // Mock TX_CONSTANTS to simulate missing type
  const _originalTxConstants = (globalThis as any).TX_CONSTANTS;

  // Test with a type that exists but might not have all properties
  const info = getScriptTypeInfo("5120" + "f".repeat(64)); // P2TR
  assertEquals(info.type, "P2TR");
  assert(typeof info.size === "number");
  assert(typeof info.isWitness === "boolean");

  // Test with address that maps to a supported type
  const p2pkhInfo = getScriptTypeInfo("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  assertEquals(p2pkhInfo.type, "P2PKH");
  assertEquals(p2pkhInfo.size, 107);
  assertEquals(p2pkhInfo.isWitness, false);

  // Edge case: very long invalid address
  const longInvalid = "x".repeat(100);
  const longInfo = getScriptTypeInfo(longInvalid);
  assertEquals(longInfo.type, "P2WPKH"); // Should default
  assert(typeof longInfo.size === "number");
  assert(typeof longInfo.isWitness === "boolean");
});

Deno.test("scriptTypeUtils - isValidBitcoinAddress edge cases", () => {
  // Test addresses at boundary lengths
  const shortP2PKH = "1" + "A".repeat(24); // Minimum length - 1
  assert(!isValidBitcoinAddress(shortP2PKH), "Should reject too short P2PKH");

  const longP2PKH = "1" + "z".repeat(35); // Maximum length + 1
  assert(!isValidBitcoinAddress(longP2PKH), "Should reject too long P2PKH");

  // Test bech32 with wrong length
  const shortBech32 = "bc1q" + "a".repeat(37); // One character short
  assert(!isValidBitcoinAddress(shortBech32), "Should reject short bech32");

  const longBech32 = "bc1q" + "z".repeat(60); // Too long
  assert(!isValidBitcoinAddress(longBech32), "Should reject long bech32");

  // Test taproot with exact length
  const exactTaproot = "bc1p" + "a".repeat(58); // Exactly 62 chars total
  assert(
    isValidBitcoinAddress(exactTaproot),
    "Should accept exact length taproot",
  );

  // Test with invalid characters
  const invalidChars = "1ABCDEFG0IJKLMNOPQRSTUVWXYZ"; // Contains 0, I, O
  assert(
    !isValidBitcoinAddress(invalidChars),
    "Should reject address with invalid base58 chars",
  );

  // Test empty and null-like values
  assert(!isValidBitcoinAddress("0"), "Should reject single zero");
  assert(!isValidBitcoinAddress("null"), "Should reject 'null' string");
});

Deno.test("scriptTypeUtils - validateWalletAddressForMinting edge cases", () => {
  // Test with null/undefined (coerced to empty string)
  const nullResult = validateWalletAddressForMinting(null as any);
  assert(!nullResult.isValid);
  assertEquals(nullResult.error, "No wallet address provided");

  // Test with whitespace - the function checks if address is truthy, not trimmed
  const whitespaceResult = validateWalletAddressForMinting("  ");
  assert(!whitespaceResult.isValid);
  assertEquals(
    whitespaceResult.error,
    "Connected wallet address type is unsupported for minting.",
  );

  // Test P2PKH at minimum valid length
  const minP2PKH = "1" + "A".repeat(25); // 26 chars total
  const minResult = validateWalletAddressForMinting(minP2PKH);
  assert(minResult.isValid, "Should accept minimum length P2PKH");

  // Test P2PKH at maximum valid length
  const maxP2PKH = "1" + "z".repeat(33); // 34 chars total
  const maxResult = validateWalletAddressForMinting(maxP2PKH);
  assert(maxResult.isValid, "Should accept maximum length P2PKH");

  // Test bech32 P2WPKH at exact boundaries
  const minBech32 = "bc1q" + "a".repeat(38); // Minimum for P2WPKH
  const minBech32Result = validateWalletAddressForMinting(minBech32);
  assert(minBech32Result.isValid, "Should accept minimum length bech32");

  const maxBech32 = "bc1q" + "z".repeat(59); // Maximum for P2WPKH
  const maxBech32Result = validateWalletAddressForMinting(maxBech32);
  assert(maxBech32Result.isValid, "Should accept maximum length bech32");

  // Test that P2WSH (bc1q with wrong length) is rejected
  const p2wsh = "bc1q" + "a".repeat(62); // Too long for P2WPKH
  const p2wshResult = validateWalletAddressForMinting(p2wsh);
  assert(!p2wshResult.isValid, "Should reject P2WSH-like address");

  // Test invalid address that starts with valid prefix
  const invalidWithGoodPrefix = "1InvalidAddress!@#";
  const invalidResult = validateWalletAddressForMinting(invalidWithGoodPrefix);
  assert(!invalidResult.isValid);
  assertEquals(
    invalidResult.error,
    "Connected wallet address type is unsupported for minting.",
  );
});

Deno.test("scriptTypeUtils - complex script detection scenarios", () => {
  // Test Uint8Array with all script types
  const scriptTests = [
    {
      bytes: new Uint8Array([
        0x76,
        0xa9,
        0x14,
        ...Array(20).fill(0x11),
        0x88,
        0xac,
      ]),
      expected: "P2PKH",
    },
    {
      bytes: new Uint8Array([0xa9, 0x14, ...Array(20).fill(0x22), 0x87]),
      expected: "P2SH",
    },
    {
      bytes: new Uint8Array([0x00, 0x14, ...Array(20).fill(0x33)]),
      expected: "P2WPKH",
    },
    {
      bytes: new Uint8Array([0x00, 0x20, ...Array(32).fill(0x44)]),
      expected: "P2WSH",
    },
    {
      bytes: new Uint8Array([0x51, 0x20, ...Array(32).fill(0x55)]),
      expected: "P2TR",
    },
  ];

  for (const test of scriptTests) {
    assertEquals(
      detectScriptType(test.bytes),
      test.expected,
      `Should detect ${test.expected} from Uint8Array`,
    );
  }

  // Test number coercion - numbers get converted to strings, "12345" starts with "1"
  assertEquals(
    detectScriptType(12345 as any),
    "P2PKH", // "12345" starts with "1", detected as P2PKH address
    "Should handle number input gracefully",
  );

  // Test object coercion
  assertEquals(
    detectScriptType({ toString: () => "bc1p" + "x".repeat(58) } as any),
    "P2TR",
    "Should handle object with toString",
  );
});
