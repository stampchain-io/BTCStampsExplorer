export const TEXT_STYLES = {
  hashSymbol: {
    base: "font-light text-stamp-purple-bright",
    sizes:
      "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-xl desktop:text-xl",
  },
  stampNumber: {
    base: "font-black text-stamp-purple-bright truncate max-w-full",
    // sizes: "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl group-data-[long-number=true]:text-sm group-data-[long-number=true]:mobileSm:text-sm group-data-[long-number=true]:mobileLg:text-base group-data-[long-number=true]:tablet:text-lg group-data-[long-number=true]:desktop:text-xl",
    sizes: "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-xl",
  },
  creator: {
    base: "font-bold text-stamp-grey break-words text-center",
    sizes:
      "text-sm mobileSm:text-sm mobileLg:text-sm tablet:text-sm desktop:text-sm",
  },
  price: {
    base: "font-medium text-stamp-grey-light text-nowrap",
    sizes:
      "text-xs mobileSm:text-xs mobileLg:text-sm tablet:text-sm desktop:text-sm",
  },
  mimeType: {
    base: "font-medium text-stamp-grey text-nowrap",
    sizes:
      "text-xs mobileSm:text-xs mobileLg:text-sm tablet:text-sm desktop:text-sm",
  },
  supply: {
    base: "font-bold text-stamp-grey-darker text-right",
    sizes:
      "text-sm mobileSm:text-sm mobileLg:text-base tablet:text-base desktop:text-base",
  },
  minimal: {
    hashSymbol: {
      base:
        "font-light text-stamp-grey-light group-hover:text-stamp-purple-bright",
      sizes:
        "text-xs mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    stampNumber: {
      base:
        "font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] truncate transition-colors duration-200",
      sizes:
        "text-sm mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    price: {
      base: "font-normal text-stamp-grey truncate text-nowrap",
      sizes: "text-[10px] mobileMd:text-xs mobileLg:text-sm",
    },
  },
  greyGradient: {
    hashSymbol: {
      base: "font-light text-stamp-grey group-hover:text-stamp-purple-bright",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    stampNumber: {
      base:
        "font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] truncate max-w-full transition-colors duration-200",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
  },
} as const;

export const ABBREVIATION_LENGTHS = {
  desktop: 6,
  tablet: 6,
  mobileLg: 6,
  mobileMd: 7,
  mobileSm: 5,
} as const;
