import { useState } from "preact/hooks";

import { STAMP_FILTER_TYPES } from "$globals";

import { FilterButton } from "$islands/filter/FilterButton.tsx";
import FilterDrawer from "$islands/filter/FilterDrawer.tsx";
import { allQueryKeysFromFilters } from "$islands/filter/FilterOptionsStamp.tsx";
import { SortButton } from "$islands/sort/SortButton.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";

export const StampHeader = (
  { filterBy, sortBy, search }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const searchparams = new URLSearchParams(search);

  let filterCount = 0;

  // Handle filetype parameter (count each filetype selection)
  if (searchparams.has("filetype")) {
    const filetypes = searchparams.get("filetype");
    if (filetypes) {
      filterCount += filetypes.split(",").length;
    }
  }

  // Handle editions parameter (count each edition selection)
  if (searchparams.has("editions")) {
    const editions = searchparams.get("editions");
    if (editions) {
      filterCount += editions.split(",").length;
    }
  }

  // Handle rarity parameter (count either preset or custom range values)
  let hasCountedRarity = false;
  if (searchparams.has("rarity")) {
    filterCount += 1;
    hasCountedRarity = true;
  }

  // If not already counted a preset, count min and max separately if they exist
  if (!hasCountedRarity) {
    if (searchparams.has("rarityMin")) {
      filterCount += 1; // Count min as one filter
    }
    if (searchparams.has("rarityMax")) {
      filterCount += 1; // Count max as one filter
    }
  }

  // Handle market filters (still using nested format)
  const marketFilters = [
    "market[atomic]",
    "market[dispenser]",
    "market[listings]",
    "market[sales]",
  ];
  marketFilters.forEach((key) => {
    if (searchparams.has(key) && searchparams.get(key) === "true") {
      filterCount += 1;
    }
  });

  // Handle price range (count as one filter if either min or max is set)
  let hasCountedPriceRange = false;
  if (
    searchparams.has("market[priceRange][min]") ||
    searchparams.has("market[priceRange][max]")
  ) {
    filterCount += 1;
    hasCountedPriceRange = true;
  }

  const handleSearchOpen = (open: boolean) => {
    setSearchOpen(open);
  };

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>ART STAMPS</h1>
      <div className="flex relative items-start justify-between gap-3">
        <FilterButton
          open={filterOpen}
          setOpen={setFilterOpen}
          count={filterCount}
          type="stamp"
        />
        <SortButton searchParams={searchparams} />
        <StampSearchClient open2={searchOpen} handleOpen2={handleSearchOpen} />
      </div>
      <FilterDrawer
        searchparams={searchparams}
        open={filterOpen}
        setOpen={setFilterOpen}
      />
    </div>
  );
};
