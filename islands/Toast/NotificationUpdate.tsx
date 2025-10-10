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
const NOTIFICATION_UPDATE_VERSION = "feature-update-v3.0";

/**
 * Message content for update notification
 * Supports multi-line formatting with bullet points
 */
const NOTIFICATION_UPDATE_MESSAGE = `New Website Updates
• Enhanced glassmorphism UI design
• Improved toast notification and messaging
• Reimagined header and navigation menus
• Updated search feature with global stamp search and token specific search (on SRC20 Tokens overview and detail pages)
• Fixed filtering issues on the Art Stamps overview page
• Added keyboard shortcuts: ⌘/⌃ + "S" to access search (globally) and ⌘/⌃ + "F" to access filters (on the Art Stamps overview page) - "ESC" to close (globally)
• Integrated blockchain stats with bitcoin block number, price, fee rates, wallet balance and Counterparty version
• New Huge Icons iconset
• Minor bug fixes and code optimization

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
