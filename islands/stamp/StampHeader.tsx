import { useEffect, useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "$globals";

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

  const titlePurpleDLClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";

  return (
    <div
      className="flex flex-row justify-between items-center gap-3 w-full"
      f-partial="/stamp"
    >
      <h1 className={titlePurpleDLClassName}>ART STAMPS</h1>
      <div className="flex gap-3 justify-between h-[40px]">
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
