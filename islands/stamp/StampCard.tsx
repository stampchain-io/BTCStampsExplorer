import type { JSX } from "preact";
import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { StampRow } from "globals";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

import {
  abbreviateAddress,
  formatSatoshisToBTC,
  getFileSuffixFromMime,
  getSupply,
} from "$lib/utils/util.ts";

dayjs.extend(relativeTime);

interface StampCardProps {
  stamp: StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  };
  kind: "cursed" | "stamp" | "named";
  isRecentSale?: boolean;
  showInfo?: boolean;
  abbreviationLength?: number;
  showDetails?: boolean;
  className?: string;
  style?: JSX.CSSProperties;
}

export function StampCard({
  stamp,
  kind = "stamp",
  isRecentSale = false,
  showInfo = true,
  abbreviationLength = 6,
  showDetails = false,
  className = "",
  style,
}: StampCardProps) {
  let src: string;
  const suffix = getFileSuffixFromMime(stamp.stamp_mimetype);
  src = `/content/${stamp.tx_hash}.${suffix}`;
  if (suffix === "unknown") {
    src = `/not-available.png`;
  }

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
            // Show fallback content
            e.currentTarget.style.display = "none"; // Hide the iframe
            const fallback = document.createElement("img");
            fallback.src = "/not-available.png"; // Fallback image
            fallback.alt = "Content not available";
            fallback.className = "w-full h-full object-contain rounded-lg";
            // Fix for linter error by checking if parentNode exists
            const parent = e.currentTarget.parentNode;
            if (parent) {
              parent.appendChild(fallback);
            }
          }}
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
          className="h-full w-full object-contain items-center pixelart"
        />
      );
    }
  };

  const renderPrice = () => {
    if (isRecentSale && stamp.sale_data) {
      return `${formatSatoshisToBTC(stamp.sale_data.btc_amount)}`;
    } else if (Number.isFinite(stamp.floorPrice)) {
      return `${stamp.floorPrice} BTC`;
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

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, abbreviationLength);

  return (
    <div className="relative flex justify-center">
      <a
        href={`/stamp/${stamp.tx_hash}`}
        target="_top"
        f-partial={`/stamp/${stamp.tx_hash}`}
        className={`text-white group relative z-0 flex flex-col 
          p-stamp-card-lg mobile-md:p-3
          rounded-stamp transition-all 
          w-full
          max-w-[318px] 
          mobile-lg:max-w-[348px] 
          tablet:max-w-[318px] 
          desktop:max-w-[318px] 
          hover:border-stamp-primary-hover 
          hover:shadow-stamp 
          hover:border-solid 
          border-2 border-transparent
          bg-stamp-primary
          ${className}`}
        style={style}
      >
        {/* Image Container */}
        <div className="relative w-full">
          <div className="aspect-stamp overflow-hidden image-rendering-pixelated w-full">
            <div className="center relative w-full h-full">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Info Section */}
        {showInfo && (
          <div className="flex flex-col font-medium px-2 mobile-sm:px-[6px] tablet:px-3">
            {showDetails && (
              <>
                {/* Stamp Number */}
                <div className="pt-1 text-center">
                  {shouldDisplayHash && (
                    <span className="text-stamp-text-secondary 
                      text-base
                      mobile-sm:text-lg 
                      mobile-lg:text-xl 
                      tablet:text-2xl 
                      desktop:text-3xl 
                      font-light font-work-sans">
                      #
                    </span>
                  )}
                  <span className="text-base
                    mobile-sm:text-lg 
                    mobile-lg:text-xl 
                    tablet:text-2xl 
                    desktop:text-3xl 
                    font-black bg-gradient-to-r 
                    from-stamp-text-secondary 
                    to-stamp-text-primary 
                    bg-clip-text text-transparent">
                    {Number(stamp.stamp ?? 0) >= 0 ||
                        (stamp.cpid && stamp.cpid.charAt(0) === "A")
                      ? `${stamp.stamp}`
                      : `${stamp.cpid}`}
                  </span>
                </div>

                {/* Creator Name or Abbreviated Address */}
                <div className="text-center text-stamp-text-primary 
                  text-sm
                  mobile-sm:text-base 
                  mobile-lg:text-base 
                  tablet:text-lg 
                  desktop:text-xl 
                  font-bold font-work-sans break-words truncate">
                  {creatorDisplay}
                </div>

                {/* Price and Supply */}
                <div className="flex justify-between mt-2">
                  {/* Price */}
                  <div>
                    <span className="text-stamp-text-primary 
                      text-xs
                      mobile-sm:text-xs 
                      mobile-lg:text-sm 
                      tablet:text-base 
                      desktop:text-lg 
                      font-medium font-work-sans">
                      {renderPrice()}
                    </span>
                  </div>

                  {/* Supply */}
                  <div className="text-right text-stamp-text-secondary 
                    text-xs
                    mobile-sm:text-xs 
                    mobile-lg:text-sm 
                    tablet:text-base 
                    desktop:text-lg 
                    font-bold font-work-sans">
                    {supplyDisplay}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </a>
    </div>
  );
}
