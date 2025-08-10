import { useEffect, useRef } from "preact/hooks";

interface BackgroundHaloProps {
  /** Base color in hex format (e.g., 0x5c0d5c) */
  baseColor?: number;
  /** Background color in hex format (e.g., 0xe0116) */
  backgroundColor?: number;
  /** Minimum height for the effect */
  minHeight?: number;
  /** Minimum width for the effect */
  minWidth?: number;
  /** Amplitude factor for the effect */
  amplitudeFactor?: number;
  /** X offset for positioning */
  xOffset?: number;
  /** Y offset for positioning */
  yOffset?: number;
  /** Size of the halo effect */
  size?: number;
  /** Enable mouse controls */
  mouseControls?: boolean;
  /** Enable touch controls */
  touchControls?: boolean;
  /** Enable gyro controls */
  gyroControls?: boolean;
}

declare global {
  interface Window {
    VANTA?: {
      HALO: (options: any) => {
        destroy: () => void;
      };
    };
    THREE?: any;
  }
}

export default function BackgroundHalo({
  baseColor = 0x5c0d5c,
  backgroundColor = 0xe0116,
  minHeight = 200.00,
  minWidth = 200.00,
  amplitudeFactor = 2.50,
  xOffset = 0.50,
  yOffset = -0.31,
  size = 3.00,
  mouseControls = true,
  touchControls = true,
  gyroControls = false,
}: BackgroundHaloProps) {
  const vantaRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple check if already initialized
    if (vantaRef.current) {
      return;
    }

    let timeoutId: number;

    const tryInitVanta = () => {
      if (window.VANTA?.HALO && containerRef.current) {
        try {
          vantaRef.current = window.VANTA.HALO({
            el: containerRef.current,
            mouseControls,
            touchControls,
            gyroControls,
            minHeight,
            minWidth,
            baseColor,
            backgroundColor,
            amplitudeFactor,
            xOffset,
            yOffset,
            size,
          });
          return true;
        } catch (error) {
          console.error("BackgroundHalo: Failed to initialize:", error);
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
          "BackgroundHalo: Failed to initialize after maximum attempts",
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
        pointerEvents: "none", // Allow clicking through to content below
        minHeight: "100vh",
        minWidth: "100vw",
        // backgroundColor removed - Vanta effect will handle the background
      }}
    />
  );
}
