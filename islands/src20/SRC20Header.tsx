import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "$globals";

import { Filter } from "$islands/datacontrol/Filter.tsx";
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";

export const SRC20Header = (
  { filterBy, sortBy }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
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
  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient1";

  return (
    <div className="tabs">
      <div class="flex flex-row justify-between items-center gap-3 w-full relative">
        <h1 className={`${titlePurpleDL} block tablet:hidden`}>TOKENS</h1>
        <h1 className={`${titlePurpleDL} hidden tablet:block`}>
          SRC-20 TOKENS
        </h1>
        <div class="flex relative items-center justify-between gap-3">
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
            dropdownPosition="absolute top-[100px] right-[-79px] mobileMd:top-[96px] mobileMd:right-[-96px] mobileLg:top-[128px] mobileLg:right-[-96px] desktop:top-[125px] desktop:right-[-108px]"
          />
          <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
            <Sort initSort={sortBy} />
          </div>
          <div class={isOpen1 ? "opacity-0 invisible" : "opacity-100"}>
            <SRC20SearchClient open2={isOpen2} handleOpen2={handleOpen2} />
          </div>
        </div>
      </div>
    </div>
  );
};
