/**
 * Tests for Bitcoin-specific type assertion utilities
 */

import { assertEquals } from "@std/assert";

import {
  bitcoinAddressTypeTest,
  createTypeValidator,
  isP2PKHAddress,
  isP2SHAddress,
  isP2TRAddress,
  isP2WPKHAddress,
  isSRC101Operation,
  isSRC20Operation,
  isTxHash,
  isValidBase64StampData,
  isValidCPID,
  isValidScriptType,
  isValidSRC101Deploy,
  isValidSRC101Slug,
  isValidSRC20Deploy,
  isValidSRC20Mint,
  isValidSRC20Ticker,
  isValidSRC20Transfer,
  isValidStampClassification,
  isValidStampMimeType,
  isValidStampNumber,
  isValidStampRow,
  isValidTransactionInput,
  isValidTransactionOutput,
  isValidUTXO,
  typeTest,
  validateBitcoinAddressType,
  validateTypeQuick,
} from "./typeAssertions.ts";

// ============================================================================
// BASIC TYPE ASSERTION TESTS
// ============================================================================

Deno.test("Type Assertions - typeTest function", () => {
  // Should compile without error
  typeTest<true>();

  // These would fail at compile time:
  // typeTest<false>(); // TS Error
  // typeTest<boolean>(); // TS Error
});

// ============================================================================
// BITCOIN ADDRESS VALIDATION TESTS
// ============================================================================

Deno.test("Bitcoin Address Validation - P2PKH addresses", () => {
  // Valid P2PKH addresses
  assertEquals(isP2PKHAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"), true);
  assertEquals(isP2PKHAddress("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"), true);
  assertEquals(isP2PKHAddress("1JQheacLPdM2e5BSftwxkPvKUUoruMTuN9"), true);

  // Invalid P2PKH addresses
  assertEquals(isP2PKHAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"), false); // P2SH
  assertEquals(
    isP2PKHAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    false,
  ); // Bech32
  assertEquals(isP2PKHAddress("invalid-address"), false);
  assertEquals(isP2PKHAddress(""), false);
});

Deno.test("Bitcoin Address Validation - P2SH addresses", () => {
  // Valid P2SH addresses
  assertEquals(isP2SHAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"), true);
  assertEquals(isP2SHAddress("3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC"), true);

  // Invalid P2SH addresses
  assertEquals(isP2SHAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"), false); // P2PKH
  assertEquals(
    isP2SHAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    false,
  ); // Bech32
  assertEquals(isP2SHAddress("invalid-address"), false);
});

Deno.test("Bitcoin Address Validation - P2WPKH addresses", () => {
  // Valid P2WPKH addresses
  assertEquals(
    isP2WPKHAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    true,
  );
  assertEquals(
    isP2WPKHAddress(
      "bc1qrp33g8q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
    ),
    true,
  );

  // Invalid P2WPKH addresses
  assertEquals(isP2WPKHAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"), false); // P2PKH
  assertEquals(isP2WPKHAddress("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy"), false); // P2SH
  assertEquals(isP2WPKHAddress("invalid-address"), false);
});

Deno.test("Bitcoin Address Validation - P2TR addresses", () => {
  // Valid P2TR addresses (Taproot)
  assertEquals(
    isP2TRAddress(
      "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
    ),
    true,
  );

  // Invalid P2TR addresses
  assertEquals(
    isP2TRAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"),
    false,
  ); // P2WPKH
  assertEquals(isP2TRAddress("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"), false); // P2PKH
  assertEquals(isP2TRAddress("invalid-address"), false);
});

Deno.test("Bitcoin Address Validation - validateBitcoinAddressType", () => {
  assertEquals(
    validateBitcoinAddressType("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "P2PKH"),
    true,
  );
  assertEquals(
    validateBitcoinAddressType("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "P2SH"),
    true,
  );
  assertEquals(
    validateBitcoinAddressType(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      "P2WPKH",
    ),
    true,
  );
  assertEquals(
    validateBitcoinAddressType(
      "bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297",
      "P2TR",
    ),
    true,
  );

  // Wrong type validation
  assertEquals(
    validateBitcoinAddressType("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "P2SH"),
    false,
  );
  assertEquals(
    validateBitcoinAddressType("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy", "P2PKH"),
    false,
  );
});

// ============================================================================
// BITCOIN TRANSACTION VALIDATION TESTS
// ============================================================================

Deno.test("Bitcoin Transaction - isTxHash", () => {
  // Valid transaction hashes
  assertEquals(
    isTxHash(
      "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    ),
    true,
  );
  assertEquals(
    isTxHash(
      "0000000000000000000000000000000000000000000000000000000000000000",
    ),
    true,
  );
  assertEquals(
    isTxHash(
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    ),
    true,
  );

  // Invalid transaction hashes
  assertEquals(isTxHash("invalid-hash"), false);
  assertEquals(
    isTxHash("4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33"),
    false,
  ); // Too short
  assertEquals(
    isTxHash(
      "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33bb",
    ),
    false,
  ); // Too long
  assertEquals(isTxHash(""), false);
});

Deno.test("Bitcoin Transaction - isValidScriptType", () => {
  // Valid script types
  assertEquals(isValidScriptType("P2PKH"), true);
  assertEquals(isValidScriptType("P2SH"), true);
  assertEquals(isValidScriptType("P2WPKH"), true);
  assertEquals(isValidScriptType("P2WSH"), true);
  assertEquals(isValidScriptType("P2TR"), true);
  assertEquals(isValidScriptType("OP_RETURN"), true);
  assertEquals(isValidScriptType("UNKNOWN"), true);

  // Invalid script types
  assertEquals(isValidScriptType("INVALID"), false);
  assertEquals(isValidScriptType(""), false);
});

Deno.test("Bitcoin Transaction - isValidUTXO", () => {
  const validUTXO = {
    txid: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    vout: 0,
    value: 50000000,
    script: "76a914389ffce9cd9ae88dcc0631e88a821ffdbe9bfe2615887",
  };

  assertEquals(isValidUTXO(validUTXO), true);

  // Invalid UTXOs
  assertEquals(isValidUTXO({}), false);
  assertEquals(isValidUTXO(null), false);
  assertEquals(isValidUTXO(undefined), false);
  assertEquals(isValidUTXO({ ...validUTXO, txid: "invalid" }), false);
  assertEquals(isValidUTXO({ ...validUTXO, vout: -1 }), false);
  assertEquals(isValidUTXO({ ...validUTXO, value: -1 }), false);
});

Deno.test("Bitcoin Transaction - isValidTransactionInput", () => {
  const validInput = {
    type: "P2PKH",
    isWitness: false,
    size: 148,
  };

  assertEquals(isValidTransactionInput(validInput), true);

  // Invalid inputs
  assertEquals(isValidTransactionInput({}), false);
  assertEquals(
    isValidTransactionInput({ ...validInput, type: "INVALID" }),
    false,
  );
  assertEquals(isValidTransactionInput({ ...validInput, size: 0 }), false);
});

Deno.test("Bitcoin Transaction - isValidTransactionOutput", () => {
  const validOutput = {
    type: "P2PKH",
    value: 50000000,
    isWitness: false,
    size: 34,
  };

  assertEquals(isValidTransactionOutput(validOutput), true);

  // Invalid outputs
  assertEquals(isValidTransactionOutput({}), false);
  assertEquals(
    isValidTransactionOutput({ ...validOutput, type: "INVALID" }),
    false,
  );
  assertEquals(isValidTransactionOutput({ ...validOutput, value: -1 }), false);
});

// ============================================================================
// SRC-20 TOKEN VALIDATION TESTS
// ============================================================================

Deno.test("SRC-20 Token - isSRC20Operation", () => {
  assertEquals(isSRC20Operation("deploy"), true);
  assertEquals(isSRC20Operation("mint"), true);
  assertEquals(isSRC20Operation("transfer"), true);

  assertEquals(isSRC20Operation("invalid"), false);
  assertEquals(isSRC20Operation(""), false);
});

Deno.test("SRC-20 Token - isValidSRC20Ticker", () => {
  // Valid tickers
  assertEquals(isValidSRC20Ticker("BTC"), true);
  assertEquals(isValidSRC20Ticker("PEPE"), true);
  assertEquals(isValidSRC20Ticker("A"), true);
  assertEquals(isValidSRC20Ticker("TEST1"), true);

  // Invalid tickers
  assertEquals(isValidSRC20Ticker(""), false);
  assertEquals(isValidSRC20Ticker("TOOLONG"), false); // More than 5 chars
  assertEquals(isValidSRC20Ticker("BTC!"), false); // Special characters
  assertEquals(isValidSRC20Ticker("btc-test"), false); // Hyphens
});

Deno.test("SRC-20 Token - isValidSRC20Deploy", () => {
  const validDeploy = {
    op: "deploy",
    tick: "TEST",
    max: "21000000",
    lim: "1000",
    dec: "8",
  };

  assertEquals(isValidSRC20Deploy(validDeploy), true);

  // Minimal valid deploy
  const minimalDeploy = {
    op: "deploy",
    tick: "BTC",
    max: "1000",
  };
  assertEquals(isValidSRC20Deploy(minimalDeploy), true);

  // Invalid deploys
  assertEquals(isValidSRC20Deploy({}), false);
  assertEquals(isValidSRC20Deploy({ ...validDeploy, op: "mint" }), false);
  assertEquals(isValidSRC20Deploy({ ...validDeploy, tick: "TOOLONG" }), false);
  assertEquals(isValidSRC20Deploy({ ...validDeploy, max: "invalid" }), false);
});

Deno.test("SRC-20 Token - isValidSRC20Mint", () => {
  const validMint = {
    op: "mint",
    tick: "TEST",
    amt: "100",
  };

  assertEquals(isValidSRC20Mint(validMint), true);

  // Invalid mints
  assertEquals(isValidSRC20Mint({}), false);
  assertEquals(isValidSRC20Mint({ ...validMint, op: "deploy" }), false);
  assertEquals(isValidSRC20Mint({ ...validMint, tick: "TOOLONG" }), false);
  assertEquals(isValidSRC20Mint({ ...validMint, amt: "invalid" }), false);
});

Deno.test("SRC-20 Token - isValidSRC20Transfer", () => {
  const validTransfer = {
    op: "transfer",
    tick: "TEST",
    amt: "50",
  };

  assertEquals(isValidSRC20Transfer(validTransfer), true);

  // Invalid transfers
  assertEquals(isValidSRC20Transfer({}), false);
  assertEquals(isValidSRC20Transfer({ ...validTransfer, op: "mint" }), false);
  assertEquals(
    isValidSRC20Transfer({ ...validTransfer, tick: "TOOLONG" }),
    false,
  );
  assertEquals(
    isValidSRC20Transfer({ ...validTransfer, amt: "invalid" }),
    false,
  );
});

// ============================================================================
// SRC-101 NFT VALIDATION TESTS
// ============================================================================

Deno.test("SRC-101 NFT - isSRC101Operation", () => {
  assertEquals(isSRC101Operation("deploy"), true);
  assertEquals(isSRC101Operation("mint"), true);
  assertEquals(isSRC101Operation("transfer"), true);

  assertEquals(isSRC101Operation("invalid"), false);
});

Deno.test("SRC-101 NFT - isValidSRC101Slug", () => {
  // Valid slugs
  assertEquals(isValidSRC101Slug("my-collection"), true);
  assertEquals(isValidSRC101Slug("test123"), true);
  assertEquals(isValidSRC101Slug("a"), true);

  // Invalid slugs
  assertEquals(isValidSRC101Slug(""), false);
  assertEquals(isValidSRC101Slug("My-Collection"), false); // Uppercase
  assertEquals(isValidSRC101Slug("test_collection"), false); // Underscore
  assertEquals(isValidSRC101Slug("a".repeat(33)), false); // Too long
});

Deno.test("SRC-101 NFT - isValidSRC101Deploy", () => {
  const validDeploy = {
    op: "deploy",
    slug: "my-collection",
    name: "My NFT Collection",
    supply: "1000",
  };

  assertEquals(isValidSRC101Deploy(validDeploy), true);

  // Invalid deploys
  assertEquals(isValidSRC101Deploy({}), false);
  assertEquals(isValidSRC101Deploy({ ...validDeploy, op: "mint" }), false);
  assertEquals(
    isValidSRC101Deploy({ ...validDeploy, slug: "Invalid_Slug" }),
    false,
  );
  assertEquals(isValidSRC101Deploy({ ...validDeploy, name: "" }), false);
  assertEquals(
    isValidSRC101Deploy({ ...validDeploy, supply: "invalid" }),
    false,
  );
});

// ============================================================================
// STAMP PROTOCOL VALIDATION TESTS
// ============================================================================

Deno.test("Stamp Protocol - isValidStampClassification", () => {
  assertEquals(isValidStampClassification("cursed"), true);
  assertEquals(isValidStampClassification("classic"), true);
  assertEquals(isValidStampClassification("posh"), true);

  assertEquals(isValidStampClassification("blessed"), false);
  assertEquals(isValidStampClassification("invalid"), false);
  assertEquals(isValidStampClassification(""), false);
});

Deno.test("Stamp Protocol - isValidStampNumber", () => {
  assertEquals(isValidStampNumber(1), true);
  assertEquals(isValidStampNumber(12345), true);
  assertEquals(isValidStampNumber(null), true);

  assertEquals(isValidStampNumber(0), false);
  assertEquals(isValidStampNumber(-1), false);
  assertEquals(isValidStampNumber(1.5), false);
  assertEquals(isValidStampNumber("1"), false);
});

Deno.test("Stamp Protocol - isValidCPID", () => {
  // Valid CPIDs
  assertEquals(isValidCPID("A1234567890"), true);
  assertEquals(isValidCPID("BITCOIN"), true);
  assertEquals(isValidCPID("TEST.ASSET"), true);

  // Invalid CPIDs
  assertEquals(isValidCPID(""), false);
  assertEquals(isValidCPID("1BITCOIN"), false); // Must start with letter
  assertEquals(isValidCPID("a1234567890"), false); // Must be uppercase
});

Deno.test("Stamp Protocol - isValidBase64StampData", () => {
  // Valid base64 data
  assertEquals(isValidBase64StampData("SGVsbG8gV29ybGQ="), true); // "Hello World"
  assertEquals(isValidBase64StampData("dGVzdA=="), true); // "test"

  // Invalid base64 data
  assertEquals(isValidBase64StampData(""), false);
  assertEquals(isValidBase64StampData("invalid base64!"), false);
  assertEquals(isValidBase64StampData("SGVsbG8=invalid"), false);
});

Deno.test("Stamp Protocol - isValidStampMimeType", () => {
  // Valid MIME types
  assertEquals(isValidStampMimeType("image/jpeg"), true);
  assertEquals(isValidStampMimeType("image/png"), true);
  assertEquals(isValidStampMimeType("image/gif"), true);
  assertEquals(isValidStampMimeType("text/html"), true);

  // Invalid MIME types
  assertEquals(isValidStampMimeType(""), false);
  assertEquals(isValidStampMimeType("invalid/type"), false);
  assertEquals(isValidStampMimeType("video/mp4"), false); // Not allowed
});

Deno.test("Stamp Protocol - isValidStampRow", () => {
  const validStampRow = {
    stamp: 12345,
    cpid: "TESTSTAMP",
    ident: "STAMP",
    block_index: 800000,
    tx_hash: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
    creator: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    stamp_base64: "SGVsbG8gV29ybGQ=",
    stamp_mimetype: "image/png",
  };

  assertEquals(isValidStampRow(validStampRow), true);

  // Test with null stamp number
  const nullStampRow = { ...validStampRow, stamp: null };
  assertEquals(isValidStampRow(nullStampRow), true);

  // Invalid stamp rows
  assertEquals(isValidStampRow({}), false);
  assertEquals(isValidStampRow({ ...validStampRow, stamp: 0 }), false);
  assertEquals(isValidStampRow({ ...validStampRow, cpid: "invalid" }), false);
  assertEquals(
    isValidStampRow({ ...validStampRow, tx_hash: "invalid" }),
    false,
  );
});

// ============================================================================
// ADVANCED TYPE UTILITIES TESTS
// ============================================================================

Deno.test("Advanced Type Utilities - createTypeValidator", () => {
  interface TestType {
    id: number;
    name: string;
    active: boolean;
  }

  const validator = createTypeValidator<TestType>({
    id: (val): val is number => typeof val === "number" && val > 0,
    name: (val): val is string => typeof val === "string" && val.length > 0,
    active: (val): val is boolean => typeof val === "boolean",
  });

  // Valid object
  assertEquals(validator({ id: 1, name: "test", active: true }), true);

  // Invalid objects
  assertEquals(validator({}), false);
  assertEquals(validator({ id: 0, name: "test", active: true }), false);
  assertEquals(validator({ id: 1, name: "", active: true }), false);
  assertEquals(validator({ id: 1, name: "test", active: "yes" }), false);
});

Deno.test("Advanced Type Utilities - validateTypeQuick", () => {
  interface TestType {
    id: number;
    name: string;
    optional?: boolean;
  }

  const validObject = { id: 1, name: "test", optional: true };

  assertEquals(
    validateTypeQuick<TestType>(
      validObject,
      ["id", "name"],
      {
        id: (val) => typeof val === "number",
        name: (val) => typeof val === "string",
      },
    ),
    true,
  );

  // Missing required key
  assertEquals(
    validateTypeQuick<TestType>(
      { name: "test" },
      ["id", "name"],
      {},
    ),
    false,
  );

  // Failed type check
  assertEquals(
    validateTypeQuick<TestType>(
      { id: "invalid", name: "test" },
      ["id", "name"],
      { id: (val) => typeof val === "number" },
    ),
    false,
  );
});

Deno.test("Advanced Type Utilities - bitcoinAddressTypeTest", () => {
  // This mainly tests compile-time behavior, so we just verify it runs
  const result1 = bitcoinAddressTypeTest(
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "P2PKH",
  );
  assertEquals(result1, true);

  const result2 = bitcoinAddressTypeTest(
    "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    "P2PKH",
  );
  assertEquals(result2, false);
});
