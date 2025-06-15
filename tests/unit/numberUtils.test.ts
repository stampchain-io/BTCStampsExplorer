import { assert, assertEquals } from "@std/assert";
import { generateRandomNumber } from "$lib/utils/numberUtils.ts";

Deno.test("numberUtils - generateRandomNumber basic functionality", () => {
  // Test that the number is within range
  const min = 1;
  const max = 10;

  for (let i = 0; i < 100; i++) {
    const result = generateRandomNumber(min, max);
    assert(result >= min, `Result ${result} should be >= ${min}`);
    assert(result <= max, `Result ${result} should be <= ${max}`);
    assert(Number.isInteger(result), `Result ${result} should be an integer`);
  }
});

Deno.test("numberUtils - generateRandomNumber with same min and max", () => {
  const value = 5;
  const result = generateRandomNumber(value, value);
  assertEquals(result, value, "Should return the only possible value");
});

Deno.test("numberUtils - generateRandomNumber with negative numbers", () => {
  const min = -10;
  const max = -1;

  for (let i = 0; i < 50; i++) {
    const result = generateRandomNumber(min, max);
    assert(result >= min, `Result ${result} should be >= ${min}`);
    assert(result <= max, `Result ${result} should be <= ${max}`);
    assert(Number.isInteger(result), `Result ${result} should be an integer`);
  }
});

Deno.test("numberUtils - generateRandomNumber with mixed positive/negative", () => {
  const min = -5;
  const max = 5;

  const results = new Set<number>();
  // Generate many numbers to ensure we get some variety
  for (let i = 0; i < 100; i++) {
    const result = generateRandomNumber(min, max);
    assert(result >= min, `Result ${result} should be >= ${min}`);
    assert(result <= max, `Result ${result} should be <= ${max}`);
    results.add(result);
  }

  // With 100 iterations, we should get at least a few different values
  assert(results.size > 1, "Should generate different values");
});

Deno.test("numberUtils - generateRandomNumber with large range", () => {
  const min = 0;
  const max = 1000000;

  const results = new Set<number>();
  for (let i = 0; i < 10; i++) {
    const result = generateRandomNumber(min, max);
    assert(result >= min, `Result ${result} should be >= ${min}`);
    assert(result <= max, `Result ${result} should be <= ${max}`);
    results.add(result);
  }

  // With such a large range, getting duplicates in 10 tries is very unlikely
  assert(
    results.size > 5,
    "Should generate mostly unique values with large range",
  );
});

Deno.test("numberUtils - generateRandomNumber edge cases", () => {
  // Test with zero
  const result1 = generateRandomNumber(0, 0);
  assertEquals(result1, 0, "Should handle zero");

  // Test with max int values (within safe integer range)
  const min = Number.MIN_SAFE_INTEGER;
  const max = Number.MIN_SAFE_INTEGER + 1000;
  const result2 = generateRandomNumber(min, max);
  assert(
    result2 >= min && result2 <= max,
    "Should handle large negative numbers",
  );
});
