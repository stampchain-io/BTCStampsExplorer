/* ===== NOTIFICATION STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
const tooltipText =
  "font-normal text-[10px] text-stamp-grey-light whitespace-nowrap";
const tooltipBackground =
  "bg-[#000000BF] px-2 py-1 rounded-sm transition-opacity duration-300 pointer-events-none";

/* ===== TOOLTIP STYLES ===== */
export const tooltipButton = `
  absolute left-1/2 -translate-x-1/2 
  ${tooltipBackground} 
  mb-1 bottom-full 
  ${tooltipText}
`;

export const tooltipButtonInCollapsible = `
  fixed z-50 
  ${tooltipBackground} 
  ${tooltipText}
`;

export const tooltipImage = `
  fixed z-50 
  ${tooltipBackground} 
  mb-1.5 
  ${tooltipText}
`;

/* ===== LEGACY STYLES ===== */
// NOTE: Possible duplicate of tooltipButton - only difference is mb-1
export const tooltipIcon = `
  absolute left-1/2 -translate-x-1/2 
  ${tooltipBackground} 
  bottom-full 
  ${tooltipText}
`;

/* ===== TOAST STYLES ===== */
// TODO(@baba): Implement toast notification styles
