export const TEXT_STYLES = {
  hashSymbol: {
    base: "font-light text-stamp-purple-bright",
    sizes:
      "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl", // deviation from design
  },
  stampNumber: {
    base: "font-black text-stamp-purple-bright truncate max-w-full",
    // sizes: "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl group-data-[long-number=true]:text-sm group-data-[long-number=true]:mobileSm:text-sm group-data-[long-number=true]:mobileLg:text-base group-data-[long-number=true]:tablet:text-lg group-data-[long-number=true]:desktop:text-xl",
    sizes:
      "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-3xl",
  },
  creator: {
    base: "font-bold text-stamp-grey break-words text-center",
    sizes:
      "text-sm mobileSm:text-sm mobileLg:text-sm tablet:text-base desktop:text-base", // deviation from design
  },
  price: {
    base: "font-medium text-stamp-grey-light text-nowrap",
    sizes:
      "text-xs mobileSm:text-xs mobileLg:text-sm tablet:text-sm desktop:text-base",
  },
  mimeType: {
    base: "font-medium text-stamp-grey text-nowrap",
    sizes:
      "text-xs mobileSm:text-xs mobileLg:text-sm tablet:text-sm desktop:text-base",
  },
  supply: {
    base: "font-bold text-stamp-grey-darker text-right",
    sizes:
      "text-sm mobileSm:text-sm mobileLg:text-base tablet:text-base desktop:text-lg",
  },
  minimal: {
    hashSymbol: {
      base: "font-light text-stamp-grey-darker",
      sizes:
        "text-xs mobileSm:text-xs mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    stampNumber: {
      base: "font-black gray-gradient1 truncate",
      sizes:
        "text-sm mobileSm:text-sm mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    price: {
      base: "font-medium text-stamp-grey-light truncate text-nowrap",
      sizes:
        "text-[10px] mobileSm:text-[10px] mobileLg:text-base tablet:text-base desktop:text-base",
    },
  },
  greyGradient: {
    hashSymbol: {
      base:
        "font-light text-stamp-grey group-hover:text-stamp-purple-highlight",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl",
    },
    stampNumber: {
      base:
        "font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] truncate max-w-full transition-colors duration-200",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl",
    },
  },
} as const;

export const ABBREVIATION_LENGTHS = {
  desktop: 6,
  tablet: 6,
  mobileLg: 6,
  mobileMd: 6,
  mobileSm: 6,
} as const;

export const StampStyles = {
  titlePurpleDL:
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1",
};

export const StampDetailStyles = {
  defaultHomeGridClass:
    "grid w-full gap-3 mobileMd:gap-6 grid-cols-3 mobileMd:grid-cols-3 mobileLg:grid-cols-5 tablet:grid-cols-6 desktop:grid-cols-7 auto-rows-fr",
  defaultDetailGridClass:
    "grid w-full gap-3 mobileLg:gap-6 grid-cols-2 mobileSm:grid-cols-3 mobileLg:grid-cols-4 desktop:grid-cols-6",
  inputField:
    "h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light",
  modalBgCenter:
    "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black bg-opacity-70 backdrop-filter backdrop-blur-md",
  tooltipIcon:
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300",
};
