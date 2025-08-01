/* ===== STAMP OVERVIEW HEADER COMPONENT ===== */
/* TODO (@baba) - update filter and styling */
import { FilterButton } from "$islands/button/FilterButton.tsx";
import { SortButton } from "$islands/button/SortButton.tsx";
import FilterDrawer from "$islands/filter/FilterDrawer.tsx";
import {
  defaultFilters,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { titlePurpleLD } from "$text";
import type { StampOverviewHeaderProps } from "$types/ui.d.ts";
import { useState } from "preact/hooks";

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

    // Marketplace filter group - count as 1 if any marketplace filters are active
    const hasMarketplaceFilters = filters.market !== "" ||
      filters.dispensers ||
      filters.atomics ||
      filters.listings !== "" ||
      filters.sales !== "" ||
      filters.listingsMin ||
      filters.listingsMax ||
      filters.salesMin ||
      filters.salesMax ||
      filters.volume !== "" ||
      filters.volumeMin ||
      filters.volumeMax;

    if (hasMarketplaceFilters) count++;

    // Other filter categories
    if (filters.fileType.length > 0) count++;
    if (filters.editions.length > 0) count++;
    if (filters.range !== null || filters.rangeMin || filters.rangeMax) count++;
    if (
      filters.fileSize !== null || filters.fileSizeMin || filters.fileSizeMax
    ) count++;

    return count;
  }

  /* ===== RENDER ===== */
  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3`}
    >
      {/* Responsive Title Section */}
      <h1 class={`${titlePurpleLD} block mobileMd:hidden`}>STAMPS</h1>
      <h1 class={`${titlePurpleLD} hidden mobileMd:block`}>ART STAMPS</h1>

      {/* Controls Section */}
      <div class="flex flex-col">
        <div class="flex relative items-start justify-between gap-[18px] tablet:gap-3">
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
