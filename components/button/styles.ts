/* ===== BUTTON STYLES MODULE ===== */
import { glassmorphismL2, shadowL2, transitionColors } from "$layout";
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

/* ===== BUTTON STYLE DEFINITIONS ===== */
/* gradientOverlay and gradientOverlayHover must be identical */
const baseGlassmorphism =
  "border-[1px] rounded-xl backdrop-blur-sm overflow-hidden";
const baseGlassmorphismColor =
  "relative text-[#080708] before:blur-sm hover:border-[var(--color-border-hover)] hover:before:scale-105";
const baseBefore =
  "before:absolute before:inset-0 before:rounded-xl before:z-[-1] before:transition-transform before:duration-50 before:origin-center";
const gradientOverlay =
  "before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]";
const gradientOverlayHover =
  "hover:before:bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]";

export const buttonStyles: ButtonVariants = {
  /* ===== BASE STYLES ===== */
  base: `
    inline-flex items-center justify-center
    rounded-xl border-[1px]
    font-semibold tracking-wide
    ${transitionColors}
    cursor-pointer
  `,

  /* ===== VARIANT STYLES  ===== */
  /* If the glassmorphism/Color variants are changed then the ToggleButton.tsx file must be update too */
  variant: {
    text: `
      !items-start !justify-start !h-auto
      !p-0 bg-transparent !border-0
      text-[var(--color-text)] hover:text-[var(--color-text-hover)]
    `,
    glassmorphism: `
      ${baseGlassmorphism} bg-[#211c21]/10 border-[var(--color-border)]
      hover:bg-[#211c21]/20 hover:border-[var(--color-border-hover)]
      text-[var(--color-dark)] hover:text-[var(--color-medium)]
      ${shadowL2}
    `,
    glassmorphismColor: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-[#211c21]/10 border-[var(--color-border)]
      ${baseBefore} ${shadowL2}
      ${gradientOverlay}
    `,
    glassmorphismSelected: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-[#211c21]/10 border-[var(--color-border)]
      ${baseBefore} ${shadowL2}
      ${gradientOverlay}
      hover:bg-[#211c21]/10 hover:!border-[var(--color-border)] hover:before:bg-none hover:text-[var(--color-text)] hover:before:blur-0
    `,
    glassmorphismDeselected: `
      ${baseGlassmorphism} ${baseGlassmorphismColor}
      bg-[#211c21]/10 border-[var(--color-border)]
      text-[var(--color-text)] before:bg-none
      hover:bg-[#211c21]/10 hover:!border-[var(--color-border)]
      hover:text-[#080708] hover:before:!scale-100 hover:before:!blur-sm
      ${baseBefore} ${shadowL2}
      ${gradientOverlayHover}
    `,
    outlineGradient: `
      relative !bg-[#000000] !p-[1px] rounded-xl !border-0
      before:absolute before:inset-0 before:rounded-xl before:z-[1]
      before:bg-[conic-gradient(from_var(--angle),var(--color-dark),var(--color-medium),var(--color-light),var(--color-medium),var(--color-dark))]
      before:[--angle:0deg] before:animate-rotate
      hover:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
      before:transition-colors before:duration-50
      [&>*]:relative [&>*]:z-[2] [&>*]:rounded-xl [&>*]:bg-[#000000] [&>*]:!border-0
      [&>*]:inline-flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full [&>*]:px-5
      [&>*]:font-bold [&>*]:tracking-wider
      [&>*]:text-[var(--color-text)] hover:[&>*]:text-[var(--color-text-hover)]
      [&>*]:transition-colors [&>*]:duration-50
    `,
    /* LEGACY STYLES - @baba-should be removed */
    flat: `
      bg-gradient-to-br from-[var(--color-light)] to-[var(--color-dark)]
      border-[var(--color-dark)] text-black
      hover:bg-gradient-to-br hover:from-[var(--color-light)] hover:to-[var(--color-light)]
      hover:border-[var(--color-light)]
    `,
    outline: `
      bg-transparent border-[var(--color-dark)] text-[var(--color-text)]
      hover:border-[var(--color-light)] hover:text-[var(--color-text-hover)]
    `,
    flatOutline: `
      bg-gradient-to-br from-[var(--color-light)] to-[var(--color-dark)]
      border-[var(--color-dark)] text-black
      hover:bg-gradient-to-br hover:from-transparent hover:to-transparent
      hover:border-[var(--color-dark)] hover:text-[var(--color-text-hover)]
    `,
    outlineFlat: `
      bg-transparent border-[var(--color-dark)] text-[var(--color-text)]
      hover:bg-gradient-to-br hover:from-[var(--color-light)] hover:to-[var(--color-dark)] hover:border-[var(--color-dark)] hover:text-black
    `,
  },

  /* ===== COLOR STYLES ===== */
  color: {
    grey: `
      [--color-dark:#CCCCCC66]
      [--color-medium:#CCCCCC99]
      [--color-light:#CCCCCCCC]
      [--color-border:#66666666]
      [--color-border-hover:#666666CC]
      [--color-text:#666666]
      [--color-text-hover:#999999]
    `,
    greyDark: `
      [--color-dark:#BBBBBB66]
      [--color-medium:#BBBBBB99]
      [--color-light:#BBBBBBCC]
      [--color-border:#55555566]
      [--color-border-hover:#555555CC]
      [--color-text:#555555]
      [--color-text-hover:#888888]
    `,
    purple: `
      [--color-dark:#AA00FF66]
      [--color-medium:#AA00FF99]
      [--color-light:#AA00FFCC]
      [--color-border:#66009966]
      [--color-border-hover:#660099CC]
      [--color-text:#660099]
      [--color-text-hover:#8800CC]
    `,
    purpleDark: `
      [--color-dark:#9900E666]
      [--color-medium:#9900E699]
      [--color-light:#9900E6CC]
      [--color-border:#55008066]
      [--color-border-hover:#550080CC]
      [--color-text:#550080]
      [--color-text-hover:#7700b3]
    `,
    test: `
      [--color-dark:#00CC0033]
      [--color-medium:#00CC0066]
      [--color-light:#CC000033]
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
    xsR: "h-[30px] tablet:h-[26px] px-[14px] text-xs tablet:text-[10px]",
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
      opacity-50
      cursor-not-allowed
      relative
      [&:after]:content-['SOON™']
      [&:after]:absolute [&:after]:inset-0
      [&:after]:flex [&:after]:items-center [&:after]:justify-center
      [&:after]:opacity-0 [&:after]:group-hover:opacity-100
      [&:after]:transition-opacity [&:after]:ease-in-out [&:after]:duration-200
      [&:after]:pointer-events-none [&:after]:z-10
      [&:after]:text-white [&:after]:text-xs [&:after]:font-bold
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
export const toggleButton =
  `flex items-center relative w-10 h-5 !rounded-full ${glassmorphismL2} focus:outline-none transition duration-50`;
export const toggleKnobBackground =
  "flex justify-center items-center relative w-5 h-5 bg-transparent rounded-full transition ease-in-out transform duration-400";
export const toggleKnob = "w-[14px] h-[14px] rounded-full";
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
  `w-full h-5 tablet:h-4 !rounded-full ${glassmorphismL2} cursor-pointer`;

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
