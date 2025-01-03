import { useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES as _STAMP_TYPES } from "$globals";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator as _useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";

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

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";

  return (
    <div
      className="flex flex-row justify-between items-center gap-3 w-full relative"
      f-partial="/stamp"
    >
      <h1 className={`${titlePurpleDL} block tablet:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleDL} hidden tablet:block`}>ART STAMPS</h1>
      <div className="flex relative items-center justify-between gap-3">
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
          dropdownPosition="absolute top-[70px] right-[-79px] mobileMd:top-[66px] mobileMd:right-[-96px] mobileLg:top-[86px] mobileLg:right-[-96px] desktop:top-[83px] desktop:right-[-108px]"
        />
        <div
          class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
        >
          <Sort initSort={sortBy} />
        </div>
        <div
          class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
        >
          <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>
      </div>
    </div>
  );
};
