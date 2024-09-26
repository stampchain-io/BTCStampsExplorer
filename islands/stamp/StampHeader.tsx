import { useEffect, useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";

export const StampHeader = (
  { filterBy, sortBy, selectedTab, type }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: string;
    selectedTab: string;
    type: STAMP_TYPES;
  },
) => {
  const { setTypeOption } = useNavigator();
  const [currentFilters, setCurrentFilters] = useState<STAMP_FILTER_TYPES[]>(
    filterBy,
  );
  const [currentSort, setCurrentSort] = useState<string>(sortBy);

  const handleTabClick = (tabType: STAMP_TYPES) => {
    setTypeOption("stamp", tabType, true);
    if (tabType === "all" || tabType === "collection") {
      window.location.href = "/collection"; // Redirect to /collection page FIXME: may just want to make the collectinn page part of the tabs here
    }
  };

  useEffect(() => {
    const handleUrlChange = (event: CustomEvent) => {
      const url = new URL(event.detail);
      const newFilters =
        url.searchParams.get("filterBy")?.split(",") as STAMP_FILTER_TYPES[] ||
        [];
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

  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false);
  };

  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between gap-3 w-full border-b border-[#3F2A4E]">
      <div class="flex gap-5 md:gap-11 items-end">
        <p
          class={`cursor-pointer pb-1 md:pb-3 text-base md:text-2xl uppercase ${
            selectedTab === "all"
              ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
              : "text-[#8800CC] font-light"
          }`}
          onClick={() => handleTabClick("all")}
        >
          ALL
        </p>
        <p
          class={`cursor-pointer pb-1 md:pb-3 text-base md:text-2xl uppercase ${
            selectedTab === "collection"
              ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
              : "text-[#8800CC] font-light"
          }`}
          onClick={() => handleTabClick("collection")}
        >
          COLLECTIONS
        </p>
      </div>
      <div class="flex gap-3 pb-1 md:pb-3 justify-between">
        <StampNavigator
          initFilter={currentFilters}
          initSort={currentSort}
          initType={type}
          selectedTab={selectedTab}
          open1={isOpen1}
          handleOpen1={handleOpen1}
        />
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};
