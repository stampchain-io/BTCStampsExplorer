/* ===== COLLECTION DETAILS HEADER COMPONENT ===== */
import { Collection, StampRow } from "$globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import { containerColData } from "$layout";
import {
  label,
  labelSm,
  textSm,
  textXs,
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
      {/* ===== COLLECTION INFO SECTION ===== */}
      <div className="flex flex-col dark-gradient rounded-lg p-6">
        <div className="flex justify-between">
          <div className="flex">
            <img
              src={stamps[0].stamp_url}
              loading="lazy"
              onError={handleImageError}
              alt="Collection image"
              className="h-[78px] w-[78px] mobileMd:h-[82px] mobileMd:w-[82px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
            />
            <div className="flex flex-col pl-[18px] mobileMd:pl-6">
              <h1 className={`${titleGreyLD} pb-0.75 mobileLg:pb-1.5`}>
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
              <h2 className={label}>
                COLLECTION BY
              </h2>
              <div>
                <h6 className="font-black text-xl gray-gradient3 inline-block -mt-1">
                  {collection.creators
                    ? abbreviateAddress(collection.creators, 6)
                    : "N/A"}
                </h6>
              </div>
            </div>
          </div>

          <div className="hidden min-[480px]:flex flex-col justify-end -space-y-0.5">
            <div className={`${containerColData} items-end`}>
              <h5 className={labelSm}>
                HOLDERS{" "}
                <span className={textSm}>
                  N/A
                </span>
              </h5>
            </div>
            <div className={`${containerColData} items-end`}>
              <h5 className={labelSm}>
                EDITIONS{" "}
                <span className={textSm}>
                  {Number(collection.total_editions).toFixed(0)}
                </span>
              </h5>
            </div>
            <div className={`${containerColData} items-end`}>
              <h5 className={labelSm}>
                STAMPS{" "}
                <span className={textSm}>
                  {collection.stamp_count}
                </span>
              </h5>
            </div>
          </div>
        </div>
        {collection.collection_description && (
          <div className="flex flex-col pt-3">
            <div className={containerColData}>
              <h5 className={labelSm}>
                ABOUT
              </h5>
              <h6 className={`${textXs} pt-1 mobileLg:pt-0.5 mb-0`}>
                {collection.collection_description}
              </h6>
            </div>
          </div>
        )}
      </div>

      {/* ===== COLLECTION STATS SECTION ===== */}
      <div class="flex flex-col dark-gradient rounded-lg p-6 ">
        <div className="flex flex-col">
          <h5 className={label}>
            MARKETCAP
          </h5>
          <h6 className={value3xl}>
            N/A <span className="font-light">BTC</span>
          </h6>
        </div>
        <div class="flex flex-wrap justify-between pt-6">
          <div className="-space-y-0.5">
            <h5 className={labelSm}>
              TOTAL VOLUME
            </h5>
            <h6 className={valueSm}>N/A BTC</h6>
          </div>
          <div className="text-center -space-y-0.5">
            <h5 className={labelSm}>
              24H VOLUME
            </h5>
            <h6 className={valueSm}>N/A BTC</h6>
          </div>
          <div className="text-right -space-y-0.5">
            <h5 className={labelSm}>
              FLOOR PRICE
            </h5>
            <h6 className={valueSm}>N/A BTC</h6>
          </div>
        </div>
      </div>
    </div>
  );
};
