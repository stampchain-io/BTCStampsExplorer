import { useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";
import { SRC20_FILTER_TYPES } from "$globals";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";

import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SRC20SearchClient } from "$islands/src20/SRC20Search.tsx";

type FilterTypes = SRC20_FILTER_TYPES;

const FilterRow = ({
  initialFilter,
}: {
  initialFilter: SRC20_FILTER_TYPES[];
}) => {
  const [filterValue, setFilterValue] = useState<SRC20_FILTER_TYPES[]>(
    initialFilter,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const { updateURL } = useURLUpdate();

  const handleFilterChange = (value: FilterTypes) => () => {
    setFilterValue((prevValue) => {
      const newFilters = prevValue.includes(value)
        ? prevValue.filter((f) => f !== value)
        : [...prevValue, value];
      updateURL({ filterBy: newFilters });
      setLoading(true);
      return newFilters;
    });
  };

  const clearAll = () => {
    setFilterValue([]);
    updateURL({ filterBy: [] });
  };

  return (
    <div className="flex gap-3 justify-start overflow-x-auto">
      <Button
        variant={filterValue.length === 0 ? "selected" : "unselected-filter"}
        onClick={clearAll}
        disabled={loading}
      >
        All
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("minting")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("minting")}
      >
        Minting
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("trending mints")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("trending mints")}
      >
        Trending mints
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("deploy")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("deploy")}
      >
        Deploy
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("supply")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("supply")}
      >
        Supply
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("marketcap")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("marketcap")}
      >
        Marketcap
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("holders")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("holders")}
      >
        Holders
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("volume")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("volume")}
      >
        Volume
      </Button>
      <Button
        disabled={loading}
        variant={filterValue.includes("price change")
          ? "selected"
          : "unselected-filter"}
        onClick={handleFilterChange("price change")}
      >
        Price Change
      </Button>
    </div>
  );
};

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
    <div className="tabs flex flex-col gap-9">
      <div class="flex flex-row justify-between items-center gap-3 w-full">
        <h1 className="hidden tablet:block text-5xl desktop:text-6xl purple-gradient1 font-black">
          SRC-20 TOKENS
        </h1>
        <h1 className="block tablet:hidden text-4xl mobileLg:text-5xl purple-gradient1 font-black">
          TOKENS
        </h1>
        <div class="flex gap-3 justify-between h-[40px]">
          <Sort initSort={sortBy} />
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
      <FilterRow
        initialFilter={Array.isArray(filterBy) ? filterBy : [filterBy]}
      />
    </div>
  );
};
