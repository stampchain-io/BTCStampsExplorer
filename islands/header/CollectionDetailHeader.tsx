/* ===== COLLECTION DETAILS HEADER COMPONENT ===== */
import { Collection, StampRow } from "$globals";
import {
  abbreviateAddress,
  formatBTC,
  formatMarketCap,
  formatNumberWithCommas,
  formatVolume,
} from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { containerBackground, containerColData } from "$layout";
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
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  console.log("collection: ", collection);

  /* ===== COMPONENT ===== */
  return (
    <div className="flex flex-col gap-6">
      <SearchStampModal showButton={false} />
      {/* ===== COLLECTION INFO SECTION ===== */}
      <div className={containerBackground}>
        <div className="flex justify-between">
          <div className="flex">
            <img
              src={stamps[0].stamp_url}
              loading="lazy"
              onError={handleImageError}
              alt="Collection image"
              className="h-[91px] w-[91px] object-contain items-center pixelart image-rendering-pixelated"
            />
            <div className="flex flex-col pl-6">
              <h1 className={`${titleGreyLD} pb-1.5`}>
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
              <h2 className={labelSm}>
                COLLECTION BY
              </h2>
              <div>
                <a
                  className={headingGreyDLLink}
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
          <div className="flex flex-col pt-3 min-[520px]:pt-[18px]">
            <div className={containerColData}>
              <h5 className={labelSm}>
                ABOUT
              </h5>
              <h6 className={`${textSm} pt-1 mb-0`}>
                {collection.collection_description}
              </h6>
            </div>
          </div>
        )}
      </div>

      {/* ===== COLLECTION STATS SECTION ===== */}
      <div class={containerBackground}>
        <div className="flex flex-col">
          <h5 className={labelSm}>
            MARKETCAP
          </h5>
          <h6 className={value3xl}>
            {collection.marketData?.minFloorPriceBTC !== null &&
                collection.total_editions
              ? formatMarketCap(
                collection.marketData.minFloorPriceBTC *
                  collection.total_editions,
              )
              : "N/A"} <span className="font-light">BTC</span>
          </h6>
        </div>
        <div class="flex flex-wrap justify-between pt-3">
          <div className="-space-y-0.5">
            <h5 className={labelSm}>
              HOLDERS
            </h5>
            <h6 className={valueSm}>
              {collection.marketData?.totalUniqueHolders
                ? formatNumberWithCommas(
                  collection.marketData.totalUniqueHolders,
                )
                : "N/A"}
            </h6>
          </div>
          <div className="hidden min-[520px]:block text-center -space-y-0.5">
            <h5 className={labelSm}>
              EDITIONS
            </h5>
            <h6 className={valueSm}>
              {Number(collection.total_editions).toFixed(0)}
            </h6>
          </div>
          <div className="text-right -space-y-0.5">
            <h5 className={labelSm}>
              STAMPS
            </h5>
            <h6 className={valueSm}>{collection.stamp_count}</h6>
          </div>
        </div>
        <div class="flex flex-wrap justify-between pt-3">
          <div className="-space-y-0.5">
            <h5 className={labelSm}>
              FLOOR PRICE
            </h5>
            <h6 className={valueSm}>
              {collection.marketData?.minFloorPriceBTC !== null
                ? `${formatBTC(collection.marketData.minFloorPriceBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
          <div className="hidden min-[520px]:block text-center -space-y-0.5">
            <h5 className={labelSm}>
              24H VOLUME
            </h5>
            <h6 className={valueSm}>
              {collection.marketData?.totalVolume24hBTC !== undefined
                ? `${formatVolume(collection.marketData.totalVolume24hBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
          <div className="text-right -space-y-0.5">
            <h5 className={labelSm}>
              AVG PRICE
            </h5>
            <h6 className={valueSm}>
              {collection.marketData?.avgFloorPriceBTC !== null
                ? `${formatBTC(collection.marketData.avgFloorPriceBTC)} BTC`
                : "N/A BTC"}
            </h6>
          </div>
        </div>
      </div>
    </div>
  );
};
