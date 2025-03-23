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
export const headingGrey2 =
  "font-black text-3xl mobileLg:text-4xl text-stamp-grey-light tracking-wide cursor-default select-none whitespace-nowrap"; // was used in about donate section - rename
export const headingGreyLDLink = // used in media page / keep reading in howto pages
  "font-bold text-xl gray-gradient1-hover tracking-wide inline-block relative transition-colors duration-300";
export const headingGrey =
  "font-bold text-2xl mobileMd:text-3xl text-stamp-grey tracking-wide cursor-default select-none";

// Body text / Values
export const textXxs = "font-normal text-[10px] text-stamp-grey-light";
export const textXs = "font-normal text-xs text-stamp-grey-light";
export const textSm = "font-normal text-sm text-stamp-grey-light";
export const text = "font-normal text-base text-stamp-grey-light";
export const textLg = "font-normal text-lg text-stamp-grey-light";
export const textXl = "font-normal text-xl text-stamp-grey-light";
export const textLinkUnderline =
  "font-bold text-base text-stamp-grey-light animated-underline transition-colors duration-300";

// Links
// Use the specifics created or just add "animated-underline" to the class name to apply the animated underline effect

// Labels
export const labelSm =
  "font-medium text-sm text-stamp-grey-light cursor-default select-none whitespace-nowrap";
export const label =
  "font-medium text-base text-stamp-grey-light cursor-default select-none whitespace-nowrap"; // = dataValue
export const labelLg =
  "font-medium text-lg text-stamp-grey-light cursor-default select-none whitespace-nowrap";

export const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey -mt-1";
export const dataValueXLlink = "text-3xl mobileLg:text-4xl font-black -mt-1";
export const textLoader =
  "text-sm mobileLg:text-base font-medium text-stamp-grey uppercase text-center py-3 animated-text-loader";

// Overline - Category labels, above titles (update from filter styles)
export const overline =
  "font-light text-base text-stamp-grey-darker tracking-wide inline-block cursor-default select-none whitespace-nowrap";

// Captions - used for stamp/token cards

// Code
// Add "font-courier-prime" to the class name to use the Courier font and make text monospace

// Tooltips

// Errors

// Success

// Old styles
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
  "text-base mobileLg:text-lg font-light text-yellow-500 uppercase";

// Footer
export const footerLogo =
  "font-black italic text-3xl mobileLg:text-5xl tablet:text-4xl purple-gradient2";
export const footerTagline =
  "font-regular text-sm mobileLg:text-base tablet:text-sm text-stamp-purple-bright";
export const footerNavTitle =
  "font-extrabold text-xs tablet:text-sm text-stamp-purple-dark tracking-wide ";
export const navContent =
  "font-bold text-xl tablet:text-sm hover:text-stamp-purple-bright";
export const copyright =
  "font-light text-xs tablet:text-sm text-stamp-purple-darker/30";
