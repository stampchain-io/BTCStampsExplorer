/* ===== TEXT STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
const logoFont = "font-black italic text-4xl tracking-wide";
const titleFont =
  "font-black text-3xl mobileMd:text-4xl tracking-wide inline-block";
const subtitleFont = "font-extralight text-2xl mobileMd:text-3xl mb-2";
const textFont = "font-normal text-stamp-grey-light";
const labelFont = "font-light text-stamp-grey-darker";
const valueFont = "font-bold text-stamp-grey-light";
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
export const navLinkPurple =
  `font-medium tablet:font-bold text-sm hover:text-stamp-purple-bright ${transition} ${cursor}`; // transparent text - ued with the overlayPurple class -  used in footer
export const navLinkPurpleThick =
  `font-extrabold text-stamp-purple group-hover:text-stamp-purple-bright tracking-wide ${transition} ${cursor}`; // used in header - desktop menu
export const navLinkGrey =
  `font-extrabold text-lg text-stamp-grey-darker group-hover:text-stamp-grey tracking-wide ${transition} ${cursor}`; // used in header - mobile menu
export const navLinkGreyLD =
  `font-extrabold text-2xl gray-gradient1-hover tracking-wide inline-block ${transition} ${cursor}`; // used in header - mobile menu

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
export const headingGreyLDLink =
  `font-bold text-xl gray-gradient1-hover tracking-wide inline-block relative ${transition}`; // used in media page / keep reading in howto pages / accordion titles (custom code)
export const headingGrey =
  "font-bold text-2xl mobileMd:text-3xl text-stamp-grey tracking-wide cursor-default select-none";

/* ===== BODY TEXT STYLES ===== */
export const textXxs = `${textFont} text-[10px]`;
export const textXs = `${textFont} text-xs`;
export const textSm = `${textFont} text-sm`;
export const text = `${textFont} text-base`;
export const textLg = `${textFont} text-lg`;
export const textXl = `${textFont} text-xl`;
export const textLinkUnderline =
  `font-bold text-base text-stamp-grey-light animated-underline ${transition}`;

/* ===== LINK STYLES ===== */
// Use the specific link styles created or just add "animated-underline" to the class name to apply an animated underline effect

/* ===== LABEL STYLES ===== */
export const labelSm = `${labelFont} text-sm ${cursor}`;
export const label = `${labelFont} text-base ${cursor}`; // = old dataLabel name
export const labelLg = `${labelFont} text-lg ${cursor}`;
export const labelXl = `${labelFont} text-xl ${cursor}`;

/* ===== VALUE STYLES ===== */
export const valueSm = `${valueFont} text-sm ${cursor}`;
export const value = `${valueFont} text-base ${cursor}`;
export const valueLg = `${valueFont} text-lg ${cursor}`;
export const valueXl = `${valueFont} text-xl ${cursor}`;
export const value2xl =
  `font-extrabold text-2xl text-stamp-grey-light -mt-1 ${cursor}`;
export const value3xl =
  `font-extrabold text-3xl text-stamp-grey-light -mt-1 ${cursor}`;
export const valueDarkSm =
  `font-medium text-sm text-stamp-grey-darker tracking-tighter ${cursor}`; // used for addy styling in mobile/table/desktop header

/* ===== TOOLTIP STYLES ===== */
// One text style for tooltips - defined in /notifications/styles.ts

/* ===== CODE STYLES ===== */
// Add "font-courier-prime" to the class name to use the Courier font and make text monospace

/* ===== SPECIAL TEXT STYLES ===== */
export const tagline =
  `font-regular text-sm bg-gradient-to-r from-[#660099] via-[#8800CC] to-[#AA00FF] text-transparent bg-clip-text ${cursor}`; // used in footer
export const copyright =
  `font-normal text-xs mobileMd:text-sm tablet:text-xs ${cursor}`; // transparent text - ued with the overlayPurple class - used in footer

// Captions - used for stamp/token cards
// Errors - used for error messages - to be defined in /notifications/styles.ts
// Success - used for success messages - to be defined in /notifications/styles.ts

/* ===== UNCATEGORIZED STYLES ===== */
// Add any new styles you cannot categorize here

/* ===== LEGACY STYLES ===== */
// Update the legacy styles to new styles
// About page
export const dataLabelPurple =
  "font-light text-base text-stamp-purple-highlight mb-0.5";
export const dataValuePurpleSm =
  "text-2xl mobileLg:text-3xl font-black text-black text-stroke-glow-small";
export const dataValuePurple =
  "text-4xl mobileLg:text-5xl desktop:text-6xl font-black text-black text-stroke-glow-small";
export const dataValuePurpleXl =
  "text-6xl mobileLg:text-7xl desktop:text-8xl font-black text-black text-stroke-glow-large";
export const aboutTitlePurpleLD =
  "text-sm mobileMd:text-lg mobileLg:text-xl font-black purple-gradient1 text-center mt-3 mobileMd:mt-4 mobileLg:mt-5 mb-1 mobileMd:mb-0";
export const aboutSubTitlePurple =
  "text-xs mobileMd:text-base font-medium text-stamp-purple text-center whitespace-nowrap";
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
export const textLoader =
  "text-sm mobileLg:text-base font-medium text-stamp-grey uppercase text-center py-3 animated-text-loader";

/* ===== TYPE DEFINITIONS ===== */
export type TextStyles = {
  // Logo styles
  logoPurpleDL: string;
  logoPurpleDLLink: string;
  logoPurpleLD: string;
  logoPurpleLDLink: string;
  // Navigation styles
  navLinkPurple: string;
  navLinkPurpleThick: string;
  navLinkGrey: string;
  navLinkGreyLD: string;
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
  headingGreyLDLink: string;
  headingGrey: string;
  // Body text styles
  textXxs: string;
  textXs: string;
  textSm: string;
  text: string;
  textLg: string;
  textXl: string;
  textLinkUnderline: string;
  // Label styles
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  // Value styles
  valueSm: string;
  value: string;
  valueLg: string;
  valueXl: string;
  value2xl: string;
  value3xl: string;
  valueDarkSm: string;
  // Special text styles
  tagline: string;
  copyright: string;
  // Legacy styles
  dataLabelPurple: string;
  dataValuePurpleSm: string;
  dataValuePurple: string;
  dataValuePurpleXl: string;
  aboutTitlePurpleLD: string;
  aboutSubTitlePurple: string;
  dataLabel: string;
  dataValue: string;
  dataValueLg: string;
  // Table styles
  dataValueXL: string;
  dataValueXLlink: string;
  textLoader: string;
};
