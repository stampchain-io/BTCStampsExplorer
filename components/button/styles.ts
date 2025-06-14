/* ===== BUTTON STYLES MODULE ===== */
import { JSX } from "preact";

/* ===== TYPE DEFINITIONS ===== */
export interface ButtonVariants {
  base: string;
  variant: Record<
    | "text"
    | "flat"
    | "outline"
    | "flatOutline"
    | "outlineFlat"
    | "outlineGradient"
    | "flatOutlineSelector"
    | "outlineFlatSelector",
    string
  >;
  color: Record<
    | "grey"
    | "greyDark"
    | "greyGradient"
    | "purple"
    | "purpleDark"
    | "purpleGradient"
    | "test"
    | "custom",
    string
  >;
  size: Record<
    "xs" | "sm" | "md" | "lg" | "xl" | "smR" | "mdR",
    string
  >;
  textSize: Record<
    "xs" | "sm" | "md" | "lg" | "xl",
    string
  >;
  state: {
    disabled: string;
    loading: string;
    active: string;
  };
  spinner: string;
}

/* ===== BUTTON PROPS INTERFACES ===== */
interface BaseButtonProps {
  variant: keyof typeof buttonStyles.variant;
  color: keyof typeof buttonStyles.color;
  size: keyof typeof buttonStyles.size;
  class?: string;
  children?: JSX.Element | string;
  disabled?: boolean;
  role?: JSX.AriaRole;
  ariaLabel?: string;
  onClick?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onMouseEnter?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onMouseLeave?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onFocus?: JSX.FocusEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  onBlur?: JSX.FocusEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  "data-type"?: string;
}

export interface ButtonElementProps extends BaseButtonProps {
  href?: undefined;
  "f-partial"?: undefined;
  target?: undefined;
}

export interface AnchorElementProps extends BaseButtonProps {
  href: string;
  "f-partial"?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

export type ButtonProps = ButtonElementProps | AnchorElementProps;

/* ===== BUTTON STYLE DEFINITIONS ===== */
export const buttonStyles: ButtonVariants = {
  /* ===== BASE STYLES ===== */
  base: `
    inline-flex items-center justify-center
    rounded-md border-2 
    font-bold tracking-wide
    transition-colors duration-300
  `,

  /* ===== VARIANT STYLES ===== */
  variant: {
    text: `
      bg-transparent
      !border-0 !p-0 !h-auto
      !items-start !justify-start
      font-semibold tracking-wide
      text-[var(--default-color)] hover:text-[var(--hover-color)]
    `,
    flat: `
      bg-[var(--default-color)] hover:bg-[var(--hover-color)]
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-black
    `,
    outline: `
      bg-transparent
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-[var(--default-color)] hover:text-[var(--hover-color)]
    `,
    flatOutline: `
      bg-[var(--default-color)] hover:bg-transparent 
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-black hover:text-[var(--hover-color)]
    `,
    outlineFlat: `
      bg-transparent hover:bg-[var(--hover-color)] 
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-[var(--default-color)] hover:text-black
    `,
    outlineGradient: `
      relative !bg-[linear-gradient(to_right,#1a0824,#210925)] !p-[2px] rounded-md !border-0
      before:absolute before:inset-0 before:rounded-md before:z-[1]
      before:bg-[conic-gradient(from_var(--angle),var(--color-dark),var(--color-medium),var(--color-light),var(--color-medium),var(--color-dark))]
      before:[--angle:0deg] before:animate-rotate
      hover:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
      before:transition-colors before:duration-300
      [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[linear-gradient(to_right,#1a0824,#210925)] [&>*]:!border-0
      [&>*]:inline-flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full [&>*]:px-5
      [&>*]:font-bold [&>*]:tracking-wider 
      [&>*]:text-[var(--default-color)] hover:[&>*]:text-[var(--hover-color)]
      [&>*]:transition-colors [&>*]:duration-100
    `,
    flatOutlineSelector: `
      bg-[var(--hover-color)] border-[var(--hover-color)] text-black
      hover:bg-[var(--hover-color)] hover:border-[var(--hover-color)] hover:text-black
    `,
    outlineFlatSelector: `
      bg-transparent border-[var(--default-color)] text-[var(--default-color)]
      hover:bg-[var(--hover-color)] hover:border-[var(--hover-color)] hover:text-black
    `,
  },

  /* ===== COLOR STYLES ===== */
  color: {
    grey: `
      [--default-color:#999999]
      [--hover-color:#CCCCCC]
    `,
    greyDark: `
      [--default-color:#666666]
      [--hover-color:#999999]
    `,
    greyGradient: `
      [--color-dark:#666666]
      [--color-medium:#999999]
      [--color-light:#CCCCCC]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
    `,
    purple: `
      [--default-color:#8800CC]
      [--hover-color:#AA00FF]
    `,
    purpleDark: `
      [--default-color:#660099]
      [--hover-color:#8800CC]
    `,
    purpleGradient: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
    `,
    test: `
      [--default-color:#00CC00]
      [--hover-color:#CC0000]
    `,
    custom: "",
  },

  /* ===== SIZE STYLES ===== */
  size: {
    xs: "h-[30px] px-[14px] text-xs",
    sm: "h-[34px] px-4 text-xs",
    md: "h-[38px] px-4 text-sm",
    lg: "h-[42px] px-4 text-sm",
    xl: "h-[46px] px-5 text-base",
    smR: "h-[34px] tablet:h-[30px] px-4 text-xs",
    mdR: "h-[38px] tablet:h-[34px] px-4 text-sm tablet:text-xs",
  },

  /* ===== TEXT SIZE STYLES - ONLY USED FOR TEXT BUTTONS ===== */
  textSize: {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  },

  /* ===== STATE STYLES ===== */
  state: {
    disabled: `
      opacity-50
      cursor-not-allowed
      pointer-events-none
    `,
    loading: `
      cursor-wait
      opacity-75
    `,
    active: `
      scale-95
      transform
      transition-transform
    `,
  },

  /* ===== SPINNER STYLES - @baba - duplicate of loaderSpin in layout/styles.ts ===== */
  spinner: `
    animate-spin 
    rounded-full 
    h-5 w-5 
    border-b-[3px] 
    border-[var(--hover-color)]
  `,
};

/* ===== ADDITIONAL STYLES ===== */
/* ===== TEMPORARY STYLES ===== */
/* @baba - update feeCalculatorBase buttons */
export const buttonPurpleOutline =
  "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm font-bold tracking-wider text-stamp-purple h-[38px] px-4 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors duration-300";
export const buttonPurpleFlat =
  "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm font-bold tracking-wider text-black h-[38px] px-4 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors duration-300";

/* ===== TOGGLE SWITCH BUTTON STYLES ===== */
export const toggleButton =
  "flex items-center relative w-10 h-5 rounded-full bg-stamp-grey focus:outline-none transition duration-300";
export const toggleKnobBackground =
  "flex justify-center items-center relative w-5 h-5 bg-stamp-grey rounded-full transition transform duration-500 ";
export const toggleKnob = "w-[18px] h-[18px] rounded-full";
export const sliderKnob =
  `[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:tablet:w-4 [&::-webkit-slider-thumb]:tablet:h-4 [&::-webkit-slider-thumb]:appearance-none
   [&::-webkit-slider-thumb]:bg-stamp-purple-dark [&::-webkit-slider-thumb]:hover:bg-stamp-purple [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
   [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:tablet:w-4 [&::-moz-range-thumb]:tablet:h-4 [&::-moz-range-thumb]:appearance-none
   [&::-moz-range-thumb]:bg-stamp-purple-dark [&::-moz-range-thumb]:hover:bg-stamp-purple-dark [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer`;
export const sliderBar =
  `w-full h-1.5 tablet:h-1 rounded-lg bg-stamp-grey appearance-none cursor-pointer`;

/* ===== STYLE COMPOSITION FUNCTION ===== */
export const button = (
  variant: keyof typeof buttonStyles.variant,
  color: keyof typeof buttonStyles.color,
  size: keyof typeof buttonStyles.size,
  state?: {
    disabled?: boolean | undefined;
    loading?: boolean | undefined;
    active?: boolean | undefined;
  },
) => {
  const stateClasses = [];
  if (state?.disabled) stateClasses.push(buttonStyles.state.disabled);
  if (state?.loading) stateClasses.push(buttonStyles.state.loading);
  if (state?.active) stateClasses.push(buttonStyles.state.active);

  return `
    ${buttonStyles.base} 
    ${buttonStyles.variant[variant]} 
    ${buttonStyles.color[color]} 
    ${buttonStyles.size[size]}
    ${stateClasses.join(" ")}
  `;
};
