import { assert, assertEquals } from "@std/assert";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";

Deno.test("protocol - PROTOCOL_IDENTIFIERS contains expected values", () => {
  assertEquals(
    PROTOCOL_IDENTIFIERS.length,
    3,
    "Should have 3 protocol identifiers",
  );
  assert(PROTOCOL_IDENTIFIERS.includes("STAMP"), "Should include STAMP");
  assert(PROTOCOL_IDENTIFIERS.includes("SRC-20"), "Should include SRC-20");
  assert(PROTOCOL_IDENTIFIERS.includes("SRC-721"), "Should include SRC-721");
});

Deno.test("protocol - PROTOCOL_IDENTIFIERS structure", () => {
  // Test that it's an array
  assert(Array.isArray(PROTOCOL_IDENTIFIERS), "Should be an array");

  // Test that all elements are strings
  for (const protocol of PROTOCOL_IDENTIFIERS) {
    assertEquals(typeof protocol, "string", "All elements should be strings");
  }

  // Note: The array is not frozen/immutable by default in the implementation
  // This test documents the current behavior
});

Deno.test("protocol - PROTOCOL_IDENTIFIERS order", () => {
  assertEquals(
    PROTOCOL_IDENTIFIERS[0],
    "STAMP",
    "First element should be STAMP",
  );
  assertEquals(
    PROTOCOL_IDENTIFIERS[1],
    "SRC-20",
    "Second element should be SRC-20",
  );
  assertEquals(
    PROTOCOL_IDENTIFIERS[2],
    "SRC-721",
    "Third element should be SRC-721",
  );
});
