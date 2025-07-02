import { assert, assertEquals } from "@std/assert";
import {
  arraysEqual,
  bin2hex,
  bufferToHex,
  bytesToHex,
  hex2bin,
  hexToBuffer,
  hexToBytes,
} from "$lib/utils/binary/baseUtils.ts";

Deno.test("baseUtils - hexToBytes converts hex string to Uint8Array", () => {
  const hex = "48656c6c6f";
  const bytes = hexToBytes(hex);

  assertEquals(bytes.length, 5, "Should have 5 bytes");
  assertEquals(bytes[0], 0x48, "First byte should be H");
  assertEquals(bytes[1], 0x65, "Second byte should be e");
  assertEquals(bytes[2], 0x6c, "Third byte should be l");
  assertEquals(bytes[3], 0x6c, "Fourth byte should be l");
  assertEquals(bytes[4], 0x6f, "Fifth byte should be o");
});

Deno.test("baseUtils - hexToBytes handles empty string", () => {
  const bytes = hexToBytes("");
  assertEquals(bytes.length, 0, "Empty hex should produce empty array");
});

Deno.test("baseUtils - hexToBytes handles single byte", () => {
  const bytes = hexToBytes("ff");
  assertEquals(bytes.length, 1, "Should have 1 byte");
  assertEquals(bytes[0], 255, "Should be 255");
});

Deno.test("baseUtils - hexToBytes handles uppercase hex", () => {
  const bytes = hexToBytes("ABCDEF");
  assertEquals(bytes.length, 3, "Should have 3 bytes");
  assertEquals(bytes[0], 0xAB, "First byte");
  assertEquals(bytes[1], 0xCD, "Second byte");
  assertEquals(bytes[2], 0xEF, "Third byte");
});

Deno.test("baseUtils - bytesToHex converts Uint8Array to hex string", () => {
  const bytes = new Uint8Array([72, 101, 108, 108, 111]);
  const hex = bytesToHex(bytes);

  assertEquals(hex, "48656c6c6f", "Should convert to 'Hello' in hex");
});

Deno.test("baseUtils - bytesToHex handles empty array", () => {
  const bytes = new Uint8Array([]);
  const hex = bytesToHex(bytes);

  assertEquals(hex, "", "Empty array should produce empty string");
});

Deno.test("baseUtils - bytesToHex pads single digit hex values", () => {
  const bytes = new Uint8Array([1, 15, 16, 255]);
  const hex = bytesToHex(bytes);

  assertEquals(hex, "010f10ff", "Should pad single digit hex values with 0");
});

Deno.test("baseUtils - hexToBytes and bytesToHex are inverse operations", () => {
  const originalHex = "0123456789abcdef";
  const bytes = hexToBytes(originalHex);
  const resultHex = bytesToHex(bytes);

  assertEquals(resultHex, originalHex, "Should get back original hex");
});

Deno.test("baseUtils - arraysEqual compares Uint8Arrays correctly", () => {
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([1, 2, 3]);
  const c = new Uint8Array([1, 2, 4]);
  const d = new Uint8Array([1, 2]);

  assert(arraysEqual(a, b), "Identical arrays should be equal");
  assert(!arraysEqual(a, c), "Different values should not be equal");
  assert(!arraysEqual(a, d), "Different lengths should not be equal");
});

Deno.test("baseUtils - arraysEqual handles empty arrays", () => {
  const a = new Uint8Array([]);
  const b = new Uint8Array([]);
  const c = new Uint8Array([1]);

  assert(arraysEqual(a, b), "Empty arrays should be equal");
  assert(!arraysEqual(a, c), "Empty vs non-empty should not be equal");
});

Deno.test("baseUtils - arraysEqual handles single element", () => {
  const a = new Uint8Array([42]);
  const b = new Uint8Array([42]);
  const c = new Uint8Array([43]);

  assert(arraysEqual(a, b), "Same single element should be equal");
  assert(!arraysEqual(a, c), "Different single element should not be equal");
});

Deno.test("baseUtils - backward compatibility aliases work", () => {
  // Test hexToBuffer alias
  const hex = "deadbeef";
  const bytes1 = hexToBytes(hex);
  const bytes2 = hexToBuffer(hex);
  assert(
    arraysEqual(bytes1, bytes2),
    "hexToBuffer should work like hexToBytes",
  );

  // Test bufferToHex alias
  const testBytes = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
  assertEquals(
    bufferToHex(testBytes),
    bytesToHex(testBytes),
    "bufferToHex should work like bytesToHex",
  );

  // Test hex2bin alias
  const bytes3 = hex2bin(hex);
  assert(arraysEqual(bytes1, bytes3), "hex2bin should work like hexToBytes");

  // Test bin2hex alias
  assertEquals(
    bin2hex(testBytes),
    bytesToHex(testBytes),
    "bin2hex should work like bytesToHex",
  );
});

Deno.test("baseUtils - handles odd-length hex strings", () => {
  // Note: The current implementation converts odd-length hex strings
  // by treating single characters as valid hex digits
  const hex = "abc"; // Odd length
  const bytes = hexToBytes(hex);

  // The regex matches "ab" and "c" separately
  assertEquals(bytes.length, 2, "Should convert both pairs and single chars");
  assertEquals(bytes[0], 0xab, "Should convert 'ab' to 171");
  assertEquals(bytes[1], 0x0c, "Should convert 'c' to 12");
});
