/* ===== TEXT STYLES MODULE ===== */

/* ===== BASE STYLES ===== */
const logoFont = "font-black italic text-3xl tracking-wide inline-block w-fit";
const titleFont = "font-black text-3xl tracking-wide inline-block w-fit";
const subtitleFont = "font-extralight text-2xl mb-2";
const textFont = "font-normal text-color-neutral-light";
const labelFont = "font-light text-color-neutral-semidark tracking-wide";
const valueFont = "font-medium text-color-neutral-light";
const select = "select-none whitespace-nowrap";
const transitionColors = "transition-colors duration-200";

/* ===== OVERLAY STYLES ===== */
// Overlays - used for text overlay effects of whole divs - text must be transparent or not declared with tailwind css
export const overlayPurple =
  `bg-gradient-to-l from-color-primary-semilight/80 via-color-primary-semilight/90 to-color-primary-semilight
  tablet:bg-gradient-to-r text-transparent bg-clip-text`;

/* ===== LOGO STYLES ===== */
export const logoPurpleDL = `${logoFont} color-primary-gradientDL ${select}`; // used in footer
export const logoPurpleDLLink =
  `${logoFont} color-primary-gradientDL-hover ${transitionColors} cursor-pointer ${select}`;
export const logoPurpleLD = `${logoFont} color-primary-gradientLD ${select}`;
export const logoPurpleLDLink =
  `${logoFont} color-primary-gradientLD-hover ${transitionColors} cursor-pointer ${select}`;

/* ===== NAVIGATION STYLES ===== */
// Header - Desktop
export const navLinkPurple =
  `font-semibold tablet:font-normal text-color-primary-semilight text-sm tablet:text-[13px] group-hover:text-color-primary-light tracking-wider ${transitionColors} cursor-pointer ${select}`;
export const navLinkPurpleActive =
  `${navLinkPurple} !text-color-primary-light hover:!text-color-primary-semilight`;
export const navSublinkPurple =
  `font-light text-color-primary-semilight text-[13px] hover:text-color-primary-light tracking-wider ${transitionColors} cursor-pointer ${select}`; // used in WalletButton and ToolsButton for submenu links
export const navSublinkPurpleActive =
  `${navSublinkPurple} !text-color-primary-light hover:!text-color-primary-semilight`;
// Header - Mobile/tablet
export const navLinkGrey =
  `font-semibold text-sm tablet:text-xs text-color-neutral hover:text-color-neutral-light
  tracking-wide ${transitionColors} cursor-pointer ${select}`;
export const navLinkGreyActive =
  `${navLinkGrey} !text-color-neutral-light hover:!text-color-neutral`;
export const navLinkGreyLD =
  `font-light text-xl tablet:text-lg color-neutral-gradientLD-hover tracking-wider inline-block w-fit ${transitionColors} cursor-pointer ${select}`;
export const navLinkGreyLDActive =
  `${navLinkGreyLD} text-color-neutral-light [background:none_!important] [-webkit-text-fill-color:var(--color-neutral-semilight)_!important] [text-fill-color:var(--color-neutral-semilight)_!important] hover:[-webkit-text-fill-color:var(--color-neutral)!important] hover:[text-fill-color:var(--color-neutral)!important]`;
// Footer - transparent text - ued with the overlayPurple class
export const navLinkTransparentPurple =
  `font-light text-[13px] hover:text-color-primary-light tracking-wider ${transitionColors} cursor-pointer ${select}`;

/* ===== TITLE STYLES ===== */
export const titleGreyLD =
  `${titleFont} color-neutral-gradientLD cursor-default ${select}`;
export const titleGreyDL =
  `${titleFont} color-neutral-gradientDL cursor-default ${select}`;
export const titlePurpleLD =
  `${titleFont} color-primary-gradientLD cursor-default ${select}`;
export const titlePurpleDL =
  `${titleFont} color-primary-gradientDL cursor-default ${select}`;

/* ===== SUBTITLE STYLES ===== */
export const subtitleGrey =
  `${subtitleFont} text-color-neutral-light cursor-default ${select}`;
export const subtitlePurple =
  `${subtitleFont} text-color-primary-light cursor-default ${select}`;

/* ===== HEADING STYLES ===== */
export const headingGrey2 =
  `font-black text-3xl mobileLg:text-4xl text-color-neutral-light tracking-wide ${select}`; // was used in about donate section - rename
export const headingGreyLD =
  `font-bold text-xl color-neutral-gradientLD tracking-wide inline-block w-fit relative ${select}`;
export const headingGreyLDLink =
  `font-bold text-lg color-neutral-gradientLD-hover tracking-wide inline-block w-fit relative ${transitionColors} cursor-pointer ${select}`; // used in media page / keep reading in howto pages / accordion titles (custom code)
export const headingGreyDLLink =
  `font-bold text-lg color-neutral-gradientDL-hover tracking-wide inline-block w-fit relative -mt-1 ${transitionColors} cursor-pointer ${select}`; // used in collection and stamp detail pages
export const headingGrey =
  `font-bold text-2xl text-color-neutral cursor-default ${select}`; // used in howto overview and detail pages / donate CTA
export const headingPurpleLD =
  "font-black text-sm mobileMd:text-lg color-primary-gradientLD tracking-wide inline-block w-fit text-center mt-3 mobileMd:mt-4 mobileLg:mt-5 mb-1 mobileMd:mb-0"; // used specifically in team banner gallery

/* ===== BODY TEXT STYLES ===== */
export const textXxs = `${textFont} text-[10px]`;
export const textXs = `${textFont} text-xs`;
export const textSm = `${textFont} text-sm`;
export const textSmLink =
  `${textFont} text-sm hover:text-color-primary-light ${transitionColors} cursor-pointer ${select}`;
export const text = `${textFont} text-base`;
export const textLg = `${textFont} text-lg`;
export const textXl = `${textFont} text-xl`;
export const text2xl = `${textFont} text-2xl`;
export const textLinkUnderline =
  `font-bold text-base text-color-neutral-light animated-underline ${transitionColors}`;

/* ===== LINK STYLES ===== */
// Use the specific link styles created or just add "animated-underline" to the class name to apply an animated underline effect

/* ===== LABEL STYLES ===== */
export const labelXxs = `${labelFont} text-[10px] ${select}`;
export const labelXs = `${labelFont} text-xs ${select}`;
export const labelSm = `${labelFont} text-sm ${select}`;
export const label = `${labelFont} text-base ${select}`; // old dataLabel name
export const labelLg = `${labelFont} text-lg ${select}`;
export const labelXl = `${labelFont} text-xl ${select}`;
export const labelXsR = `${labelFont} text-xs tablet:text-[10px] ${select}`; // used for the filter file type labels
export const labelXsPosition =
  `flex justify-end mt-1 tablet:mt-0 -mb-5 tablet:-mb-4`; // used for the filter file type label positioning
export const labelLightSm = `font-light text-sm text-color-neutral ${select}`;

export const labelSmPurple =
  `font-light text-sm text-color-primary-light tracking-wide mb-0.5 ${select}`;

export const labelLogicResponsive = ( // used for the filter labels
  checked: boolean,
  canHoverSelected: boolean,
): string => `
  inline-block ml-3 tablet:ml-[9px] pt-[1px] tablet:pt-0
  font-semibold text-sm tablet:text-xs
  transition-colors duration-200
  select-pointer select-none
  ${
  checked
    ? canHoverSelected
      ? "text-color-neutral-light group-hover:text-color-neutral"
      : "text-color-neutral-light"
    : canHoverSelected
    ? "text-color-neutral group-hover:text-color-neutral-light"
    : "text-color-neutral"
}
`;

/* ===== VALUE STYLES ===== */
// Grey variants
export const valueXs = `${valueFont} text-xs ${select}`;
export const valueSm = `${valueFont} text-sm ${select}`;
export const valueSmLink =
  `${valueFont} text-sm hover:text-color-primary-light ${transitionColors} cursor-pointer w-full ${select}`;
export const value = `${valueFont} text-base ${select}`;
export const valueLg = `${valueFont} text-lg ${select}`;
export const valueXl =
  `font-black text-xl text-color-neutral-light -mt-1  ${select}`;
export const value2xl =
  `font-black text-2xl text-color-neutral-light -mt-1 ${select}`;
export const value3xl =
  `font-black text-3xl text-color-neutral-light -mt-1 ${select}`;
// Transparent variants
export const value2xlTransparent = `font-black text-2xl -mt-1 ${select}`;
export const value3xlTransparent = `font-black text-3xl -mt-1 ${select}`; // used in DetailsTableBase.tsx
// Purple variants
export const valueSmPurple =
  `font-medium text-xs text-color-primary text-center wcursor-default ${select}`; // used in team banner gallery
export const value2xlPurpleGlow =
  `font-black text-2xl text-black text-stroke-glow-small cursor-default ${select}`; // used in about header
export const value5xlPurpleGlow =
  `font-black text-5xl text-black text-stroke-glow-small cursor-default ${select}`; // used in about header
export const value7xlPurpleGlow =
  `font-black text-7xl text-black text-stroke-glow-large cursor-default ${select}`; // used in about header
// Dark variants
export const valueDarkXs =
  `font-medium text-xs text-color-neutral-semidark tracking-tighter ${select}`; // used for addy styling in mobile/table header
export const valueDarkSm =
  `font-medium text-sm text-color-neutral-semidark tracking-tighter ${select}`; // used for addy styling in desktop header
export const valueDark =
  `font-semibold text-base text-color-neutral-semidark ${select}`; // used in tables
// Color variants
export const valuePositive = `text-green-600`;
export const valueNegative = `text-red-600`;
export const valueNeutral = `text-color-neutral-semidark`;

/* ===== TOOLTIP STYLES ===== */
// One text style for tooltips - defined in /notifications/styles.ts

/* ===== CODE STYLES ===== */
// Add "font-courier-prime" to the class name to use the Courier font and make text monospace

/* ===== SPECIAL TEXT STYLES ===== */
export const tagline =
  `font-regular text-xs bg-gradient-to-r from-color-primary-light via-color-primary-semilight to-color-primary-semidark text-transparent bg-clip-text cursor-default ${select}`; // used in footer
export const copyright =
  `font-normal text-xs mobileMd:text-sm tablet:text-xs text-color-neutral-dark cursor-default ${select}`; // used in the footer for copyright and counterparty version text
export const toggleSymbol =
  `font-bold text-[10px] text-black cursor-default ${select}`; // used in ToggleSwitchButton.tsx for $/BTC symbols

// Captions - used for stamp/token cards
// Errors - used for error messages - to be defined in /notifications/styles.ts
// Success - used for success messages - to be defined in /notifications/styles.ts

/* ===== CARD TEXT STYLES ===== */
// Standard card styles
export const cardHashSymbol =
  `font-light text-color-primary-light text-lg mobileLg:text-xl ${select}`;
export const cardStampNumber =
  `font-extrabold text-color-primary-light truncate max-w-full text-lg mobileLg:text-xl ${select}`;
export const cardCreator =
  `font-semibold text-color-neutral-light break-words text-center pt-1 text-xs mobileMd:text-sm ${select}`;
export const cardPrice =
  `font-normal text-color-neutral-light text-nowrap text-xs mobileLg:text-sm ${select}`;
export const cardMimeType =
  `font-normal text-color-neutral text-nowrap text-xs mobileLg:text-sm ${select}`;
export const cardSupply =
  `font-medium text-color-neutral text-right text-xs mobileLg:text-base ${select}`;

// Minimal card variant styles
export const cardHashSymbolMinimal =
  `font-light text-color-neutral-light group-hover:text-color-primary-light text-xs mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl ${transitionColors} ${select}`;
export const cardStampNumberMinimal =
  `font-black color-neutral-gradientLD group-hover:[-webkit-text-fill-color:var(--color-primary-light)] truncate text-sm mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl ${transitionColors} ${select}`;
export const cardPriceMinimal =
  `font-normal text-color-neutral truncate text-nowrap text-[10px] mobileMd:text-xs mobileLg:text-sm ${select}`;

// Grey gradient card variant styles
export const cardHashSymbolGrey =
  `font-light text-color-neutral group-hover:text-color-primary-light text-lg min-[420px]:text-xl ${transitionColors} ${select}`;
export const cardStampNumberGrey =
  `font-black color-neutral-gradientLD group-hover:[-webkit-text-fill-color:var(--color-primary-light)] truncate max-w-full text-lg min-[420px]:text-xl ${transitionColors} ${select}`;

/* ===== CARD CONFIGURATION - check if used ===== */
export const ABBREVIATION_LENGTHS = {
  desktop: 5,
  tablet: 5,
  mobileLg: 4,
  mobileMd: 5,
  mobileSm: 5,
} as const;

/* ===== UNCATEGORIZED STYLES ===== */
// Add any new styles you cannot categorize here

/* ===== TYPE DEFINITIONS ===== */
export type TextStyles = {
  // Overlay styles
  overlayPurple: string;
  // Logo styles
  logoPurpleDL: string;
  logoPurpleDLLink: string;
  logoPurpleLD: string;
  logoPurpleLDLink: string;
  // Navigation styles
  navLinkPurple: string;
  navLinkPurpleActive: string;
  navSublinkPurple: string;
  navSublinkPurpleActive: string;
  navLinkGrey: string;
  navLinkGreyLD: string;
  navLinkGreyLDActive: string;
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
  headingGreyDLLink: string;
  headingGrey: string;
  headingPurpleLD: string;
  // Body text styles
  textXxs: string;
  textXs: string;
  textSm: string;
  textSmLink: string;
  text: string;
  textLg: string;
  textXl: string;
  text2xl: string;
  textLinkUnderline: string;
  // Label styles
  labelXxs: string;
  labelXs: string;
  labelSm: string;
  label: string;
  labelLg: string;
  labelXl: string;
  labelXsR: string;
  labelXsPosition: string;
  labelLightSm: string;
  labelSmPurple: string;
  labelLogicResponsive: (
    checked: boolean,
    canHoverSelected: boolean,
  ) => string;
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
  valueGain: string;
  valueLoss: string;
  // Special text styles
  tagline: string;
  copyright: string;
  toggleSymbol: string;
  // Card text styles
  cardHashSymbol: string;
  cardStampNumber: string;
  cardCreator: string;
  cardPrice: string;
  cardMimeType: string;
  cardSupply: string;
  cardHashSymbolMinimal: string;
  cardStampNumberMinimal: string;
  cardPriceMinimal: string;
  cardHashSymbolGrey: string;
  cardStampNumberGrey: string;
};
