import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const CollectionDetailsHeader = (
  { filterBy, sortBy }: { filterBy: any[]; sortBy: string },
) => {
  const [selectedCategory, setSelectedCategory] = useState("BigTiles");

  return (
    <div class="flex flex-col gap-3">
      <div class="flex gap-4">
        <img
          src="/img/mock.png"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = `/not-available.png`;
          }}
          alt="collection image"
          class="h-24 w-24 object-contain items-center standalone:h-24 standalone:w-auto pixelart image-rendering-pixelated"
        />
        <div class="flex flex-col justify-between">
          <p class="font-semibold text-xl text-white">Collection 1</p>
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-[#B9B9B9]">FLOOR</p>
                <p class="text-lg font-semibold text-white">
                  0.00018{" "}
                  <span class="text-sm font-normal text-[#B9B9B9]">BTC</span>
                </p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">TOTAL VOL</p>
                <p class="text-lg font-semibold text-white">
                  0.0019{" "}
                  <span class="text-sm font-normal text-[#B9B9B9]">BTC</span>
                </p>
              </div>
            </div>
            <div class="flex gap-4">
              <div>
                <p class="text-sm text-[#B9B9B9]">OWNERS</p>
                <p class="text-lg font-semibold text-white">1.1K</p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">LISTED</p>
                <p class="text-lg font-semibold text-white">41</p>
              </div>
              <div>
                <p class="text-sm text-[#B9B9B9]">TOTAL SUPLY</p>
                <p class="text-lg font-semibold text-white">21K</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr class="border-2 border-[#3F2A4E]" />
      <div class="flex flex-col-reverse md:flex-row justify-between items-center w-full">
        <div class="hidden md:flex gap-6 md:gap-8 items-center">
          <img
            src={selectedCategory === "BigTiles"
              ? "/img/icon_big_tiles.png"
              : "/img/icon_big_tiles.png"}
            onClick={() => setSelectedCategory("BigTiles")}
            class="bg-[#3F2A4E] p-4 w-14 h-14 cursor-pointer"
          />
          <img
            src={selectedCategory === "SmallTiles"
              ? "/img/icon_small_tiles_selected.png"
              : "/img/icon_small_tiles_selected.png"}
            onClick={() => setSelectedCategory("SmallTiles")}
            class="bg-[#3F2A4E] p-4 w-14 h-14 cursor-pointer"
          />
          <img
            src={selectedCategory === "List"
              ? "/img/icon_lists.png"
              : "/img/icon_lists.png"}
            onClick={() => setSelectedCategory("List")}
            class="bg-[#3F2A4E] py-5 px-2 w-14 h-14 cursor-pointer"
          />
        </div>
        <div class="flex gap-6">
          <select
            name="sort"
            id="sort-select"
            class="hidden md:block bg-[#3F2A4E] text-[#8D9199] h-[54px] min-w-[200px] px-6 rounded"
          >
            <option value="lowToHigh">Price: Low to High</option>
            <option value="highToLow">Price: High to Low</option>
            <option value="recent">Date: Recent</option>
          </select>
          <StampNavigator initFilter={filterBy} initSort={sortBy} />
          <StampSearchClient />
        </div>
      </div>
    </div>
  );
};
