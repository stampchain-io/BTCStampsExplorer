import { Collection, StampRow } from "globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { handleImageError } from "$lib/utils/imageUtils.ts";

export const CollectionDetailsHeader = (
  { collection, stamps }: { collection: Collection; stamps: StampRow[] },
) => {
  console.log("collection: ", collection);

  return (
    <div className="flex flex-col gap-3">
      <div className="dark-gradient p-6 space-y-6">
        <div className="flex gap-4">
          <img
            src={stamps[0].stamp_url}
            loading="lazy"
            onError={handleImageError}
            alt="collection image"
            className="h-[148px] w-[148px] object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
          />
          <div>
            <p className="font-black text-6xl purple-gradient3">
              {collection.collection_name.toUpperCase()}
            </p>
            <p className="text-[#666666] text-xl font-light">COLLECTION BY</p>
            <div>
              <p className="text-[#999999] text-4xl font-black">
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
        <p className="text-[#999999]">
          {collection.collection_description}
        </p>
      </div>

      <div className="flex justify-between dark-gradient p-6">
        <div className="text-left">
          <p className="text-[#666666] text-xl font-light">STAMPS</p>
          <p className="text-[#999999] text-4xl font-black">
            {collection.stamp_count}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[#666666] text-xl font-light">EDITIONS</p>
          <p className="text-[#999999] text-4xl font-black">
            {Number(collection.total_editions).toFixed(0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#666666] text-xl font-light">FLOOR PRICE</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
      </div>
      <div className="flex justify-between dark-gradient p-6">
        <div className="text-left">
          <p className="text-[#666666] text-xl font-light">MARKETCAP</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-center">
          <p className="text-[#666666] text-xl font-light">TOTAL VOLUME</p>
          <p className="text-[#999999] text-4xl font-black">
            N/A <span className="font-extralight">BTC</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[#666666] text-xl font-light">HOLDERS</p>
          <p className="text-[#999999] text-4xl font-black">N/A</p>
        </div>
      </div>
    </div>
  );
};
