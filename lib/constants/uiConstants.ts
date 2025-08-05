/**
 * UI Constants for BTC Stamps Explorer
 * Runtime constants for UI components, themes, and behaviors
 */

/**
 * Button variant types - standardized across the application
 */
export type ButtonVariant =
  | "text"
  | "glassmorphism"
  | "glassmorphismColor"
  | "glassmorphismSelected"
  | "glassmorphismDeselected"
  | "flat"
  | "outline"
  | "flatOutline"
  | "outlineFlat"
  | "outlineGradient"
  | "custom"
  | "fill"
  | "light"
  | "thin"
  | "regular"
  | "bold";

/**
 * Button color types - standardized theme colors
 */
export type ButtonColor =
  | "purple"
  | "purpleDark"
  | "grey"
  | "greyDark"
  | "test"
  | "custom";

/**
 * Button size types - responsive sizing system
 */
export type ButtonSize =
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl"
  | "xxsR" // Responsive variants
  | "xsR"
  | "smR"
  | "mdR"
  | "lgR"
  | "custom";

/**
 * Modal size constants
 */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

/**
 * Loading state constants for async operations
 */
export type AsyncLoadingState = "idle" | "loading" | "success" | "error";

/**
 * Animation duration constants (in milliseconds)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
} as const;

/**
 * Z-index layering system
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  TOOLTIP: 1060,
  TOAST: 1070,
  OVERLAY: 1080,
} as const;
