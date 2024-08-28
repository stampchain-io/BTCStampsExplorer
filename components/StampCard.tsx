import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { StampRow } from "globals";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

import {
  abbreviateAddress,
  getFileSuffixFromMime,
  getSupply,
} from "utils/util.ts";

dayjs.extend(relativeTime);

/**
 * Renders a stamp card component.
 * @param stamp - The stamp row data.
 * @param kind - The kind of stamp card (cursed, stamp, named).
 * @returns The stamp card component.
 */
export function StampCard({
  stamp,
  kind = "stamp",
}: {
  stamp: StampRow;
  kind: "cursed" | "stamp" | "named";
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
          className="h-full w-full object-contain items-center standalone:h-full standalone:w-auto pixelart image-rendering-pixelated"
        />
      );
    }
  };

  return (
    <a
      href={`/stamp/${stamp.tx_hash}`}
      className="bg-[#2E0F4D] text-white group relative z-10 flex h-full w-full grow flex-col p-2 rounded-lg @container transition-all"
    >
      <div className="relative flex overflow-hidden">
        <div className="pointer-events-none relative aspect-square min-h-[70px] grow overflow-hidden rounded-lg">
          <div className="center relative aspect-square overflow-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
      <div className="flex grow flex-col pt-1 font-title text-[13px] font-medium text-text">
        <div className="flex justify-center items-center text-black">
          <h3 className="text-[13px] font-semibold text-white text-lg">
            {Number(stamp.stamp ?? 0) >= 0 ||
                (stamp.cpid && stamp.cpid.charAt(0) === "A")
              ? `Stamp #${stamp.stamp}`
              : `${stamp.cpid}`}
          </h3>
        </div>
        <div>
          <div className="flex justify-between text-black">
            <h3 className="text-white text-[11px]">Creator :</h3>
            <h3 className="text-white text-[11px]">Floor :</h3>
          </div>
          <div className="flex justify-between">
            <h3 className="truncate text-[13px] text-[#C7C5C5]">
              {stamp.creator_name
                ? stamp.creator_name
                : abbreviateAddress(stamp.creator, 6)}
            </h3>
            <h3 className="truncate text-[13px] text-[#C7C5C5]">
              {Number.isFinite(stamp.floorPrice)
                ? `${stamp.floorPrice} BTC`
                : "priceless"}
            </h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end rounded-b-lg text-white">
          <div className="flex items-center gap-x-2 justify-between pt-1">
            <div className="bg-foreground-1 transition-all hover:bg-foreground-1-hover">
              <div className="center h-[18px] text-[12px] gap-x-1">
                <p className="leading-4">
                  {stamp.ident !== "SRC-20" && stamp.balance
                    ? (
                      `${getSupply(stamp.balance, stamp.divisible)}/${
                        stamp.supply < 100000 && !stamp.divisible
                          ? getSupply(stamp.supply, stamp.divisible)
                          : "+100000"
                      }`
                    )
                    : (
                      `1/${getSupply(stamp.supply, stamp.divisible)}`
                    )}
                </p>
              </div>
            </div>
            <p className="truncate text-[12px] rounded-lg uppercase">
              {stamp.ident && stamp.ident === "SRC-20"
                ? "SRC-20"
                : stamp.ident && stamp.ident === "SRC-721"
                ? "SRC-721"
                : stamp.stamp_mimetype
                ? stamp.stamp_mimetype.split("/")[1]
                : "TEXT"}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}
