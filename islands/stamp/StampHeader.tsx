import { useEffect, useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search, SearchResult } from "$islands/datacontrol/Search.tsx";

export const StampHeader = (
  { filterBy, sortBy }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
  },
) => {
  // const [currentFilters, setCurrentFilters] = useState<STAMP_FILTER_TYPES[]>(
  //   filterBy,
  // );
  // const [currentSort, setCurrentSort] = useState<string>(sortBy);

  // useEffect(() => {
  //   const handleUrlChange = (event: CustomEvent) => {
  //     const url = new URL(event.detail);
  //     const newFilters =
  //       url.searchParams.get("filterBy")?.split(",") as STAMP_FILTER_TYPES[] ||
  //       [];
  //     const newSort = url.searchParams.get("sortBy") || "DESC";
  //     setCurrentFilters(newFilters);
  //     setCurrentSort(newSort);
  //     // Here you would typically fetch new data based on the updated filters and sort
  //   };

  //   self.addEventListener("urlChanged", handleUrlChange as EventListener);

  //   return () => {
  //     self.removeEventListener("urlChanged", handleUrlChange as EventListener);
  //   };
  // }, []);

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

  const handleResultClick = (result: SearchResult) => {
    if (result.id) {
      globalThis.location.href = `/stamp/${result.id}`;
    }
  };

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between items-center gap-3 w-full">
      <p className="purple-gradient1 text-3xl md:text-6xl font-black">
        ART STAMPS
      </p>
      <div class="flex gap-3 justify-between h-[40px]">
        <Sort initSort={sortBy} />
        <Filter
          initFilter={filterBy}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "pixel",
            "vector",
            "for sale",
            "trending sales",
            "sold",
          ]}
        />
        {
          /* <Search
          open={isOpen2}
          handleOpen={handleOpen2}
          placeholder="stamp #, CPID, wallet address, tx_hash"
          searchEndpoint="/api/v2/stamp/search?q="
          onResultClick={handleResultClick}
          resultDisplay={(result) => result.id || ""}
        /> */
        }
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};
