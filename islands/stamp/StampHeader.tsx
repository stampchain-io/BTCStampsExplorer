import { useEffect } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const StampHeader = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
  },
) => {
  const { setType, setTypeOption } = useNavigator();

  useEffect(() => {
    setType(selectedTab);
  }, []);

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-5 md:gap-11 items-end">
        <p
          class={selectedTab === "all"
            ? "text-[26px] text-[#7A00F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[20px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp", "all")}
        >
          All
        </p>
        <p
          class={selectedTab === "classic"
            ? "text-[26px] text-[#7A00F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[20px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp", "classic")}
        >
          Classic
        </p>
        <p
          class={selectedTab === "posh"
            ? "text-[26px] text-[#7A00F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
            : "text-[20px] text-[#B9B9B9] cursor-pointer pb-4"}
          onClick={() => setTypeOption("stamp", "posh")}
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
