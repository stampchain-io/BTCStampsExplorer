import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES, SRC20_TYPES } from "globals";

import { SRC20Navigator } from "$islands/src20/SRC20Navigator.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";

export const SRC20Header = (
  { filterBy, sortBy, selectedTab, type }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: string;
    selectedTab: string;
    type: SRC20_TYPES;
  },
) => {
  const { setTypeOption } = useNavigator();

  const [currentFilters, setCurrentFilters] = useState<SRC20_FILTER_TYPES[]>(
    Array.isArray(filterBy) ? filterBy : [filterBy],
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
    <div className="tabs">
      <a
        href="/src20?type=all"
        className={selectedTab === "all" ? "active" : ""}
      >
        All
      </a>
      <a
        href="/src20?type=trending"
        className={selectedTab === "trending" ? "active" : ""}
      >
        Trending
      </a>
      <div class="flex flex-col-reverse lg:flex-row justify-between gap-3 w-full border-b border-[#3F2A4E]">
        <div class="flex gap-6 md:gap-8 items-end">
          <p
            class={`cursor-pointer pb-1 md:pb-3 text-base md:text-2xl uppercase ${
              selectedTab === "all"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "all", true)}
          >
            All
          </p>
          <p
            class={`cursor-pointer pb-1 md:pb-3 text-base md:text-2xl uppercase ${
              selectedTab === "trending"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "trending", true)}
          >
            Trending
          </p>
        </div>
        <div class="flex gap-3 pb-1 md:pb-3 justify-between">
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
