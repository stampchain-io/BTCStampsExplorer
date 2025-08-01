/* ===== BUTTON STYLES MODULE ===== */
import { JSX } from "preact";
/* ===== TYPE DEFINITIONS ===== */

// Basic button props interface - exclude conflicting HTML attributes
export interface ButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, "loading" | "size"> {
  variant?: keyof ButtonVariants["variant"];
  color?: keyof ButtonVariants["color"];
  size?: keyof ButtonVariants["size"];
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
  "data-type"?: string;
  "f-partial"?: string;
}

export interface ButtonVariants {
  base: string;
  variant: Record<
    | "text"
    | "flat"
    | "outline"
    | "flatOutline"
    | "outlineFlat"
    | "outlineGradient",
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
    // when adding new sizes, update the ToggleButton.tsx file too
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxsR"
    | "xsR"
    | "smR"
    | "mdR"
    | "lgR",
    string
  >;
  textSize: Record<
    "xs" | "sm" | "md" | "lg" | "xl",
    string
  >;
  padding: Record<
    "xs" | "sm" | "md" | "lg",
    string
  >;
  pillSize: Record<
    "xs" | "sm" | "md" | "lg",
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

/* ===== BUTTON STYLE DEFINITIONS ===== */
export const buttonStyles: ButtonVariants = {
  /* ===== BASE STYLES ===== */
  base: `
    inline-flex items-center justify-center
    rounded-lg border-[1px]
    font-bold tracking-wide
    transition-colors ease-in-out duration-200
  `,

  /* ===== VARIANT STYLES ===== */
  variant: {
    text: `
      !items-start !justify-start !h-auto
      !p-0 bg-transparent !border-0
      font-semibold tracking-wide
      text-[var(--default-color)] hover:text-[var(--hover-color)]
    `,
    flat: `
      bg-gradient-to-br from-[var(--color-light)] to-[var(--color-dark)]
      border-[var(--color-dark)] text-black
      hover:bg-gradient-to-br hover:from-[var(--color-light)] hover:to-[var(--color-light)]
      hover:border-[var(--color-light)]
    `,
    outline: `
      bg-transparent border-[var(--color-dark)] text-[var(--color-dark)]
      hover:border-[var(--color-light)] hover:text-[var(--color-light)]
    `,
    flatOutline: `
      bg-gradient-to-br from-[var(--color-light)] to-[var(--color-dark)]
      border-[var(--color-dark)] text-black
      hover:bg-gradient-to-br hover:from-transparent hover:to-transparent
      hover:border-[var(--color-dark)] hover:text-[var(--color-dark)]
    `,
    outlineFlat: `
      bg-transparent border-[var(--color-dark)] text-[var(--color-dark)]
      hover:bg-gradient-to-br hover:from-[var(--color-light)] hover:to-[var(--color-dark)] hover:border-[var(--color-dark)] hover:text-black
    `,
    outlineGradient: `
      relative !bg-[linear-gradient(to_right,#1a0824,#210925)] !p-[1px] rounded-lg !border-0
      before:absolute before:inset-0 before:rounded-lg before:z-[1]
      before:bg-[conic-gradient(from_var(--angle),var(--color-dark),var(--color-medium),var(--color-light),var(--color-medium),var(--color-dark))]
      before:[--angle:0deg] before:animate-rotate
      hover:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
      before:transition-colors before:ease-in-out before:duration-200
      [&>*]:relative [&>*]:z-[2] [&>*]:rounded-lg [&>*]:bg-[linear-gradient(to_right,#1a0824,#210925)] [&>*]:!border-0
      [&>*]:inline-flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full [&>*]:px-5
      [&>*]:font-bold [&>*]:tracking-wider
      [&>*]:text-[var(--default-color)] hover:[&>*]:text-[var(--hover-color)]
      [&>*]:transition-colors [&>*]:ease-in-out [&>*]:duration-200
    `,
  },

  /* ===== COLOR STYLES ===== */
  color: {
    grey: `
      [--color-dark:#999999]
      [--color-light:#CCCCCC]
    `,
    greyDark: `
      [--color-dark:#666666]
      [--color-light:#999999]
    `,
    greyGradient: `
      [--color-dark:#666666]
      [--color-medium:#999999]
      [--color-light:#CCCCCC]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
    `,
    purple: `
      [--color-dark:#8800CC]
      [--color-light:#AA00FF]
    `,
    purpleDark: `
      [--color-dark:#660099]
      [--color-light:#8800CC]
    `,
    purpleGradient: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
    `,
    test: `
      [--color-dark:#00CC00]
      [--color-light:#CC0000]
    `,
    custom: "",
  },

  /* ===== SIZE STYLES ===== */
  size: {
    xxs: "h-[26px] px-[14px] text-[10px]",
    xs: "h-[30px] px-[14px] text-xs",
    sm: "h-[34px] px-4 text-xs",
    md: "h-[38px] px-4 text-sm",
    lg: "h-[42px] px-4 text-sm",
    xl: "h-[46px] px-5 text-base",
    xxsR: "h-[26px] tablet:h-[22px] px-[14px] text-[10px]",
    xsR: "h-[30px] tablet:h-[26px] px-[14px] text-xs",
    smR: "h-[34px] tablet:h-[30px] px-4 text-xs",
    mdR: "h-[38px] tablet:h-[34px] px-4 text-sm tablet:text-xs",
    lgR: "h-[42px] tablet:h-[38px] px-4 text-sm",
  },

  /* ===== TEXT SIZE STYLES - ONLY USED FOR TEXT BUTTONS ===== */
  textSize: {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  },

  /* ===== PADDING STYLES ===== */
  padding: {
    xs: "py-[5px] px-[14px]",
    sm: "py-[7px] px-4",
    md: "py-[9px] px-4",
    lg: "py-[11px] px-4",
  },

  /* ===== PILL SIZE STYLES ===== */
  pillSize: {
    xs: "text-xs py-[5px] px-[14px]",
    sm: "text-xs py-[7px] px-4",
    md: "text-sm py-[9px] px-4",
    lg: "text-sm py-[11px] px-4",
  },

  /* ===== STATE STYLES ===== */
  state: {
    disabled: `
      opacity-70
      cursor-not-allowed
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
/* @baba - update feeCalculatorBase buttons + toggle switch */
export const buttonPurpleOutline =
  "inline-flex items-center justify-center border-[1px] border-stamp-purple rounded-lg text-sm font-bold tracking-wider text-stamp-purple h-[38px] px-4 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors ease-in-out duration-200";
export const buttonPurpleFlat =
  "inline-flex items-center justify-center bg-stamp-purple border-[1px] border-stamp-purple rounded-lg text-sm font-bold tracking-wider text-black h-[38px] px-4 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors ease-in-out duration-200";

/* ===== TOGGLE SWITCH BUTTON STYLES ===== */
export const toggleButton =
  "flex items-center relative w-10 h-5 rounded-full bg-stamp-grey focus:outline-none transition ease-in-out duration-200";
export const toggleKnobBackground =
  "flex justify-center items-center relative w-5 h-5 bg-stamp-grey rounded-full transition ease-in-out transform duration-400 ";
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
