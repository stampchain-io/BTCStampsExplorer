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
    <div
      class="flex flex-row justify-between items-center gap-3 w-full"
      f-partial="/stamp"
    >
      <p className="bg-text-purple bg-clip-text text-transparent text-3xl mobile-lg:text-6xl font-black hidden mobile-lg:block">
        ART STAMPS
      </p>
      <p className="bg-text-purple bg-clip-text text-transparent text-3xl mobile-lg:text-6xl font-black block mobile-lg:hidden">
        STAMPS
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
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};
