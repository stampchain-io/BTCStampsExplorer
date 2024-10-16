import { useState } from "preact/hooks";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { Filter } from "$islands/filter.tsx";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

interface WalletHeaderProps {
  filterBy: STAMP_FILTER_TYPES[];
  sortBy: string;
  selectedTab: STAMP_TYPES;
  type: STAMP_TYPES;
}

const WalletHeader = ({
  filterBy,
  sortBy,
  selectedTab,
  type,
}: WalletHeaderProps) => {
  // State management for the open states
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
    <div class="flex flex-col-reverse lg:flex-row justify-between gap-3 w-full">
      <div class="flex gap-5 md:gap-11 items-end">
        <h1 className="text-5xl text-[#660099] font-black">WALLET</h1>
      </div>
      <div class="flex gap-3 pb-1 md:pb-3 justify-between">
        <Filter
          initFilter={filterBy}
          initSort={sortBy}
          initType={type}
          selectedTab={selectedTab}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "all",
            "stamps",
            "collections",
            "dispensers",
            "tokens",
          ]}
          isStamp={false}
        />
        {
          /* <StampNavigator
          initFilter={filterBy}
          initSort={sortBy}
          initType={type}
          selectedTab={selectedTab}
          open1={isOpen1}
          handleOpen1={handleOpen1}
        /> */
        }
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};

export default WalletHeader;
