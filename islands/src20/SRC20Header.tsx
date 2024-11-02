import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "globals";

import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { Search, SearchResult } from "$islands/datacontrol/Search.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";

export const SRC20Header = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

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

  const handleResultClick = (result: SearchResult) => {
    globalThis.location.href = `/src20/${result.tick}`;
  };

  return (
    <div className="tabs">
      <div class="flex flex-row justify-between items-center gap-3 w-full">
        <div class="flex gap-6 tablet:gap-8 items-end">
          <p
            class={`cursor-pointer pb-1 tablet:pb-3 text-base tablet:text-2xl uppercase ${
              selectedTab === "all"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "all", true)}
          >
            All
          </p>
          <p
            class={`cursor-pointer pb-1 tablet:pb-3 text-base tablet:text-2xl uppercase ${
              selectedTab === "trending"
                ? "text-[#AA00FF] border-b-2 border-b-[#AA00FF] font-bold"
                : "text-[#8800CC] font-light"
            }`}
            onClick={() => setTypeOption("src20", "trending", true)}
          >
            Trending
          </p>
        </div>
        <div class="flex gap-3 justify-between h-[40px]">
          <Sort initSort={sortBy} />
          <Filter
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
          />
          <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
          {
            /* <Search
            open={isOpen2}
            handleOpen={handleOpen2}
            placeholder="Token Name, Tx Hash, or Address"
            searchEndpoint="/api/v2/src20/search?q="
            onResultClick={handleResultClick}
            resultDisplay={(result) => result.id || ""}
          /> */
          }
        </div>
      </div>
    </div>
  );
};
