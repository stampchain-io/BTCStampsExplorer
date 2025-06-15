import { assert, assertEquals } from "@std/assert";
import {
  getIdentifierType,
  isCpid,
  isStampHash,
  isStampNumber,
  isTxHash,
} from "$lib/utils/identifierUtils.ts";

Deno.test("identifierUtils - isStampNumber with valid numbers", () => {
  // Positive integers
  assert(isStampNumber(1), "Should accept positive integer");
  assert(isStampNumber(12345), "Should accept larger positive integer");
  assert(isStampNumber("42"), "Should accept string positive integer");

  // Negative integers (cursed stamps)
  assert(isStampNumber(-1), "Should accept negative integer");
  assert(isStampNumber(-99999), "Should accept larger negative integer");
  assert(isStampNumber("-123"), "Should accept string negative integer");

  // Zero
  assert(isStampNumber(0), "Should accept zero");
  assert(isStampNumber("0"), "Should accept string zero");
});

Deno.test("identifierUtils - isStampNumber with invalid values", () => {
  assert(!isStampNumber(1.5), "Should reject decimal number");
  assert(!isStampNumber("1.5"), "Should reject string decimal");
  assert(!isStampNumber("abc"), "Should reject non-numeric string");
  // Note: Empty string converts to 0, which is a valid integer
  assert(isStampNumber(""), "Empty string converts to 0");
  assert(!isStampNumber(null), "Should reject null");
  assert(!isStampNumber(undefined), "Should reject undefined");
  assert(!isStampNumber({}), "Should reject object");
  assert(!isStampNumber([]), "Should reject array");
  assert(!isStampNumber(NaN), "Should reject NaN");
  assert(!isStampNumber(Infinity), "Should reject Infinity");
});

Deno.test("identifierUtils - isTxHash with valid hashes", () => {
  const validHash = "a".repeat(64);
  assert(isTxHash(validHash), "Should accept 64 char lowercase hex");

  const validHashUpper = "A".repeat(64);
  assert(isTxHash(validHashUpper), "Should accept 64 char uppercase hex");

  const validHashMixed = "aBcDeF1234567890".repeat(4);
  assert(isTxHash(validHashMixed), "Should accept mixed case hex");

  const realTxHash =
    "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b";
  assert(isTxHash(realTxHash), "Should accept real transaction hash");
});

Deno.test("identifierUtils - isTxHash with invalid values", () => {
  assert(!isTxHash("a".repeat(63)), "Should reject too short");
  assert(!isTxHash("a".repeat(65)), "Should reject too long");
  assert(!isTxHash("g".repeat(64)), "Should reject non-hex characters");
  assert(!isTxHash(""), "Should reject empty string");
  assert(!isTxHash(null), "Should reject null");
  assert(!isTxHash(123), "Should reject number");
  assert(!isTxHash({}), "Should reject object");
});

Deno.test("identifierUtils - isStampHash with valid hashes", () => {
  assert(isStampHash("aBcDeFgHiJkL"), "Should accept 12 char mixed case");
  assert(
    isStampHash("aBcDeFgHiJkLmNoPqRsT"),
    "Should accept 20 char mixed case",
  );
  assert(
    isStampHash("aB1234567890123"),
    "Should accept alphanumeric with mixed case",
  );

  // Must have at least one lowercase and one uppercase
  assert(isStampHash("aAAAAAAAAAAAA"), "Should accept with one lowercase");
  assert(isStampHash("Aaaaaaaaaaaa"), "Should accept with one uppercase");
});

Deno.test("identifierUtils - isStampHash with invalid values", () => {
  assert(!isStampHash("aBcDeFgHiJk"), "Should reject too short (11 chars)");
  assert(
    !isStampHash("aBcDeFgHiJkLmNoPqRsTu"),
    "Should reject too long (21 chars)",
  );
  assert(!isStampHash("abcdefghijkl"), "Should reject all lowercase");
  assert(!isStampHash("ABCDEFGHIJKL"), "Should reject all uppercase");
  assert(!isStampHash("123456789012"), "Should reject all numeric");
  assert(!isStampHash("aBc-DeFgHiJk"), "Should reject special characters");
  assert(!isStampHash(""), "Should reject empty string");
  assert(!isStampHash(null), "Should reject null");
});

Deno.test("identifierUtils - isCpid with valid CPIDs", () => {
  // A-prefixed numeric CPIDs
  assert(
    isCpid("A" + (26n ** 12n + 1n).toString()),
    "Should accept minimum A-prefixed CPID",
  );
  // Use a number that's above the minimum threshold
  assert(
    isCpid("A95428956661682177"),
    "Should accept minimum valid A-prefixed numeric",
  );
  assert(
    isCpid("A99999999999999999"),
    "Should accept valid A-prefixed numeric",
  );

  // Alphabetic CPIDs
  assert(isCpid("B"), "Should accept single letter starting with B");
  assert(isCpid("Z"), "Should accept single letter Z");
  assert(isCpid("BABCDEFGHIJKL"), "Should accept 13 chars starting with B");
  assert(isCpid("ZZZZZZZZZZZZZ"), "Should accept 13 chars all Z");
  assert(isCpid("CPID"), "Should accept valid alphabetic CPID");
});

Deno.test("identifierUtils - isCpid with invalid values", () => {
  // Invalid A-prefixed
  assert(!isCpid("A"), "Should reject A without number");
  assert(!isCpid("A0"), "Should reject A with number below minimum");
  assert(!isCpid("Aabc"), "Should reject A with non-numeric");
  assert(
    !isCpid("A" + (2n ** 64n).toString()),
    "Should reject A-prefixed above max",
  );

  // Invalid alphabetic
  assert(!isCpid("A"), "Should reject single A");
  assert(!isCpid("BABCDEFGHIJKLM"), "Should reject too long (14 chars)");
  assert(!isCpid("bABC"), "Should reject lowercase");
  assert(!isCpid("1ABC"), "Should reject starting with number");
  assert(!isCpid(""), "Should reject empty string");
  assert(!isCpid(null), "Should reject null");
});

Deno.test("identifierUtils - getIdentifierType", () => {
  // Stamp numbers
  assertEquals(getIdentifierType(123), "stamp_number");
  assertEquals(getIdentifierType("-456"), "stamp_number");

  // TX hashes
  assertEquals(getIdentifierType("a".repeat(64)), "tx_hash");

  // Stamp hashes
  assertEquals(getIdentifierType("aBcDeFgHiJkL"), "stamp_hash");

  // CPIDs
  assertEquals(getIdentifierType("BITCOIN"), "cpid");
  assertEquals(getIdentifierType("A95428956661682177"), "cpid");

  // Invalid
  assertEquals(getIdentifierType("invalid"), "invalid");
  assertEquals(getIdentifierType(null), "invalid");
  assertEquals(getIdentifierType({}), "invalid");
  assertEquals(getIdentifierType([]), "invalid");
});

Deno.test("identifierUtils - getIdentifierType precedence", () => {
  // If something could match multiple types, check precedence
  // A 64-char hex string that's all numbers could be both stamp_number and tx_hash
  const allNumericHex =
    "1234567890123456789012345678901234567890123456789012345678901234";
  assertEquals(
    getIdentifierType(allNumericHex),
    "stamp_number",
    "Should prefer stamp_number over tx_hash",
  );
});
