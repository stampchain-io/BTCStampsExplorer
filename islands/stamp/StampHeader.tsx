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
  const [isOpen2, setIsOpen2] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [filterCount, setFilterCount] = useState(0);

  const updateFilterCount = () => {
    const searchparams = new URLSearchParams(window.location.search);
    let count = 0;
    const processedRanges = new Set();

    Array.from(searchparams.entries()).forEach(([key, value]) => {
      if (value === "true" || (value !== "false" && value !== "")) {
        // Handle price range parameters
        if (key.startsWith("priceRange[")) {
          if (!processedRanges.has("priceRange")) {
            count++;
            processedRanges.add("priceRange");
          }
        } // Handle stamp range parameters
        else if (key.startsWith("stampRange[") || key === "stampRangePreset") {
          if (!processedRanges.has("stampRange")) {
            count++;
            processedRanges.add("stampRange");
          }
        } // Handle file type parameters
        else if (key.startsWith("fileType[")) {
          count++;
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

  const handleOpen2 = (open: boolean) => {
    setIsOpen2(open);
  };

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>ART STAMPS</h1>
      <div className="flex relative items-start justify-between gap-3">
        <StampFilterButton
          open={openSearch}
          setOpen={setOpenSearch}
          searchparams={searchparams}
          filterCount={filterCount}
        />
        <div class="opacity-100">
          <Sort initSort={sortBy} />
        </div>
        <div class="opacity-100">
          <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>
      </div>
      <StampFilter
        searchparams={searchparams}
        open={openSearch}
        setOpen={setOpenSearch}
        onFiltersChange={updateFilterCount}
      />
    </div>
  );
};
