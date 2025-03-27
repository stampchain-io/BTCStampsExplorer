/* ===== BUTTON STYLES MODULE ===== */
import { JSX } from "preact";

/* ===== TYPE DEFINITIONS ===== */
export interface ButtonVariants {
  base: string;
  variant: Record<
    "outline" | "flat" | "flatOutline" | "outlineFlat" | "outlineGradient",
    string
  >;
  color: Record<
    "grey" | "purple" | "purpleGradient" | "greyGradient" | "test",
    string
  >;
  size: Record<
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
    font-bold tracking-wider 
    transition-colors duration-300
  `,

  /* ===== VARIANT STYLES ===== */
  variant: {
    outline: `
      bg-transparent
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-[var(--default-color)] hover:text-[var(--hover-color)]
    `,
    flat: `
      bg-[var(--default-color)] hover:bg-[var(--hover-color)]
      border-[var(--default-color)] hover:border-[var(--hover-color)]
      text-black
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
      relative !bg-[#2b1132] !p-[2px] rounded-md !border-0
      before:absolute before:inset-0 before:rounded-md before:z-[1]
      before:bg-[conic-gradient(from_var(--angle),var(--color-dark),var(--color-medium),var(--color-light),var(--color-medium),var(--color-dark))]
      before:[--angle:0deg] before:animate-rotate
      hover:before:bg-[conic-gradient(from_var(--angle),var(--color-light),var(--color-light),var(--color-light),var(--color-light),var(--color-light))]
      before:transition-colors before:duration-300
      [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#2b1132] [&>*]:!border-0
      [&>*]:inline-flex [&>*]:items-center [&>*]:justify-center [&>*]:w-full [&>*]:h-full [&>*]:px-5
      [&>*]:font-bold [&>*]:tracking-wider 
      [&>*]:text-[var(--default-color)] hover:[&>*]:text-[var(--hover-color)]
      [&>*]:transition-colors [&>*]:duration-100
    `,
  },

  /* ===== COLOR STYLES ===== */
  color: {
    grey: `
      [--default-color:#999999]
      [--hover-color:#CCCCCC]
    `,
    purple: `
      [--default-color:#8800CC]
      [--hover-color:#AA00FF]
    `,
    purpleGradient: `
      [--color-dark:#660099]
      [--color-medium:#8800CC]
      [--color-light:#AA00FF]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
    `,
    greyGradient: `
      [--color-dark:#666666]
      [--color-medium:#999999]
      [--color-light:#CCCCCC]
      [--default-color:var(--color-medium)]
      [--hover-color:var(--color-light)]
  `,
    test: `
      [--default-color:#00CC00]
      [--hover-color:#CC0000]
  `,
  },

  /* ===== SIZE STYLES ===== */
  size: {
    xs: "h-7 px-4 tablet:px-3 text-xs tablet:text-[10px] font-semibold",
    sm: "h-8 px-5 tablet:px-4 text-xs tablet:text-xs",
    md: "h-9 px-5 text-sm tablet:text-xs",
    lg: "h-10 px-5 text-sm",
    xl: "h-11 px-6 tablet:px-5 text-base",
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

  /* ===== SPINNER STYLES ===== */
  spinner: `
    animate-spin 
    rounded-full 
    h-5 w-5 
    border-b-2 
    border-[var(--hover-color)]
  `,
};

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
