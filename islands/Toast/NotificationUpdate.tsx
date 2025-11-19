// islands/Toast/NotificationUpdate.tsx
import { showToast } from "$lib/utils/ui/notifications/toastSignal.ts";
import { useEffect } from "preact/hooks";

/**
 * Update Notification Configuration
 * All settings for the major app update notification
 *
 * To show a new announcement:
 * 1. Increment NOTIFICATION_UPDATE_VERSION version (e.g., "v1" -> "v2")
 * 2. Update NOTIFICATION_UPDATE_MESSAGE content
 * 3. Adjust timing/behavior if needed
 */

/**
 * localStorage key for tracking if update notification has been shown
 * INCREMENT VERSION for each new major update announcement
 */
const NOTIFICATION_UPDATE_VERSION = "feature-update-v3.1";

/**
 * Message content for update notification
 * Supports multi-line formatting with bullet points
 */
const NOTIFICATION_UPDATE_MESSAGE = `Website Updates
• Enhanced color palette with vibrant hues
• Improved Wallet Profile page with updated design
• Minor UI tweaks and bug fixes
• Major code optimization and performance improvements

Please clear browser cache and refresh the page for all updates to take effect.`;

/**
 * Delay before showing notification (milliseconds)
 */
const DELAY = 2000;

/**
 * Toast type - "info" | "success" | "warning" | "error"
 */
const TYPE = "info" as const;

/**
 * Whether toast should auto-dismiss
 * false = user must manually close it
 */
const AUTO_DISMISS = false;

/**
 * Displays a one-time notification for major app updates
 * All configuration is self-contained in this file
 */
export function NotificationUpdate() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Check if this version has been shown
    const hasBeenShown = localStorage.getItem(NOTIFICATION_UPDATE_VERSION);

    if (hasBeenShown) return; // Already shown, exit early

    // Delay for better UX (let page settle first)
    const timer = setTimeout(() => {
      // Show the toast
      showToast(
        NOTIFICATION_UPDATE_MESSAGE,
        TYPE,
        AUTO_DISMISS,
      );

      // Mark as shown (user has been notified)
      localStorage.setItem(NOTIFICATION_UPDATE_VERSION, "true");
    }, DELAY);

    return () => clearTimeout(timer);
  }, []);

  // No visual render - this is a pure behavior component
  return null;
}
