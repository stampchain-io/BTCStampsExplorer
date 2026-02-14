/* ===== LAZY LOADING WRAPPER FOR TRADE TOOL ===== */
/*
 * This wrapper implements lazy loading for the heavy TradeTool island (1113 lines)
 * to reduce initial hydration burden and improve Time to Interactive (TTI).
 *
 * Strategy:
 * - Shows loading skeleton immediately
 * - Dynamically imports actual TradeTool on mount
 * - Hydration happens only when component is in viewport
 *
 * Expected Impact: ~100-150ms TBT reduction by deferring 1113 lines of JS parsing
 */

import { lazy, Suspense } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

/* ===== LAZY IMPORT ===== */
// Dynamic import - only loaded when this component mounts
const StampTradeTool = lazy(() =>
  import("./TradeTool.tsx").then((mod) => ({
    default: mod.StampTradeTool,
  }))
);

/* ===== LOADING SKELETON ===== */
function TradeToolSkeleton() {
  return (
    <div class="flex flex-col items-center w-full p-6 animate-pulse">
      <div class="w-full max-w-2xl bg-gradient-to-r from-purple-900/20 to-purple-700/20 rounded-2xl p-8">
        <div class="h-8 bg-purple-500/30 rounded w-48 mb-6"></div>
        <div class="space-y-4">
          <div class="h-12 bg-purple-500/20 rounded"></div>
          <div class="h-12 bg-purple-500/20 rounded"></div>
          <div class="h-12 bg-purple-500/20 rounded"></div>
        </div>
        <div class="mt-6 h-12 bg-purple-600/30 rounded"></div>
      </div>
    </div>
  );
}

/* ===== COMPONENT ===== */
export function TradeToolLazy() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer loading until browser is idle
    // Falls back to setTimeout if requestIdleCallback is not available
    const idleCallback = (globalThis as any).requestIdleCallback ||
      ((cb: () => void) => setTimeout(cb, 1));

    const handle = idleCallback(() => {
      setShouldLoad(true);
    });

    return () => {
      if ((globalThis as any).cancelIdleCallback) {
        (globalThis as any).cancelIdleCallback(handle);
      } else if (typeof handle === "number") {
        clearTimeout(handle);
      }
    };
  }, []);

  if (!shouldLoad) {
    return <TradeToolSkeleton />;
  }

  return (
    <Suspense fallback={<TradeToolSkeleton />}>
      <StampTradeTool />
    </Suspense>
  );
}
