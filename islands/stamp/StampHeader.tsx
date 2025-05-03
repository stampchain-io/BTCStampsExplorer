import { useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES as _STAMP_TYPES } from "$globals";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator as _useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { ModulesStyles } from "$islands/modules/Styles.ts";

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
      class={`relative flex flex-row justify-between items-start w-full gap-3 ${
        isOpen1 ? "-mb-[150px] mobileMd:-mb-[146px] mobileLg:-mb-[160px]" : ""
      }`}
    >
      <h1 className={`${ModulesStyles.titlePurpleDL} block mobileLg:hidden`}>
        STAMPS
      </h1>
      <h1 className={`${ModulesStyles.titlePurpleDL} hidden mobileLg:block`}>
        ART STAMPS
      </h1>
      <div className="flex relative items-start justify-between gap-3">
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
          dropdownPosition="right-[-84px] mobileLg:right-[-96px]"
          open2={isOpen2}
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
