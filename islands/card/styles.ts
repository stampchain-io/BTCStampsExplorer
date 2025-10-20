export const TEXT_STYLES = {
  hashSymbol: {
    base: "font-light text-color-primary-light",
    sizes: "text-lg mobileLg:text-xl",
  },
  stampNumber: {
    base: "font-extrabold text-color-primary-light truncate max-w-full",
    // sizes: "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl group-data-[long-number=true]:text-sm group-data-[long-number=true]:mobileSm:text-sm group-data-[long-number=true]:mobileLg:text-base group-data-[long-number=true]:tablet:text-lg group-data-[long-number=true]:desktop:text-xl",
    sizes: "text-lg mobileLg:text-xl",
  },
  creator: {
    base: "font-semibold text-color-neutral-light break-words text-center pt-1",
    sizes: "text-xs mobileMd:text-sm",
  },
  price: {
    base: "font-normal text-color-neutral-light text-nowrap",
    sizes: "text-xs mobileLg:text-sm",
  },
  mimeType: {
    base: "font-normal text-color-neutral text-nowrap",
    sizes: "text-xs mobileLg:text-sm",
  },
  supply: {
    base: "font-medium text-color-neutral text-right",
    sizes: "text-xs mobileLg:text-base",
  },
  minimal: {
    hashSymbol: {
      base:
        "font-light text-color-neutral-light group-hover:text-color-primary-light",
      sizes:
        "text-xs mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    stampNumber: {
      base:
        "font-black color-neutral-gradientDL group-hover:[-webkit-text-fill-color:var(--color-primary-light)] truncate transition-colors duration-200",
      sizes:
        "text-sm mobileSm:text-base mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    price: {
      base: "font-normal text-color-neutral truncate text-nowrap",
      sizes: "text-[10px] mobileMd:text-xs mobileLg:text-sm",
    },
  },
  greyGradient: {
    hashSymbol: {
      base:
        "font-light text-color-neutral group-hover:text-color-primary-light",
      sizes: "text-lg min-[420px]:text-xl",
    },
    stampNumber: {
      base:
        "font-black color-neutral-gradientDL group-hover:[-webkit-text-fill-color:var(--color-primary-light)] truncate max-w-full transition-colors duration-200",
      sizes: "text-lg min-[420px]:text-xl",
    },
  },
} as const;

export const ABBREVIATION_LENGTHS = {
  desktop: 5,
  tablet: 5,
  mobileLg: 4,
  mobileMd: 5,
  mobileSm: 5,
} as const;
