import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { StampRow } from "globals";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";
import { BREAKPOINTS } from "$client/utils/constants.ts";
import { isValidSVG } from "$lib/utils/util.ts";
import { useEffect, useState } from "preact/hooks";

import {
  abbreviateAddress,
  // formatSatoshisToBTC,
  getFileSuffixFromMime,
  getSupply,
} from "$lib/utils/util.ts";

import { useWindowSize } from "$lib/hooks/useWindowSize.ts";

dayjs.extend(relativeTime);

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
      "text-lg mobileSm:text-lg mobileLg:text-xl tablet:text-2xl desktop:text-2xl",
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

  let src: string;
  const suffix = getFileSuffixFromMime(stamp.stamp_mimetype);
  src = `/content/${stamp.tx_hash}.${suffix}`;
  if (suffix === "unknown") {
    src = `/not-available.png`;
  }

  // Add state for validated content
  const [validatedContent, setValidatedContent] = useState<preact.VNode | null>(
    null,
  );

  useEffect(() => {
    const validateSVG = async () => {
      try {
        const response = await fetch(src);

        if (!response.ok) {
          throw new Error("Failed to fetch SVG");
        }

        const svgContent = await response.text();

        // Show fallback if content is empty, invalid SVG, or contains deploy data
        if (
          !svgContent || !isValidSVG(svgContent) ||
          svgContent.includes('"p":"deploy"')
        ) {
          setValidatedContent(
            <img
              src="/not-available.png"
              alt="Content not available"
              className="h-full w-full object-contain pixelart"
            />,
          );
          return;
        }

        // Set valid SVG content
        setValidatedContent(
          <img
            src={src}
            loading="lazy"
            alt={`Stamp No. ${stamp.stamp}`}
            className="h-full w-full object-contain pixelart"
            onError={(e) => {
              e.currentTarget.src = `/not-available.png`;
            }}
          />,
        );
      } catch {
        setValidatedContent(
          <img
            src="/not-available.png"
            alt="Content not available"
            className="h-full w-full object-contain pixelart"
          />,
        );
      }
    };

    if (suffix === "svg") {
      validateSVG();
    }
  }, [src, suffix, stamp.stamp]);

  const renderContent = () => {
    if (stamp.stamp_mimetype === "text/plain" || suffix === "txt") {
      return <TextContentIsland src={src} />;
    } else if (suffix === "html") {
      return (
        <iframe
          scrolling="no"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          src={src}
          className="h-full w-fit max-w-full object-contain items-center pointer-events-none"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = document.createElement("img");
            fallback.src = "/not-available.png";
            fallback.alt = "Content not available";
            fallback.className = "w-full h-full object-contain rounded-lg";
            const parent = e.currentTarget.parentNode;
            if (parent) {
              parent.appendChild(fallback);
            }
          }}
        />
      );
    } else if (suffix === "svg") {
      return validatedContent || (
        <img
          src="/not-available.png"
          alt="Loading..."
          className="h-full w-full object-contain pixelart"
        />
      );
    } else {
      return (
        <img
          src={src}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = `/not-available.png`;
          }}
          alt={`Stamp No. ${stamp.stamp}`}
          className="h-full w-full object-contain pixelart"
        />
      );
    }
  };

  const renderPrice = () => {
    if (isRecentSale && stamp.sale_data) {
      return `${stamp.sale_data.btc_amount.toLocaleString()} SATS`;
    } else if (Number.isFinite(stamp.floorPrice)) {
      return `${Number(stamp.floorPrice).toLocaleString()} SATS`; // FIXME: this may be in BTC..
    } else {
      return "NOT LISTED";
    }
  };

  const shouldDisplayHash = Number(stamp.stamp ?? 0) >= 0 ||
    (stamp.cpid && stamp.cpid.charAt(0) === "A");

  const supplyDisplay = stamp.ident !== "SRC-20" && stamp.balance
    ? `${getSupply(Number(stamp.balance), stamp.divisible)}/${
      stamp.supply < 100000 && !stamp.divisible
        ? getSupply(stamp.supply, stamp.divisible)
        : "+100000"
    }`
    : `1/${getSupply(stamp.supply, stamp.divisible)}`;

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
        {/* Image Container - Made more flexible */}
        <div className="relative w-full h-full">
          <div className="aspect-stamp w-full h-full overflow-hidden image-rendering-pixelated">
            <div className="center relative w-full h-full">
              {renderContent()}
            </div>
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
