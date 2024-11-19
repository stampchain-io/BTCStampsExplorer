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
      "text-base mobileSm:text-base mobileLg:text-lg tablet:text-lg desktop:text-lg", // deviation from design
  },
  price: {
    base: "font-medium text-stamp-grey  text-nowrap",
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
      base: "font-light text-stamp-grey-darker",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-3xl",
    },
    stampNumber: {
      base: "font-black text-stamp-grey-darker truncate max-w-full",
      sizes:
        "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl", // deviation from design
    },
  },
} as const;

const ABBREVIATION_LENGTHS = {
  desktop: 8,
  tablet: 6,
  mobileLg: 6,
  mobileSm: 4,
} as const;

export function StampCard({
  stamp,
  isRecentSale = false,
  showDetails = true,
  showMinDetails = false,
  variant = "default",
}: {
  stamp: StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  };
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
    return ABBREVIATION_LENGTHS.mobileSm;
  };

  const src = getStampImageSrc(stamp);

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
            <div className="stamp-container">
              <img
                src={src}
                loading="lazy"
                alt={`Stamp No. ${stamp.stamp}`}
                className="absolute inset-0 w-full h-full object-contain pixelart stamp-image"
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

    if (stamp.stamp_mimetype === "text/html") {
      return (
        <div className="relative w-full h-full">
          <iframe
            scrolling="no"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-modals"
            src={src}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            onError={handleImageError}
          />
        </div>
      );
    }

    if (stamp.stamp_mimetype === "image/svg+xml") {
      return validatedContent || (
        <img
          src="/not-available.png"
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-contain pixelart"
        />
      );
    }

    // Regular images
    return (
      <img
        src={src}
        loading="lazy"
        alt={`Stamp No. ${stamp.stamp}`}
        className="absolute inset-0 w-full h-full object-contain pixelart"
        onError={handleImageError}
      />
    );
  };

  const renderPrice = () => {
    if (isRecentSale && stamp.sale_data) {
      return `${stripTrailingZeros(stamp.sale_data.btc_amount.toFixed(8))} BTC`;
    } else if (stamp.floorPrice !== "priceless") {
      return `${stripTrailingZeros(Number(stamp.floorPrice).toFixed(8))} BTC`;
    } else if (stamp.recentSalePrice !== "priceless") {
      return `${
        stripTrailingZeros(Number(stamp.recentSalePrice).toFixed(8))
      } BTC`;
    } else {
      return stamp.stamp_mimetype?.split("/")[1].toUpperCase() || "UNKNOWN";
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
          p-stamp-card-lg mobileLg:p-3
          rounded-stamp transition-all
          w-full h-full
          hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent
          bg-stamp-card-bg
        `}
      >
        <div className="relative w-full h-full">
          <div className="aspect-stamp w-full h-full overflow-hidden flex items-center justify-center">
            {renderContent()}
          </div>
        </div>

        {/* Full Details Section with variant support */}
        {showDetails && !showMinDetails && (
          <div class="flex flex-col items-center px-2 tablet:px-3 py-2">
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
              class={`${TEXT_STYLES.creator.base} ${TEXT_STYLES.creator.sizes}`}
            >
              {creatorDisplay}
            </div>

            {/* Price and Supply */}
            <div class="flex justify-between w-full mt-2">
              {/* Render Price on the Left */}
              <div class="flex-1 text-left">
                <span
                  class={`${TEXT_STYLES.price.base} ${TEXT_STYLES.price.sizes}`}
                >
                  {renderPrice()}
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
                {renderPrice()}
              </span>
            </div>
          </div>
        )}
      </a>
    </div>
  );
}
