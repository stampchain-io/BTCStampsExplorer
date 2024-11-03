import { Collection } from "globals";

export function CollectionOverviewCard(
  { collection }: { collection: Collection },
) {
  console.log("collection: ", collection);
  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      className={`
        rounded-md w-full dark-gradient p-3 mobileLg:p-6 flex flex-col gap-6
      hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent
      `}
    >
      <div className="flex gap-6 w-full">
        <div className="aspect-stamp min-w-[140px] min-h-[140px] max-w-[140px] max-h-[140px] overflow-hidden image-rendering-pixelated">
          <div className="center relative w-full h-full">
            <img
              src={collection.first_stamp_image}
              alt=""
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="text-[#666666] text-base mobileLg:text-xl font-light w-full">
          <p class="text-3xl mobileLg:text-5xl font-black purple-gradient1">
            {collection.collection_name}
          </p>
          <p>
            BY <span className="font-bold">bc1qhk...hlls5q</span>
          </p>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p>
              STAMPS{" "}
              <span className="font-bold text-[#999999]">
                {collection.stamp_images?.length}
              </span>
            </p>
            <p>
              VOLUME <span className="font-bold text-[#999999]">N/A</span> BTC
            </p>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p>
              FLOOR PRICE <span className="font-bold text-[#999999]">N/A</span>
              {" "}
              BTC
            </p>
            <p>
              MARKETCAP <span className="font-bold text-[#999999]">N/A</span>
              {" "}
              BTC
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 mobileLg:grid-cols-6 desktop:grid-cols-8 gap-6">
        {collection.stamp_images && collection.stamp_images.slice(0, 8).map((imageUrl, index) => {
          return (
            <div
              className={`aspect-stamp w-full h-full overflow-hidden image-rendering-pixelated ${
                index >= 6
                  ? "hidden desktop:block"
                  : (index >= 4 ? "hidden mobileLg:block" : "")
              }`}
            >
              <div className="center relative w-full h-full">
                <img
                  key={index}
                  src={imageUrl}
                  alt=""
                  className={`min-w-[140px] min-h-[140px] object-contain pixelart`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </a>
  );
}
