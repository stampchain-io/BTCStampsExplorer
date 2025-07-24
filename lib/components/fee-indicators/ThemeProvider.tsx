/* ===== FEE INDICATOR THEME PROVIDER ===== */

import type { ComponentChildren } from "preact";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import {
  DEFAULT_FEE_INDICATOR_THEME,
  generateCSSCustomProperties,
} from "./StyleConstants.ts";
import type { SharedFeeIndicatorTheme } from "./types.ts";

/* ===== THEME CONTEXT ===== */

const FeeIndicatorThemeContext = createContext<SharedFeeIndicatorTheme>(
  DEFAULT_FEE_INDICATOR_THEME,
);

/* ===== THEME PROVIDER COMPONENT ===== */

interface FeeIndicatorThemeProviderProps {
  theme?: Partial<SharedFeeIndicatorTheme>;
  children: ComponentChildren;
}

export function FeeIndicatorTheme({
  theme: customTheme,
  children,
}: FeeIndicatorThemeProviderProps) {
  // Merge custom theme with defaults
  const mergedTheme: SharedFeeIndicatorTheme = {
    ...DEFAULT_FEE_INDICATOR_THEME,
    ...customTheme,
    colors: {
      ...DEFAULT_FEE_INDICATOR_THEME.colors,
      ...customTheme?.colors,
    },
    spacing: {
      ...DEFAULT_FEE_INDICATOR_THEME.spacing,
      ...customTheme?.spacing,
    },
    timing: {
      ...DEFAULT_FEE_INDICATOR_THEME.timing,
      ...customTheme?.timing,
    },
    opacity: {
      ...DEFAULT_FEE_INDICATOR_THEME.opacity,
      ...customTheme?.opacity,
    },
  };

  // Generate CSS custom properties
  const cssProps = generateCSSCustomProperties(mergedTheme);

  return (
    <FeeIndicatorThemeContext.Provider value={mergedTheme}>
      <div style={cssProps}>
        {children}
      </div>
    </FeeIndicatorThemeContext.Provider>
  );
}

/* ===== THEME HOOK ===== */

export function useFeeIndicatorTheme(): SharedFeeIndicatorTheme {
  return useContext(FeeIndicatorThemeContext);
}
