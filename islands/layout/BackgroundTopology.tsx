import { useEffect, useRef } from "preact/hooks";

// Minimal interface since we're hardcoding values in the JS file
interface BackgroundTopologyProps {
  /** Optional className for additional styling */
  className?: string;
}

declare global {
  var VANTA: {
    TOPOLOGY?: (options: any) => {
      destroy: () => void;
    };
  } | undefined;
  var p5: any;
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
      if (globalThis.VANTA?.TOPOLOGY && containerRef.current) {
        try {
          // All options are now hardcoded in the JS file
          vantaRef.current = globalThis.VANTA.TOPOLOGY({
            el: containerRef.current,
          });
          return true;
        } catch (error) {
          console.error("BackgroundTopology: Failed to initialize:", error);
          return false;
        }
      }
      return false;
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
