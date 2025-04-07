/* ===== STAMP OVERVIEW HEADER COMPONENT ===== */
import { useState } from "preact/hooks";
import { STAMP_FILTER_TYPES, STAMP_TYPES as _STAMP_TYPES } from "$globals";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator as _useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { titlePurpleLD } from "$text";

/* ===== COMPONENT INTERFACE ===== */
type StampHeaderProps = {
  filterBy: STAMP_FILTER_TYPES[];
  sortBy: "ASC" | "DESC" | undefined;
};

/* ===== HEADER COMPONENT IMPLEMENTATION ===== */
export const StampHeader = (
  { filterBy, sortBy }: StampHeaderProps,
) => {
  /* ===== DROPDOWN STATE MANAGEMENT ===== */
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  /* ===== DROPDOWN HANDLERS ===== */
  // Handle filter dropdown
  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false); // Close search when filter opens
  };

  // Handle search dropdown
  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false); // Close filter when search opens
    setIsOpen2(open);
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3 ${
        isOpen1 ? "-mb-[150px] mobileMd:-mb-[146px] mobileLg:-mb-[160px]" : ""
      }`}
    >
      {/* Responsive Title Section */}
      <h1 className={`${titlePurpleLD} block mobileLg:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleLD} hidden mobileLg:block`}>ART STAMPS</h1>

      {/* Controls Section */}
      <div className="flex flex-col">
        <div className="flex relative items-start justify-between gap-3 tablet:gap-1">
          {/* Filter Component */}
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

          {/* Sort Component - Hidden when filter is open */}
          <div
            class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
          >
            <Sort initSort={sortBy} />
          </div>

          {/* Search Component - Hidden when filter is open */}
          <div
            class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}
          >
            <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
          </div>
        </div>
      </div>
    </div>
  );
};
