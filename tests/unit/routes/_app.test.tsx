/* ===== APP ROUTE SCRIPT LOADING COORDINATOR TESTS ===== */
/*
 * Tests for the async script loading coordinator in routes/_app.tsx.
 *
 * The coordinator manages the loading of 3 external scripts (three.js, p5.js,
 * background-topology.js) and dispatches a 'vanta-scripts-ready' event when
 * all scripts have loaded.
 *
 * Tests verify the coordinator pattern exists in the source without requiring
 * a DOM environment (compatible with Deno server runtime).
 */

import { assertEquals } from "@std/assert";

/* ===== PATH HELPERS ===== */
// Resolve paths relative to this test file so they work regardless of CWD
const resolve = (rel: string) =>
  new URL(rel, import.meta.url).pathname;

const APP_ROUTE = resolve("../../../routes/_app.tsx");

/* ===== SCRIPT LOADING COORDINATOR PATTERN TESTS ===== */

Deno.test({
  name: "Script coordinator - initializes state tracker",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must initialize the __vantaScripts state tracker
    assertEquals(
      source.includes("window.__vantaScripts"),
      true,
      "Must initialize window.__vantaScripts state tracker",
    );

    // Must initialize with all three script flags set to false
    assertEquals(
      source.includes("three: false"),
      true,
      "Must initialize three.js flag to false",
    );

    assertEquals(
      source.includes("p5: false"),
      true,
      "Must initialize p5.js flag to false",
    );

    assertEquals(
      source.includes("vanta: false"),
      true,
      "Must initialize vanta flag to false",
    );
  },
});

Deno.test({
  name: "Script coordinator - defines checkVantaReady function",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must define the checkVantaReady function
    assertEquals(
      source.includes("window.checkVantaReady"),
      true,
      "Must define window.checkVantaReady function",
    );

    // Must check all three script states
    assertEquals(
      source.includes("__vantaScripts.three") &&
        source.includes("__vantaScripts.p5") &&
        source.includes("__vantaScripts.vanta"),
      true,
      "checkVantaReady must check all three script states",
    );
  },
});

Deno.test({
  name: "Script coordinator - dispatches vanta-scripts-ready event",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must dispatch the custom event
    assertEquals(
      source.includes("vanta-scripts-ready"),
      true,
      "Must dispatch 'vanta-scripts-ready' CustomEvent",
    );

    // Must use CustomEvent constructor
    assertEquals(
      source.includes("new CustomEvent"),
      true,
      "Must create CustomEvent",
    );

    // Must dispatch via window
    assertEquals(
      source.includes("window.dispatchEvent"),
      true,
      "Must dispatch event via window.dispatchEvent",
    );
  },
});

/* ===== ASYNC SCRIPT LOADING TESTS ===== */

Deno.test({
  name: "Script loading - creates script elements with async attribute",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must create script elements dynamically
    assertEquals(
      source.includes("document.createElement('script')"),
      true,
      "Must create script elements dynamically",
    );

    // Must set async attribute
    assertEquals(
      source.includes("s.async = true"),
      true,
      "Must set async=true for dynamic script loading",
    );

    // Must append to document head
    assertEquals(
      source.includes("document.head.appendChild"),
      true,
      "Must append script elements to document.head",
    );
  },
});

Deno.test({
  name: "Script loading - loads three.js with correct URL and handler",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must reference three.js CDN URL
    assertEquals(
      source.includes("cdnjs.cloudflare.com/ajax/libs/three.js"),
      true,
      "Must load three.js from CDN",
    );

    // Must set three flag to true in onload
    assertEquals(
      source.includes("__vantaScripts.three = true"),
      true,
      "Must set three flag to true when loaded",
    );
  },
});

Deno.test({
  name: "Script loading - loads p5.js with correct URL and handler",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must reference p5.js CDN URL
    assertEquals(
      source.includes("cdnjs.cloudflare.com/ajax/libs/p5.js"),
      true,
      "Must load p5.js from CDN",
    );

    // Must set p5 flag to true in onload
    assertEquals(
      source.includes("__vantaScripts.p5 = true"),
      true,
      "Must set p5 flag to true when loaded",
    );
  },
});

Deno.test({
  name: "Script loading - loads background-topology.js with handler",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Must reference background-topology.js (local file)
    assertEquals(
      source.includes("/background-topology.js"),
      true,
      "Must load background-topology.js from local path",
    );

    // Must set vanta flag to true in onload
    assertEquals(
      source.includes("__vantaScripts.vanta = true"),
      true,
      "Must set vanta flag to true when loaded",
    );
  },
});

Deno.test({
  name: "Script loading - all scripts call checkVantaReady on load",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Extract all onload handlers
    const onloadPattern = /s\.onload\s*=\s*function\(\)\s*\{([^}]+)\}/g;
    const handlers = [];
    let match;

    while ((match = onloadPattern.exec(source)) !== null) {
      handlers.push(match[1]);
    }

    // Must have at least 3 onload handlers (one for each script)
    assertEquals(
      handlers.length >= 3,
      true,
      "Must have at least 3 onload handlers (three.js, p5.js, background-topology.js)",
    );

    // Each handler must call checkVantaReady
    for (const handler of handlers) {
      if (handler.includes("__vantaScripts")) {
        assertEquals(
          handler.includes("checkVantaReady()"),
          true,
          "Each script's onload handler must call checkVantaReady()",
        );
      }
    }
  },
});

/* ===== COMPLETE PATTERN VERIFICATION ===== */

Deno.test({
  name: "Script coordinator - complete pattern verification",
  fn: () => {
    const source = Deno.readTextFileSync(APP_ROUTE);

    // Verify the complete coordinator pattern exists:
    // 1. State initialization
    const hasStateInit = source.includes(
      "window.__vantaScripts = { three: false, p5: false, vanta: false }",
    );

    // 2. Ready check function
    const hasReadyCheck = source.includes("window.checkVantaReady");

    // 3. Event dispatch
    const hasEventDispatch = source.includes("vanta-scripts-ready");

    // 4. Dynamic script creation
    const hasScriptCreation = source.includes(
      "document.createElement('script')",
    );

    // 5. Async loading
    const hasAsyncAttribute = source.includes("s.async = true");

    // 6. All three scripts referenced
    const hasThreeJs = source.includes("three.js");
    const hasP5Js = source.includes("p5.js");
    const hasBackgroundTopology = source.includes("background-topology.js");

    // Assert all components are present
    assertEquals(hasStateInit, true, "Missing state initialization");
    assertEquals(hasReadyCheck, true, "Missing checkVantaReady function");
    assertEquals(hasEventDispatch, true, "Missing event dispatch");
    assertEquals(hasScriptCreation, true, "Missing dynamic script creation");
    assertEquals(hasAsyncAttribute, true, "Missing async attribute");
    assertEquals(hasThreeJs, true, "Missing three.js reference");
    assertEquals(hasP5Js, true, "Missing p5.js reference");
    assertEquals(
      hasBackgroundTopology,
      true,
      "Missing background-topology.js reference",
    );
  },
});
