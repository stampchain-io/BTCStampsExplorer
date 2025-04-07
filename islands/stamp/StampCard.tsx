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

import { StampRow } from "$globals";
import TextContentIsland from "./detail/StampTextContent.tsx";
import { BREAKPOINTS } from "$lib/utils/constants.ts";
import { useEffect, useState } from "preact/hooks";
import { useWindowSize } from "$lib/hooks/useWindowSize.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import { logger } from "$lib/utils/logger.ts";
// Text style constants for different breakpoints

// TODO(@reinamora_137): add a variant for the inline detail display

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
  showEdition = false,
  showMinDetails = false,
  variant = "default",
  fromPage,
}: {
  stamp: StampWithSaleData;
  isRecentSale?: boolean;
  showDetails?: boolean;
  showEdition?: boolean;
  showMinDetails?: boolean;
  variant?: "default" | "grey";
  fromPage?: string;
}) {
  // Add window size hook
  const { width } = useWindowSize();
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState<string>("");
  // Function to get current abbreviation length based on screen size
  const getAbbreviationLength = () => {
    if (width >= BREAKPOINTS.desktop) return ABBREVIATION_LENGTHS.desktop;
    if (width >= BREAKPOINTS.tablet) return ABBREVIATION_LENGTHS.tablet;
    if (width >= BREAKPOINTS.mobileLg) return ABBREVIATION_LENGTHS.mobileLg;
    if (width >= BREAKPOINTS.mobileMd) return ABBREVIATION_LENGTHS.mobileMd;
    return ABBREVIATION_LENGTHS.mobileSm;
  };

  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(stamp as StampRow);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  useEffect(() => {
    fetchStampImage();
  }, []);

  // Add state for validated content
  const [validatedContent, setValidatedContent] = useState<preact.VNode | null>(
    null,
  );

  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml") {
        const { isValid, error } = await validateStampContent(src);
        if (isValid) {
          setValidatedContent(
            <div class="stamp-container">
              <div class="relative z-10 aspect-square">
                <img
                  src={src}
                  loading="lazy"
                  alt={`Stamp No. ${stamp.stamp}`}
                  class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                  onError={handleImageError}
                />
              </div>
            </div>,
          );
        } else {
          logger.debug("stamps", {
            message: "SVG validation failed",
            error,
            stamp: stamp.stamp,
          });
          setValidatedContent(
            <div class="stamp-container">
              <div class="relative z-10 aspect-square">
                <img
                  src={NOT_AVAILABLE_IMAGE}
                  alt="Invalid SVG"
                  class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                />
              </div>
            </div>,
          );
        }
      }
    };
    if (src) {
      validateContent();
    }
  }, [src, stamp.stamp_mimetype]);

  const renderContent = () => {
    if (loading && !src) {
      return (
        <div class="stamp-container">
          <div class="relative z-10 aspect-square animate-pulse">
            <div class="flex items-center justify-center bg-[#220033CC] object-contain rounded pixelart stamp-image">
              <svg
                class="p-[25%] text-stamp-purple-dark"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 32 32"
              >
                <path d="M27.5 28C27.5 28.1326 27.4473 28.2598 27.3536 28.3536C27.2598 28.4473 27.1326 28.5 27 28.5H5C4.86739 28.5 4.74021 28.4473 4.64645 28.3536C4.55268 28.2598 4.5 28.1326 4.5 28C4.5 27.8674 4.55268 27.7402 4.64645 27.6464C4.74021 27.5527 4.86739 27.5 5 27.5H27C27.1326 27.5 27.2598 27.5527 27.3536 27.6464C27.4473 27.7402 27.5 27.8674 27.5 28ZM27.5 18V23C27.5 23.3978 27.342 23.7794 27.0607 24.0607C26.7794 24.342 26.3978 24.5 26 24.5H6C5.60218 24.5 5.22064 24.342 4.93934 24.0607C4.65804 23.7794 4.5 23.3978 4.5 23V18C4.5 17.6022 4.65804 17.2206 4.93934 16.9393C5.22064 16.658 5.60218 16.5 6 16.5H13.6713L11.5787 6.73375C11.4694 6.22352 11.4754 5.69528 11.5965 5.1877C11.7177 4.68012 11.9507 4.20604 12.2787 3.80017C12.6067 3.39429 13.0213 3.06689 13.4921 2.84193C13.963 2.61697 14.4782 2.50015 15 2.5H17C17.5219 2.49996 18.0373 2.61665 18.5083 2.84153C18.9793 3.06641 19.394 3.39378 19.7221 3.79968C20.0503 4.20558 20.2835 4.67972 20.4046 5.18739C20.5258 5.69507 20.5319 6.22341 20.4225 6.73375L18.3288 16.5H26C26.3978 16.5 26.7794 16.658 27.0607 16.9393C27.342 17.2206 27.5 17.6022 27.5 18ZM14.6938 16.5H17.3062L19.4438 6.52375C19.5218 6.15932 19.5174 5.78205 19.4309 5.41954C19.3444 5.05702 19.1779 4.71844 18.9436 4.42858C18.7093 4.13871 18.4132 3.90489 18.0769 3.74422C17.7407 3.58356 17.3727 3.50012 17 3.5H15C14.6272 3.49993 14.2591 3.58323 13.9227 3.74382C13.5862 3.9044 13.2899 4.1382 13.0555 4.42809C12.8211 4.71798 12.6545 5.05663 12.5679 5.41923C12.4813 5.78184 12.4769 6.15922 12.555 6.52375L14.6938 16.5ZM26.5 18C26.5 17.8674 26.4473 17.7402 26.3536 17.6464C26.2598 17.5527 26.1326 17.5 26 17.5H6C5.86739 17.5 5.74021 17.5527 5.64645 17.6464C5.55268 17.7402 5.5 17.8674 5.5 18V23C5.5 23.1326 5.55268 23.2598 5.64645 23.3536C5.74021 23.4473 5.86739 23.5 6 23.5H26C26.1326 23.5 26.2598 23.4473 26.3536 23.3536C26.4473 23.2598 26.5 23.1326 26.5 23V18Z" />
              </svg>
            </div>
          </div>
        </div>
      );
    }

    if (stamp.stamp_mimetype?.startsWith("audio/")) {
      return (
        <div class="stamp-audio-container relative w-full h-full flex items-center justify-center">
          <div class="absolute inset-0 flex items-center justify-center">
            <audio
              controls
              class="stamp-audio-player"
            >
              <source src={src} type={stamp.stamp_mimetype} />
            </audio>
          </div>
        </div>
      );
    }

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
              class="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
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
            <div class="absolute inset-0 cursor-pointer" />
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
        <div class="stamp-container">
          <div class="relative z-10 aspect-square">
            <img
              src={NOT_AVAILABLE_IMAGE}
              alt="Loading..."
              class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
            />
          </div>
        </div>
      );
    }

    // Regular images
    return (
      <div class="stamp-container">
        <div class="relative z-10 aspect-square">
          <img
            src={src}
            loading="lazy"
            alt={`Stamp No. ${stamp.stamp}`}
            class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
            onError={handleImageError}
          />
        </div>
      </div>
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
    }

    // Handle floor price or recent sale price
    const price = stamp.floorPrice !== "priceless"
      ? stamp.floorPrice
      : stamp.recentSalePrice;
    if (price !== "priceless" && !isNaN(Number(price))) {
      return {
        text: `${stripTrailingZeros(Number(price).toFixed(8))} BTC`,
        style: TEXT_STYLES.price,
      };
    }

    // Default to mime type if no valid price
    return {
      text: stamp.stamp_mimetype?.split("/")[1].toUpperCase() || "UNKNOWN",
      style: TEXT_STYLES.mimeType,
    };
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

  const editionCount = stamp.divisible
    ? (stamp.supply / 100000000).toFixed(2)
    : stamp.supply > 100000
    ? "+100000"
    : stamp.supply;

  return (
    <div class="relative flex justify-center w-full h-full max-w-72">
      <a
        href={`/stamp/${stamp.tx_hash}`}
        target="_top"
        f-partial={`/stamp/${stamp.tx_hash}`}
        data-long-number={isLongNumber(stampValue)}
        class={`
          text-white group relative z-0 flex flex-col
          p-stamp-card mobileLg:p-3
          rounded-md transition-all
          w-full h-full
          hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent
          bg-stamp-card-bg
        `}
      >
        {fromPage && fromPage === "stamp" && (
          <div className="absolute top-0 right-0 w-[31px] h-[31px] z-10 rounded-[3px] bg-[#1F002E] p-[3px] desktop:block hidden">
            <img className="" src="/img/stamp/atom.svg" />
          </div>
        )}
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

        {showEdition && (
          <div class="flex flex-col items-center px-1.5 mobileLg:px-3 pt-1.5 mobileLg:pt-3">
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
            <div class="-mt-1 mobileLg:mt-0.5 w-full flex justify-between items-center">
              <span
                class={`${TEXT_STYLES.minimal.price.base} ${TEXT_STYLES.minimal.price.sizes}`}
              >
                {editionCount}
              </span>
              <span
                class={`${TEXT_STYLES.minimal.price.base} ${TEXT_STYLES.minimal.price.sizes}`}
              >
                {renderPrice().text}
              </span>
            </div>
          </div>
        )}

        {/* Minimal Details Section */}
        {showMinDetails && !showDetails && (
          <div class="flex flex-col items-center px-1.5 mobileLg:px-3 pt-1.5 mobileLg:pt-3">
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
            <div class="-mt-1 mobileLg:mt-0.5">
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
