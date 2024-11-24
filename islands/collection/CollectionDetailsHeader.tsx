import { Collection, StampRow } from "globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";

export const CollectionDetailsHeader = (
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  console.log("collection: ", collection);

  const titlePurpleLDClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3";

  return (
    <div className="flex flex-col gap-3 mobileMd:gap-6">
      <div className="dark-gradient p-3 mobileMd:p-6">
        <div className="flex">
          <img
            src={stamps[0].stamp_url}
            loading="lazy"
            onError={handleImageError}
            alt="Collection image"
            className="h-[96px] w-[96px] mobileMd:h-[104px] mobileMd:w-[104px] mobileLg:h-[119px] mobileLg:w-[119px] desktop:h-[146px] desktop:w-[146px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
          />
          <div className="flex flex-col pl-[18px] mobileMd:pl-6">
            <p className={`${titlePurpleLDClassName} desktop:mt-[6px]`}>
              {collection.collection_name.toUpperCase()}
            </p>
            <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light pt-[6px]">
              COLLECTION BY
            </p>
            <div>
              <p className="text-stamp-grey-light text-xl mobileMd:text-2xl mobileLg:text-3xl desktop:text-4xl font-black">
                {collection.creators
                  ? abbreviateAddress(collection.creators, 6)
                  : "N/A"}
              </p>
              <div>
                <img src="" alt="" />
                <img src="" alt="" />
              </div>
            </div>
          </div>
        </div>
        <p className="text-stamp-grey-light">
          {collection.collection_description}
        </p>
      </div>

      <div className="flex justify-between dark-gradient p-3 mobileMd:p-6">
        <div className="text-left">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            STAMPS
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            {collection.stamp_count}
          </p>
        </div>
        <div className="text-center">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            EDITIONS
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            {Number(collection.total_editions).toFixed(0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            FLOOR PRICE
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
      </div>
      <div className="flex justify-between dark-gradient p-6">
        <div className="text-left">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            MARKETCAP
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            TOTAL VOLUME
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-stamp-grey-darker text-base mobileLg:text-lg font-light">
            HOLDERS
          </p>
          <p className="text-stamp-grey-light text-2xl mobileLg:text-4xl font-black">
            N/A
          </p>
        </div>
      </div>
    </div>
  );
};
