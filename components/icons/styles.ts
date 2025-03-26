import type { JSX } from "preact";

/* ===== ICON BASE PROPS ===== */
export interface IconVariants {
  type: "icon" | "iconLink" | "iconButton";
  name: string;
  weight: "light" | "normal" | "bold";
  size: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  color: "grey" | "purple" | "gradient";
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

/* ===== BADGE PROPS ===== */
export interface BadgeVariants {
  text: string;
  className?: string;
}

/* ===== ICON STYLES ===== */
export const iconStyles = {
  base: "inline-block transition-colors duration-300",
  size: {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
    xxl: "w-12 h-12",
  },
  color: {
    grey: "fill-stamp-grey hover:fill-stamp-grey-light",
    purple: "fill-stamp-purple hover:fill-stamp-purple-bright",
    gradient: "",
  },
  type: {
    icon: "hover:!fill-none",
    iconLink: "hover:fill-red-500 transition-colors duration-300",
    iconButton: "hover:fill-green-500 transition-colors duration-300",
  },
} as const;

/* ===== CUSTOM ICONS ===== */
/* ===== SLIDER HANDLE ICON ===== */
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

/* ===== CHECKBOX ICON ===== */
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
