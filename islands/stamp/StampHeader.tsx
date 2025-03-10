import { useEffect, useState } from "preact/hooks";

import { STAMP_FILTER_TYPES } from "$globals";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { FilterToggle } from "$islands/datacontrol/FilterToggle.tsx";
import { allQueryKeysFromFilters } from "$islands/filterpane/StampFilterPane.tsx";
import StampSearchDrawer from "$islands/stamp/details/StampSearchDrawer.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";

export const StampHeader = (
  { filterBy, sortBy, search }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filterCount, setFilterCount] = useState(() => {
    const searchparams = new URLSearchParams(search);
    return allQueryKeysFromFilters.filter((key) =>
      searchparams.has(key) && searchparams.get(key) !== "false"
    ).length;
  });

  useEffect(() => {
    const updateFilterCount = (e) => setFilterCount(e.detail);
    window.addEventListener("filterCountUpdate", updateFilterCount);
    return () =>
      window.removeEventListener("filterCountUpdate", updateFilterCount);
  }, []);

  const searchparams = new URLSearchParams(search);

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
        <FilterToggle
          open={filterOpen}
          setOpen={setFilterOpen}
          count={filterCount}
        />
        <Sort searchParams={searchparams} />
        <StampSearchClient open2={searchOpen} handleOpen2={handleSearchOpen} />
      </div>
      <StampSearchDrawer
        searchparams={searchparams}
        open={filterOpen}
        setOpen={setFilterOpen}
      />
    </div>
  );
};
