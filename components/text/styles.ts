/* ===== TEXT STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
const logoFont = "font-black italic text-3xl tracking-wide inline-block w-fit";
const titleFont = "font-black text-3xl tracking-wide inline-block w-fit";
const subtitleFont = "font-extralight text-2xl mb-2";
const textFont = "font-normal text-stamp-grey-light";
const labelFont = "font-light text-stamp-grey-darker tracking-wide";
const valueFont = "font-medium text-stamp-grey-light";
const cursor = "cursor-default select-none whitespace-nowrap";
const transition = "transition-colors duration-300";

/* ===== OVERLAY STYLES ===== */
// Overlays - used for text overlay effects of whole divs - text must be transparent or not declared with tailwind css
export const overlayPurple =
  "bg-gradient-to-r from-[#AA00FF]/80 via-[#AA00FF]/60 to-[#AA00FF]/40 text-transparent bg-clip-text";

/* ===== LOGO STYLES ===== */
export const logoPurpleDL = `${logoFont} purple-gradient2 ${cursor}`; // used in footer
export const logoPurpleDLLink =
  `${logoFont} purple-gradient2-hover ${transition}`;
export const logoPurpleLD = `${logoFont} purple-gradient4 ${cursor}`;
export const logoPurpleLDLink =
  `${logoFont} purple-gradient4-hover ${transition}`; // used in header

/* ===== NAVIGATION STYLES ===== */
// Header - Desktop
export const navLinkPurple =
  `font-extrabold text-stamp-purple text-sm group-hover:text-stamp-purple-bright tracking-wide ${transition} ${cursor}`;
export const navSublinkPurple =
  `font-semibold text-stamp-purple text-xs hover:text-stamp-purple-bright ${transition} ${cursor}`; // used in ConnectButton.tsx for connected sunmenu links - header uses custom styles
// Header - Mobile/tablet
export const navLinkGrey =
  `font-bold text-lg text-stamp-grey-darker group-hover:text-stamp-grey tracking-wide ${transition} ${cursor}`;
export const navLinkGreyLD =
  `font-extrabold text-xl gray-gradient1-hover tracking-wide inline-block w-fit ${transition} ${cursor}`;
// Footer - transparent text - ued with the overlayPurple class
export const navLinkTransparentPurple =
  `font-semibold text-xs hover:text-stamp-purple-bright ${transition} ${cursor}`;

/* ===== TITLE STYLES ===== */
export const titleGreyLD = `${titleFont} gray-gradient1 ${cursor}`;
export const titleGreyDL = `${titleFont} gray-gradient3 ${cursor}`;
export const titlePurpleLD = `${titleFont} purple-gradient3 ${cursor}`;
export const titlePurpleDL = `${titleFont} purple-gradient1 ${cursor}`;

/* ===== SUBTITLE STYLES ===== */
export const subtitleGrey = `${subtitleFont} text-stamp-grey-light ${cursor}`;
export const subtitlePurple =
  `${subtitleFont} text-stamp-purple-bright ${cursor}`;

/* ===== HEADING STYLES ===== */
export const headingGrey2 =
  `font-black text-3xl mobileLg:text-4xl text-stamp-grey-light tracking-wide ${cursor}`; // was used in about donate section - rename
export const headingGreyLD =
  `font-bold text-xl gray-gradient1 tracking-wide inline-block w-fit relative ${cursor}`;
export const headingGreyLDLink =
  `font-bold text-lg gray-gradient1-hover tracking-wide inline-block w-fit relative ${transition}`; // used in media page / keep reading in howto pages / accordion titles (custom code)
export const headingGrey =
  "font-bold text-2xl text-stamp-grey cursor-default select-none"; // used in howto overview and detail pages / donate CTA
export const headingPurpleLD =
  "font-black text-sm mobileMd:text-lg purple-gradient3 tracking-wide inline-block w-fit text-center mt-3 mobileMd:mt-4 mobileLg:mt-5 mb-1 mobileMd:mb-0"; // used specifically in team banner gallery

/* ===== BODY TEXT STYLES ===== */
export const textXxs = `${textFont} text-[10px]`;
export const textXs = `${textFont} text-xs`;
export const textSm = `${textFont} text-sm`;
export const text = `${textFont} text-base`;
export const textLg = `${textFont} text-lg`;
export const textXl = `${textFont} text-xl`;
export const text2xl = `${textFont} text-2xl`;
export const textLinkUnderline =
  `font-bold text-base text-stamp-grey-light animated-underline ${transition}`;

/* ===== LINK STYLES ===== */
// Use the specific link styles created or just add "animated-underline" to the class name to apply an animated underline effect

/* ===== LABEL STYLES ===== */
export const labelXs = `${labelFont} text-xs ${cursor}`;
export const labelSm = `${labelFont} text-sm ${cursor}`;
export const label = `${labelFont} text-base ${cursor}`; // = old dataLabel name
export const labelLg = `${labelFont} text-lg ${cursor}`;
export const labelXl = `${labelFont} text-xl ${cursor}`;
export const labelSmPurple =
  `font-light text-sm text-stamp-purple-bright tracking-wide mb-0.5 ${cursor}`;

/* ===== VALUE STYLES ===== */
// Grey variants
export const valueXs = `${valueFont} text-xs ${cursor}`;
export const valueSm = `${valueFont} text-sm ${cursor}`;
export const valueSmLink =
  `${valueFont} text-sm hover:text-stamp-purple-bright transition-colors duration-300 cursor-pointer w-full ${cursor}`;
export const value = `${valueFont} text-base ${cursor}`;
export const valueLg = `${valueFont} text-lg ${cursor}`;
export const valueXl =
  `font-black text-xl text-stamp-grey-light -mt-1  ${cursor}`;
export const value2xl =
  `font-black text-2xl text-stamp-grey-light -mt-1 ${cursor}`;
export const value3xl =
  `font-black text-3xl text-stamp-grey-light -mt-1 ${cursor}`;
// Transparent variants
export const value2xlTransparent = `font-black text-2xl -mt-1 ${cursor}`;
export const value3xlTransparent = `font-black text-3xl -mt-1 ${cursor}`; // used in DataTableBase.tsx
// Purple variants
export const valueSmPurple =
  `font-medium text-xs text-stamp-purple text-center whitespace-nowrap ${cursor}`; // used in team banner gallery
export const value2xlPurpleGlow =
  "font-black text-2xl text-black text-stroke-glow-small"; // used in about header
export const value5xlPurpleGlow =
  "font-black text-5xl text-black text-stroke-glow-small"; // used in about header
export const value7xlPurpleGlow =
  "font-black text-7xl text-black text-stroke-glow-large"; // used in about header
// Dark variants
export const valueDarkXs =
  `font-medium text-xs text-stamp-grey-darker tracking-tighter ${cursor}`; // used for addy styling in mobile/table header
export const valueDarkSm =
  `font-medium text-sm text-stamp-grey-darker tracking-tighter ${cursor}`; // used for addy styling in desktop header
export const valueDark = `font-bold text-base text-stamp-grey-darker ${cursor}`; // used in tables

/* ===== TOOLTIP STYLES ===== */
// One text style for tooltips - defined in /notifications/styles.ts

/* ===== CODE STYLES ===== */
// Add "font-courier-prime" to the class name to use the Courier font and make text monospace

/* ===== SPECIAL TEXT STYLES ===== */
export const tagline =
  `font-regular text-xs bg-gradient-to-r from-[#660099] via-[#8800CC] to-[#AA00FF] text-transparent bg-clip-text ${cursor}`; // used in footer
export const copyright = `font-normal text-xs ${cursor}`; // transparent text - combined with the overlayPurple class - used in footer
export const loaderText =
  `font-medium text-sm text-stamp-grey uppercase text-center py-3 animated-text-loader ${cursor}`; // table more rows loader

// Captions - used for stamp/token cards
// Errors - used for error messages - to be defined in /notifications/styles.ts
// Success - used for success messages - to be defined in /notifications/styles.ts

/* ===== UNCATEGORIZED STYLES ===== */
// Add any new styles you cannot categorize here

/* ===== LEGACY STYLES ===== */
// @baba - should be able to delete !!!
export const dataLabel =
  "text-base mobileLg:text-lg font-light text-red-500 uppercase"; // check where used
export const dataValue =
  "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase"; // check where used
export const dataValueLg =
  "text-xl mobileLg:text-2xl font-medium text-stamp-grey-light uppercase"; // check where used
// Tables
export const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1";
export const dataValueXLlink = "text-3xl mobileLg:text-4xl font-black -mt-1";

/* ===== TYPE DEFINITIONS ===== */
export type TextStyles = {
  // Logo styles
  logoPurpleDL: string;
  logoPurpleDLLink: string;
  logoPurpleLD: string;
  logoPurpleLDLink: string;
  // Navigation styles
  navLinkPurple: string;
  navSublinkPurple: string;
  navLinkGrey: string;
  navLinkGreyLD: string;
  navLinkTransparentPurple: string;
  // Title styles
  titleGreyLD: string;
  titleGreyDL: string;
  titlePurpleLD: string;
  titlePurpleDL: string;
  // Subtitle styles
  subtitleGrey: string;
  subtitlePurple: string;
  // Heading styles
  headingGrey2: string;
  headingGreyLD: string;
  headingGreyLDLink: string;
  headingGrey: string;
  headingPurpleLD: string;
  // Body text styles
  textXxs: string;
  textXs: string;
  textSm: string;
  text: string;
  textLg: string;
  textXl: string;
  textLinkUnderline: string;
  // Label styles
  labelXs: string;
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  labelSmPurple: string;
  // Value styles
  valueXs: string;
  valueSm: string;
  valueSmLink: string;
  value: string;
  valueLg: string;
  valueXl: string;
  value2xl: string;
  value3xl: string;
  value2xlTransparent: string;
  value3xlTransparent: string;
  valueSmPurple: string;
  value2xlPurpleGlow: string;
  value5xlPurpleGlow: string;
  value7xlPurpleGlow: string;
  valueDarkSm: string;
  valueDarkXs: string;
  valueDark: string;
  // Special text styles
  tagline: string;
  copyright: string;
  loaderText: string;
  // Legacy styles
  dataLabel: string;
  dataValue: string;
  dataValueLg: string;
  // Table styles
  dataValueXL: string;
  dataValueXLlink: string;
};
