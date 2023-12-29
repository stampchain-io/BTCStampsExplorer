import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import {
  get_suffix_from_mimetype,
  getSupply,
  short_address,
} from "$lib/utils/util.ts";

dayjs.extend(relativeTime);

export function StampCard(
  { stamp, kind = "stamp" }: {
    stamp: StampRow;
    kind: "cursed" | "stamp" | "named";
  },
) {
  let src: string;
  const suffix = get_suffix_from_mimetype(stamp.stamp_mimetype);
  src = `/content/${stamp.tx_hash}.${suffix}`;
  if (suffix === "json" || suffix === "txt") {
    src = `/content/not-available.png`;
  }
  return (
    <a
      href={`/stamp/${stamp.tx_hash}`}
      class="text-white group relative z-10 flex h-full w-full grow flex-col overflow-hidden rounded-[17px] p-2 @container bg-gray-800 transition-all hover:bg-gray-700"
    >
      <div class="relative flex overflow-hidden">
        <div class="pointer-events-none relative aspect-square min-h-[70px] grow overflow-hidden rounded-[13px]">
          <div class="center relative aspect-square">
            {suffix === "html"
              ? (
                <iframe
                  sandbox="allow-scripts allow-same-origin"
                  src={src}
                  class="h-full w-fit max-w-full object-contain items-center standalone:h-full standalone:w-auto safari_only_image"
                />
              )
              : (
                <img
                  src={src}
                  onError={(e) => {
                    e.currentTarget.src = `/content/not-available.png`;
                  }}
                  alt={`Stamp No. ${stamp.stamp}`}
                  class="pixelart image-rendering-pixelated h-full w-fit max-w-full object-contain items-center standalone:h-full standalone:w-auto safari_only_image"
                />
              )}
          </div>
        </div>
      </div>
      <div class="flex grow flex-col pt-2.5 font-title text-[13px] font-medium text-text">
        <div class="flex justify-between">
          <h3 class="text-[15px] font-medium text-text-strong">
            {stamp.stamp && stamp.stamp >= 0 ? `#${stamp.stamp}` : "CURSED"}
            {
              /* TODO: change this when we have cursed numbering
              `#${stamp.stamp}`
            */
            }
          </h3>
          <h3 class="truncate text-[12px] text-text">
            {stamp.creator_name
              ? stamp.creator_name
              : short_address(stamp.creator, 6)}
          </h3>
        </div>
        {
          /*
          stamp.collection &&
          <a class="text-[12px] text-accent hover:underline" href="/collection/honey-badgers">
            {stamp.collection}
          </a>
        */
        }
        <p class="truncate text-[13px] rounded-lg ">
          {stamp.cpid}
        </p>
        <div class="flex flex-1 flex-col justify-end">
          <div class="flex items-center gap-x-2 justify-between">
            <div
              class="rounded-[7px] bg-foreground-1 px-[8px] py-[4px] transition-all hover:bg-foreground-1-hover"
              aria-label="up-vote"
            >
              <div class="center h-[18px] gap-x-1">
                <p class="leading-4">
                  {stamp.ident !== "SRC-20" &&
                    (
                      stamp.balance
                        ? `${getSupply(stamp.balance, stamp.divisible)}/${
                          stamp.supply < 100000 && !stamp.divisible
                            ? getSupply(stamp.supply, stamp.divisible)
                            : "+100000"
                        }`
                        : `1/${getSupply(stamp.supply, stamp.divisible)}`
                    )}
                </p>
              </div>
            </div>
            <p class="truncate text-[13px] rounded-lg uppercase">
              {stamp.ident && stamp.ident === "SRC-20"
                ? "SRC-20"
                : stamp.ident && stamp.ident === "SRC-721"
                ? "SRC-721"
                : stamp.stamp_mimetype.split("/")[1]}
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}
