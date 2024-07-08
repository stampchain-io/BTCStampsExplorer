import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const SRC20Header = (
  { filterBy, sortBy }: { filterBy: any[]; sortBy: string },
) => {
  const [selectedTab, setSelectedTab] = useState("All");

  return (
    <div class="text-white flex flex-col gap-8">
      <div class="text-center">
        <p class="text-7xl leading-normal">SRC-20</p>
        <p class="text-[#DBDBDB] font-light">
          Welcome to the forefront of digital collectibles, where each stamp is
          a unique<br />
          piece of art intertwined with the immutability of the blockchain.
        </p>
      </div>
      <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E]">
        <div class="flex gap-4 md:gap-8 items-end">
          <p
            class={selectedTab === "All"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("All")}
          >
            All
          </p>
          <p
            class={selectedTab === "Trending"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("Trending")}
          >
            Trending
          </p>
          <p
            class={selectedTab === "Mints"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("Mints")}
          >
            Mints
          </p>
        </div>
        <div class="flex gap-6">
          <StampNavigator initFilter={filterBy} initSort={sortBy} />
          <StampSearchClient />
        </div>
      </div>
    </div>
  );
};
