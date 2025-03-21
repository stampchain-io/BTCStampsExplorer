/**
 * Global text styles for the application
 * Usage:
 * import { titleGreyLD, body } from "$text";
 * <h1 className={titleGreyLD}>Title</h1>
 * <p className={body}>Content</p>
 */

// Type definitions - only import TextStyles when doing type work
// Example: const myStyle: keyof TextStyles = "titleGreyLD";
export type TextStyles = {
  logo: string;
  titleGreyLD: string;
  titleGreyDL: string;
  titlePurpleLD: string;
  titlePurpleDL: string;
  subtitleGrey: string;
  subtitlePurple: string;
  textXxs: string;
  textXs: string;
  textSm: string;
  text: string;
  textLg: string;
  textLink: string;
  labelSm: string;
  label: string;
  labelLg: string;
};

// Text styles
// Logo
export const logo =
  "font-black italic text-4xl purple-hover-gradient hover:purple-hover-gradient2 tracking-wide pr-3 transition-colors duration-300";

// Navigation
// export const navMenuTitle =
//   "font-extrabold text-lg text-stamp-grey-darker group-hover:text-stamp-grey transition-colors duration-300";
// export const navMenuLink =
//   "font-extrabold text-stamp-purple group-hover:text-stamp-purple-bright transition-colors duration-300";

// Titles
export const titleGreyLD =
  "font-black text-3xl mobileMd:text-4xl gray-gradient1 tracking-wide inline-block cursor-default select-none whitespace-nowrap";
export const titleGreyDL =
  "font-black text-3xl mobileMd:text-4xl gray-gradient3 tracking-wide inline-block cursor-default select-none whitespace-nowrap";
export const titlePurpleLD =
  "font-black text-3xl mobileMd:text-4xl purple-gradient3 tracking-wide inline-block cursor-default select-none whitespace-nowrap";
export const titlePurpleDL =
  "font-black text-3xl mobileMd:text-4xl purple-gradient1 tracking-wide inline-block cursor-default select-none whitespace-nowrap";

// Subtitles
export const subtitleGrey =
  "font-extralight text-2xl mobileMd:text-3xl text-stamp-grey-light mb-2 cursor-default select-none whitespace-nowrap";
export const subtitlePurple =
  "font-extralight text-2xl mobileMd:text-3xl text-stamp-purple-bright mb-2 cursor-default select-none whitespace-nowrap";

// Headings

// Body text / Values
export const textXxs = "font-normal text-[10px] text-stamp-grey-light";
export const textXs = "font-normal text-xs text-stamp-grey-light";
export const textSm = "font-normal text-sm text-stamp-grey-light";
export const text = "font-normal text-base text-stamp-grey-light";
export const textLg = "font-normal text-lg text-stamp-grey-light";

// Links
// Just add "animated-underline" to the class name to apply the animated underline effect or use the const below for standard body text
export const textLinkUnderline =
  "font-bold text-base text-stamp-grey-light animated-underline transition-colors duration-300";
export const headingLinkGreyLD = // check naming - used in media index.tsx
  "font-bold text-xl gray-gradient1-hover inline-block relative transition-colors duration-300";

// Labels
export const labelSm =
  "font-medium text-sm text-stamp-grey-light cursor-default select-none whitespace-nowrap";
export const label =
  "font-medium text-base text-stamp-grey-light cursor-default select-none whitespace-nowrap";
export const labelLg =
  "font-medium text-lg text-stamp-grey-light cursor-default select-none whitespace-nowrap";

// Overline - Category labels, above titles (update from filter styles)

// Captions - used for stamp/token cards

// Code
// Add "font-courier-prime" to the class name to use the Courier font and make text monospace

// Tooltips

// Errors

// Success

// Old styles
