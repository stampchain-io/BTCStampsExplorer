import { useState } from "preact/hooks";
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

  const searchparams = new URLSearchParams(search);
  const filterCount = allQueryKeysFromFilters.filter((key) => {
    return searchparams.has(key) && searchparams.get(key) != "false";
  }).length;

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
      />
    </div>
  );
};
