/**
 * Fee Theme Hook
 *
 * Provides theme configuration for fee indicators
 * Based on StampingTool patterns
 */

import { useEffect, useMemo } from "preact/hooks";
import {
  DEFAULT_FEE_INDICATOR_THEME,
  generateCSSCustomProperties,
  type SharedFeeIndicatorTheme,
} from "$lib/components/fee-indicators/StyleConstants.ts";

interface UseFeeThemeOptions {
  /** Custom theme overrides */
  theme?: Partial<SharedFeeIndicatorTheme>;
  /** Apply CSS custom properties to root */
  applyToRoot?: boolean;
  /** CSS selector for theme application */
  selector?: string;
}

interface UseFeeThemeReturn {
  /** Current theme configuration */
  theme: SharedFeeIndicatorTheme;
  /** CSS custom properties object */
  cssProperties: Record<string, string>;
  /** Apply theme to an element */
  applyTheme: (element: HTMLElement) => void;
  /** Get color for a specific phase */
  getPhaseColor: (phase: "instant" | "cached" | "exact") => string;
  /** Get timing for a specific animation */
  getTiming: (timing: "fast" | "normal" | "slow") => string;
}

/**
 * Hook for managing fee indicator theming
 */
export function useFeeTheme(
  options: UseFeeThemeOptions = {},
): UseFeeThemeReturn {
  const {
    theme: customTheme,
    applyToRoot = true,
    selector = ":root",
  } = options;

  // Merge custom theme with defaults
  const theme = useMemo(() => {
    return {
      ...DEFAULT_FEE_INDICATOR_THEME,
      ...customTheme,
      colors: {
        ...DEFAULT_FEE_INDICATOR_THEME.colors,
        ...(customTheme?.colors || {}),
      },
      spacing: {
        ...DEFAULT_FEE_INDICATOR_THEME.spacing,
        ...(customTheme?.spacing || {}),
      },
      timing: {
        ...DEFAULT_FEE_INDICATOR_THEME.timing,
        ...(customTheme?.timing || {}),
      },
    } as SharedFeeIndicatorTheme;
  }, [customTheme]);

  // Generate CSS custom properties
  const cssProperties = useMemo(() => {
    return generateCSSCustomProperties(theme);
  }, [theme]);

  // Apply CSS custom properties to root element
  useEffect(() => {
    if (applyToRoot && typeof document !== "undefined") {
      const element = document.querySelector(selector);
      if (element instanceof HTMLElement) {
        Object.entries(cssProperties).forEach(([key, value]) => {
          element.style.setProperty(key, value);
        });
      }
    }
  }, [applyToRoot, selector, cssProperties]);

  /**
   * Apply theme to a specific element
   */
  const applyTheme = (element: HTMLElement) => {
    Object.entries(cssProperties).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  };

  /**
   * Get color for a specific phase
   */
  const getPhaseColor = (phase: "instant" | "cached" | "exact"): string => {
    return theme.colors[phase];
  };

  /**
   * Get timing for a specific animation
   */
  const getTiming = (timing: "fast" | "normal" | "slow"): string => {
    return theme.timing[timing];
  };

  return {
    theme,
    cssProperties,
    applyTheme,
    getPhaseColor,
    getTiming,
  };
}
