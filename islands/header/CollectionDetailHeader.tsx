/* ===== COLLECTION DETAILS HEADER COMPONENT ===== */
import type { CollectionWithOptionalMarketData, StampRow } from "$server/types/collection.d.ts";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { containerBackground, containerColData } from "$layout";
import {
  abbreviateAddress,
  formatBTC,
  formatMarketCap,
  formatNumberWithCommas,
  formatVolume,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { handleImageError } from "$lib/utils/ui/media/imageUtils.ts";
import {
  headingGreyDLLink,
  labelSm,
  textSm,
  titleGreyLD,
  value3xl,
  valueSm,
} from "$text";

/* ===== COMPONENT ===== */
export const CollectionDetailHeader = (
  { collection, stamps }: { collection: CollectionWithOptionalMarketData; stamps: StampRow[] },
) => {
  console.log("collection: ", collection);

  /* ===== COMPONENT ===== */
  return (
    <div class="flex flex-col gap-6">
      <SearchStampModal showButton={false} />
      {/* ===== COLLECTION INFO SECTION ===== */}
      <div class={containerBackground}>
        <div class="flex justify-between">
          <div class="flex">
            {stamps && stamps.length > 0 && (
              <img
                src={stamps[0].stamp_url}
                loading="lazy"
                onError={handleImageError}
                alt="Collection image"
                class="h-[91px] w-[91px] object-contain items-center pixelart image-rendering-pixelated"
              />
            )}
            {(!stamps || stamps.length === 0) && (
              <div class="h-[91px] w-[91px] bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                No Image
              </div>
            )}
            <div class="flex flex-col pl-6">
              <h1 class={`${titleGreyLD} pb-1.5`}>
                {collection.collection_name.length > 12
                  ? (
                    <>
                      <span class="mobileLg:hidden">
                        {collection.collection_name.slice(0, 10)
                          .toUpperCase()}...
                      </span>
                      <span class="hidden mobileLg:inline">
                        {collection.collection_name.toUpperCase()}
                      </span>
                    </>
                  )
                  : collection.collection_name.toUpperCase()}
              </h1>
              <h2 class={labelSm}>
                COLLECTION BY
              </h2>
              <div>
                <a
                  class={headingGreyDLLink}
                  href={`/wallet/${collection.creators?.[0] || ""}`}
                  target="_parent"
                >
                  {collection.creators && collection.creators.length > 0
                    ? (collection.creator_names &&
                        collection.creator_names.length > 0
                      ? collection.creator_names[0]
                      : abbreviateAddress(collection.creators[0], 6))
                    : "N/A"}
                </a>
              </div>
            </div>
          </div>
        </div>

        {collection.collection_description && (
          <div class="flex flex-col pt-3 min-[520px]:pt-[18px]">
            <div class={containerColData}>
              <h5 class={labelSm}>
                ABOUT
              </h5>
              <h6 class={`${textSm} pt-1 mb-0`}>
                {collection.collection_description}
              </h6>
            </div>
          </div>
        )}
      </div>

      {/* ===== COLLECTION STATS SECTION ===== */}
      <div class={containerBackground}>
        <div class="flex flex-col">
          <h5 class={labelSm}>
            MARKETCAP
          </h5>
          <h6 class={value3xl}>
            {collection.marketData?.minFloorPriceBTC !== null &&
                collection.marketData?.minFloorPriceBTC !== undefined &&
                collection.total_editions
              ? formatMarketCap(
                collection.marketData.minFloorPriceBTC *
                  collection.total_editions,
              )
              : "N/A"} <span class="font-light">BTC</span>
          </h6>
        </div>
        <div class="flex flex-wrap justify-between pt-3">
          <div class="-space-y-0.5">
            <h5 class={labelSm}>
              HOLDERS
            </h5>
            <h6 class={valueSm}>
              {collection.marketData?.totalUniqueHolders
                ? formatNumberWithCommas(
                  collection.marketData.totalUniqueHolders,
                )
                : "N/A"}
            </h6>
          </div>
          <div class="hidden min-[520px]:block text-center -space-y-0.5">
            <h5 class={labelSm}>
              EDITIONS
            </h5>
            <h6 class={valueSm}>
              {Number(collection.total_editions).toFixed(0)}
            </h6>
          </div>
          <div class="text-right -space-y-0.5">
            <h5 class={labelSm}>
              STAMPS
            </h5>
            <h6 class={valueSm}>{collection.stamp_count}</h6>
          </div>
        </div>
        <div class="flex flex-wrap justify-between pt-3">
          <div class="-space-y-0.5">
            <h5 class={labelSm}>
              FLOOR PRICE
            </h5>
            <h6 class={valueSm}>
              {collection.marketData?.minFloorPriceBTC !== null &&
                  collection.marketData?.minFloorPriceBTC !== undefined
                ? `${formatBTC(collection.marketData.minFloorPriceBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
          <div class="hidden min-[520px]:block text-center -space-y-0.5">
            <h5 class={labelSm}>
              24H VOLUME
            </h5>
            <h6 class={valueSm}>
              {collection.marketData?.totalVolume24hBTC !== undefined
                ? `${formatVolume(collection.marketData.totalVolume24hBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
          <div class="text-right -space-y-0.5">
            <h5 class={labelSm}>
              AVG PRICE
            </h5>
            <h6 class={valueSm}>
              {collection.marketData?.avgFloorPriceBTC !== null &&
                  collection.marketData?.avgFloorPriceBTC !== undefined
                ? `${formatBTC(collection.marketData.avgFloorPriceBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
        </div>
      </div>
    </div>
  );
};
