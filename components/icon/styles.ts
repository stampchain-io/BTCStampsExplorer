/* ===== ICON STYLES MODULE ===== */
import { JSX } from "preact";

/* ===== TYPE DEFINITIONS ===== */
export interface IconVariants {
  type: "icon" | "iconButton";
  name: string;
  weight: "light" | "normal" | "bold";
  size:
    | "xxxs"
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "xxsR"
    | "xsR"
    | "smR"
    | "mdR"
    | "custom";
  color: "grey" | "purple" | "custom";
  className?: string;
  role?: JSX.AriaRole;
  ariaLabel?: string;
  onClick?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  onMouseEnter?: JSX.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement | HTMLImageElement | SVGElement
  >;
  onMouseLeave?: JSX.MouseEventHandler<
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

/* ===== GLOBAL SVG ATTRIBUTES ===== */
export const globalSvgAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 32 32",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
} as const;

/* ===== ICON STYLE DEFINITIONS ===== */
export const iconStyles = {
  /* ===== BASE STYLES ===== */
  base: "inline-block transition-colors duration-300",

  /* ===== ICON VARIANTS & COLOR STYLES ===== */

  // Note: Two-tone colors are built into the icon styles below
  // Custom color allows for special icons with advanced coloring:
  // - Gear icon in collapsible menu (mobile menu drawer) has conditional color based on menu state
  // - Close icon in mobile menu drawer has custom gradient fill options (grey/purple)
  //   - the gradient defs have to be included in the file, since creating a global gradient file for them requires moving them up in the DOM tree (I abandoned this approach)

  icon: {
    grey: "stroke-stamp-grey-darker fill-none",
    purple: "stroke-stamp-purple fill-none",
    custom: "",
  },

  iconButton: {
    grey:
      "stroke-stamp-grey hover:stroke-stamp-grey-light fill-none hover:fill-none cursor-pointer",
    purple:
      "stroke-stamp-purple hover:stroke-stamp-purple-bright fill-none hover:fill-none cursor-pointer",
    custom: "",
  },

  /* ===== WEIGHT VARIANTS ===== */
  weight: {
    light: "[stroke-width:1.75]",
    normal: "[stroke-width:2.25]",
    bold: "[stroke-width:3]",
  },

  /* ===== SIZE VARIANTS ===== */
  size: {
    xxxs: "w-3 h-3",
    xxs: "w-4 h-4",
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-8 h-8",
    xl: "w-9 h-9",
    xxl: "w-10 h-10",
    xxsR: "w-4 h-4 tablet:w-[14px] tablet:h-[14px]",
    xsR: "w-5 h-5 tablet:w-[18px] tablet:h-[18px]",
    smR: "w-6 h-6 tablet:w-[22px] tablet:h-[22px]",
    mdR: "w-7 h-7 tablet:w-[26px] tablet:h-[26px]",
    custom: "",
  },
} as const;

/* ===== INTERACTIVE ELEMENT STYLES ===== */
/* ===== SLIDER HANDLE ===== */
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
