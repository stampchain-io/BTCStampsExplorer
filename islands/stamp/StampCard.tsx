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

/**
 * Renders a stamp card component.
 * @param stamp - The stamp row data.
 * @param kind - The kind of stamp card (cursed, stamp, named).
 * @param isRecentSale - Whether this card is being displayed in the recent sales context.
 * @returns The stamp card component.
 */
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
            fallback.className = "w-full h-full object-contain rounded-lg"; // Apply the same styles
            e.currentTarget.parentNode.appendChild(fallback);
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
        className="text-white group relative z-0 flex flex-col p-[max(6px,min(12px,calc(6px+((100vw-360px)*0.029))))] sm:p-3 rounded-[6px] transition-all w-full max-w-[318px] lg:max-w-[348px] xl:max-w-[318px] 2xl:max-w-[318px] hover:border-[#aa00ff] hover:shadow-[0px_0px_30px_#aa00ff] hover:border-solid border-2 border-transparent"
        style={{
          background:
            "linear-gradient(141deg, rgba(10, 0, 15, 0) 0%, #14001F 50%, #1F002E 100%)",
        }}
      >
        {/* Image Container */}
        <div className="relative w-full">
          <div className="
              aspect-square
              overflow-hidden
              image-rendering-pixelated
              w-full
            ">
            <div className="center relative w-full h-full">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Info Section */}
        {showInfo && (
          <div className="flex flex-col font-medium px-[6px] xl:px-3">
            {/* Conditionally render the additional text */}
            {showDetails && (
              <>
                {/* Stamp Number */}
                <div className="pt-1 text-center">
                  {shouldDisplayHash && (
                    <span className="text-[#666666] text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-light font-work-sans">
                      #
                    </span>
                  )}
                  <span className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-black bg-gradient-to-r from-[#666666] to-[#999999] bg-clip-text text-transparent">
                    {Number(stamp.stamp ?? 0) >= 0 ||
                        (stamp.cpid && stamp.cpid.charAt(0) === "A")
                      ? `${stamp.stamp}`
                      : `${stamp.cpid}`}
                  </span>
                </div>

                {/* Creator Name or Abbreviated Address */}
                <div className="text-center text-[#999999] text-base md:text-base xl:text-lg 2xl:text-xl font-bold font-work-sans break-words truncate">
                  {creatorDisplay}
                </div>

                {/* Price and Supply */}
                <div className="flex justify-between mt-2">
                  {/* Render Price on the Left */}
                  <div>
                    <span className="text-[#999999] text-xs md:text-sm xl:text-base 2xl:text-lg font-medium font-work-sans">
                      {renderPrice()}
                    </span>
                  </div>

                  {/* Supply on the Right */}
                  <div className="text-right text-[#666666] text-xs md:text-sm xl:text-base 2xl:text-lg font-bold font-work-sans">
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
