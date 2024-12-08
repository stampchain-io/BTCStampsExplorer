import { Collection } from "$globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

function abbreviateCollectionName(name: string): string {
  if (name.length <= 11) return name;
  return name.slice(0, 8) + "...";
}

export function CollectionOverviewCard(
  { collection }: { collection: Collection },
) {
  const dataLabelSm =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const dataValueSm =
    "text-sm mobileLg:text-base font-medium text-stamp-grey-light";

  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      className={`rounded-md w-full dark-gradient p-3 mobileMd:p-6 flex flex-col gap-2 mobileMd:gap-5 hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent group`}
    >
      <div className="flex gap-6 w-full">
        <div className="aspect-stamp min-w-[106px] min-h-[106px] max-w-[106px] max-h-[106px] mobileMd:min-w-[112px] mobileMd:min-h-[112px] mobileMd:max-w-[112px] mobileMd:max-h-[112px] mobileLg:min-w-[114px] mobileLg:min-h-[114px] mobileLg:max-w-[114px] mobileLg:max-h-[114px] desktop:min-w-[120px] desktop:min-h-[120px] desktop:max-w-[120px] desktop:max-h-[120px] overflow-hidden image-rendering-pixelated rounded-sm">
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
            <p className={`${dataLabelSm} -mt-0.5`}>
              STAMPS{" "}
              <span className={dataValueSm}>
                {collection.stamp_count}
              </span>
            </p>
            <p className={`${dataLabelSm} -mt-0.5 hidden mobileLg:block`}>
              VOLUME <span className={dataValueSm}>N/A</span>{"  "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <p className={`${dataLabelSm} -mt-0.5`}>
              <span className="min-[400px]:hidden">PRICE</span>
              <span className="hidden min-[400px]:inline">FLOOR PRICE</span>
              {" "}
              <span className={dataValueSm}>N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
            <p className={`${dataLabelSm} -mt-0.5`}>
              <span className="min-[400px]:hidden">CAP</span>
              <span className="hidden min-[400px]:inline">MARKETCAP</span>{" "}
              <span className={dataValueSm}>N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-8 desktop:grid-cols-10 gap-3 mobileMd:gap-6">
        {collection.stamp_images &&
          collection.stamp_images.slice(-10).reverse().map(
            (imageUrl, index) => {
              return (
                <div
                  className={`aspect-stamp w-full h-full overflow-hidden image-rendering-pixelated rounded-sm ${
                    index >= 8
                      ? "hidden desktop:block"
                      : index >= 6
                      ? "hidden tablet:block"
                      : index >= 4
                      ? "hidden mobileLg:block"
                      : index >= 3
                      ? "hidden mobileMd:block"
                      : ""
                  }`}
                >
                  <div className="center relative w-full h-full">
                    <img
                      key={index}
                      src={imageUrl}
                      alt=""
                      className={`min-w-[80%] min-h-[80%] object-contain pixelart`}
                    />
                  </div>
                </div>
              );
            },
          )}
      </div>
    </a>
  );
}
