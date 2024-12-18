import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "$globals";

import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";

export const SRC20Header = (
  { filterBy, sortBy }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    selectedTab: string;
  },
) => {
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
      <div class="flex flex-row justify-between items-center gap-3 w-full relative">
        <h1 className="hidden tablet:block text-5xl desktop:text-6xl purple-gradient1 font-black">
          SRC-20 TOKENS
        </h1>
        <h1 className="block tablet:hidden text-4xl mobileLg:text-5xl purple-gradient1 font-black">
          TOKENS
        </h1>
        <div class="flex gap-3 justify-between mobileLg:h-9 h-7 items-center">
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
