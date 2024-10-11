import { useState } from "preact/hooks";
import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { StampRow } from "globals";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

import {
  abbreviateAddress,
  formatSatoshisToBTC,
  getFileSuffixFromMime,
  getSupply,
} from "utils/util.ts";

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
}: {
  stamp: StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  };
  kind: "cursed" | "stamp" | "named";
  isRecentSale?: boolean;
  showInfo?: boolean;
  abbreviationLength?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

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
          className="h-full w-fit max-w-full object-contain items-center standalone:h-full standalone:w-auto"
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
          className="h-full w-full object-contain items-center standalone:h-full standalone:w-auto pixelart"
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
    ? `${getSupply(stamp.balance, stamp.divisible)}/${
      stamp.supply < 100000 && !stamp.divisible
        ? getSupply(stamp.supply, stamp.divisible)
        : "+100000"
    }`
    : `1/${getSupply(stamp.supply, stamp.divisible)}`;

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, abbreviationLength);

  return (
    <a
      href={`/stamp/${stamp.tx_hash}`}
      className="border-2 border-[#2E0F4D] text-white group relative z-10 flex h-full w-full grow flex-col p-[6px] sm:p-3 rounded-[6px] transition-all hover:border-[#9900EE] hover:shadow-[0px_0px_20px_#9900EE]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background:
          "linear-gradient(141deg, rgba(10, 0, 15, 0) 0%, #14001F 50%, #1F002E 100%)",
      }}
    >
      <div className="relative flex overflow-hidden">
        <div className="pointer-events-none relative aspect-square min-h-[70px] grow overflow-hidden image-rendering-pixelated">
          <div className="center relative aspect-square overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
      {showInfo && (
        <div className="flex grow flex-col pt-1 font-title font-medium text-text">
          {/* Stamp Number with Gradient */}
          <div className="text-center">
            {shouldDisplayHash && (
              <span className="text-[#666666] text-[30px] font-light font-work-sans">
                #
              </span>
            )}
            <span className="text-[30px] font-black font-work-sans bg-gradient-to-r from-[#666666] to-[#999999] bg-clip-text text-transparent">
              {Number(stamp.stamp ?? 0) >= 0 ||
                  (stamp.cpid && stamp.cpid.charAt(0) === "A")
                ? `${stamp.stamp}`
                : `${stamp.cpid}`}
            </span>
          </div>

          {/* Creator Name or Abbreviated Address */}
          <div className="text-center text-[#999999] text-[20px] font-bold font-work-sans break-words">
            {creatorDisplay}
          </div>

          {/* Price and Supply */}
          <div className="flex justify-between mt-2">
            {/* Render Price on the Left */}
            <div>
              <span className="text-[#999999] text-[16px] font-medium font-work-sans">
                {renderPrice()}
              </span>
            </div>

            {/* Supply on the Right */}
            <div className="text-right text-[#666666] text-[18px] font-bold font-work-sans">
              {supplyDisplay}
            </div>
          </div>
        </div>
      )}
    </a>
  );
}
