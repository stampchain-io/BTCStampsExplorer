import { Collection } from "globals";

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <a
      href={`/collection/${collection.collection_name}`}
      className="bg-[#2E0F4D] text-white group relative z-10 flex h-full w-full grow flex-col p-2 rounded-lg @container transition-all"
    >
      <div class="relative flex overflow-hidden">
        <div class="pointer-events-none relative aspect-square min-h-[70px] grow overflow-hidden rounded-lg">
          <div class="center relative aspect-square overflow-hidden">
            <img
              src={collection.first_stamp_image || "/img/mock.png"}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `/not-available.png`;
              }}
              alt={`First stamp in ${collection.collection_name}`}
              class="h-full w-full object-contain items-center standalone:h-full standalone:w-auto pixelart image-rendering-pixelated"
            />
          </div>
        </div>
      </div>
      <div class="flex grow flex-col pt-1 font-title text-[13px] font-medium text-text">
        <div class="flex justify-between text-black">
          <h3 class="text-[13px] font-semibold text-white text-lg">
            {collection.collection_name}
          </h3>
        </div>
        <div>
          <div class="flex justify-between text-black">
            <h3 class="text-[#BF83FC]">
              Floor Price: {Number.isFinite(collection.floorPrice)
                ? `${parseFloat(collection.floorPrice.toFixed(8))} BTC`
                : collection.floorPrice || "N/A"}
            </h3>
          </div>
        </div>
      </div>
    </a>
  );
}
