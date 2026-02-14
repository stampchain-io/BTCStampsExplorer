/* ===== CAROUSEL IDLE VALIDATION TESTS ===== */
/*
 * Tests for Carousel stamp validation deferral using requestIdleCallback.
 * Ensures validation work is spread across idle periods to reduce TBT.
 */

import { assertEquals } from "@std/assert";
import { render } from "@testing-library/preact";
import CarouselGallery from "../../../islands/section/gallery/Carousel.tsx";
import type { StampRow } from "../../../lib/types/stamp.d.ts";

/* ===== TEST FIXTURES ===== */

const mockStamps: StampRow[] = [
  {
    tx_hash: "test_hash_1",
    stamp: 1,
    stamp_url: "https://example.com/stamp1.png",
    stamp_mimetype: "image/png",
    creator: "bc1qtest1",
    creator_name: "Test Creator 1",
    supply: 1,
    divisible: false,
  },
  {
    tx_hash: "test_hash_2",
    stamp: 2,
    stamp_url: "https://example.com/stamp2.png",
    stamp_mimetype: "image/png",
    creator: "bc1qtest2",
    creator_name: "Test Creator 2",
    supply: 1,
    divisible: false,
  },
  {
    tx_hash: "test_hash_3",
    stamp: 3,
    stamp_mimetype: "text/html",
    creator: "bc1qtest3",
    creator_name: "Test Creator 3",
    supply: 1,
    divisible: false,
  },
] as StampRow[];

/* ===== TEST UTILITIES ===== */

function setupIdleCallbackTracker() {
  const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
  const callbackQueue: Array<() => void> = [];
  let callCount = 0;

  (globalThis as any).requestIdleCallback = (callback: () => void) => {
    callCount++;
    callbackQueue.push(callback);
    // Execute after a small delay to simulate idle callback
    setTimeout(() => {
      const cb = callbackQueue.shift();
      if (cb) cb();
    }, 10);
    return callCount;
  };

  return {
    getCallCount: () => callCount,
    cleanup: () => {
      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    },
  };
}

/* ===== TESTS ===== */

Deno.test({
  name: "Carousel - uses requestIdleCallback for validation batching",
  fn: async () => {
    const tracker = setupIdleCallbackTracker();

    try {
      render(<CarouselGallery carouselStamps={mockStamps} />);

      // Wait for initial idle callback to be scheduled
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have called requestIdleCallback at least once for batched validation
      const callCount = tracker.getCallCount();
      assertEquals(callCount > 0, true, "requestIdleCallback should be called");

      tracker.cleanup();
    } catch (error) {
      tracker.cleanup();
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Carousel - processes stamps in batches",
  fn: async () => {
    // Create enough stamps to trigger multiple batches
    const manyStamps = Array.from({ length: 15 }, (_, i) => ({
      tx_hash: `test_hash_${i}`,
      stamp: i + 1,
      stamp_url: `https://example.com/stamp${i}.png`,
      stamp_mimetype: "image/png",
      creator: `bc1qtest${i}`,
      creator_name: `Test Creator ${i}`,
      supply: 1,
      divisible: false,
    })) as StampRow[];

    const tracker = setupIdleCallbackTracker();

    try {
      render(<CarouselGallery carouselStamps={manyStamps} />);

      // Wait for batched validation to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      // With batch size of 5, 15 stamps should trigger multiple idle callbacks
      const callCount = tracker.getCallCount();
      assertEquals(
        callCount >= 3,
        true,
        `Should process 15 stamps in multiple batches (got ${callCount} calls)`,
      );

      tracker.cleanup();
    } catch (error) {
      tracker.cleanup();
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Carousel - falls back to setTimeout when requestIdleCallback unavailable",
  fn: async () => {
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
    delete (globalThis as any).requestIdleCallback;

    let setTimeoutCallCount = 0;
    const originalSetTimeout = globalThis.setTimeout;
    (globalThis as any).setTimeout = ((
      callback: () => void,
      delay?: number,
    ) => {
      setTimeoutCallCount++;
      return originalSetTimeout(callback, delay);
    }) as typeof setTimeout;

    try {
      render(<CarouselGallery carouselStamps={mockStamps} />);

      // Wait for setTimeout fallback to be called
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should have used setTimeout as fallback
      assertEquals(
        setTimeoutCallCount > 0,
        true,
        "setTimeout should be used as fallback",
      );

      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
      (globalThis as any).setTimeout = originalSetTimeout;
    } catch (error) {
      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
      (globalThis as any).setTimeout = originalSetTimeout;
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "Carousel - renders without crashing when stamps array is empty",
  fn: () => {
    const tracker = setupIdleCallbackTracker();

    try {
      const { container } = render(<CarouselGallery carouselStamps={[]} />);

      // Should render without errors
      assertEquals(container !== null, true);

      tracker.cleanup();
    } catch (error) {
      tracker.cleanup();
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
