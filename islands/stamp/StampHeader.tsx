import { useEffect, useState } from "preact/hooks";
import { STAMP_FILTER_TYPES } from "$globals";
import {
  allQueryKeysFromFilters,
  StampFilterButton,
} from "$islands/stamp/StampFilter.tsx";
import { StampFilter } from "$islands/stamp/StampFilter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const StampHeader = (
  { filterBy, sortBy, search }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  const updateFilterCount = () => {
    const searchparams = new URLSearchParams(window.location.search);
    let count = 0;
    const processedRanges = new Set();

    Array.from(searchparams.entries()).forEach(([key, value]) => {
      if (value === "true" || (value !== "false" && value !== "")) {
        // Handle market price range parameters
        if (key.startsWith("market[priceRange]")) {
          if (!processedRanges.has("marketPriceRange")) {
            count++;
            processedRanges.add("marketPriceRange");
          }
        } // Handle rarity stamp range parameters
        else if (key.startsWith("rarity[stampRange]")) {
          if (!processedRanges.has("rarityStampRange")) {
            count++;
            processedRanges.add("rarityStampRange");
          }
        } // Count each individual checkbox separately
        else if (key.includes("[")) {
          const paramMatch = key.match(/^([^[]+)\[([^\]]+)\]$/);
          if (paramMatch && value === "true") {
            count++;
          }
        } // Handle other filters
        else if (!key.includes("[")) {
          count++;
        }
      }
    });

    setFilterCount(count);
  };

  useEffect(() => {
    updateFilterCount();
  }, [search]);

  const searchparams = new URLSearchParams(search);

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>ART STAMPS</h1>
      <div className="flex relative items-start justify-between gap-3">
        <StampFilterButton
          open={isFilterOpen}
          setOpen={setIsFilterOpen}
          searchparams={searchparams}
          filterCount={filterCount}
        />
        <Sort initSort={sortBy} />
        <StampSearchClient
          open2={isSearchOpen}
          handleOpen2={setIsSearchOpen}
        />
      </div>
      <StampFilter
        searchparams={searchparams}
        open={isFilterOpen}
        setOpen={setIsFilterOpen}
        onFiltersChange={updateFilterCount}
      />
    </div>
  );
};
