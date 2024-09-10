import { useEffect, useState } from "preact/hooks";
import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { FILTER_TYPES, STAMP_TYPES } from "globals";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

interface TabInfo {
  key: STAMP_TYPES;
  label: string;
}

const tabs: TabInfo[] = [
  { key: "all", label: "ALL" },
  { key: "classic", label: "CLASSIC" },
  { key: "posh", label: "POSH" },
];

export const StampHeader = (
  { filterBy, sortBy, selectedTab, type }: {
    filterBy: FILTER_TYPES[];
    sortBy: string;
    selectedTab: STAMP_TYPES;
    type: STAMP_TYPES;
  },
) => {
  const { setTypeOption } = useNavigator();
  const [currentFilters, setCurrentFilters] = useState<FILTER_TYPES[]>(
    filterBy,
  );
  const [currentSort, setCurrentSort] = useState<string>(sortBy);

  const handleTabClick = (tabType: STAMP_TYPES) => {
    setTypeOption("stamp", tabType, true);
  };

  useEffect(() => {
    const handleUrlChange = (event: CustomEvent) => {
      const url = new URL(event.detail);
      const newFilters =
        url.searchParams.get("filterBy")?.split(",") as FILTER_TYPES[] || [];
      const newSort = url.searchParams.get("sortBy") || "DESC";
      setCurrentFilters(newFilters);
      setCurrentSort(newSort);
      // Here you would typically fetch new data based on the updated filters and sort
    };

    self.addEventListener("urlChanged", handleUrlChange as EventListener);

    return () => {
      self.removeEventListener("urlChanged", handleUrlChange as EventListener);
    };
  }, []);

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-5 md:gap-11 items-end">
        {tabs.map((tab) => (
          <p
            key={tab.key}
            class={`${
              selectedTab === tab.key
                ? "text-[26px] text-[#7A00F5] border-b-4 border-b-[#7A00F5]"
                : "text-[20px] text-[#B9B9B9]"
            } cursor-pointer pb-4`}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </p>
        ))}
      </div>
      <div class="flex gap-3 md:gap-6 justify-between">
        <StampNavigator
          initFilter={currentFilters}
          initSort={currentSort}
          initType={type}
          selectedTab={selectedTab}
        />
        <StampSearchClient />
      </div>
    </div>
  );
};
