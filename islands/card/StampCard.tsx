/* ===== STAMP CARD COMPONENT ===== */
/* @baba-update audio icon size (custom) - 247*/
/*@baba-check styles+icon*/
import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";
import { StampRow } from "$globals";
import { Icon, LoadingIcon } from "$icon";
import StampTextContent from "$islands/content/stampDetailContent/StampTextContent.tsx";

import { stripTrailingZeros } from "$lib/utils/formatUtils.ts";
import { formatSupplyValue } from "$lib/utils/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import {
  AUDIO_FILE_IMAGE,
  LIBRARY_FILE_IMAGE,
  NOT_AVAILABLE_IMAGE,
} from "$lib/utils/constants.ts";
import { TEXT_STYLES } from "$card";

/* ===== TYPES ===== */
interface StampWithSaleData extends Omit<StampRow, "stamp_base64"> {
  sale_data?: {
    btc_amount: number;
    block_index: number;
    tx_hash: string;
  };
  stamp_base64?: string;
}

/* ===== COMPONENT ===== */
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
  /* ===== STATE ===== */
  const [loading, setLoading] = useState<boolean>(true);
  const [src, setSrc] = useState<string>("");
  const [validatedContent, setValidatedContent] = useState<VNode | null>(null);

  // Audio-related state (always declared to avoid conditional hooks)
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Library file detection
  const isLibraryFile = stamp.stamp_mimetype === "text/css" ||
    stamp.stamp_mimetype === "text/javascript" ||
    stamp.stamp_mimetype === "application/javascript" ||
    stamp.stamp_mimetype === "application/gzip";

  /* ===== HANDLERS ===== */
  const handleImageError = (e: Event) => {
    if (e.currentTarget instanceof HTMLImageElement) {
      e.currentTarget.src = NOT_AVAILABLE_IMAGE;
    }
  };

  const getAbbreviationLength = () => {
    if (typeof globalThis !== "undefined" && globalThis.innerWidth) {
      if (globalThis.innerWidth < 768) return 4;
      if (globalThis.innerWidth < 1024) return 6;
      return 8;
    }
    return 6;
  };

  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(stamp as StampRow);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  /* ===== EFFECTS ===== */
  // Fetch stamp image on mount
  useEffect(() => {
    fetchStampImage();
  }, []);

  // Validate SVG content when source changes
  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml" && src) {
        try {
          // Fetch the SVG content
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
          }

          const svgContent = await response.text();

          // Check if SVG has external ordinals.com references
          if (svgContent.includes("ordinals.com/content/")) {
            // Rewrite external references to use our proxy
            let rewrittenSVG = svgContent.replace(
              /https:\/\/ordinals\.com\/content\/([^"'\s>]+)/g,
              "/api/proxy/ordinals/$1",
            );

            // Ensure SVG fills container by removing fixed dimensions and adding proper styling
            if (rewrittenSVG.includes("<svg")) {
              // Remove width and height attributes
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)\s+width="([^"]*)"([^>]*)/,
                "<svg$1$3",
              ).replace(
                /<svg([^>]*)\s+height="([^"]*)"([^>]*)/,
                "<svg$1$3",
              );

              // Add viewBox if not present (using the original dimensions)
              if (!rewrittenSVG.includes("viewBox")) {
                rewrittenSVG = rewrittenSVG.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 viewBox="0 0 460 500">',
                );
              }

              // Add responsive styling to fill container properly
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;">',
              );
            }

            setValidatedContent(
              <div class="stamp-container">
                <div class="relative z-10 aspect-square flex items-center justify-center">
                  <div
                    class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                    dangerouslySetInnerHTML={{ __html: rewrittenSVG }}
                  />
                </div>
              </div>,
            );
          } else {
            // No external references, use original src
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
          }
        } catch (_error) {
          // Fallback to NOT_AVAILABLE_IMAGE
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

  /* ===== RENDER HELPERS ===== */
  const renderContent = () => {
    if (loading && !src) {
      return (
        <div className="stamp-container">
          <LoadingIcon />
        </div>
      );
    }

    if (stamp.stamp_mimetype?.startsWith("audio/")) {
      // Audio player functionality
      const togglePlayback = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      };

      const handleAudioEnded = () => {
        setIsPlaying(false);
      };

      return (
        <div class="stamp-audio-container relative w-full h-full flex items-center justify-center">
          <div class="absolute inset-0 flex items-center justify-center">
            {/* Fallback image for audio files */}
            <img
              src={AUDIO_FILE_IMAGE}
              alt="Audio File"
              class="absolute top-0 left-0 w-full h-full object-contain rounded pixelart stamp-image pointer-events-none select-none"
              draggable={false}
            />
            <audio
              ref={audioRef}
              class="hidden"
              onEnded={handleAudioEnded}
            >
              <source src={src} type={stamp.stamp_mimetype} />
            </audio>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                togglePlayback();
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[40px] tablet:w-[34px] aspect-square flex items-center justify-center group/button"
            >
              <div className="absolute inset-0 bg-black opacity-50 rounded-full" />
              <Icon
                name={isPlaying ? "pause" : "play"}
                type="iconButton"
                weight="bold"
                size="xsR"
                color="custom"
                className="relative z-10 fill-stamp-grey group-hover/button:fill-stamp-purple-bright"
              />
            </button>
          </div>
        </div>
      );
    }

    if (stamp.stamp_mimetype === "text/plain") {
      return <StampTextContent src={src} />;
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

    // Handle Library Files (CSS, JS, GZIP)
    if (isLibraryFile) {
      return (
        <div class="stamp-container relative">
          <div class="relative z-10 aspect-square">
            <img
              src={LIBRARY_FILE_IMAGE}
              alt="Library File"
              class="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
              loading="lazy"
            />
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

  /* ===== COMPUTED VALUES ===== */
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

  const stampValue = Number(stamp.stamp ?? 0) >= 0 ||
      (stamp.cpid && stamp.cpid.charAt(0) === "A")
    ? `${stamp.stamp}`
    : `${stamp.cpid}`;

  const editionCount = stamp.divisible
    ? (stamp.supply / 100000000).toFixed(2)
    : stamp.supply > 100000
    ? "+100000"
    : stamp.supply;

  /* ===== STYLE HELPERS ===== */
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

  const isLongNumber = (value: string | number) => {
    const stringValue = String(value);
    return stringValue.length > 6;
  };

  /* ===== RENDER ===== */
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
        {/* ===== ATOM ICON ===== */}
        {fromPage && fromPage === "stamp" && (
          <div className="absolute top-0 right-0 w-[31px] h-[31px] z-10 rounded-[3px] bg-[#1F002E] p-[3px] desktop:block hidden">
            <Icon
              type="icon"
              name="atom"
              weight="normal"
              size="xs"
              color="grey"
            />
          </div>
        )}

        {/* ===== CONTENT SECTION ===== */}
        <div class="relative w-full h-full">
          <div class="aspect-stamp w-full h-full overflow-hidden flex items-center justify-center">
            {renderContent()}
          </div>
        </div>

        {/* ===== DETAILS SECTION ===== */}
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

        {/* ===== EDITION SECTION ===== */}
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

        {/* ===== MINIMAL DETAILS SECTION ===== */}
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
