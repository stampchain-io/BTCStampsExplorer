import { useEffect } from "preact/hooks";
import { initializePageVisibilityManager } from "$lib/hooks/usePageVisibility.ts";

/**
 * Global Page Visibility Manager Island
 * Initializes page visibility detection for animation performance optimization
 * This runs on the client side to manage CSS animation states globally
 */
export default function PageVisibilityManager() {
  useEffect(() => {
    // Initialize global page visibility manager
    const cleanup = initializePageVisibilityManager();

    // Return cleanup function
    return cleanup;
  }, []);

  // This component doesn't render anything visible
  return null;
}
