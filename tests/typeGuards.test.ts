/**
 * Test suite for type guard utilities
 */

import {
    isDefined,
    isNonEmptyArray,
    isNonEmptyString,
    isNotNull,
    isValidNumber,
    safeArrayAccess,
    safeNumberConvert,
    safeStringConvert
} from "$lib/utils/typeGuards.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("isDefined - should correctly identify defined values", () => {
  assertEquals(isDefined("hello"), true);
  assertEquals(isDefined(42), true);
  assertEquals(isDefined(0), true);
  assertEquals(isDefined(false), true);
  assertEquals(isDefined(""), true);
  assertEquals(isDefined([]), true);
  assertEquals(isDefined({}), true);

  assertEquals(isDefined(null), false);
  assertEquals(isDefined(undefined), false);
});

Deno.test("isNotNull - should correctly identify non-null values", () => {
  assertEquals(isNotNull("hello"), true);
  assertEquals(isNotNull(42), true);
  assertEquals(isNotNull(0), true);
  assertEquals(isNotNull(false), true);
  assertEquals(isNotNull(""), true);
  assertEquals(isNotNull([]), true);
  assertEquals(isNotNull({}), true);
  assertEquals(isNotNull(undefined), true);

  assertEquals(isNotNull(null), false);
});

Deno.test("isValidNumber - should correctly identify valid numbers", () => {
  assertEquals(isValidNumber(42), true);
  assertEquals(isValidNumber(0), true);
  assertEquals(isValidNumber(-1), true);
  assertEquals(isValidNumber(3.14), true);

  assertEquals(isValidNumber(NaN), false);
  assertEquals(isValidNumber(Infinity), false);
  assertEquals(isValidNumber(-Infinity), false);
  assertEquals(isValidNumber("42"), false);
  assertEquals(isValidNumber(null), false);
  assertEquals(isValidNumber(undefined), false);
});

Deno.test("isNonEmptyString - should correctly identify non-empty strings", () => {
  assertEquals(isNonEmptyString("hello"), true);
  assertEquals(isNonEmptyString("0"), true);
  assertEquals(isNonEmptyString("false"), true);

  assertEquals(isNonEmptyString(""), false);
  assertEquals(isNonEmptyString("   "), false);
  assertEquals(isNonEmptyString("\t\n"), false);
  assertEquals(isNonEmptyString(null), false);
  assertEquals(isNonEmptyString(undefined), false);
  assertEquals(isNonEmptyString(42), false);
});

Deno.test("safeArrayAccess - should safely access array elements", () => {
  const arr = ["a", "b", "c"];

  assertEquals(safeArrayAccess(arr, 0), "a");
  assertEquals(safeArrayAccess(arr, 1), "b");
  assertEquals(safeArrayAccess(arr, 2), "c");
  assertEquals(safeArrayAccess(arr, 3), undefined);
  assertEquals(safeArrayAccess(arr, -1), undefined);

  assertEquals(safeArrayAccess(null, 0), undefined);
  assertEquals(safeArrayAccess(undefined, 0), undefined);
  assertEquals(safeArrayAccess([], 0), undefined);

  assertEquals(safeArrayAccess(arr, 3, "default"), "default");
});

Deno.test("safeNumberConvert - should safely convert values to numbers", () => {
  assertEquals(safeNumberConvert(42), 42);
  assertEquals(safeNumberConvert("42"), 42);
  assertEquals(safeNumberConvert("3.14"), 3.14);
  assertEquals(safeNumberConvert("0"), 0);

  assertEquals(safeNumberConvert("invalid", 10), 10);
  assertEquals(safeNumberConvert(null, 5), 5);
  assertEquals(safeNumberConvert(undefined, 7), 7);
  assertEquals(safeNumberConvert(true, 3), 3);

  assertEquals(safeNumberConvert("invalid"), 0);
  assertEquals(safeNumberConvert(null), 0);
});

Deno.test("safeStringConvert - should safely convert values to strings", () => {
  assertEquals(safeStringConvert("hello"), "hello");
  assertEquals(safeStringConvert(42), "42");
  assertEquals(safeStringConvert(true), "true");
  assertEquals(safeStringConvert(false), "false");

  assertEquals(safeStringConvert(null), "");
  assertEquals(safeStringConvert(undefined), "");
  assertEquals(safeStringConvert(null, "default"), "default");
  assertEquals(safeStringConvert(undefined, "fallback"), "fallback");
});

Deno.test("isNonEmptyArray - should correctly identify non-empty arrays", () => {
  assertEquals(isNonEmptyArray([1, 2, 3]), true);
  assertEquals(isNonEmptyArray(["a"]), true);
  assertEquals(isNonEmptyArray([null]), true);

  assertEquals(isNonEmptyArray([]), false);
  assertEquals(isNonEmptyArray(null), false);
  assertEquals(isNonEmptyArray(undefined), false);
  assertEquals(isNonEmptyArray("not array"), false);
  assertEquals(isNonEmptyArray({}), false);
});
