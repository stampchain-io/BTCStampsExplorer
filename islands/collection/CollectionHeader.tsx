import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const CollectionHeader = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        <p
          class={selectedTab === "all"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("collection", "all")}
        >
          All
        </p>
        <p
          class={selectedTab === "stamps"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("collection", "stamps")}
        >
          STAMPS
        </p>
        <p
          class={selectedTab === "posh"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("collection", "posh")}
        >
          Posh
        </p>
      </div>
      <div class="flex gap-3 md:gap-6 justify-between">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};
