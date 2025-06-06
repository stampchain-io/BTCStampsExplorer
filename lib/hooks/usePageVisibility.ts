import { useEffect, useState } from "preact/hooks";

/**
 * Custom hook to track page visibility state using the Page Visibility API
 * Used for performance optimization to pause animations when tab is inactive
 */
export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === "undefined" || !document.visibilityState) {
      return;
    }

    // Set initial state
    setIsVisible(document.visibilityState === "visible");

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === "visible";
      setIsVisible(visible);

      // Apply global class to body for CSS-based animation control
      if (visible) {
        document.body.classList.remove("page-hidden");
      } else {
        document.body.classList.add("page-hidden");
      }
    };

    // Add event listener
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Set initial class state
    handleVisibilityChange();

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

/**
 * Global page visibility manager for performance optimization
 * Automatically pauses animations when page becomes hidden
 */
export function initializePageVisibilityManager() {
  if (typeof document === "undefined" || !document.visibilityState) {
    return;
  }

  const handleVisibilityChange = () => {
    const visible = document.visibilityState === "visible";

    // Apply global class to body for CSS-based animation control
    if (visible) {
      document.body.classList.remove("page-hidden");
    } else {
      document.body.classList.add("page-hidden");
    }
  };

  // Set initial state
  handleVisibilityChange();

  // Add event listener
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
