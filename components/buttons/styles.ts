import { JSX } from "preact";

// TypeScript interfaces
export interface ButtonVariants {
  base: string;
  variant: Record<"outline" | "flat" | "flatOutline" | "outlineFlat", string>;
  color: Record<"grey" | "purple" | "test", string>;
  size: Record<"xs" | "sm" | "md" | "lg" | "xl", string>;
  state: {
    disabled: string;
    loading: string;
    active: string;
  };
  spinner: string;
}

// Base shared props for both button and anchor
interface BaseButtonProps {
  variant: keyof typeof buttonStyles.variant;
  color: keyof typeof buttonStyles.color;
  size: keyof typeof buttonStyles.size;
  class?: string;
  children?: JSX.Element | string;
  disabled?: boolean;
}

// Button specific props
export interface ButtonElementProps extends BaseButtonProps {
  href?: undefined;
  "f-partial"?: undefined;
  target?: undefined;
}

// Anchor specific props
export interface AnchorElementProps extends BaseButtonProps {
  href: string;
  "f-partial"?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

// Union type for all possible props
export type ButtonProps = ButtonElementProps | AnchorElementProps;

// Button Styles
export const buttonStyles: ButtonVariants = {
  base: `
    inline-flex items-center justify-center
    rounded-md border-2 
    font-bold tracking-wider 
    transition-colors duration-300
  `,

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
  },

  color: {
    grey: `
      [--default-color:#999999]
      [--hover-color:#CCCCCC]
    `,
    purple: `
      [--default-color:#8800CC]
      [--hover-color:#AA00FF]
    `,
    test: `
      [--default-color:#00CC00]
      [--hover-color:#CC0000]
    `,
  },

  size: {
    xs:
      "h-8 tablet:h-7 px-4 tablet:px-3 text-xs tablet:text-[10px] font-semibold",
    sm: "h-9 tablet:h-8 px-5 tablet:px-4 text-xs tablet:text-xs",
    md: "h-10 tablet:h-9 px-5 text-sm tablet:text-xs",
    lg: "h-11 tablet:h-10 px-5 text-sm",
    xl: "h-12 tablet:h-11 px-6 tablet:px-5 text-base",
  },

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

  spinner: `
    animate-spin 
    rounded-full 
    h-5 w-5 
    border-b-2 
    border-[var(--hover-color)]
  `,
};

/**
 * Combines button styles based on variant, color, size and state
 */
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
