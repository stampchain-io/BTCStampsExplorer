/* ===== BUTTON STYLES MODULE ===== */
import { glassmorphismLayer2 } from "$layout";
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
    | "glassmorphism"
    | "glassmorphismColor"
    | "glassmorphismSelected"
    | "glassmorphismDeselected"
    | "flat"
    | "outline"
    | "flatOutline"
    | "outlineFlat"
    | "outlineGradient"
    | "custom"
    | "fill"
    | "light"
    | "thin"
    | "regular"
    | "bold",
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
    | "xxl"
    | "xxsR"
    | "xsR"
    | "smR"
    | "mdR"
    | "lgR"
    | "custom",
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

/* ===== BUTTON STYLE DEFINITIONS ===== */
const baseBefore =
  "before:absolute before:inset-0 before:rounded-lg before:z-[-1] before:transition-transform before:duration-50 before:origin-center";
const baseGlassmorphism =
  "border-[1px] rounded-lg backdrop-blur-sm overflow-hidden";
const baseGlassmorphismColor =
  "relative text-[#1e1723] before:blur-[5px] hover:border-[var(--color-border-hover)] hover:before:scale-110 hover:before:blur-sm";
const shadow =
  "shadow-[0_2px_4px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_2px_2px_rgba(22,22,22,0.2)]";

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
    glassmorphism: `
      ${baseGlassmorphism} bg-stamp-grey-darkest/15 border-stamp-grey-darkest/20
      hover:bg-stamp-grey-darkest/30 hover:border-stamp-grey-darkest/40
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
      hover:bg-stamp-grey-darkest/15 hover:border-stamp-grey-darkest/20 hover:before:bg-none hover:text-[var(--color-dark)] hover:before:blur-0
    `,
    glassmorphismDeselected: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-stamp-grey-darkest/10 border-stamp-grey-darkest/20
      ${baseBefore} hover:${shadow}
      before:bg-none hover:before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
      text-stamp-grey-darkest hover:border-[var(--color-border)]
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
    custom: `
      /* Custom variant - allows external styling via className */
    `,
    fill: `
      bg-[var(--color-dark)] border-[var(--color-dark)] text-white
      hover:bg-[var(--color-light)] hover:border-[var(--color-light)]
    `,
    light: `
      bg-[var(--color-light)] border-[var(--color-light)] text-black
      hover:bg-[var(--color-dark)] hover:border-[var(--color-dark)] hover:text-white
    `,
    thin: `
      bg-transparent border-[var(--color-dark)] text-[var(--color-dark)]
      border-opacity-50 font-normal
      hover:border-opacity-100 hover:bg-[var(--color-dark)] hover:bg-opacity-10
    `,
    regular: `
      bg-[var(--color-dark)] border-[var(--color-dark)] text-white
      font-medium
      hover:bg-[var(--color-light)] hover:border-[var(--color-light)]
    `,
    bold: `
      bg-[var(--color-dark)] border-[var(--color-dark)] text-white
      font-bold border-2
      hover:bg-[var(--color-light)] hover:border-[var(--color-light)]
    `,
  },

  /* ===== COLOR STYLES ===== */
  color: {
    grey: `
      [--color-dark:#666666]
      [--color-medium:#999999]
      [--color-light:#CCCCCC]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
      [--color-border:#66666680]
      [--color-border-hover:#66666699]
    `,
    greyDark: `
      [--color-dark:#555555]
      [--color-medium:#888888]
      [--color-light:#BBBBBB]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
      [--color-border:#55555580]
      [--color-border-hover:#55555599]
    `,
    purple: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
      [--color-border:#66009980]
      [--color-border-hover:#66009999]
    `,
    purpleDark: `
      [--color-dark:#550080]
      [--color-medium:#7700b3]
      [--color-light:#9900E6]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
      [--color-border:#55008080]
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
    xxl: "h-[50px] px-6 text-lg",
    xxsR: "h-[26px] tablet:h-[22px] px-[14px] text-[10px]",
    xsR: "h-[30px] tablet:h-[26px] px-[14px] text-xs",
    smR: "h-[34px] tablet:h-[30px] px-4 text-xs",
    mdR: "h-[38px] tablet:h-[34px] px-4 text-sm tablet:text-xs",
    lgR: "h-[42px] tablet:h-[38px] px-4 text-sm",
    custom: "/* Custom size - allows external sizing via className */",
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
export const sliderKnob = `
  absolute top-0.5 bottom-0.5 w-full h-[14px] tablet:h-[10px] rounded-full appearance-none bg-transparent pointer-events-none
  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
  [&::-webkit-slider-thumb]:size-[14px] [&::-webkit-slider-thumb]:tablet:size-[10px]
  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stamp-grey
  [&::-webkit-slider-thumb]:hover:bg-stamp-grey-light [&::-webkit-slider-thumb]:cursor-grab
  [&::-webkit-slider-thumb]:active:cursor-grabbing
  [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
  [&::-moz-range-thumb]:size-[14px][&::-moz-range-thumb]:tablet:size-[10px]
  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-stamp-grey
  [&::-moz-range-thumb]:hover:bg-stamp-grey-light [&::-moz-range-thumb]:cursor-grab
  [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-0
  `;
export const trackFill = `
  absolute top-0.5 bottom-0.5 h-[14px] tablet:h-[10px] rounded-full transition-colors duration-200 pointer-events-none
  `;
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
