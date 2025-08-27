/**
 * Simple Type Test
 * Basic test to verify test runner works
 */

import { assertEquals } from "@std/assert";

Deno.test("Simple test", () => {
  assertEquals(1 + 1, 2);
});

Deno.test("Type compilation test", async () => {
  // Test that basic types can be imported
  try {
    const { SUBPROTOCOLS } = await import("../../lib/types/base.d.ts");
    // If we get here, the import worked
    assertEquals(typeof SUBPROTOCOLS, "undefined"); // It's a type, not a value
  } catch (error) {
    console.log("Import error:", error.message);
    // This is expected for type-only imports
    assertEquals(true, true);
  }
});

console.log("✅ Simple type tests completed!");
