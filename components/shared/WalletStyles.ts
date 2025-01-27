// Container styles
export const backgroundContainer =
  "flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6";

// Data column and layout styles
export const dataColumn = "flex flex-col -space-y-1";

// Text styles - Labels
export const dataLabelSm =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
export const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
export const dataLabelLg =
  "text-lg mobileLg:text-xl font-light text-stamp-grey-darker uppercase";

// Text styles - Values
export const dataValueXs =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light";
export const dataValueSm =
  "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
export const dataValue =
  "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
export const dataValueLg =
  "text-xl mobileLg:text-2xl font-medium text-stamp-grey-light uppercase";
export const dataValueXl =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light";

// Title styles
export const titleGreyDL =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
export const subTitleGrey =
  "inline-block text-sm mobileMd:text-base mobileLg:text-lg font-medium text-stamp-grey-darker";

// Button styles
export const buttonPurpleFlat =
  "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors";
export const buttonGreyOutline =
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

// Tooltip styles
export const tooltipIcon =
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";

// Header styles
export const titlePurpleDL =
  "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

// Alignment utilities
export const alignmentClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

// Type for alignment options
export type AlignmentType = keyof typeof alignmentClasses;
