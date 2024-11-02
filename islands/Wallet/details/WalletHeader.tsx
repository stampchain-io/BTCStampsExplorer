import { useState } from "preact/hooks";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { Filter } from "../../datacontrol/Filter.tsx";

import { WALLET_FILTER_TYPES } from "globals";

interface WalletHeaderProps {
  filterBy: WALLET_FILTER_TYPES[];
  sortBy: string;
}

const WalletHeader = ({
  filterBy,
  sortBy,
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
    <div class="flex flex-col-reverse tablet:flex-row justify-between items-center gap-3 w-full">
      <h1 className="text-5xl text-[#660099] font-black">WALLET</h1>
      <div class="flex gap-3 justify-between h-[40px]">
        <Filter
          initFilter={filterBy}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "all",
            "stamps",
            "collections",
            "dispensers",
            "tokens",
          ]}
        />
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};

export default WalletHeader;
