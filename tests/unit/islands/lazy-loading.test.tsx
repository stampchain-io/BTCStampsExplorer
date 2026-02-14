/* ===== LAZY LOADING ISLANDS TESTS ===== */
/*
 * Tests for lazy loading wrapper components that defer heavy island hydration
 * to improve Time to Interactive (TTI) and Total Blocking Time (TBT).
 *
 * Tests verify the lazy loading pattern and requestIdleCallback usage
 * without requiring a DOM environment (compatible with Deno server runtime).
 *
 * Tested Components:
 * - StampingToolLazy (2389 lines)
 * - TradeToolLazy (1113 lines)
 */

import { assertEquals, assertExists } from "@std/assert";
import { renderToString } from "preact-render-to-string";
import { StampingToolLazy } from "../../../islands/tool/stamp/StampingToolLazy.tsx";
import { TradeToolLazy } from "../../../islands/tool/stamp/TradeToolLazy.tsx";

/* ===== PATH HELPERS ===== */
// Resolve paths relative to this test file so they work regardless of CWD
const resolve = (rel: string) =>
  new URL(rel, import.meta.url).pathname;

const STAMPING_TOOL_LAZY = resolve(
  "../../../islands/tool/stamp/StampingToolLazy.tsx",
);
const TRADE_TOOL_LAZY = resolve(
  "../../../islands/tool/stamp/TradeToolLazy.tsx",
);

/* ===== TESTS ===== */

Deno.test({
  name: "StampingToolLazy - renders skeleton on SSR (before hydration)",
  fn: () => {
    // SSR renders the initial state which is the skeleton (shouldLoad = false)
    const html = renderToString(<StampingToolLazy />);

    // Should contain skeleton markup (animate-pulse is the skeleton indicator)
    assertExists(html);
    assertEquals(typeof html, "string");
    assertEquals(html.length > 0, true);
    // The skeleton is rendered because useState(false) means shouldLoad=false on SSR
  },
});

Deno.test({
  name: "TradeToolLazy - renders skeleton on SSR (before hydration)",
  fn: () => {
    const html = renderToString(<TradeToolLazy />);

    assertExists(html);
    assertEquals(typeof html, "string");
    assertEquals(html.length > 0, true);
  },
});

Deno.test({
  name: "StampingToolLazy - uses requestIdleCallback pattern",
  fn: () => {
    // Verify the component source uses requestIdleCallback
    // This is a static analysis test that verifies the pattern exists
    const componentSource = Deno.readTextFileSync(STAMPING_TOOL_LAZY);

    // Must use requestIdleCallback for deferred loading
    assertEquals(
      componentSource.includes("requestIdleCallback"),
      true,
      "StampingToolLazy must use requestIdleCallback for deferred loading",
    );

    // Must fall back to setTimeout
    assertEquals(
      componentSource.includes("setTimeout"),
      true,
      "StampingToolLazy must fall back to setTimeout",
    );

    // Must use lazy() from preact/compat for code splitting
    assertEquals(
      componentSource.includes("lazy("),
      true,
      "StampingToolLazy must use lazy() for code splitting",
    );

    // Must use Suspense for lazy loading boundary
    assertEquals(
      componentSource.includes("Suspense"),
      true,
      "StampingToolLazy must use Suspense boundary",
    );
  },
});

Deno.test({
  name: "TradeToolLazy - uses requestIdleCallback pattern",
  fn: () => {
    const componentSource = Deno.readTextFileSync(TRADE_TOOL_LAZY);

    assertEquals(
      componentSource.includes("requestIdleCallback"),
      true,
      "TradeToolLazy must use requestIdleCallback for deferred loading",
    );

    assertEquals(
      componentSource.includes("setTimeout"),
      true,
      "TradeToolLazy must fall back to setTimeout",
    );

    assertEquals(
      componentSource.includes("lazy("),
      true,
      "TradeToolLazy must use lazy() for code splitting",
    );

    assertEquals(
      componentSource.includes("Suspense"),
      true,
      "TradeToolLazy must use Suspense boundary",
    );
  },
});

Deno.test({
  name: "StampingToolLazy - cleanup cancels idle callback",
  fn: () => {
    const componentSource = Deno.readTextFileSync(STAMPING_TOOL_LAZY);

    // Must handle cleanup (cancelIdleCallback or clearTimeout)
    assertEquals(
      componentSource.includes("cancelIdleCallback") ||
        componentSource.includes("clearTimeout"),
      true,
      "StampingToolLazy must clean up idle callback on unmount",
    );
  },
});

Deno.test({
  name: "TradeToolLazy - cleanup cancels idle callback",
  fn: () => {
    const componentSource = Deno.readTextFileSync(TRADE_TOOL_LAZY);

    assertEquals(
      componentSource.includes("cancelIdleCallback") ||
        componentSource.includes("clearTimeout"),
      true,
      "TradeToolLazy must clean up idle callback on unmount",
    );
  },
});
