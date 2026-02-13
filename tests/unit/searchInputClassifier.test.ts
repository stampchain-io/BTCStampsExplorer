/**
 * Unit tests for the shared search input classifier.
 *
 * Covers: classifySearchInput, generateSearchErrorMessage
 */
import { assertEquals } from "@std/assert";
import {
  classifySearchInput,
  generateSearchErrorMessage,
} from "$lib/utils/data/search/searchInputClassifier.ts";

// ---------------------------------------------------------------------------
// classifySearchInput
// ---------------------------------------------------------------------------

Deno.test("classifySearchInput - CPID detection", () => {
  const result = classifySearchInput("A12345");
  assertEquals(result.type, "cpid");
  assertEquals(result.sanitized, "A12345");

  const lower = classifySearchInput("a123456");
  assertEquals(lower.type, "cpid");
  assertEquals(lower.sanitized, "A123456");
});

Deno.test("classifySearchInput - CPID needs 5+ digits", () => {
  // Only 4 digits -> not CPID
  const result = classifySearchInput("A1234");
  assertEquals(result.type !== "cpid", true);
});

Deno.test("classifySearchInput - stamp number detection", () => {
  assertEquals(classifySearchInput("123").type, "stamp_number");
  assertEquals(classifySearchInput("0").type, "stamp_number");
  assertEquals(classifySearchInput("-456").type, "stamp_number");
  assertEquals(
    classifySearchInput("-456").sanitized,
    "-456",
  );
});

Deno.test("classifySearchInput - tx hash detection", () => {
  const hash =
    "24832ae47e475303801fc47cbf08094f5d0f8eb6f255efa05ee2d93c422a52f4";
  const result = classifySearchInput(hash);
  assertEquals(result.type, "tx_hash");
  assertEquals(result.sanitized, hash.toLowerCase());
});

Deno.test("classifySearchInput - tx hash with uppercase", () => {
  const hash =
    "24832AE47E475303801FC47CBF08094F5D0F8EB6F255EFA05EE2D93C422A52F4";
  const result = classifySearchInput(hash);
  assertEquals(result.type, "tx_hash");
  assertEquals(result.sanitized, hash.toLowerCase());
});

Deno.test("classifySearchInput - bech32 address detection", () => {
  const addr = "bc1q7mlw0y0qe9dadg24q2225ded0myuxkw2wm8pzj";
  const result = classifySearchInput(addr);
  assertEquals(result.type, "address");
  assertEquals(result.sanitized, addr);
});

Deno.test("classifySearchInput - P2PKH address detection", () => {
  const addr = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
  const result = classifySearchInput(addr);
  assertEquals(result.type, "address");
});

Deno.test("classifySearchInput - ticker detection", () => {
  assertEquals(classifySearchInput("STAMP").type, "ticker");
  assertEquals(classifySearchInput("TEST").type, "ticker");
  assertEquals(classifySearchInput("BTC").type, "ticker");
  assertEquals(
    classifySearchInput("STAMP").sanitized,
    "STAMP",
  );
});

Deno.test("classifySearchInput - ticker sanitization strips special chars", () => {
  const result = classifySearchInput("TE$T");
  assertEquals(result.type, "ticker");
  assertEquals(result.sanitized, "TET");
});

Deno.test("classifySearchInput - handles leading/trailing spaces", () => {
  const result = classifySearchInput("  STAMP  ");
  assertEquals(result.type, "ticker");
  assertEquals(result.sanitized, "STAMP");
});

Deno.test("classifySearchInput - empty string returns unknown", () => {
  assertEquals(classifySearchInput("").type, "unknown");
  assertEquals(classifySearchInput("   ").type, "unknown");
});

Deno.test("classifySearchInput - special chars only returns unknown", () => {
  const result = classifySearchInput("@#$%^&*()");
  assertEquals(result.type, "unknown");
});

Deno.test("classifySearchInput - preserves original input", () => {
  const input = "  STAMP  ";
  const result = classifySearchInput(input);
  assertEquals(result.original, "STAMP");
});

Deno.test("classifySearchInput - long string not matching other types", () => {
  // 6+ characters that aren't hex or address format
  const result = classifySearchInput("LONGTOKEN");
  assertEquals(result.type, "unknown");
});

// ---------------------------------------------------------------------------
// generateSearchErrorMessage
// ---------------------------------------------------------------------------

Deno.test("generateSearchErrorMessage - stamp + cpid", () => {
  const msg = generateSearchErrorMessage("A12345", "stamp");
  assertEquals(msg.includes("NO STAMP FOUND"), true);
  assertEquals(msg.includes("CPID doesn't exist"), true);
  assertEquals(msg.includes("A12345"), true);
});

Deno.test("generateSearchErrorMessage - stamp + stamp number", () => {
  const msg = generateSearchErrorMessage("42", "stamp");
  assertEquals(msg.includes("NO STAMP FOUND"), true);
  assertEquals(msg.includes("stamp number doesn't exist"), true);
});

Deno.test("generateSearchErrorMessage - stamp + tx hash", () => {
  const hash =
    "24832ae47e475303801fc47cbf08094f5d0f8eb6f255efa05ee2d93c422a52f4";
  const msg = generateSearchErrorMessage(hash, "stamp");
  assertEquals(msg.includes("NO STAMP FOUND"), true);
  assertEquals(
    msg.includes("No stamp found for this transaction"),
    true,
  );
});

Deno.test("generateSearchErrorMessage - stamp + address", () => {
  const addr = "bc1q7mlw0y0qe9dadg24q2225ded0myuxkw2wm8pzj";
  const msg = generateSearchErrorMessage(addr, "stamp");
  assertEquals(msg.includes("NO STAMPS FOUND"), true);
  assertEquals(
    msg.includes("No stamps found for this address"),
    true,
  );
});

Deno.test("generateSearchErrorMessage - src20 + ticker", () => {
  const msg = generateSearchErrorMessage("STAMP", "src20");
  assertEquals(msg.includes("NO TOKEN FOUND"), true);
  assertEquals(
    msg.includes("ticker isn't recognized"),
    true,
  );
});

Deno.test("generateSearchErrorMessage - src20 + tx hash", () => {
  const hash =
    "24832ae47e475303801fc47cbf08094f5d0f8eb6f255efa05ee2d93c422a52f4";
  const msg = generateSearchErrorMessage(hash, "src20");
  assertEquals(msg.includes("NO TOKEN FOUND"), true);
  assertEquals(
    msg.includes("No token deploy found for this transaction"),
    true,
  );
});

Deno.test("generateSearchErrorMessage - src20 + address", () => {
  const addr = "bc1q7mlw0y0qe9dadg24q2225ded0myuxkw2wm8pzj";
  const msg = generateSearchErrorMessage(addr, "src20");
  assertEquals(msg.includes("NO TOKENS FOUND"), true);
  assertEquals(
    msg.includes("No token deploy found for this address"),
    true,
  );
});

Deno.test("generateSearchErrorMessage - unknown input", () => {
  const msg = generateSearchErrorMessage("@#$%", "stamp");
  assertEquals(msg.includes("NO RESULTS FOUND"), true);
});
