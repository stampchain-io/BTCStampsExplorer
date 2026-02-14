/* ===== LAZY LOADING ISLANDS TESTS ===== */
/*
 * Tests for lazy loading wrapper components that defer heavy island hydration
 * to improve Time to Interactive (TTI) and Total Blocking Time (TBT).
 *
 * Tested Components:
 * - StampingToolLazy (2389 lines)
 * - TradeToolLazy (1113 lines)
 */

import { assertEquals, assertExists } from "@std/assert";
import { render } from "@testing-library/preact";
import { StampingToolLazy } from "../../../islands/tool/stamp/StampingToolLazy.tsx";
import { TradeToolLazy } from "../../../islands/tool/stamp/TradeToolLazy.tsx";

/* ===== TEST UTILITIES ===== */

// Mock requestIdleCallback if not available
function setupIdleCallbackMock() {
  const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
  const originalCancelIdleCallback = (globalThis as any).cancelIdleCallback;

  const callbacks: Array<() => void> = [];
  let idCounter = 0;

  (globalThis as any).requestIdleCallback = (callback: () => void) => {
    const id = ++idCounter;
    callbacks.push(callback);
    // Execute immediately in tests for simplicity
    setTimeout(() => callback(), 0);
    return id;
  };

  (globalThis as any).cancelIdleCallback = (id: number) => {
    // No-op for tests
  };

  return () => {
    (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    (globalThis as any).cancelIdleCallback = originalCancelIdleCallback;
  };
}

/* ===== TESTS ===== */

Deno.test({
  name: "StampingToolLazy - renders skeleton on initial mount",
  fn: async () => {
    const cleanup = setupIdleCallbackMock();

    try {
      const { container } = render(<StampingToolLazy />);

      // Should render skeleton initially
      // StampingToolSkeleton has specific structure we can check for
      assertExists(container.querySelector(".animate-pulse"));

      cleanup();
    } catch (error) {
      cleanup();
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TradeToolLazy - renders skeleton on initial mount",
  fn: async () => {
    const cleanup = setupIdleCallbackMock();

    try {
      const { container } = render(<TradeToolLazy />);

      // Should render skeleton initially
      // TradeToolSkeleton has animate-pulse class
      assertExists(container.querySelector(".animate-pulse"));

      cleanup();
    } catch (error) {
      cleanup();
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "StampingToolLazy - defers loading using requestIdleCallback",
  fn: async () => {
    let idleCallbackCalled = false;
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;

    (globalThis as any).requestIdleCallback = (callback: () => void) => {
      idleCallbackCalled = true;
      // Don't execute the callback to test initial state
      return 1;
    };

    try {
      render(<StampingToolLazy />);

      // Verify that requestIdleCallback was called
      assertEquals(idleCallbackCalled, true);

      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    } catch (error) {
      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "TradeToolLazy - defers loading using requestIdleCallback",
  fn: async () => {
    let idleCallbackCalled = false;
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;

    (globalThis as any).requestIdleCallback = (callback: () => void) => {
      idleCallbackCalled = true;
      // Don't execute the callback to test initial state
      return 1;
    };

    try {
      render(<TradeToolLazy />);

      // Verify that requestIdleCallback was called
      assertEquals(idleCallbackCalled, true);

      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
    } catch (error) {
      (globalThis as any).requestIdleCallback = originalRequestIdleCallback;
      throw error;
    }
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "StampingToolLazy - falls back to setTimeout when requestIdleCallback unavailable",
  fn: async () => {
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
    delete (globalThis as any).requestIdleCallback;

    let setTimeoutCalled = false;
    const originalSetTimeout = globalThis.setTimeout;
    (globalThis as any).setTimeout = ((callback: () => void, delay?: number) => {
      setTimeoutCalled = true;
      return originalSetTimeout(callback, delay);
    }) as typeof setTimeout;

    try {
      render(<StampingToolLazy />);

      // Verify that setTimeout was used as fallback
      assertEquals(setTimeoutCalled, true);

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
  name: "TradeToolLazy - falls back to setTimeout when requestIdleCallback unavailable",
  fn: async () => {
    const originalRequestIdleCallback = (globalThis as any).requestIdleCallback;
    delete (globalThis as any).requestIdleCallback;

    let setTimeoutCalled = false;
    const originalSetTimeout = globalThis.setTimeout;
    (globalThis as any).setTimeout = ((callback: () => void, delay?: number) => {
      setTimeoutCalled = true;
      return originalSetTimeout(callback, delay);
    }) as typeof setTimeout;

    try {
      render(<TradeToolLazy />);

      // Verify that setTimeout was used as fallback
      assertEquals(setTimeoutCalled, true);

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
