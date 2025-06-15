import { assert, assertEquals } from "@std/assert";
import {
  detectScriptType,
  getScriptTypeInfo,
  isP2PKH,
  isP2SH,
  isP2TR,
  isP2WPKH,
  isP2WSH,
  isValidBitcoinAddress,
  validateWalletAddressForMinting,
} from "$lib/utils/scriptTypeUtils.ts";

Deno.test("scriptTypeUtils - isP2PKH", () => {
  // Valid P2PKH scripts
  assert(
    isP2PKH("76a914" + "a".repeat(40) + "88ac"),
    "Should detect valid P2PKH script",
  );
  assert(
    isP2PKH("76a914" + "0".repeat(40) + "88ac"),
    "Should detect valid P2PKH script with zeros",
  );

  // Invalid scripts
  assert(
    !isP2PKH("a914" + "a".repeat(40) + "87"),
    "Should not detect P2SH as P2PKH",
  );
  assert(
    !isP2PKH("0014" + "a".repeat(40)),
    "Should not detect P2WPKH as P2PKH",
  );
  assert(!isP2PKH("invalid"), "Should not detect invalid string as P2PKH");
  assert(!isP2PKH(""), "Should not detect empty string as P2PKH");

  // Test with Uint8Array
  const validBytes = new Uint8Array([
    0x76,
    0xa9,
    0x14,
    ...Array(20).fill(0xaa),
    0x88,
    0xac,
  ]);
  assert(isP2PKH(validBytes), "Should detect valid P2PKH from Uint8Array");
});

Deno.test("scriptTypeUtils - isP2SH", () => {
  // Valid P2SH scripts
  assert(
    isP2SH("a914" + "b".repeat(40) + "87"),
    "Should detect valid P2SH script",
  );
  assert(
    isP2SH("a914" + "0".repeat(40) + "87"),
    "Should detect valid P2SH script with zeros",
  );

  // Invalid scripts
  assert(
    !isP2SH("76a914" + "a".repeat(40) + "88ac"),
    "Should not detect P2PKH as P2SH",
  );
  assert(!isP2SH("0014" + "a".repeat(40)), "Should not detect P2WPKH as P2SH");
  assert(!isP2SH("invalid"), "Should not detect invalid string as P2SH");
});

Deno.test("scriptTypeUtils - isP2WPKH", () => {
  // Valid P2WPKH scripts
  assert(
    isP2WPKH("0014" + "c".repeat(40)),
    "Should detect valid P2WPKH script",
  );
  assert(
    isP2WPKH("0014" + "0".repeat(40)),
    "Should detect valid P2WPKH script with zeros",
  );

  // Invalid scripts
  assert(
    !isP2WPKH("0020" + "a".repeat(64)),
    "Should not detect P2WSH as P2WPKH",
  );
  assert(
    !isP2WPKH("76a914" + "a".repeat(40) + "88ac"),
    "Should not detect P2PKH as P2WPKH",
  );
});

Deno.test("scriptTypeUtils - isP2WSH", () => {
  // Valid P2WSH scripts
  assert(isP2WSH("0020" + "d".repeat(64)), "Should detect valid P2WSH script");
  assert(
    isP2WSH("0020" + "0".repeat(64)),
    "Should detect valid P2WSH script with zeros",
  );

  // Invalid scripts
  assert(
    !isP2WSH("0014" + "a".repeat(40)),
    "Should not detect P2WPKH as P2WSH",
  );
  assert(!isP2WSH("5120" + "a".repeat(64)), "Should not detect P2TR as P2WSH");
});

Deno.test("scriptTypeUtils - isP2TR", () => {
  // Valid P2TR scripts
  assert(isP2TR("5120" + "e".repeat(64)), "Should detect valid P2TR script");
  assert(
    isP2TR("5120" + "0".repeat(64)),
    "Should detect valid P2TR script with zeros",
  );

  // Invalid scripts
  assert(!isP2TR("0020" + "a".repeat(64)), "Should not detect P2WSH as P2TR");
  assert(!isP2TR("0014" + "a".repeat(40)), "Should not detect P2WPKH as P2TR");
});

Deno.test("scriptTypeUtils - isValidBitcoinAddress", () => {
  // Valid addresses
  assert(
    isValidBitcoinAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    "Should validate P2PKH address",
  );
  assert(
    isValidBitcoinAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
    "Should validate P2SH address",
  );
  assert(
    isValidBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    "Should validate P2WPKH address",
  );
  assert(
    isValidBitcoinAddress(
      "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
    ),
    "Should validate P2TR address",
  );

  // Invalid addresses
  assert(!isValidBitcoinAddress(""), "Should not validate empty string");
  assert(
    !isValidBitcoinAddress("invalid"),
    "Should not validate invalid address",
  );
  assert(
    !isValidBitcoinAddress("0A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    "Should not validate address with invalid prefix",
  );
  assert(
    !isValidBitcoinAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t"),
    "Should not validate address with wrong length",
  );
});

Deno.test("scriptTypeUtils - detectScriptType", () => {
  // Test with scripts
  assertEquals(
    detectScriptType("76a914" + "a".repeat(40) + "88ac"),
    "P2PKH",
    "Should detect P2PKH script",
  );
  assertEquals(
    detectScriptType("a914" + "b".repeat(40) + "87"),
    "P2SH",
    "Should detect P2SH script",
  );
  assertEquals(
    detectScriptType("0014" + "c".repeat(40)),
    "P2WPKH",
    "Should detect P2WPKH script",
  );
  assertEquals(
    detectScriptType("0020" + "d".repeat(64)),
    "P2WSH",
    "Should detect P2WSH script",
  );
  assertEquals(
    detectScriptType("5120" + "e".repeat(64)),
    "P2TR",
    "Should detect P2TR script",
  );

  // Test with addresses
  assertEquals(
    detectScriptType("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"),
    "P2PKH",
    "Should detect P2PKH address",
  );
  assertEquals(
    detectScriptType("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"),
    "P2SH",
    "Should detect P2SH address",
  );
  assertEquals(
    detectScriptType("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    "P2WPKH",
    "Should detect P2WPKH address",
  );
  assertEquals(
    detectScriptType(
      "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
    ),
    "P2TR",
    "Should detect P2TR address",
  );

  // Test edge cases
  assertEquals(
    detectScriptType(null),
    "P2WPKH",
    "Should return default for null",
  );
  assertEquals(
    detectScriptType(undefined),
    "P2WPKH",
    "Should return default for undefined",
  );
  assertEquals(
    detectScriptType(""),
    "P2WPKH",
    "Should return default for empty string",
  );
  assertEquals(
    detectScriptType("invalid"),
    "P2WPKH",
    "Should return default for invalid input",
  );

  // Test with Uint8Array
  const p2pkhBytes = new Uint8Array([
    0x76,
    0xa9,
    0x14,
    ...Array(20).fill(0xaa),
    0x88,
    0xac,
  ]);
  assertEquals(
    detectScriptType(p2pkhBytes),
    "P2PKH",
    "Should detect P2PKH from Uint8Array",
  );
});

Deno.test("scriptTypeUtils - getScriptTypeInfo", () => {
  const info = getScriptTypeInfo("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
  assertEquals(info.type, "P2WPKH", "Should return correct script type");
  assert("size" in info, "Should include size from TX_CONSTANTS");
  assert("isWitness" in info, "Should include isWitness from TX_CONSTANTS");
  assertEquals(info.size, 107, "Should have correct size for P2WPKH");
  assertEquals(info.isWitness, true, "Should be witness type for P2WPKH");

  // Test with null
  const defaultInfo = getScriptTypeInfo(null);
  assertEquals(
    defaultInfo.type,
    "P2WPKH",
    "Should return default type for null",
  );
});

Deno.test("scriptTypeUtils - validateWalletAddressForMinting", () => {
  // Valid addresses for minting
  const validP2PKH = validateWalletAddressForMinting(
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  );
  assert(validP2PKH.isValid, "Should validate P2PKH address for minting");
  assertEquals(
    validP2PKH.error,
    undefined,
    "Should not have error for valid address",
  );

  const validP2WPKH = validateWalletAddressForMinting(
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  );
  assert(validP2WPKH.isValid, "Should validate P2WPKH address for minting");

  // Invalid addresses for minting
  const invalidP2SH = validateWalletAddressForMinting(
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  );
  assert(!invalidP2SH.isValid, "Should not validate P2SH address for minting");
  assertEquals(
    invalidP2SH.error,
    "Connected wallet address type is unsupported for minting.",
  );

  const invalidP2TR = validateWalletAddressForMinting(
    "bc1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqkedrcr",
  );
  assert(!invalidP2TR.isValid, "Should not validate P2TR address for minting");

  const noAddress = validateWalletAddressForMinting("");
  assert(!noAddress.isValid, "Should not validate empty address");
  assertEquals(noAddress.error, "No wallet address provided");
});
