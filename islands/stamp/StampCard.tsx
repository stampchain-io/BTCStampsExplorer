import {
  abbreviateAddress,
  formatSupplyValue,
  stripTrailingZeros,
} from "$lib/utils/formatUtils.ts";
import {
  getStampImageSrc,
  handleImageError,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";

import { StampRow } from "globals";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";
import { BREAKPOINTS } from "$client/utils/constants.ts";
import { useEffect, useState } from "preact/hooks";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";

// Text style constants for different breakpoints

// TODO add a variant for the inline detail display

const TEXT_STYLES = {
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
      base: "font-black text-stamp-grey-darker truncate",
      sizes:
        "text-xs mobileSm:text-xs mobileLg:text-xl tablet:text-xl desktop:text-xl",
    },
    price: {
      base: "font-medium text-stamp-grey truncate text-nowrap",
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

const ABBREVIATION_LENGTHS = {
  desktop: 6,
  tablet: 6,
  mobileLg: 6,
  mobileMd: 6,
  mobileSm: 6,
} as const;

interface StampWithSaleData extends Omit<StampRow, "stamp_base64"> {
  sale_data?: {
    btc_amount: number;
    block_index: number;
    tx_hash: string;
  };
  stamp_base64?: string;
}

export function StampCard({
  stamp,
  isRecentSale = false,
  showDetails = true,
  showMinDetails = false,
  variant = "default",
}: {
  stamp: StampWithSaleData;
  isRecentSale?: boolean;
  showDetails?: boolean;
  showMinDetails?: boolean;
  variant?: "default" | "grey";
}) {
  // Add window size hook
  const { width } = useWindowSize();

  // Function to get current abbreviation length based on screen size
  const getAbbreviationLength = () => {
    if (width >= BREAKPOINTS.desktop) return ABBREVIATION_LENGTHS.desktop;
    if (width >= BREAKPOINTS.tablet) return ABBREVIATION_LENGTHS.tablet;
    if (width >= BREAKPOINTS.mobileLg) return ABBREVIATION_LENGTHS.mobileLg;
    if (width >= BREAKPOINTS.mobileMd) return ABBREVIATION_LENGTHS.mobileMd;
    return ABBREVIATION_LENGTHS.mobileSm;
  };

  const src = getStampImageSrc(stamp as StampRow);

  // Add state for validated content
  const [validatedContent, setValidatedContent] = useState<preact.VNode | null>(
    null,
  );

  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml") {
        const { isValid } = await validateStampContent(src);
        if (isValid) {
          setValidatedContent(
            <div class="stamp-container">
              <img
                src={src}
                loading="lazy"
                alt={`Stamp No. ${stamp.stamp}`}
                class="absolute inset-0 w-full h-full object-contain pixelart stamp-image"
                onError={handleImageError}
              />
            </div>,
          );
        }
      }
    };

    validateContent();
  }, [src, stamp.stamp_mimetype]);

  const renderContent = () => {
    if (stamp.stamp_mimetype === "text/plain") {
      return <TextContentIsland src={src} />;
    }

    // Handle HTML content
    if (stamp.stamp_mimetype === "text/html") {
      return (
        <div class="relative w-full h-full">
          <div class="relative pt-[100%]">
            <iframe
              width="100%"
              height="100%"
              scrolling="no"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin"
              src={src}
              class="absolute top-0 left-0 w-full h-full object-contain"
              onError={(e) => {
                console.error("iframe error (detailed):", {
                  error: e,
                  target: e.target,
                  src: (e.target as HTMLIFrameElement).src,
                  contentWindow: (e.target as HTMLIFrameElement).contentWindow
                    ? "present"
                    : "missing",
                });
                handleImageError(e);
              }}
            />
          </div>
        </div>
      );
    }

    // Handle JavaScript content
    if (stamp.stamp_mimetype === "application/javascript") {
      // Create a container for the script's output
      return (
        <div class="relative w-full h-full">
          <div class="relative pt-[100%]">
            <div
              id={`js-output-${stamp.stamp}`}
              class="absolute top-0 left-0 w-full h-full"
            >
              <script
                src={src}
                async
                defer
                onError={(e) => {
                  console.error("Script error (detailed):", {
                    error: e,
                    target: e.target,
                    src: (e.target as HTMLScriptElement).src,
                  });
                  handleImageError(e);
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    if (stamp.stamp_mimetype === "image/svg+xml") {
      return validatedContent || (
        <img
          src={NOT_AVAILABLE_IMAGE}
          alt="Loading..."
          class="absolute inset-0 w-full h-full object-contain pixelart"
        />
      );
    }

    // Regular images
    return (
      <img
        src={src}
        loading="lazy"
        alt={`Stamp No. ${stamp.stamp}`}
        class="absolute inset-0 w-full h-full object-contain pixelart"
        onError={handleImageError}
      />
    );
  };

  const renderPrice = () => {
    if (isRecentSale && stamp.sale_data) {
      return {
        text: `${
          stripTrailingZeros(stamp.sale_data.btc_amount.toFixed(8))
        } BTC`,
        style: TEXT_STYLES.price,
      };
    } else if (stamp.floorPrice !== "priceless") {
      return {
        text: `${stripTrailingZeros(Number(stamp.floorPrice).toFixed(8))} BTC`,
        style: TEXT_STYLES.price,
      };
    } else if (stamp.recentSalePrice !== "priceless") {
      return {
        text: `${
          stripTrailingZeros(Number(stamp.recentSalePrice).toFixed(8))
        } BTC`,
        style: TEXT_STYLES.price,
      };
    } else {
      return {
        text: stamp.stamp_mimetype?.split("/")[1].toUpperCase() || "UNKNOWN",
        style: TEXT_STYLES.mimeType,
      };
    }
  };

  const shouldDisplayHash = Number(stamp.stamp ?? 0) >= 0 ||
    (stamp.cpid && stamp.cpid.charAt(0) === "A");

  const supplyDisplay = stamp.ident !== "SRC-20" && stamp.balance
    ? `${formatSupplyValue(Number(stamp.balance), stamp.divisible)}/${
      stamp.supply < 100000 && !stamp.divisible
        ? formatSupplyValue(stamp.supply ?? 0, stamp.divisible)
        : "+100000"
    }`
    : `1/${formatSupplyValue(stamp.supply ?? 0, stamp.divisible)}`;

  // Use dynamic abbreviation length
  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, getAbbreviationLength());

  // Helper to get correct text styles based on variant
  const getTextStyles = (type: "hashSymbol" | "stampNumber") => {
    if (variant === "grey") {
      return {
        base: TEXT_STYLES.greyGradient[type].base,
        sizes: TEXT_STYLES.greyGradient[type].sizes,
      };
    }
    return {
      base: TEXT_STYLES[type].base,
      sizes: TEXT_STYLES[type].sizes,
    };
  };

  // Add function to check if number is long
  const isLongNumber = (value: string | number) => {
    const stringValue = String(value);
    return stringValue.length > 6;
  };

  const stampValue = Number(stamp.stamp ?? 0) >= 0 ||
      (stamp.cpid && stamp.cpid.charAt(0) === "A")
    ? `${stamp.stamp}`
    : `${stamp.cpid}`;

  return (
    <div class="relative flex justify-center w-full h-full">
      <a
        href={`/stamp/${stamp.tx_hash}`}
        target="_top"
        f-partial={`/stamp/${stamp.tx_hash}`}
        data-long-number={isLongNumber(stampValue)}
        class={`
          text-white group relative z-0 flex flex-col
          p-stamp-card mobileLg:p-3
          rounded-stamp transition-all
          w-full h-full
          hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent
          bg-stamp-card-bg
        `}
      >
        <div class="relative w-full h-full">
          <div class="aspect-stamp w-full h-full overflow-hidden flex items-center justify-center">
            {renderContent()}
          </div>
        </div>

        {/* Full Details Section with variant support */}
        {showDetails && !showMinDetails && (
          <div class="flex flex-col items-center px-[6px] pt-[18px] pb-0">
            {/* Stamp Number with container */}
            <div class="flex items-center justify-center max-w-[90%]">
              {shouldDisplayHash && (
                <span
                  class={`${getTextStyles("hashSymbol").base} ${
                    getTextStyles("hashSymbol").sizes
                  }`}
                >
                  #
                </span>
              )}
              <span
                class={`${getTextStyles("stampNumber").base} ${
                  getTextStyles("stampNumber").sizes
                }`}
              >
                {stampValue}
              </span>
            </div>

            {/* Creator Name or Abbreviated Address */}
            <div
              class={`${TEXT_STYLES.creator.base} ${TEXT_STYLES.creator.sizes} mt-[3px]`}
            >
              {creatorDisplay}
            </div>

            {/* Price and Supply */}
            <div class="flex justify-between w-full mt-[6px]">
              {/* Render Price on the Left */}
              <div class="flex-1 text-left -mt-[2px] mobileLg:-mt-[0px] desktop:mt-[3px]">
                <span
                  class={`${renderPrice().style.base} ${renderPrice().style.sizes}`}
                >
                  {renderPrice().text}
                </span>
              </div>
              <div
                class={`${TEXT_STYLES.supply.base} ${TEXT_STYLES.supply.sizes} flex-1 text-right`}
              >
                {supplyDisplay}
              </div>
            </div>
          </div>
        )}

        {/* Minimal Details Section */}
        {showMinDetails && !showDetails && (
          <div class="flex flex-col items-center px-2 tablet:px-3 py-2">
            <div class="flex items-center justify-center">
              {shouldDisplayHash && (
                <span
                  class={`${TEXT_STYLES.minimal.hashSymbol.base} ${TEXT_STYLES.minimal.hashSymbol.sizes}`}
                >
                  #
                </span>
              )}
              <span
                class={`${TEXT_STYLES.minimal.stampNumber.base} ${TEXT_STYLES.minimal.stampNumber.sizes}`}
              >
                {stampValue}
              </span>
            </div>
            <div class="mt-1">
              <span
                class={`${TEXT_STYLES.minimal.price.base} ${TEXT_STYLES.minimal.price.sizes}`}
              >
                {renderPrice().text}
              </span>
            </div>
          </div>
        )}
      </a>
    </div>
  );
}
