/* ===== STYLE CONSTANTS - MATCHING EXISTING EXCELLENCE ===== */

import type { SharedFeeIndicatorTheme, StyleConstantsConfig } from "./types.ts";

/* ===== COLOR CONSTANTS (MATCHING EXISTING IMPLEMENTATIONS) ===== */

export const FEE_INDICATOR_COLORS = {
  // Phase colors (matches StampingTool implementation)
  instant: "rgb(74, 222, 128)", // green-400
  cached: "rgb(96, 165, 250)", // blue-400
  exact: "rgb(251, 146, 60)", // orange-400

  // Status colors
  success: "rgb(34, 197, 94)", // green-500
  error: "rgb(239, 68, 68)", // red-500
  loading: "rgb(156, 163, 175)", // gray-400

  // Background colors (matches existing glass-morphism)
  background: "rgba(16, 3, 24, 0.95)", // stamp-grey-darker/95
  backgroundLight: "rgba(255, 255, 255, 0.1)", // stamp-grey-light/10

  // Text colors
  textPrimary: "rgb(229, 231, 235)", // stamp-grey-light
  textSecondary: "rgb(156, 163, 175)", // stamp-grey
  textMuted: "rgba(156, 163, 175, 0.8)", // stamp-grey with opacity
} as const;

/* ===== SPACING CONSTANTS ===== */

export const FEE_INDICATOR_SPACING = {
  // Size variants
  sm: {
    indicator: "0.25rem", // w-1 h-1
    gap: "0.25rem", // gap-1
    padding: "0.5rem", // p-2
    fontSize: "0.75rem", // text-xs
  },
  md: {
    indicator: "0.375rem", // w-1.5 h-1.5 (matches StampingTool)
    gap: "0.5rem", // gap-2
    padding: "0.75rem", // p-3
    fontSize: "0.875rem", // text-sm
  },
  lg: {
    indicator: "0.5rem", // w-2 h-2
    gap: "0.75rem", // gap-3
    padding: "1rem", // p-4
    fontSize: "1rem", // text-base
  },
} as const;

/* ===== TIMING CONSTANTS ===== */

export const FEE_INDICATOR_TIMING = {
  fast: "150ms",
  normal: "300ms", // matches transition-all duration-300
  slow: "600ms",
} as const;

/* ===== Z-INDEX CONSTANTS ===== */

export const FEE_INDICATOR_Z_INDEX = {
  indicator: 10, // matches StampingTool z-10
  modal: 50, // for modal indicators
  tooltip: 100, // for tooltips and overlays
} as const;

/* ===== MAIN STYLE CONSTANTS CONFIG ===== */

export const StyleConstants: StyleConstantsConfig = {
  colors: {
    instant: FEE_INDICATOR_COLORS.instant,
    cached: FEE_INDICATOR_COLORS.cached,
    exact: FEE_INDICATOR_COLORS.exact,
    success: FEE_INDICATOR_COLORS.success,
    error: FEE_INDICATOR_COLORS.error,
    loading: FEE_INDICATOR_COLORS.loading,
  },
  spacing: {
    sm: FEE_INDICATOR_SPACING.sm.padding,
    md: FEE_INDICATOR_SPACING.md.padding,
    lg: FEE_INDICATOR_SPACING.lg.padding,
  },
  timing: FEE_INDICATOR_TIMING,
  zIndex: FEE_INDICATOR_Z_INDEX,
};

/* ===== SHARED THEME (MATCHES EXISTING IMPLEMENTATIONS) ===== */

export const DEFAULT_FEE_INDICATOR_THEME: SharedFeeIndicatorTheme = {
  colors: StyleConstants.colors,
  spacing: StyleConstants.spacing,
  timing: StyleConstants.timing,

  // Border radius (matches existing rounded styles)
  borderRadius: "9999px", // rounded-full

  // Backdrop blur (matches StampingTool backdrop-blur-sm)
  backdropBlur: "4px",

  // Opacity levels
  opacity: {
    active: 1.0,
    inactive: 0.3, // matches /30 opacity
    disabled: 0.1,
  },
};

/* ===== CSS CUSTOM PROPERTIES GENERATOR ===== */

export const generateCSSCustomProperties = (
  theme: SharedFeeIndicatorTheme = DEFAULT_FEE_INDICATOR_THEME,
): Record<string, string> => {
  return {
    // Color properties
    "--fee-indicator-color-instant": theme.colors.instant,
    "--fee-indicator-color-cached": theme.colors.cached,
    "--fee-indicator-color-exact": theme.colors.exact,
    "--fee-indicator-color-success": theme.colors.success,
    "--fee-indicator-color-error": theme.colors.error,
    "--fee-indicator-color-loading": theme.colors.loading,

    // Spacing properties
    "--fee-indicator-spacing-sm": theme.spacing.sm,
    "--fee-indicator-spacing-md": theme.spacing.md,
    "--fee-indicator-spacing-lg": theme.spacing.lg,

    // Timing properties
    "--fee-indicator-timing-fast": theme.timing.fast,
    "--fee-indicator-timing-normal": theme.timing.normal,
    "--fee-indicator-timing-slow": theme.timing.slow,

    // Visual properties
    "--fee-indicator-border-radius": theme.borderRadius,
    "--fee-indicator-backdrop-blur": theme.backdropBlur,
    "--fee-indicator-opacity-active": theme.opacity.active.toString(),
    "--fee-indicator-opacity-inactive": theme.opacity.inactive.toString(),
    "--fee-indicator-opacity-disabled": theme.opacity.disabled.toString(),
  };
};

/* ===== UTILITY CLASSES GENERATOR ===== */

export const FEE_INDICATOR_UTILITY_CLASSES = {
  // Base indicator classes (matches StampingTool)
  baseIndicator: "w-1.5 h-1.5 rounded-full transition-all duration-300",

  // Container classes (matches StampingTool positioning)
  containerTopRight: "absolute top-3 right-3 z-10",
  containerTopLeft: "absolute top-3 left-3 z-10",
  containerBottomRight: "absolute bottom-3 right-3 z-10",
  containerBottomLeft: "absolute bottom-3 left-3 z-10",
  containerInline: "inline-flex items-center gap-2",

  // Background classes (matches existing glass-morphism)
  glassMorphism:
    "bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10",

  // Text classes
  labelText: "text-xs text-stamp-grey-light font-normal opacity-80",
  labelTextHidden: "hidden sm:inline",
  labelTextMobile: "inline sm:hidden",

  // Animation classes (matches existing)
  animatePulse: "animate-pulse",
  animatePing: "animate-ping",

  // Phase-specific classes
  phaseInstant: "bg-green-400",
  phaseCached: "bg-blue-400",
  phaseExact: "bg-orange-400",
  phaseInactive: "bg-stamp-grey-light/30",
  phaseError: "bg-red-400",
} as const;

/* ===== RESPONSIVE BREAKPOINT UTILITIES ===== */

export const FEE_INDICATOR_BREAKPOINTS = {
  // Show text labels only on larger screens (matches StampingTool)
  showLabelsQuery: "(min-width: 640px)", // sm breakpoint

  // Hide on mobile if needed
  hideMobileQuery: "(max-width: 639px)",

  // Reduce motion query
  reduceMotionQuery: "(prefers-reduced-motion: reduce)",
} as const;

/* ===== ACCESSIBILITY CONSTANTS ===== */

export const FEE_INDICATOR_A11Y = {
  // ARIA labels
  ariaLabels: {
    instant: "Phase 1: Instant fee estimate",
    cached: "Phase 2: Smart UTXO analysis",
    exact: "Phase 3: Exact fee calculation",
    loading: "Calculating fees...",
    error: "Fee calculation error",
    success: "Fee calculation complete",
  },

  // Screen reader text
  srText: {
    phaseComplete: "Phase complete",
    phaseActive: "Phase in progress",
    phaseError: "Phase failed",
    estimating: "Estimating transaction fees",
  },
} as const;
