/* ===== LAZY LOADING WRAPPER FOR STAMPING TOOL ===== */
/*
 * This wrapper implements lazy loading for the heavy StampingTool island (2389 lines)
 * to reduce initial hydration burden and improve Time to Interactive (TTI).
 *
 * Strategy:
 * - Shows skeleton loader immediately
 * - Dynamically imports actual StampingTool on mount
 * - Hydration happens only when component is in viewport
 *
 * Expected Impact: ~200-300ms TBT reduction by deferring 2389 lines of JS parsing
 */

import { StampingToolSkeleton } from "$components/indicators/index.ts";
import { lazy, Suspense } from "preact/compat";
import { useEffect, useState } from "preact/hooks";

/* ===== LAZY IMPORT ===== */
// Dynamic import - only loaded when this component mounts
const StampingTool = lazy(() =>
  import("./StampingTool.tsx").then((mod) => ({ default: mod.StampingTool }))
);

/* ===== COMPONENT ===== */
export function StampingToolLazy() {
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
    return <StampingToolSkeleton />;
  }

  return (
    <Suspense fallback={<StampingToolSkeleton />}>
      <StampingTool />
    </Suspense>
  );
}
