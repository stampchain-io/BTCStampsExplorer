/* ===== ICON STYLES MODULE ===== */
import type { JSX } from "preact";

/* ===== INTERFACE DEFINITIONS ===== */
export interface IconVariants {
  name: string;
  weight: "light" | "normal" | "bold";
  size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  color: "grey" | "purple" | "gradient";
  type: "icon" | "iconLink" | "iconButton";
  className?: string;
  role?: JSX.AriaRole;
  ariaLabel?: string;
  onClick?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  href?: string;
  target?: string;
  rel?: string;
  text?: string;
}

export interface BadgeVariants {
  text: string;
  className?: string;
}

/* ===== ICON STYLES ===== */
export const iconStyles = {
  /* ===== BASE STYLES ===== */
  base: "inline-block transition-colors duration-300",

  /* ===== SIZE VARIANTS ===== */
  size: {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-8 h-8",
    xl: "w-9 h-9",
    xxl: "w-10 h-10",
  },

  /* ===== BASIC ICON STYLES ===== */
  icon: {
    grey: "fill-stamp-grey",
    purple: "fill-stamp-purple",
    gradient: "",
  },

  /* ===== ICON LINK STYLES ===== */
  iconLink: {
    grey: "fill-stamp-grey hover:fill-stamp-grey-light",
    purple: "fill-stamp-purple hover:fill-stamp-purple-bright",
    gradient: "",
  },

  /* ===== ICON BUTTON STYLES ===== */
  iconButton: {
    grey:
      "fill-stamp-grey hover:fill-stamp-grey-light bg-[#333333]/40 hover:bg-[#333333]/20 tablet:bg-transparent tablet:hover:bg-transparent rounded-md p-1.5",
    purple:
      "fill-stamp-purple hover:fill-stamp-purple-bright bg-[#333333]/40 hover:bg-[#333333]/20 tablet:bg-transparent tablet:hover:bg-transparent rounded-md p-1.5",
    gradient: "",
  },
} as const;

/* ===== CUSTOM ICON STYLES ===== */
/* ===== SLIDER HANDLE STYLES ===== */
export const handleIcon = `
  absolute w-full h-4 tablet:h-3 rounded-full appearance-none bg-transparent pointer-events-none 
  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
  [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:tablet:size-3
  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stamp-grey
  [&::-webkit-slider-thumb]:hover:bg-stamp-grey-light [&::-webkit-slider-thumb]:cursor-grab
  [&::-webkit-slider-thumb]:active:cursor-grabbing
  [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
  [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:tablet:size-3
  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-stamp-grey
  [&::-moz-range-thumb]:hover:bg-stamp-grey-light [&::-moz-range-thumb]:cursor-grab
  [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-0
`;

/* ===== CHECKBOX STYLES ===== */
export const checkboxIcon = (
  checked: boolean,
  canHoverSelected: boolean,
): string => `
  appearance-none
  relative
  size-4 tablet:size-3.5
  rounded-full
  border-2
  cursor-pointer
  transition-colors duration-300
  ${
  checked
    ? canHoverSelected
      ? "border-stamp-grey-light after:bg-stamp-grey-light group-hover:border-stamp-grey group-hover:after:bg-stamp-grey"
      : "border-stamp-grey-light after:bg-stamp-grey-light"
    : canHoverSelected
    ? "border-stamp-grey group-hover:border-stamp-grey-light"
    : "border-stamp-grey"
}
  after:content-['']
  after:block
  after:size-2 tablet:after:size-1.5
  after:rounded-full
  after:absolute
  after:top-1/2 after:left-1/2
  after:-translate-x-1/2 after:-translate-y-1/2
  after:scale-0
  checked:after:scale-100
  after:transition-all
  after:duration-100
`;
