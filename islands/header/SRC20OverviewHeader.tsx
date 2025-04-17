/* ===== SRC20 HEADER COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { SRC20_FILTER_TYPES } from "$globals";
import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SRC20SearchClient } from "$search";
import FilterSRC20Modal from "$islands/modal/FilterSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { openModal } from "$islands/modal/states.ts";

/* ===== COMPONENT ===== */
export const SRC20OverviewHeader = ({
  filterBy,
  sortBy,
}: {
  filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
  sortBy: "ASC" | "DESC" | undefined;
}) => {
  /* ===== STATE ===== */
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [filterValue, setFilterValue] = useState([]);

  /* ===== EVENT HANDLERS ===== */
  const handleOpenFilterModal = (filterOptions) => {
    const modalContent = <FilterSRC20Modal filterOptions={filterOptions} />;
    openModal(modalContent, "zoomInOut");
  };

  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false);
  };

  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  /* ===== EFFECTS ===== */
  useEffect(() => {
    if (filterValue.length) {
      handleOpenFilterModal(filterValue);
    }
  }, [filterValue]);

  /* ===== RENDER ===== */
  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3 ${
        isOpen1 ? "-mb-[220px] mobileMd:-mb-[216px] mobileLg:-mb-[244px]" : ""
      }`}
    >
      {/* ===== RESPONSIVE TITLE ===== */}
      <h1 className={`${titlePurpleLD} block mobileLg:hidden`}>TOKENS</h1>
      <h1 className={`${titlePurpleLD} hidden mobileLg:block`}>
        SRC-20 TOKENS
      </h1>

      {/* ===== CONTROLS SECTION ===== */}
      <div class="flex relative items-start justify-between gap-3">
        <Filter
          setFilterValue={setFilterValue}
          initFilter={Array.isArray(filterBy) ? filterBy : [filterBy]}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "minting",
            "trending mints",
            "deploy",
            "supply",
            "marketcap",
            "holders",
            "volume",
            "price change",
          ]}
          dropdownPosition="right-[-84px] mobileLg:right-[-96px]"
          open2={isOpen2}
        />
        <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
          <Sort initSort={sortBy} />
        </div>
        <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
          <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>
      </div>
    </div>
  );
};
