import { Collection, StampRow } from "$globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import { HeaderStyles } from "./styles.ts";

export const CollectionDetailsHeader = (
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  return (
    <div className="flex flex-col gap-3 mobileMd:gap-6">
      <div className="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6">
        <div className="flex justify-between">
          <div className="flex">
            <img
              src={stamps[0].stamp_url}
              loading="lazy"
              onError={handleImageError}
              alt="Collection image"
              className="h-[78px] w-[78px] mobileMd:h-[82px] mobileMd:w-[82px] mobileLg:h-[108px] mobileLg:w-[108px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
            />
            <div className="flex flex-col pl-[18px] mobileMd:pl-6">
              <p
                className={`${HeaderStyles.titleGreyLD} pb-0.75 mobileLg:pb-1.5`}
              >
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
              <p className={HeaderStyles.dataLabel}>
                COLLECTION BY
              </p>
              <div>
                <p className="inline-blocktext-xl mobileLg:text-2xl font-black gray-gradient3 -mt-1">
                  {collection.creators
                    ? abbreviateAddress(collection.creators?.[0] || "", 6)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden min-[480px]:flex flex-col justify-end -space-y-0.5">
            <div className={`${HeaderStyles.dataColumn} items-end`}>
              <p className={HeaderStyles.dataLabelSm}>
                HOLDERS{" "}
                <span className={HeaderStyles.dataValueSm}>
                  N/A
                </span>
              </p>
            </div>
            <div className={`${HeaderStyles.dataColumn} items-end`}>
              <p className={HeaderStyles.dataLabelSm}>
                EDITIONS{" "}
                <span className={HeaderStyles.dataValueSm}>
                  {Number(collection.total_editions).toFixed(0)}
                </span>
              </p>
            </div>
            <div className={`${HeaderStyles.dataColumn} items-end`}>
              <p className={HeaderStyles.dataLabelSm}>
                STAMPS{" "}
                <span className={HeaderStyles.dataValueSm}>
                  {collection.stamp_count}
                </span>
              </p>
            </div>
          </div>
        </div>
        {collection.collection_description && (
          <div className="flex flex-col pt-1.5 mobileLg:pt-3">
            <div className={HeaderStyles.dataColumn}>
              <p className={HeaderStyles.dataLabelSm}>
                ABOUT
              </p>
              <p className={`${HeaderStyles.dataValueXs} pt-1 mobileLg:pt-0.5`}>
                {collection.collection_description}
              </p>
            </div>
          </div>
        )}
      </div>

      <div class="flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6 ">
        <div className="flex flex-col">
          <p className={HeaderStyles.dataLabel}>
            MARKETCAP
          </p>
          <p className={HeaderStyles.dataValueXl}>
            N/A <span className="font-light">BTC</span>
          </p>
        </div>
        <div class="flex flex-wrap justify-between pt-3 mobileLg:pt-6">
          <div className="-space-y-0.5">
            <p className={HeaderStyles.dataLabelSm}>
              TOTAL VOLUME
            </p>
            <p className={HeaderStyles.dataValueSm}>N/A BTC</p>
          </div>
          <div className="text-center -space-y-0.5">
            <p className={HeaderStyles.dataLabelSm}>
              24H VOLUME
            </p>
            <p className={HeaderStyles.dataValueSm}>N/A BTC</p>
          </div>
          <div className="text-right -space-y-0.5">
            <p className={HeaderStyles.dataLabelSm}>
              FLOOR PRICE
            </p>
            <p className={HeaderStyles.dataValueSm}>N/A BTC</p>
          </div>
        </div>
      </div>
    </div>
  );
};
