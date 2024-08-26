import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const SRC20Header = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

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
      <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
        <div class="flex gap-6 md:gap-8 items-end">
          <p
            class={selectedTab === "all"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setTypeOption("src20", "all")}
          >
            All
          </p>
          <p
            class={selectedTab === "trending"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setTypeOption("src20", "trending")}
          >
            Trending
          </p>
          <p
            class={selectedTab === "mints"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setTypeOption("src20", "mints")}
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
