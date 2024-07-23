import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const CollectionDetailsHeader = (
  { filterBy, sortBy }: { filterBy: any[]; sortBy: string },
) => {
  const [selectedCategory, setSelectedCategory] = useState("BigTiles");

  return (
    <div class="flex flex-col-reverse md:flex-row justify-between w-full border-t border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-center">
        <img
          src={selectedCategory === "BigTiles"
            ? "/img/icon_big_tiles.png"
            : "/img/icon_big_tiles.png"}
          onClick={() => setSelectedCategory("BigTiles")}
        />
        <img
          src={selectedCategory === "SmallTiles"
            ? "/img/icon_small_tiles_selected.png"
            : "/img/icon_small_tiles_selected.png"}
          onClick={() => setSelectedCategory("SmallTiles")}
        />
        <img
          src={selectedCategory === "List"
            ? "/img/icon_lists.png"
            : "/img/icon_lists.png"}
          onClick={() => setSelectedCategory("List")}
        />
      </div>
      <div class="flex gap-6">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};
