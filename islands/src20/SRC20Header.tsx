import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "$globals";
import { FilterButton } from "$islands/filter/FilterButton.tsx";
import FilterDrawer from "$islands/filter/FilterDrawer.tsx";
import { allQueryKeysFromFiltersSRC20 } from "$islands/filter/FilterOptionsSRC20.tsx";
import { SortButton } from "$islands/sort/SortButton.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";

export const SRC20Header = (
  { filterBy, sortBy, search }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const handleSearchOpen = (open: boolean) => {
    setSearchOpen(open);
  };

  const searchparams = new URLSearchParams(search);

  // Count filters with special handling for holders
  let filterCount = 0;

  // Check if holders is selected
  const holdersSelected = searchparams.has("details[holders]") &&
    searchparams.get("details[holders]") === "true";

  // Check if min and max values are defined
  const minDefined = searchparams.has("details[holdersRange][min]");
  const maxDefined = searchparams.has("details[holdersRange][max]");

  // Apply the special counting rules for holders
  if (holdersSelected) {
    // Base case: holders selected counts as 1
    filterCount += 1;

    // If both min and max are defined, add 1 more (total: 2)
    if (minDefined && maxDefined) {
      filterCount += 1;
    }
    // If only one of min or max is defined, don't add anything (total: 1)
  }

  // Count all other filters (excluding Period parameters and holders-related ones)
  allQueryKeysFromFiltersSRC20.forEach((key) => {
    // Skip holders-related keys as we've already counted them
    if (key.includes("holders")) {
      return;
    }

    // Skip Period parameters
    if (key.includes("Period")) {
      return;
    }

    // Count this filter if it exists and is not false
    if (searchparams.has(key) && searchparams.get(key) !== "false") {
      filterCount += 1;
    }
  });

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>TOKENS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>
        SRC-20 TOKENS
      </h1>
      <div class="flex relative items-start justify-between gap-3">
        <FilterButton
          open={filterOpen}
          setOpen={setFilterOpen}
          count={filterCount}
          type="src20"
        />
        <SortButton searchParams={searchparams} />
        <SRC20SearchClient
          open2={searchOpen}
          handleOpen2={handleSearchOpen}
        />
      </div>
      <FilterDrawer
        searchparams={searchparams}
        open={filterOpen}
        setOpen={setFilterOpen}
        type="src20"
      />
    </div>
  );
};
