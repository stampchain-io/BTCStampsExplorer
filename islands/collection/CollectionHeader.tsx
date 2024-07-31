import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const CollectionHeader = (
  { filterBy, sortBy }: { filterBy: any[]; sortBy: string },
) => {
  const [selectedTab, setSelectedTab] = useState("All");

  return (
    <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        <p
          class={selectedTab === "All"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setSelectedTab("All")}
        >
          All
        </p>
        <p
          class={selectedTab === "Stamps"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setSelectedTab("Stamps")}
        >
          STAMPS
        </p>
        <p
          class={selectedTab === "Posh"
            ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setSelectedTab("Posh")}
        >
          Posh
        </p>
      </div>
      <div class="flex gap-6">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};
