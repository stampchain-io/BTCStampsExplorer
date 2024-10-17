import { useEffect, useState } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "globals";
import { useURLUpdate } from "hooks/useURLUpdate.ts";

type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES;

interface FilterProps {
  initFilter?: FilterTypes[];
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: FilterTypes[];
}

export function Filter({
  initFilter = [],
  open,
  handleOpen,
  filterButtons,
}: FilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterTypes[]>(initFilter);
  const { updateURL } = useURLUpdate();

  useEffect(() => {
    setLocalFilters(initFilter);
  }, [initFilter]);

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
    <div
      class={`border-2 border-[#660099] bg-[#0B0B0B] rounded-md flex flex-col items-center gap-1 h-fit relative z-[100] ${
        open ? "px-6 py-4" : "p-[10px]"
      }`}
    >
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
                class={`cursor-pointer text-xs md:text-sm font-black ${
                  localFilters.includes(filter)
                    ? "text-[#AA00FF]"
                    : "text-[#660099] hover:text-[#AA00FF]"
                }`}
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
  );
}
