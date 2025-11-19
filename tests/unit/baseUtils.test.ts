import {
  arraysEqual,
  base64_to_hex,
  base64ToBytes,
  base64ToHex,
  bin2hex,
  bufferToHex,
  bytesToBase64,
  bytesToHex,
  hex2bin,
  hex_to_base64,
  hexToBase64,
  hexToBuffer,
  hexToBytes,
} from "$lib/utils/data/binary/baseUtils.ts";
import { assert, assertEquals, assertThrows } from "@std/assert";

Deno.test("baseUtils - hexToBytes converts hex string to Uint8Array", () => {
  const hex = "48656c6c6f";
  const bytes = hexToBytes(hex);
  const expected = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

  assertEquals(bytes.length, expected.length);
  for (let i = 0; i < bytes.length; i++) {
    assertEquals(bytes[i], expected[i]);
  }
});

Deno.test("baseUtils - hexToBytes handles empty string", () => {
  const bytes = hexToBytes("");
  assertEquals(bytes.length, 0);
});

Deno.test("baseUtils - hexToBytes handles single byte", () => {
  const bytes = hexToBytes("ff");
  assertEquals(bytes.length, 1);
  assertEquals(bytes[0], 255);
});

Deno.test("baseUtils - hexToBytes handles uppercase hex", () => {
  const bytes = hexToBytes("ABCDEF");
  const expected = new Uint8Array([0xAB, 0xCD, 0xEF]);
  assert(arraysEqual(bytes, expected));
});

Deno.test("baseUtils - bytesToHex converts Uint8Array to hex string", () => {
  const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  const hex = bytesToHex(bytes);
  assertEquals(hex, "48656c6c6f");
});

Deno.test("baseUtils - bytesToHex handles empty array", () => {
  const bytes = new Uint8Array([]);
  const hex = bytesToHex(bytes);
  assertEquals(hex, "");
});

Deno.test("baseUtils - bytesToHex pads single digit hex values", () => {
  const bytes = new Uint8Array([5, 15, 255]);
  const hex = bytesToHex(bytes);
  assertEquals(hex, "050fff");
});

Deno.test("baseUtils - hexToBytes and bytesToHex are inverse operations", () => {
  const originalHex = "48656c6c6f576f726c64";
  const bytes = hexToBytes(originalHex);
  const resultHex = bytesToHex(bytes);
  assertEquals(resultHex, originalHex);
});

Deno.test("baseUtils - base64ToBytes converts base64 to Uint8Array", () => {
  const base64 = "SGVsbG8="; // "Hello"
  const bytes = base64ToBytes(base64);
  const expected = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  assert(arraysEqual(bytes, expected));
});

Deno.test("baseUtils - bytesToBase64 converts Uint8Array to base64", () => {
  const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
  const base64 = bytesToBase64(bytes);
  assertEquals(base64, "SGVsbG8=");
});

Deno.test("baseUtils - base64ToHex converts base64 to hex", () => {
  const base64 = "SGVsbG8="; // "Hello"
  const hex = base64ToHex(base64);
  assertEquals(hex, "48656c6c6f");
});

Deno.test("baseUtils - hexToBase64 converts hex to base64", () => {
  const hex = "48656c6c6f"; // "Hello"
  const base64 = hexToBase64(hex);
  assertEquals(base64, "SGVsbG8=");
});

Deno.test("baseUtils - hexToBase64 throws on empty string (CIP33 compatibility)", () => {
  assertThrows(
    () => hexToBase64(""),
    TypeError,
    "Cannot read properties of null",
  );
});

Deno.test("baseUtils - base64 round-trip conversion", () => {
  const originalBase64 = "SGVsbG8gV29ybGQ="; // "Hello World"
  const hex = base64ToHex(originalBase64);
  const backToBase64 = hexToBase64(hex);
  assertEquals(backToBase64, originalBase64);
});

Deno.test("baseUtils - arraysEqual compares Uint8Arrays correctly", () => {
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([1, 2, 3]);
  const c = new Uint8Array([1, 2, 4]);

  assert(arraysEqual(a, b));
  assert(!arraysEqual(a, c));
});

Deno.test("baseUtils - arraysEqual handles empty arrays", () => {
  const a = new Uint8Array([]);
  const b = new Uint8Array([]);
  assert(arraysEqual(a, b));
});

Deno.test("baseUtils - arraysEqual handles single element", () => {
  const a = new Uint8Array([42]);
  const b = new Uint8Array([42]);
  const c = new Uint8Array([43]);

  assert(arraysEqual(a, b));
  assert(!arraysEqual(a, c));
});

Deno.test("baseUtils - backward compatibility aliases work", () => {
  const hex = "48656c6c6f";
  const testBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

  // Test hexToBuffer alias
  assert(
    arraysEqual(hexToBuffer(hex), hexToBytes(hex)),
    "hexToBuffer should work like hexToBytes",
  );

  // Test bufferToHex alias
  assertEquals(
    bufferToHex(testBytes),
    bytesToHex(testBytes),
    "bufferToHex should work like bytesToHex",
  );

  // Test hex2bin alias
  const bytes3 = hex2bin(hex);
  assert(
    arraysEqual(hexToBytes(hex), bytes3),
    "hex2bin should work like hexToBytes",
  );

  // Test bin2hex alias
  assertEquals(
    bin2hex(testBytes),
    bytesToHex(testBytes),
    "bin2hex should work like bytesToHex",
  );

  // Test base64 aliases
  const base64 = "SGVsbG8=";
  assertEquals(
    base64_to_hex(base64),
    base64ToHex(base64),
    "base64_to_hex should work like base64ToHex",
  );

  assertEquals(
    hex_to_base64(hex),
    hexToBase64(hex),
    "hex_to_base64 should work like hexToBase64",
  );
});

Deno.test("baseUtils - handles odd-length hex strings", () => {
  // Regex matches pairs: "12", "34", "56", "7"
  const bytes = hexToBytes("1234567");
  assertEquals(bytes.length, 4); // Creates 4 bytes: [0x12, 0x34, 0x56, 0x07]
  assertEquals(bytes[0], 0x12);
  assertEquals(bytes[1], 0x34);
  assertEquals(bytes[2], 0x56);
  assertEquals(bytes[3], 0x07);
});
