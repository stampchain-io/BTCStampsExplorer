import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

import { MyItemCard } from "$components/wallet/MyItemCard.tsx";

export const MyItemsContent = ({
  filterBy,
  sortBy,
}: {
  filterBy: any[];
  sortBy: string;
}) => {
  const [selectedCategory, setSelectedCategory] = useState("BigTiles");

  return (
    <>
      <div class="flex flex-col-reverse md:flex-row justify-between items-center w-full">
        <div class="hidden md:flex gap-[10px] items-center">
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
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
        {[...Array(5)].map((item) => <MyItemCard item={item} />)}
      </div>
    </>
  );
};
