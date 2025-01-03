import { useEffect, useState } from "preact/hooks";
import { useEffect, useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "$globals";

import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";
import FilterModal from "$islands/src20/FilterModal.tsx";
import FilterModal from "$islands/src20/FilterModal.tsx";

export const SRC20Header = (
  { filterBy, sortBy }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
  },
) => {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [filterValue, setFilterValue] = useState([]);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };
  const [openModal, setOpenModal] = useState(false);
  const [filterValue, setFilterValue] = useState([]);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false);
  };

  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  useEffect(() => {
    if (filterValue.length) {
      handleOpenModal();
    }
  }, [filterValue]);

  return (
    <div
      class={`relative flex flex-row justify-between items-start w-full gap-3 ${
        isOpen1 ? "-mb-[220px] mobileMd:-mb-[216px] mobileLg:-mb-[244px]" : ""
      }`}
    >
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>TOKENS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>
        SRC-20 TOKENS
      </h1>
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
        />
        <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
          <Sort initSort={sortBy} />
        </div>
        <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
          <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>
      </div>
      {openModal &&
        (
          <FilterModal
            filterOptions={filterValue}
            handleCloseModal={handleCloseModal}
          />
        )}
    </div>
  );
};
