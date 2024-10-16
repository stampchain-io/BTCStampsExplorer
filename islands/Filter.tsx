import { useEffect, useState } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "globals";
import { STAMP_TYPES } from "globals";
import { useURLUpdate } from "hooks/useURLUpdate.ts";

type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES;

interface FilterProps {
  initFilter?: FilterTypes[];
  initType?: STAMP_TYPES;
  selectedTab?: STAMP_TYPES;
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: FilterTypes[];
  isStamp?: boolean;
}

export function Filter({
  initFilter = [],
  initType,
  selectedTab,
  open,
  handleOpen,
  filterButtons,
  isStamp = true,
}: FilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterTypes[]>(initFilter);
  const { updateURL } = useURLUpdate();

  useEffect(() => {
    setLocalFilters(initFilter);
  }, [initFilter, initType]);

  const handleFilterChange = (value: FilterTypes) => {
    setLocalFilters((prevFilters) => {
      const newFilters = prevFilters.includes(value)
        ? prevFilters.filter((f) => f !== value)
        : [...prevFilters, value];
      updateURL({ filterBy: newFilters });
      return newFilters;
    });
  };

  return (
    <div class="relative flex items-center gap-3">
      <div class="border-2 border-[#660099] px-6 py-4 rounded-md flex flex-col items-center gap-1 relative">
        {open
          ? (
            <>
              <img
                class="cursor-pointer absolute top-5 right-2"
                src="/img/stamp/navigator-close.png"
                alt="Navigator close"
                onClick={() => handleOpen(false)}
              />
              <p className="text-lg font-black text-[#AA00FF] mb-1">FILTERS</p>
              {filterButtons.map((filter) => (
                <button
                  key={filter}
                  class="cursor-pointer text-xs md:text-sm font-black text-[#660099] hover:text-[#AA00FF]"
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </>
          )
          : (
            <img
              class="cursor-pointer"
              src="/img/stamp/navigator-list.png"
              alt="Navigator list"
              onClick={() => handleOpen(true)}
            />
          )}
      </div>
    </div>
  );
}
