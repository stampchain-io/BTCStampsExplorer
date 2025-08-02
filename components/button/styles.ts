/* ===== BUTTON STYLES MODULE ===== */
import { glassmorphismLayer2 } from "$layout";
import { JSX } from "preact";

/* ===== TYPE DEFINITIONS ===== */
export interface ButtonVariants {
  base: string;
  variant: Record<
    | "text"
    | "glassmorphism"
    | "glassmorphismColor"
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
    | "purple"
    | "purpleDark"
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
    rounded-lg border
    font-bold tracking-wide
    transition-colors duration-50
  `,

  /* ===== VARIANT STYLES ===== */
  variant: {
    text: `
      !items-start !justify-start !h-auto
      !p-0 bg-transparent !border-0
      font-semibold tracking-wide
      text-[var(--color-medium)] hover:text-[var(--color-light)]
    `,
    glassmorphism: `
      border-[1px] border-stamp-grey-darkest/40 rounded-lg
      bg-stamp-grey-darkest/30 backdrop-blur-md overflow-hidden
      text-[var(--color-dark)] hover:text-[var(--color-light)]
      shadow-[0_6px_12px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_3px_3px_rgba(22,22,22,0.2)]
    `,
    glassmorphismColor: `
      relative border-[1px] border-[var(--color-border)] rounded-lg
      bg-stamp-grey-darkest/10 overflow-hidden
      before:absolute before:inset-0 before:rounded-lg before:z-[-1]
      before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
      before:blur-[5px] before:transition-transform before:duration-50 before:origin-center
      hover:before:scale-110 hover:before:blur-sm
      text-[#1e1723]
      shadow-[0_2px_12px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_6px_3px_rgba(22,22,22,0.2)]
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
      before:transition-colors before:duration-50
      [&>*]:relative [&>*]:z-[2] [&>*]:rounded-lg [&>*]:bg-[linear-gradient(to_right,#1a0824,#210925)] [&>*]:!border-0
      [&>*]:inline-flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full [&>*]:px-5
      [&>*]:font-bold [&>*]:tracking-wider
      [&>*]:text-[var(--color-medium)] hover:[&>*]:text-[var(--color-light)]
      [&>*]:transition-colors [&>*]:duration-50
    `,
  },

  /* ===== COLOR STYLES ===== */
  /* @baba - update Gradient color styles across all buttons */
  color: {
    grey: `
      [--color-dark:#666666]
      [--color-medium:#999999]
      [--color-light:#CCCCCC]
      [--color-border:#33333366]
    `,
    greyDark: `
      [--color-dark:#333333]
      [--color-medium:#666666]
      [--color-light:#999999]
      [--color-border:#33333366]
    `,
    purple: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--color-border:#44006666]
    `,
    purpleDark: `
      [--color-dark:#440066]
      [--color-medium:#660099]
      [--color-light:#8800CC]
      [--color-border:#44006666]
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

  /* ===== PADDING STYLES - USED FOR THE SELECTOR BUTTONS ===== */
  padding: {
    xs: "py-[5px] px-[14px]",
    sm: "py-[7px] px-4",
    md: "py-[9px] px-4",
    lg: "py-[11px] px-4",
  },

  /* ===== PILL SIZE STYLES - USED FOR THE SELECTOR BUTTONS ===== */
  pillSize: {
    xs: "text-xs py-[5px] px-[14px]",
    sm: "text-xs py-[7px] px-4",
    md: "text-sm py-[9px] px-4",
    lg: "text-sm py-[11px] px-4",
  },

  /* ===== STATE STYLES ===== */
  state: {
    disabled: `
      opacity-50
      cursor-not-allowed
    `,
    loading: `
      opacity-70
      cursor-wait
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
    border-[var(--color-light)]
  `,
};

/* ===== ADDITIONAL STYLES ===== */
/* ===== TOGGLE SWITCH BUTTON STYLES ===== */
/* @baba - update toggle switch - possible duplicate */

export const toggleButton =
  `flex items-center relative w-10 h-5 !rounded-full ${glassmorphismLayer2} focus:outline-none transition duration-50`;
export const toggleKnobBackground =
  "flex justify-center items-center relative w-5 h-5 bg-transparent rounded-full transition ease-in-out transform duration-400 ";
export const toggleKnob = "w-[16px] h-[16px] rounded-full";
export const sliderKnob =
  `[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:tablet:w-3 [&::-webkit-slider-thumb]:tablet:h-3 [&::-webkit-slider-thumb]:appearance-none
   [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:hover:bg-stamp-grey [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:tablet:w- [&::-moz-range-thumb]:tablet:h-3 [&::-moz-range-thumb]:appearance-none
   [&::-moz-range-thumb]:bg-grey-light [&::-moz-range-thumb]:hover:bg-stamp-grey [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer`;
export const sliderBar =
  `w-full h-5 tablet:h-4 !rounded-full ${glassmorphismLayer2} cursor-pointer`;

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
