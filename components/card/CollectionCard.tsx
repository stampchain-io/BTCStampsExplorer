/* ===== COLLECTION OVERVIEW CARD COMPONENT ===== */
import { Collection } from "$globals";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { containerBackground } from "$layout";
import { labelSm, textSm } from "$text";

/* ===== HELPERS ===== */
function abbreviateCollectionName(name: string): string {
  if (name.length <= 11) return name;
  return name.slice(0, 8) + "...";
}

/* ===== COMPONENT ===== */
export function CollectionCard(
  { collection }: { collection: Collection },
) {
  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      className={`${containerBackground} gap-6 hover:border-stamp-purple-bright hover:shadow-stamp hover:border-solid border-2 border-transparent group`}
    >
      {/* ===== CARD HEADER ===== */}
      <div className="flex w-full gap-6">
        <div className="min-w-[106px] min-h-[106px] max-w-[106px] max-h-[106px] mobileMd:min-w-[112px] mobileMd:min-h-[112px] mobileMd:max-w-[112px] mobileMd:max-h-[112px] rounded aspect-stamp image-rendering-pixelated overflow-hidden">
          <div className="relative flex items-center justify-center w-full h-full">
            <img
              src={collection.first_stamp_image || collection.img}
              alt=""
              className="w-full h-full"
            />
          </div>
        </div>
        <div className="w-full">
          <div className="flex flex-col justify-between w-full">
            {/* check code */}
            <h2 className="font-black text-2xl mobileMd:text-3xl gray-gradient1 group-hover:[-webkit-text-fill-color:#AA00FF] inline-block">
              <span className="min-[420px]:hidden">
                {abbreviateCollectionName(collection.collection_name)
                  .toUpperCase()}
              </span>
              <span className="hidden min-[420px]:inline">
                {collection.collection_name.toUpperCase()}
              </span>
            </h2>

            <h5 className={`${labelSm} pt-0.75 mobileLg:pt-1.5`}>
              BY{" "}
              <span className={`${textSm} normal-case`}>
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
            </h5>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <h5 className={`${labelSm} -mt-0.5`}>
              STAMPS{" "}
              <span className={textSm}>
                {collection.stamp_count}
              </span>
            </h5>
            <h5 className={`${labelSm} -mt-0.5 hidden mobileLg:block`}>
              VOLUME <span className={textSm}>N/A</span>{"  "}
              <span className="text-stamp-grey-light">BTC</span>
            </h5>
          </div>
          <div className="flex flex-col mobileLg:flex-row justify-between w-full">
            <h5 className={`${labelSm} -mt-0.5`}>
              <span className="min-[400px]:hidden">PRICE</span>
              <span className="hidden min-[400px]:inline">FLOOR PRICE</span>
              {" "}
              <span className={textSm}>N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </h5>
            <h5 className={`${labelSm} -mt-0.5`}>
              <span className="min-[400px]:hidden">CAP</span>
              <span className="hidden min-[400px]:inline">MARKETCAP</span>{" "}
              <span className={textSm}>N/A</span>{" "}
              <span className="text-stamp-grey-light">BTC</span>
            </h5>
          </div>
        </div>
      </div>

      {/* ===== CARD GALLERY ===== */}
      <div className="grid grid-cols-3 mobileMd:grid-cols-4 mobileLg:grid-cols-6 tablet:grid-cols-8 desktop:grid-cols-10 gap-6">
        {collection.stamp_images &&
          collection.stamp_images.slice(-10).reverse().map(
            (imageUrl, index) => {
              return (
                <div
                  className={`w-full h-full rounded aspect-stamp image-rendering-pixelated overflow-hidden ${
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
                  <div className="relative flex items-center justify-center w-full h-full">
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
