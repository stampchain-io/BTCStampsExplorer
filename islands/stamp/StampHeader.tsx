import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const StampHeader = (
  { filterBy, sortBy }: { filterBy: any[]; sortBy: string },
) => {
  const [selectedTab, setSelectedTab] = useState("All");

  return (
    <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-5 md:gap-11 items-end">
        <p
          class={selectedTab === "All"
            ? "text-[26px] text-[#7A00F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[20px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setSelectedTab("All")}
        >
          All Stamps
        </p>
        <p
          class={selectedTab === "Classic"
            ? "text-[26px] text-[#7A00F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[20px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setSelectedTab("Classic")}
        >
          Classic Stamps
        </p>
      </div>
      <div class="flex gap-6">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};
