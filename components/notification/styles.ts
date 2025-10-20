import { shadow } from "$layout";

/* ===== BASE STYLES ===== */
/* ===== NOTIFICATION STYLES ===== */
const notificationContainer = `
  w-full px-4 pt-3 pb-4 border-[1px] rounded-2xl backdrop-blur-md ${shadow}`;

/* ===== TOOLTIPS STYLES ===== */
const tooltipBackground =
  "bg-[#000000BF] px-2 py-1 rounded-md transition-opacity duration-200 pointer-events-none";
const tooltipText =
  "font-normal text-[10px] text-color-neutral-light whitespace-nowrap";

/* ===== NOTIFICATION STYLES ===== */
/* General */
export const notificationHeading =
  `font-semibold text-[15px] text-color-neutral`;
export const notificationBody = `font-normal text-sm text-color-neutral`;
export const notificationTextError = `!text-[#990000]`;
export const notificationTextSuccess = `!text-[#009900]`;

/* Info */
export const notificationContainerInfo =
  `${notificationContainer} bg-gradient-to-br from-[#333333]/60 via-[#222222]/60 to-[#080708]/80 border-[#666666]/80`;

/* Error */
export const notificationContainerError =
  `${notificationContainer} bg-gradient-to-br from-[#330000]/60 via-[#220000]/60 to-[#080708]/80 border-[#660000]/80`;

/* Success */
export const notificationContainerSuccess =
  `${notificationContainer} bg-gradient-to-br from-[#003300]/60 via-[#002200]/60 to-[#080708]/80 border-[#006600]/80`;

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
