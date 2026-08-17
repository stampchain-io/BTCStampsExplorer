import { shadow } from "$layout";

/* ===== BASE STYLES ===== */
/* ===== NOTIFICATION STYLES ===== */
const notificationContainer = `
  w-full px-4 pt-3 pb-4 border rounded-2xl backdrop-blur-md ${shadow}`;

/* ===== TOOLTIPS STYLES ===== */
const tooltipBackground =
  "bg-color-neutral-1000/90 px-2.5 py-1 rounded-lg transition-opacity duration-200 pointer-events-none";
const tooltipText =
  "font-normal text-[0.625rem] text-color-neutral-200 whitespace-nowrap";

/* ===== NOTIFICATION STYLES ===== */
/* General */
export const notificationHeader =
  "font-bold text-sm text-color-neutral-200 tracking-wider";
export const notificationFooter = "font-normal text-sm text-color-neutral-400";
export const notificationBody = "font-normal text-sm text-color-neutral-200";
export const notificationTextError = `!text-color-red-400`;
export const notificationTextSuccess = `!text-color-green-400`;

/* Info */
export const notificationContainerInfo =
  `${notificationContainer} bg-gradient-to-br from-color-neutral-800/90 via-color-neutral-900/80 to-color-neutral-1000/90 border-color-neutral-500`;

/* Error */
export const notificationContainerError =
  `${notificationContainer} bg-gradient-to-br from-color-red-950/90 via-color-neutral-900/80 to-color-neutral-1000/90 border-color-red-700`;

/* Warning */
export const notificationContainerWarning =
  `${notificationContainer} bg-gradient-to-br from-color-orange-950/90 via-color-neutral-900/80 to-color-neutral-1000/90 border-color-orange-500`;

/* Success */
export const notificationContainerSuccess =
  `${notificationContainer} bg-gradient-to-br from-color-green-950/90 via-color-neutral-900/80 to-color-neutral-1000/90 border-color-green-700`;

/* ===== TOOLTIP STYLES ===== */
export const tooltipButton = `
  absolute left-1/2 -translate-x-1/2
  bottom-full mb-1.5 z-tooltip
  ${tooltipBackground} ${tooltipText}
`;

export const tooltipButtonInCollapsible = `
  fixed -mt-[3px] z-tooltip
  ${tooltipBackground} ${tooltipText}
`;

export const tooltipImage = `
  absolute mb-1.5 z-tooltip
  ${tooltipBackground} ${tooltipText}
`;

/* ===== LEGACY STYLES ===== */
// NOTE: Possible duplicate of tooltipButton - only difference is mb-1
export const tooltipIcon = `
  absolute left-1/2 -translate-x-1/2
  ${tooltipBackground}
  bottom-full
  ${tooltipText}
`;
