import { Collection, StampRow } from "$globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";

export const CollectionDetailsHeader = (
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  console.log("collection: ", collection);

  const titleGreyLD =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black gray-gradient1";
  const dataColumn = "flex flex-col -space-y-1";
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXs =
    "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const _dataValue =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";

  return (
    <div className="flex flex-col gap-3 mobileMd:gap-6">
      <div className="flex flex-col dark-gradient p-3 mobileMd:p-6">
        <div className="flex justify-between">
          <div className="flex">
            <img
              src={stamps[0].stamp_url}
              loading="lazy"
              onError={handleImageError}
              alt="Collection image"
              className="h-[78px] w-[78px] mobileMd:h-[82px] mobileMd:w-[82px] mobileLg:h-[108px] mobileLg:w-[108px] desktop:h-[120px] desktop:w-[120px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
            />
            <div className="flex flex-col pl-[18px] mobileMd:pl-6">
              <p className={`${titleGreyLD} pb-0.75 mobileLg:pb-1.5`}>
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
              </p>
              <p className={dataLabel}>
                COLLECTION BY
              </p>
              <div>
                <p className="inline-blocktext-xl mobileLg:text-2xl font-black gray-gradient3 -mt-1">
                  {collection.creators
                    ? abbreviateAddress(collection.creators, 6)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden min-[480px]:flex flex-col justify-end -space-y-0.5">
            <div className={`${dataColumn} items-end`}>
              <p className={dataLabelSm}>
                HOLDERS{" "}
                <span className={dataValueSm}>
                  N/A
                </span>
              </p>
            </div>
            <div className={`${dataColumn} items-end`}>
              <p className={dataLabelSm}>
                EDITIONS{" "}
                <span className={dataValueSm}>
                  {Number(collection.total_editions).toFixed(0)}
                </span>
              </p>
            </div>
            <div className={`${dataColumn} items-end`}>
              <p className={dataLabelSm}>
                STAMPS{" "}
                <span className={dataValueSm}>
                  {collection.stamp_count}
                </span>
              </p>
            </div>
          </div>
        </div>
        {collection.collection_description && (
          <div className="flex flex-col pt-1.5 mobileLg:pt-3">
            <div className={dataColumn}>
              <p className={dataLabelSm}>
                ABOUT
              </p>
              <p className={`${dataValueXs} pt-1 mobileLg:pt-0.5`}>
                {collection.collection_description}
              </p>
            </div>
          </div>
        )}
      </div>

      <div class="flex flex-col dark-gradient p-3 mobileMd:p-6 ">
        <div className="flex flex-col">
          <p className={dataLabel}>
            MARKETCAP
          </p>
          <p className={dataValueXl}>
            N/A <span className="font-light">BTC</span>
          </p>
        </div>
        <div class="flex flex-wrap justify-between pt-3 mobileLg:pt-6">
          <div className="-space-y-0.5">
            <p className={dataLabelSm}>
              TOTAL VOLUME
            </p>
            <p className={dataValueSm}>N/A BTC</p>
          </div>
          <div className="text-center -space-y-0.5">
            <p className={dataLabelSm}>
              24H VOLUME
            </p>
            <p className={dataValueSm}>N/A BTC</p>
          </div>
          <div className="text-right -space-y-0.5">
            <p className={dataLabelSm}>
              FLOOR PRICE
            </p>
            <p className={dataValueSm}>N/A BTC</p>
          </div>
        </div>
      </div>
    </div>
  );
};
