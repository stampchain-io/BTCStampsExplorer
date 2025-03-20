/**
 * Global text styles for the application
 * Usage:
 * import { titleGreyLD, body } from "$components/text/styles.ts";
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
  bodyXxs: string;
  bodyXs: string;
  bodySm: string;
  body: string;
  bodyLg: string;
  labelSm: string;
  label: string;
  labelLg: string;
};

// Text styles
// Logo
export const logo =
  "font-black italic text-4xl purple-hover-gradient hover:purple-hover-gradient2 tracking-wide pr-3";

// Title
export const titleGreyLD =
  "font-black text-3xl mobileMd:text-4xl gray-gradient1 inline-block";
export const titleGreyDL =
  "font-black text-3xl mobileMd:text-4xl gray-gradient3 inline-block";
export const titlePurpleLD =
  "font-black text-3xl mobileMd:text-4xl purple-gradient3 inline-block";
export const titlePurpleDL =
  "font-black text-3xl mobileMd:text-4xl purple-gradient1 inline-block";

// Subtitle
export const subtitleGrey =
  "font-extralight text-2xl mobileMd:text-3xl text-stamp-grey-light mb-2";
export const subtitlePurple =
  "font-extralight text-2xl mobileMd:text-3xl text-stamp-purple-bright mb-2";

// Body
export const textXxs = "font-normal text-[10px] text-stamp-grey-light";
export const textXs = "font-normal text-xs text-stamp-grey-light";
export const textSm = "font-normal text-sm text-stamp-grey-light";
export const text = "font-normal text-base text-stamp-grey-light";
export const textLg = "font-normal text-lg text-stamp-grey-light";
export const textLink =
  "font-bold text-base text-stamp-grey-light animated-underline";

// Label
export const labelSm = "font-medium text-sm text-stamp-grey-light";
export const label = "font-medium text-base text-stamp-grey-light";
export const labelLg = "font-medium text-lg text-stamp-grey-light";

// Code
// Add "font-courier-prime" to the class name to use the Courier font and make it monospace
