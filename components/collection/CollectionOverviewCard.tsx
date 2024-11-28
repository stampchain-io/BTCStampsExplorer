import { Collection } from "globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

function abbreviateCollectionName(name: string): string {
  if (name.length <= 11) return name;
  return name.slice(0, 8) + "...";
}

export function CollectionOverviewCard(
  { collection }: { collection: Collection },
) {
  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      className={`rounded-md w-full dark-gradient p-3 mobileMd:p-6 flex flex-col gap-3 mobileMdgap-6 hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent group`}
    >
      <div className="flex gap-6 w-full">
        <div className="aspect-stamp min-w-[135px] min-h-[135px] max-w-[135px] max-h-[135px] mobileMd:min-w-[138px] mobileMd:min-h-[138px] mobileMd:max-w-[138px] mobileMd:max-h-[138px] mobileLg:min-w-[130px] mobileLg:min-h-[130px] mobileLg:max-w-[130px] mobileLg:max-h-[130px] desktop:min-w-[140px] desktop:min-h-[140px] desktop:max-w-[140px] desktop:max-h-[140px] overflow-hidden image-rendering-pixelated">
          <div className="center relative w-full h-full">
            <img
              src={collection.first_stamp_image}
              alt=""
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="text-stamp-grey-darker text-base mobileLg:text-lg font-light w-full">
          <p>
            <p className="inline-block text-2xl mobileMd:text-3xl mobileLg:text-4xl desktop:text-5xl font-black gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF]">
              <span className="min-[420px]:hidden">
                {abbreviateCollectionName(collection.collection_name)
                  .toUpperCase()}
              </span>
              <span className="hidden min-[420px]:inline">
                {collection.collection_name.toUpperCase()}
              </span>
            </p>
          </p>
          <p className="pt-[6px]">
            BY{" "}
            <span className="font-bold text-stamp-grey-light">
              {collection.creators
                ? (
                  <>
                    <span className="mobileMd:hidden">
                      {abbreviateAddress(collection.creators[0], 4)}
                    </span>
                    <span className="hidden mobileMd:inline mobileLg:hidden">
                      {abbreviateAddress(collection.creators[0], 7)}
                    </span>
                    <span className="hidden mobileLg:inline tablet:hidden">
                      {abbreviateAddress(collection.creators[0], 9)}
                    </span>
                    <span className="hidden tablet:inline">
                      {collection.creators[0]}
                    </span>
                  </>
                )
                : "N/A"}
            </span>
          </p>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p>
              STAMPS{" "}
              <span className="font-bold text-stamp-grey-light">
                {collection.stamp_count}
              </span>
            </p>
            <p className="hidden mobileLg:block">
              VOLUME{" "}
              <span className="font-bold text-stamp-grey-light">N/A</span>{"  "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p>
              <span className="min-[400px]:hidden">PRICE</span>
              <span className="hidden min-[400px]:inline">FLOOR PRICE</span>
              {" "}
              <span className="font-bold text-stamp-grey-light">N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
            <p>
              <span className="min-[400px]:hidden">CAP</span>
              <span className="hidden min-[400px]:inline">MARKETCAP</span>{" "}
              <span className="font-bold text-stamp-grey-light">N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 mobileLg:grid-cols-6 desktop:grid-cols-8 gap-6">
        {collection.stamp_images &&
          collection.stamp_images.slice(-8).reverse().map((imageUrl, index) => {
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
                    className={`min-w-[120px] min-h-[120px] mobileLg:min-w-[130px] mobileLg:min-h-[130px] desktop:min-w-[140px] desktop:min-h-[140px] object-contain pixelart`}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </a>
  );
}
