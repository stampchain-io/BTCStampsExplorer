/* ===== ANIMATION CONTROLS MANAGER ===== */
import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import AnimationManager from "$lib/hooks/useAnimationControls.ts";

/* ===== COMPONENT ===== */
export default function AnimationControlsManager() {
  useEffect(() => {
    if (!IS_BROWSER) return;

    // Initialize the global animation manager
    const manager = AnimationManager.getInstance();

    // Cleanup on unmount
    return () => {
      manager.cleanup();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
