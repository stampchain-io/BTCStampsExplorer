/* ===== STAMP OVERVIEW HEADER COMPONENT ===== */
/* TODO (@baba) - update filter and styling */
import { useState } from "preact/hooks";
import { FilterButton } from "$islands/button/FilterButton.tsx";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { SortButton } from "$islands/button/SortButton.tsx";
import { titlePurpleLD } from "$text";
import {
  defaultFilters,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
import FilterDrawer from "$islands/filter/FilterDrawer.tsx";

/* ===== TYPES ===== */
type StampOverviewHeaderProps = {
  currentFilters?: StampFilters;
};

/* ===== COMPONENT ===== */
export const StampOverviewHeader = (
  { currentFilters = defaultFilters }: StampOverviewHeaderProps,
) => {
  /* ===== STATE MANAGEMENT ===== */
  const [isOpen1, setIsOpen1] = useState(false);

  /* ===== EVENT HANDLERS ===== */
  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
  };

  /* ===== HELPER FUNCTION ===== */
  function countActiveStampFilters(filters: StampFilters): number {
    let count = 0;
    if (filters.market.length > 0) count++;
    count += filters.fileType.length;
    count += filters.editions.length;
    if (filters.range !== null) count++;
    if (filters.marketMin || filters.marketMax) count++;
    if (filters.rangeMin || filters.rangeMax) count++;
    return count;
  }

  /* ===== RENDER ===== */
  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3`}
    >
      {/* Responsive Title Section */}
      <h1 className={`${titlePurpleLD} block mobileMd:hidden`}>STAMPS</h1>
      <h1 className={`${titlePurpleLD} hidden mobileMd:block`}>ART STAMPS</h1>

      {/* Controls Section */}
      <div className="flex flex-col">
        <div className="flex relative items-start justify-between gap-[18px] tablet:gap-3">
          <FilterButton
            count={countActiveStampFilters(currentFilters)}
            open={isOpen1}
            setOpen={handleOpen1}
            type="stamp"
          />
          <SortButton />
          <SearchStampModal showButton />
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        open={isOpen1}
        setOpen={handleOpen1}
        type="stamp"
      />
    </div>
  );
};
