import { useEffect, useRef } from "preact/hooks";

interface BackgroundTopologyProps {
  /** Color in hex format (e.g., 0xcc1fde) */
  color?: number;
  /** Background color in hex format (e.g., 0x220022) */
  backgroundColor?: number;
  /** Minimum height for the effect */
  minHeight?: number;
  /** Minimum width for the effect */
  minWidth?: number;
  /** Scale factor */
  scale?: number;
  /** Scale factor for mobile */
  scaleMobile?: number;
  /** Enable mouse controls */
  mouseControls?: boolean;
  /** Enable touch controls */
  touchControls?: boolean;
  /** Enable gyro controls */
  gyroControls?: boolean;
}

declare global {
  interface Window {
    VANTA?: any;
    p5?: any;
  }
}

export default function BackgroundTopology({
  color = 0x3b0056,
  backgroundColor = 0x000000,
  minHeight = 200.00,
  minWidth = 200.00,
  scale = 1.00,
  scaleMobile = 1.00,
  mouseControls = false,
  touchControls = false,
  gyroControls = false,
}: BackgroundTopologyProps) {
  const vantaRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple check if already initialized
    if (vantaRef.current) {
      return;
    }

    let timeoutId: number;

    const tryInitVanta = () => {
      if (window.VANTA?.TOPOLOGY && containerRef.current) {
        try {
          vantaRef.current = window.VANTA.TOPOLOGY({
            el: containerRef.current,
            mouseControls,
            touchControls,
            gyroControls,
            minHeight,
            minWidth,
            scale,
            scaleMobile,
            color,
            backgroundColor,
          });
          return true;
        } catch (error) {
          console.error("BackgroundTopology: Failed to initialize:", error);
          return false;
        }
      }
      return false;
    };

    // Try to initialize immediately if scripts are already loaded
    if (tryInitVanta()) {
      return;
    }

    // If not available, set up polling to check periodically
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

    // Cleanup
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
      class="fixed inset-0 w-full h-full"
      style={{
        zIndex: 0,
        pointerEvents: "none",
        minHeight: "100vh",
        minWidth: "100vw",
      }}
    />
  );
}
