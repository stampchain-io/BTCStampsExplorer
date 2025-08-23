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

  useEffect(() => {
    if (vantaRef.current) {
      return;
    }

    let timeoutId: number;

    const tryInitVanta = () => {
      // Check for all required dependencies
      if (!globalThis.THREE) {
        console.warn("BackgroundTopology: THREE.js not loaded yet");
        return false;
      }

      if (!globalThis.p5) {
        console.warn("BackgroundTopology: p5.js not loaded yet");
        return false;
      }

      if (!globalThis.VANTA?.TOPOLOGY) {
        console.warn("BackgroundTopology: VANTA.TOPOLOGY not available yet");
        return false;
      }

      if (!containerRef.current) {
        console.warn("BackgroundTopology: Container ref not ready");
        return false;
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

    if (tryInitVanta()) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const pollForDependencies = () => {
      attempts++;
      if (tryInitVanta()) {
        return;
      }
      if (attempts < maxAttempts) {
        timeoutId = setTimeout(pollForDependencies, 100);
      } else {
        console.error(
          "BackgroundTopology: Failed to initialize after maximum attempts",
        );
      }
    };

    timeoutId = setTimeout(pollForDependencies, 100);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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
