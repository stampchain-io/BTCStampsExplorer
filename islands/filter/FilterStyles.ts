// Helper function to format large numbers with commas
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Icon styles
// Handle icon - Slider
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
export const checkboxIcon = (checked: boolean, canHover: boolean): string => `
  appearance-none
  size-[18px] tablet:size-4
  border-2 
  rounded-sm
  cursor-pointer
  relative
  transition-colors duration-300
  ${
  checked
    ? canHover
      ? "border-stamp-grey-light after:bg-stamp-grey-light group-hover:border-stamp-grey group-hover:after:bg-stamp-grey"
      : "border-stamp-grey-light after:bg-stamp-grey-light"
    : canHover
    ? "border-stamp-grey group-hover:border-stamp-grey-light"
    : "border-stamp-grey"
}
  after:content-['']
  after:block
  after:size-2 tablet:after:size-1.5
  after:rounded-[1px]
  after:absolute
  after:top-1/2 after:left-1/2
  after:-translate-x-1/2 after:-translate-y-1/2
  after:scale-0
  checked:after:scale-100
  after:transition-all
  after:duration-100
`;

// Text styles
// Label - Filter
export const labelGreyBaseFilter = (
  checked: boolean,
  canHover: boolean,
): string => `
  inline-block ml-3 tablet:ml-[9px] text-base tablet:text-sm font-bold 
  transition-colors duration-300
  cursor-pointer select-none
  ${
  checked
    ? canHover
      ? "text-stamp-grey-light group-hover:text-stamp-grey"
      : "text-stamp-grey-light"
    : canHover
    ? "text-stamp-grey group-hover:text-stamp-grey-light"
    : "text-stamp-grey"
}
`;

// Button styles
export const buttonStyles = {
  base:
    "inline-flex items-center justify-center border-2 rounded-md text-sm tablet:text-xs font-extrabold tracking-wider transition-colors duration-300",

  // Variants
  variant: {
    outlineGrey:
      "bg-transparent border-stamp-grey hover:border-stamp-grey-light text-stamp-grey hover:text-stamp-grey-light",
    flatGrey:
      "bg-stamp-grey hover:bg-stamp-grey-light border-stamp-grey hover:border-stamp-grey-light text-black",

    flatOutlineGrey:
      "bg-stamp-grey hover:bg-transparent border-stamp-grey hover:border-stamp-grey text-black hover:text-stamp-grey",
    outlineFlatGrey:
      "bg-transparent hover:bg-stamp-grey border-stamp-grey hover:border-stamp-grey text-stamp-grey hover:text-black",

    flatTest:
      "bg-red-500 hover:bg-green-500 border-red-500 hover:border-green-500  text-black",
  },

  // Sizes
  size: {
    sm: "h-9 tablet:h-8 px-4 tablet:px-3",
    md: "h-10 tablet:h-9 px-4 tablet:px-3",
    lg: "h-11 tablet:h-10 px-5 tablet:px-4",
  },
};

// Helper function to combine button styles
export const button = (
  variant: keyof typeof buttonStyles.variant,
  size: keyof typeof buttonStyles.size,
) => {
  return `${buttonStyles.base} ${buttonStyles.variant[variant]} ${
    buttonStyles.size[size]
  }`;
};

// Example usage:
// className={button('outlineGrey', 'lg')}
