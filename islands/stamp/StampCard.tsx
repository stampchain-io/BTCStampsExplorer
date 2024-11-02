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

export function StampCard({
  stamp,
  kind = "stamp",
  isRecentSale = false,
  showInfo = true,
  abbreviationLength = 6,
  showDetails = false,
}: {
  stamp: StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  };
  kind: "cursed" | "stamp" | "named";
  isRecentSale?: boolean;
  showInfo?: boolean;
  abbreviationLength?: number;
  showDetails?: boolean;
}) {
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
          className="h-full w-full object-contain pixelart"
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
    <div class="relative flex justify-center">
      <a
        href={`/stamp/${stamp.tx_hash}`}
        target="_top"
        f-partial={`/stamp/${stamp.tx_hash}`}
        class={`
          text-white group relative z-0 flex flex-col
          p-stamp-card-lg mobile-768:p-3
          rounded-stamp transition-all
          w-full
          hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent
          bg-stamp-card-bg
        `}
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
          <div class="flex flex-col font-medium px-2 tablet:px-3">
            {showDetails && (
              <>
                {/* Stamp Number */}
                <div class="pt-1 text-center">
                  {shouldDisplayHash && (
                    <span class="text-stamp-grey-darker text-lg mobile-768:text-xl tablet:text-2xl desktop:text-3xl font-light font-work-sans">
                      #
                    </span>
                  )}
                  <span class="text-lg mobile-768:text-xl tablet:text-2xl desktop:text-3xl font-black 
                    bg-stamp-text-grey bg-clip-text text-fill-transparent">
                    {Number(stamp.stamp ?? 0) >= 0 ||
                        (stamp.cpid && stamp.cpid.charAt(0) === "A")
                      ? `${stamp.stamp}`
                      : `${stamp.cpid}`}
                  </span>
                </div>

                {/* Creator Name or Abbreviated Address */}
                <div class="text-stamp-grey text-base mobile-768:text-base tablet:text-lg desktop:text-xl 
                  font-bold font-work-sans break-words truncate text-center">
                  {creatorDisplay}
                </div>

                {/* Price and Supply */}
                <div class="flex justify-between mt-2">
                  {/* Render Price on the Left */}
                  <div class="truncate text-nowrap">
                    <span class="text-stamp-grey text-xs tablet:text-sm desktop:text-base desktop:text-base font-medium font-work-sans">
                      {renderPrice()}
                    </span>
                  </div>
                  <div class="text-stamp-grey-darker text-xs mobile-768:text-sm tablet:text-base desktop:text-lg 
                    font-bold font-work-sans text-right">
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
