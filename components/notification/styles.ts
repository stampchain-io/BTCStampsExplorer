import { shadow } from "$layout";

/* ===== BASE STYLES ===== */
/* ===== NOTIFICATION STYLES ===== */
const notificationContainer = `
  w-full px-5 py-2.5 border-[1px] rounded-2xl backdrop-blur-lg ${shadow}`;

/* ===== TOOLTIPS STYLES ===== */
const tooltipBackground =
  "bg-[#000000BF] px-2 py-1 rounded-md transition-opacity duration-200 pointer-events-none";
const tooltipText =
  "font-normal text-[10px] text-stamp-grey-light whitespace-nowrap";

/* ===== NOTIFICATION STYLES ===== */
/* General */
export const notificationHeading = `font-semibold text-base text-stamp-grey`;
export const notificationBody = `font-normal text-sm text-stamp-grey`;

/* Info */
export const notificationContainerInfo =
  `${notificationContainer} bg-gradient-to-br from-[#333333]/60 via-[#333333]/40 to-[#080708]/80 border-[#666666]/60`;

/* Error */
export const notificationContainerError =
  `${notificationContainer} bg-gradient-to-br from-[#330000]/60 via-[#330000]/40 to-[#080708]/80 border-[#660000]/60`;

/* Success */
export const notificationContainerSuccess =
  `${notificationContainer} bg-gradient-to-br from-[#003300]/60 via-[#003300]/40 to-[#080708]/80 border-[#006600]/60`;

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
