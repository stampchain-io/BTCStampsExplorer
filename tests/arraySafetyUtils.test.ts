/**
 * Test suite for array safety utilities
 */

import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  conditionalRender,
  createSafeArrayUpdater,
  isSafeArray,
  safeArrayAt,
  safeArrayChunk,
  safeArrayFilter,
  safeArrayFind,
  safeArrayJoin,
  safeArrayRender,
  safePaginationSlice,
} from "$lib/utils/ui/rendering/arraySafetyUtils.ts";

Deno.test("safeArrayRender - should safely render arrays", () => {
  const items = [1, 2, 3];
  const renderItem = (item: number, index: number) => `Item ${item}`;

  const result = safeArrayRender(items, renderItem);
  assertEquals(result, ["Item 1", "Item 2", "Item 3"]);

  // Test with null array
  const nullResult = safeArrayRender(null, renderItem, "fallback");
  assertEquals(nullResult, "fallback");

  // Test with empty array
  const emptyResult = safeArrayRender([], renderItem);
  assertEquals(emptyResult, null);
});

Deno.test("safeArrayAt - should safely access array elements", () => {
  const arr = ["a", "b", "c", "d"];

  assertEquals(safeArrayAt(arr, 0), "a");
  assertEquals(safeArrayAt(arr, 2), "c");
  assertEquals(safeArrayAt(arr, -1), "d"); // Last element
  assertEquals(safeArrayAt(arr, -2), "c"); // Second to last
  assertEquals(safeArrayAt(arr, 10), undefined); // Out of bounds
  assertEquals(safeArrayAt(arr, -10), undefined); // Negative out of bounds

  assertEquals(safeArrayAt(null, 0), undefined);
  assertEquals(safeArrayAt(undefined, 0), undefined);
  assertEquals(safeArrayAt([], 0), undefined);
});

Deno.test("conditionalRender - should handle conditional rendering safely", () => {
  const renderTrue = () => "rendered";
  const renderFalse = () => "not rendered";

  assertEquals(conditionalRender(true, renderTrue), "rendered");
  assertEquals(conditionalRender(false, renderTrue), null);
  assertEquals(conditionalRender(false, renderTrue, "fallback"), "fallback");
  assertEquals(conditionalRender(null, renderTrue), null);
  assertEquals(conditionalRender(undefined, renderTrue), null);
  assertEquals(conditionalRender("truthy", renderTrue), "rendered");
  assertEquals(conditionalRender("", renderTrue), null);
});

Deno.test("safePaginationSlice - should safely slice arrays for pagination", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  assertEquals(safePaginationSlice(items, 1, 3), [1, 2, 3]);
  assertEquals(safePaginationSlice(items, 2, 3), [4, 5, 6]);
  assertEquals(safePaginationSlice(items, 4, 3), [10]);
  assertEquals(safePaginationSlice(items, 5, 3), []);

  assertEquals(safePaginationSlice(null, 1, 3), []);
  assertEquals(safePaginationSlice([], 1, 3), []);
});

Deno.test("safeArrayJoin - should safely join array elements", () => {
  const strings = ["a", "b", "c"];
  const numbers = [1, 2, 3];

  assertEquals(safeArrayJoin(strings), "a, b, c");
  assertEquals(safeArrayJoin(strings, " | "), "a | b | c");
  assertEquals(safeArrayJoin(numbers, "-", (n) => `#${n}`), "#1-#2-#3");

  assertEquals(safeArrayJoin(null), "");
  assertEquals(safeArrayJoin([]), "");
  assertEquals(safeArrayJoin(["", null, "test"]), "test"); // Filters out falsy values
});

Deno.test("safeArrayFilter - should safely filter arrays", () => {
  const numbers = [1, 2, 3, 4, 5];
  const evens = safeArrayFilter(numbers, (n) => n % 2 === 0);

  assertEquals(evens, [2, 4]);
  assertEquals(safeArrayFilter(null, (n) => true), []);
  assertEquals(safeArrayFilter([], (n) => true), []);
});

Deno.test("safeArrayFind - should safely find array elements", () => {
  const numbers = [1, 2, 3, 4, 5];

  assertEquals(safeArrayFind(numbers, (n) => n > 3), 4);
  assertEquals(safeArrayFind(numbers, (n) => n > 10), undefined);
  assertEquals(safeArrayFind(numbers, (n) => n > 10, 999), 999);

  assertEquals(safeArrayFind(null, (n) => true), undefined);
  assertEquals(safeArrayFind([], (n) => true, "fallback"), "fallback");
});

Deno.test("safeArrayChunk - should safely chunk arrays", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  assertEquals(safeArrayChunk(items, 3), [[1, 2, 3], [4, 5, 6], [7]]);
  assertEquals(safeArrayChunk(items, 1), [[1], [2], [3], [4], [5], [6], [7]]);
  assertEquals(safeArrayChunk(items, 10), [[1, 2, 3, 4, 5, 6, 7]]);

  assertEquals(safeArrayChunk(null, 3), []);
  assertEquals(safeArrayChunk([], 3), []);
  assertEquals(safeArrayChunk(items, 0), []);
  assertEquals(safeArrayChunk(items, -1), []);
});

Deno.test("isSafeArray - should correctly identify safe arrays", () => {
  assertEquals(isSafeArray([1, 2, 3]), true);
  assertEquals(isSafeArray([]), true);
  assertEquals(isSafeArray(new Array(5)), true);

  assertEquals(isSafeArray(null), false);
  assertEquals(isSafeArray(undefined), false);
  assertEquals(isSafeArray("not array"), false);
  assertEquals(isSafeArray({}), false);
});

Deno.test("createSafeArrayUpdater - should create safe array state updaters", () => {
  let state: number[] = [1, 2, 3];
  const setState = (newState: number[] | ((prev: number[]) => number[])) => {
    if (typeof newState === "function") {
      state = newState(state);
    } else {
      state = newState;
    }
  };
  const safeUpdater = createSafeArrayUpdater(setState);

  // Test function updater
  safeUpdater((prev) => [...prev, 4]);
  assertEquals(state, [1, 2, 3, 4]);

  // Test direct array updater
  safeUpdater([5, 6, 7]);
  assertEquals(state, [5, 6, 7]);

  // Test with invalid input (should handle gracefully)
  state = [1, 2];
  safeUpdater("invalid" as any);
  assertEquals(state, [1, 2]); // Should remain unchanged
});
