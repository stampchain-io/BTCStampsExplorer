import { useState } from "preact/hooks";

import { SRC20_FILTER_TYPES } from "$globals";
import { SortButton } from "$islands/sort/SortButton.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";

export const SRC20Header = (
  { filterBy, sortBy, search }: {
    filterBy: SRC20_FILTER_TYPES | SRC20_FILTER_TYPES[];
    sortBy: "ASC" | "DESC" | undefined;
    search: string;
  },
) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchOpen = (open: boolean) => {
    setSearchOpen(open);
  };

  const searchparams = new URLSearchParams(search);

  const titlePurpleDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient1";

  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      <h1 className={`${titlePurpleDL} block mobileLg:hidden`}>TOKENS</h1>
      <h1 className={`${titlePurpleDL} hidden mobileLg:block`}>
        SRC-20 TOKENS
      </h1>
      <div class="flex relative items-start justify-between gap-3">
        <SortButton searchParams={searchparams} />
        <SRC20SearchClient
          open2={searchOpen}
          handleOpen2={handleSearchOpen}
        />
      </div>
    </div>
  );
};
