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
    | "glassmorphismSelected"
    | "glassmorphismDeselected"
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
const baseBefore =
  "before:absolute before:inset-0 before:rounded-lg before:z-[-1] before:transition-transform before:duration-50 before:origin-center";
const baseGlassmorphism =
  "border-[1px] rounded-lg backdrop-blur overflow-hidden";
const baseGlassmorphismColor =
  "relative text-[#1e1723] before:blur-[5px] hover:border-[var(--color-border-hover)] hover:before:scale-110 hover:before:blur-sm";
const shadow =
  "shadow-[0_3px_6px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_3px_3px_rgba(22,22,22,0.2)]";

export const buttonStyles: ButtonVariants = {
  /* ===== BASE STYLES ===== */
  base: `
    inline-flex items-center justify-center
    rounded-lg border
    font-semibold tracking-wide
    transition-colors duration-50
  `,

  /* ===== VARIANT STYLES ===== */
  /* If the glassmorphismColor variant "before:"" background gradient is changed then  the ToggleButton.tsx file must be update too */
  variant: {
    text: `
      !items-start !justify-start !h-auto
      !p-0 bg-transparent !border-0
      text-[var(--color-medium)] hover:text-[var(--color-light)]
    `,
    glassmorphism: `
      ${baseGlassmorphism} bg-stamp-grey-darkest/30 border-stamp-grey-darkest/20
      hover:bg-stamp-grey-darkest/40 hover:border-stamp-grey-darkest/30
      text-[var(--color-dark)] hover:text-[var(--color-medium)]
      ${shadow}
    `,
    glassmorphismColor: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-stamp-grey-darkest/10 border-[var(--color-border)]
      ${baseBefore} ${shadow}
      before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
    `,
    glassmorphismSelected: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-stamp-grey-darkest/10 border-[var(--color-border)]
      ${baseBefore} ${shadow}
      before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
      hover:bg-stamp-grey-darkest/30 hover:border-stamp-grey-darkest/20 hover:before:bg-none hover:text-[var(--color-dark)] hover:before:blur-0
    `,
    glassmorphismDeselected: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-stamp-grey-darkest/30 border-stamp-grey-darkest/20
      text-[var(--color-dark)] before:bg-none
      hover:bg-stamp-grey-darkest/10 hover:text-[#1e1723] hover:before:!scale-100 hover:before:!blur-[5px]
      ${baseBefore} ${shadow}
      hover:before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
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
      [--color-border:#66666666]
      [--color-border-hover:#66666699]
    `,
    greyDark: `
      [--color-dark:#555555]
      [--color-medium:#888888]
      [--color-light:#bbbbbb]
      [--color-border:#55555566]
      [--color-border-hover:#55555599]
    `,
    purple: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--color-border:#66009966]
      [--color-border-hover:#66009999]
    `,
    purpleDark: `
      [--color-dark:#550080]
      [--color-medium:#7700b3]
      [--color-light:#9900e6]
      [--color-border:#55008066]
      [--color-border-hover:#55008099]
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
    xsR: "h-[30px] tablet:h-[26px] px-[14px] text-xs tablet:text-[10px]",
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

  /* ===== STATE STYLES ===== */
  state: {
    disabled: `
      opacity-70
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
