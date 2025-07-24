/**
 * FairmintTool Style Component
 *
 * Provides CSS custom properties for animation and styling constants
 * Part of Task 22.1 integration
 */

import {
  DEFAULT_FEE_INDICATOR_THEME,
  generateCSSCustomProperties,
} from "$lib/components/fee-indicators/StyleConstants.ts";

export function FairmintToolStyles() {
  const cssProperties = generateCSSCustomProperties(
    DEFAULT_FEE_INDICATOR_THEME,
  );

  // Convert to CSS string
  const cssString = Object.entries(cssProperties)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n    ");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
      :root {
        ${cssString}
      }
      
      /* Additional FairmintTool specific styles */
      [data-testid="fee-phase-indicator"] {
        transition-property: all;
        transition-timing-function: var(--fee-indicator-timing-function, cubic-bezier(0.4, 0, 0.2, 1));
      }
      
      /* Ensure phase dots use CSS variables when available */
      [data-phase="instant"] {
        --phase-color: var(--fee-indicator-color-instant, rgb(74, 222, 128));
      }
      
      [data-phase="cached"] {
        --phase-color: var(--fee-indicator-color-cached, rgb(96, 165, 250));
      }
      
      [data-phase="exact"] {
        --phase-color: var(--fee-indicator-color-exact, rgb(251, 146, 60));
      }
    `,
      }}
    />
  );
}
