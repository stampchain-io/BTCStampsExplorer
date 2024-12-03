import { Collection } from "globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

function abbreviateCollectionName(name: string): string {
  if (name.length <= 11) return name;
  return name.slice(0, 8) + "...";
}

export function CollectionOverviewCard(
  { collection }: { collection: Collection },
) {
  const dataColumn = "flex flex-col -space-y-1";
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataLabel =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXs =
    "text-xs mobileLg:text-sm font-medium text-stamp-grey-light";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";
  const dataValue =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light uppercase";
  const dataValueXl =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
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
        <div className="w-full">
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
          <p className={`${dataLabelSm} pt-0.75 mobileLg:pt-1.5`}>
            BY{" "}
            <span className={`${dataValueSm} normal-case`}>
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
            <p className={dataLabelSm}>
              STAMPS{" "}
              <span className={dataValueSm}>
                {collection.stamp_count}
              </span>
            </p>
            <p className={`${dataLabelSm} hidden mobileLg:block`}>
              VOLUME <span className={dataValueSm}>N/A</span>{"  "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p className={dataLabelSm}>
              <span className="min-[400px]:hidden">PRICE</span>
              <span className="hidden min-[400px]:inline">FLOOR PRICE</span>
              {" "}
              <span className={dataValueSm}>N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
            <p className={dataLabelSm}>
              <span className="min-[400px]:hidden">CAP</span>
              <span className="hidden min-[400px]:inline">MARKETCAP</span>{" "}
              <span className={dataValueSm}>N/A</span>{" "}
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
                    className={`min-w-[100px] min-h-[100px] mobileLg:min-w-[110px] mobileLg:min-h-[110px] desktop:min-w-[120px] desktop:min-h-[120px] object-contain pixelart`}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </a>
  );
}
