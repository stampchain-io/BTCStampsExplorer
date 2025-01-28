import { useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES as _STAMP_TYPES } from "$globals";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator as _useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { useBreakpoints } from "$lib/hooks/useBreakpoints.ts";
import { FilterToggle } from "$islands/datacontrol/FilterToggle.tsx";
import { allQueryKeysFromFilters } from "$islands/filterpane/StampFilterPane.tsx";
import { flags } from "../../lib/flags/flags.ts";

export const StampHeader = (
  { filterBy, sortBy, filters, search }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const breakpoints = useBreakpoints();

  const searchparams = new URLSearchParams(search);
  const filterCount = allQueryKeysFromFilters.filter((key) => {
    return searchparams.has(key);
  }).length;
  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false);
  };
  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3 ${
        isOpen1 ? "-mb-[150px] mobileMd:-mb-[146px] mobileLg:-mb-[160px]" : ""
      }`}
    >
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>ART STAMPS</h1>
      <div className="flex relative items-start justify-between gap-3">
        {/* <h1 className={titlePurpleDL}>ART STAMPS</h1> */}
        {/* <div className="flex gap-3 justify-between mobileLg:h-9 h-7 items-center relative"> */}
        {
          /* <button
          onClick={() => {
            const open = location.search.includes("filterpane=open");
            const search = new URLSearchParams(location.search);
            if (!open) {
              search.set("filterpane", "open");
            } else {
              search.delete("filterpane");
            }
            history.pushState(
              {},
              "",
              location.pathname + "?" + search.toString(),
            );
          }}
        >
          Filter pane
        </button> */
        }
        {breakpoints.isMobile() &&
          flags.getBooleanFlag("NEW_ART_STAMP_FILTERS", false) && (
          <FilterToggle count={filterCount} />
        )}
        {!flags.getBooleanFlag("NEW_ART_STAMP_FILTERS", false)
          ? (
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
          )
          : null}

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
