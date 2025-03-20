// TypeScript interfaces
export interface IconVariants { // WIP
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
  color?: "grey" | "purple" | "gradient";
  className?: string;
  role?: string;
  ariaLabel?: string;
}

export interface BadgeVariants {
  text: string;
  className?: string;
}

// Icon styles
export const iconStyles = { // WIP
  base: "transform transition-all duration-300",
  sizes: {
    xs: "size-3 tablet:size-2",
    sm: "size-4 tablet:size-3",
    md: "size-5 tablet:size-4",
    lg: "size-6 tablet:size-5",
    xl: "size-7 tablet:size-6",
    xxl: "size-8 tablet:size-7",
  },
  colors: {
    grey: "fill-stamp-grey hover:fill-stamp-grey-light",
    purple: "fill-stamp-purple hover:fill-stamp-purple-bright",
    gradient: "",
  },
} as const;

export const icon = (
  { size = "md", color = "grey", className = "" }: IconVariants,
) => {
  return `
    ${iconStyles.base}
    ${iconStyles.sizes[size]}
    ${iconStyles.colors[color]}
    ${className}
  `;
};

// Slider handle icon
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

// Checkbox icon
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
