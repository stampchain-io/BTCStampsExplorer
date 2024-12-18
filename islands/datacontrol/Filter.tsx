import { useEffect, useState } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";
import { Button } from "$components/shared/Button.tsx";

type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | LISTING_FILTER_TYPES;

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
      class={`${
        open
          ? "bg-gradient-filters h-fit px-6 py-4 absolute top-0 right-10 z-20 border-2 border-stamp-purple"
          : "cursor-pointer relative z-[10]"
      } rounded-md flex flex-col items-center gap-1 `}
      onClick={() => {
        if (open) return;
        handleOpen(true);
      }}
    >
      {open
        ? (
          <>
            <img
              class="cursor-pointer absolute top-5 right-2"
              src="/img/stamp/navigator-close.png"
              alt="Navigator close"
              onClick={(ev) => {
                ev.stopPropagation();
                handleOpen(false);
              }}
            />
            <p className="text-lg font-black text-[#AA00FF] mb-1">FILTERS</p>
            {filterButtons.map((filter) => (
              <button
                key={filter}
                class={`cursor-pointer text-xs tablet:text-sm font-black ${
                  localFilters.includes(filter)
                    ? "text-[#AA00FF]"
                    : "text-[#8800CC] hover:text-[#AA00FF]"
                }`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </>
        )
        : (
          <Button
            variant="icon"
            icon="/img/stamp/List.svg"
            iconAlt="Navigator list"
            class="cursor-pointer bg-transparent"
          />
        )}
    </div>
  );
}
