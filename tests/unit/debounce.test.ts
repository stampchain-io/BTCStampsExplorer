import { assertEquals } from "@std/assert";
import { debounce } from "$lib/utils/debounce.ts";
import { delay } from "@std/async/delay";

Deno.test("debounce - delays function execution", async () => {
  let callCount = 0;
  const testFn = () => {
    callCount++;
  };

  const debouncedFn = debounce(testFn, 50);

  // Call multiple times rapidly
  debouncedFn();
  debouncedFn();
  debouncedFn();

  // Should not have been called yet
  assertEquals(callCount, 0, "Function should not be called immediately");

  // Wait for debounce delay
  await delay(60);

  // Should have been called once
  assertEquals(callCount, 1, "Function should be called once after delay");
});

Deno.test("debounce - resets timer on subsequent calls", async () => {
  let callCount = 0;
  const testFn = () => {
    callCount++;
  };

  const debouncedFn = debounce(testFn, 50);

  debouncedFn();
  await delay(30); // Wait less than debounce time
  debouncedFn(); // This should reset the timer
  await delay(30); // Total 60ms, but timer was reset

  // Should not have been called yet
  assertEquals(
    callCount,
    0,
    "Function should not be called when timer is reset",
  );

  await delay(30); // Now total 90ms, 60ms since last call

  // Should have been called once
  assertEquals(callCount, 1, "Function should be called once after full delay");
});

Deno.test("debounce - passes arguments correctly", async () => {
  let receivedArgs: any[] = [];
  const testFn = (...args: any[]) => {
    receivedArgs = args;
  };

  const debouncedFn = debounce(testFn, 50);

  debouncedFn(1, "test", { value: 42 });

  await delay(60);

  assertEquals(
    receivedArgs,
    [1, "test", { value: 42 }],
    "Should pass all arguments",
  );
});

Deno.test("debounce - cancel prevents execution", async () => {
  let callCount = 0;
  const testFn = () => {
    callCount++;
  };

  const debouncedFn = debounce(testFn, 50);

  debouncedFn();
  debouncedFn.cancel();

  await delay(60);

  assertEquals(callCount, 0, "Function should not be called after cancel");
});

Deno.test("debounce - multiple cancel calls are safe", () => {
  const testFn = () => {};
  const debouncedFn = debounce(testFn, 50);

  // Should not throw
  debouncedFn.cancel();
  debouncedFn.cancel();
  debouncedFn.cancel();
});

Deno.test("debounce - works with different wait times", async () => {
  let callCount = 0;
  const testFn = () => {
    callCount++;
  };

  const shortDebounce = debounce(testFn, 10);
  const longDebounce = debounce(testFn, 100);

  shortDebounce();
  longDebounce();

  await delay(20);
  assertEquals(callCount, 1, "Short debounce should have fired");

  await delay(90);
  assertEquals(callCount, 2, "Long debounce should have fired");
});

Deno.test("debounce - preserves function context", async () => {
  const obj = {
    value: 42,
    getValue: function () {
      return this.value;
    },
  };

  let result: any;
  const captureResult = function (this: any) {
    result = this.getValue();
  };

  const debouncedFn = debounce(captureResult.bind(obj), 50);
  debouncedFn();

  await delay(60);

  assertEquals(result, 42, "Should preserve 'this' context");
});
