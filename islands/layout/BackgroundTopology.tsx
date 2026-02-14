/* ===== Animated background topology ===== */
/* References the static/background-topology.js file */

import { useEffect, useRef } from "preact/hooks";

interface BackgroundTopologyProps {
  className?: string;
}

declare global {
  var VANTA: {
    TOPOLOGY?: (options: any) => {
      destroy: () => void;
    };
  } | undefined;
  var p5: any;
  var THREE: any;
}

export default function BackgroundTopology(
  { className }: BackgroundTopologyProps,
) {
  const vantaRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const idleCallbackIdRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (vantaRef.current) {
      return;
    }

    const tryInitVanta = () => {
      // Check for all required dependencies
      if (!globalThis.THREE) {
        return false;
      }

      if (!globalThis.p5) {
        return false;
      }

      if (!globalThis.VANTA?.TOPOLOGY) {
        return false;
      }

      if (!containerRef.current) {
        return false;
      }

      // Prevent duplicate initialization
      if (vantaRef.current) {
        return true;
      }

      try {
        // All options are now hardcoded in the JS file
        vantaRef.current = globalThis.VANTA.TOPOLOGY({
          el: containerRef.current,
        });
        console.log("BackgroundTopology: Successfully initialized");
        return true;
      } catch (error) {
        console.error("BackgroundTopology: Failed to initialize:", error);
        return false;
      }
    };

    const deferredInit = () => {
      // Use requestIdleCallback to defer until browser is idle
      if (typeof globalThis.requestIdleCallback === "function") {
        idleCallbackIdRef.current = globalThis.requestIdleCallback(() => {
          tryInitVanta();
        });
      } else {
        // Fallback to IntersectionObserver for browsers without requestIdleCallback
        if (
          typeof IntersectionObserver !== "undefined" && containerRef.current
        ) {
          observerRef.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              tryInitVanta();
              // Disconnect after first intersection
              if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
              }
            }
          }, { threshold: 0.1 });

          observerRef.current.observe(containerRef.current);
        } else {
          // Last resort: small delay to ensure container is ready
          setTimeout(() => tryInitVanta(), 100);
        }
      }
    };

    // Event-based script loading detection
    const handleScriptsReady = () => {
      // Check if all dependencies are available
      if (globalThis.THREE && globalThis.p5 && globalThis.VANTA?.TOPOLOGY) {
        deferredInit();
      }
    };

    // Listen for custom event dispatched when all scripts are loaded
    globalThis.addEventListener("vanta-scripts-ready", handleScriptsReady);

    // Try immediate init in case scripts are already loaded (e.g., cached)
    if (globalThis.THREE && globalThis.p5 && globalThis.VANTA?.TOPOLOGY) {
      deferredInit();
    }

    return () => {
      // Cleanup event listener
      globalThis.removeEventListener("vanta-scripts-ready", handleScriptsReady);

      // Cancel idle callback if pending
      if (
        idleCallbackIdRef.current !== null &&
        typeof globalThis.cancelIdleCallback === "function"
      ) {
        globalThis.cancelIdleCallback(idleCallbackIdRef.current);
      }

      // Disconnect observer if active
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      // Destroy Vanta instance
      if (vantaRef.current) {
        vantaRef.current.destroy();
        vantaRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="vanta-background"
      class={`fixed inset-0 w-full h-full ${className || ""}`}
      style={{
        zIndex: 0,
        pointerEvents: "none",
        minHeight: "100vh",
        minWidth: "100vw",
      }}
    />
  );
}
