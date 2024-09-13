import { useEffect, useState } from "preact/hooks";

import { SRC20Navigator } from "$islands/src20/SRC20Navigator.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

export const SRC20Header = (
  { filterBy, sortBy, selectedTab, type }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
    type: STAMP_TYPES;
  },
) => {
  const { setTypeOption } = useNavigator();

  const [currentFilters, setCurrentFilters] = useState<FILTER_TYPES[]>(
    filterBy,
  );
  const [currentSort, setCurrentSort] = useState<string>(sortBy);

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
    <div class="text-white flex flex-col gap-8">
      <p className="text-3xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC]">
        SRC-20 TOKENS
      </p>
      <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
        <div class="flex gap-6 md:gap-8 items-end">
          <p
            class={`cursor-pointer pb-3 text-2xl uppercase ${
              selectedTab === "all"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "all")}
          >
            All
          </p>
          <p
            class={`cursor-pointer pb-3 text-2xl uppercase ${
              selectedTab === "minting"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "minting")}
          >
            Minting
          </p>
        </div>
        <div class="flex gap-3 justify-between">
          <SRC20Navigator
            initFilter={currentFilters}
            initSort={currentSort}
            initType={type}
            selectedTab={selectedTab}
            open1={isOpen1}
            handleOpen1={handleOpen1}
          />
          <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
        </div>
      </div>
    </div>
  );
};
