import { shadow } from "$layout";

/* ===== BASE STYLES ===== */
/* ===== NOTIFICATION STYLES ===== */
const notificationContainer = `
  w-full px-4 pt-3 pb-4 border rounded-2xl backdrop-blur-md ${shadow}`;

/* ===== TOOLTIPS STYLES ===== */
const tooltipBackground =
  "bg-black/75 px-2 py-1 rounded-md transition-opacity duration-200 pointer-events-none";
const tooltipText =
  "font-normal text-[10px] text-color-grey-light whitespace-nowrap";

/* ===== NOTIFICATION STYLES ===== */
/* General */
export const notificationHeading =
  `font-semibold text-[15px] text-color-grey-light`;
export const notificationBody = `font-normal text-sm text-color-grey-semilight`;
export const notificationTextError = `!text-color-red`;
export const notificationTextSuccess = `!text-color-green`;

/* Info */
export const notificationContainerInfo =
  `${notificationContainer} bg-gradient-to-br from-color-grey-dark/60 via-color-background/60 to-color-background/90 border-color-grey-semidark/80`;

/* Error */
export const notificationContainerError =
  `${notificationContainer} bg-gradient-to-br from-color-red-dark/60 via-color-background/60 to-color-background/90 border-color-red-semidark/80`;

/* Warning */
export const notificationContainerWarning =
  `${notificationContainer} bg-gradient-to-br from-color-orange-dark/60 via-color-background/60 to-color-background/90 border-color-orange/80`;

/* Success */
export const notificationContainerSuccess =
  `${notificationContainer} bg-gradient-to-br from-color-green-dark/60 via-color-background/60 to-color-background/90 border-color-green-semidark/80`;

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
