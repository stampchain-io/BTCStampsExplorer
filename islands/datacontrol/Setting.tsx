import { useEffect, useState } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  SRC20_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";

type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | LISTING_FILTER_TYPES
  | SRC20_TYPES;

interface FilterProps {
  initFilter?: FilterTypes[];
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: FilterTypes[];
}
export function Setting({
  initFilter = [],
  open = false,
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
      class={`rounded-md flex flex-col items-center gap-1 h-fit relative z-[10] ${
        open ? "px-6 py-4 border-2 border-stamp-purple bg-[#0B0B0B]" : ""
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
            <p className="text-lg font-black text-[#AA00FF] mb-1">TOOLS</p>
            {filterButtons.map((filter) => (
              <button
                key={filter}
                class={`cursor-pointer text-xs tablet:text-sm font-black ${
                  localFilters.includes(filter)
                    ? "text-stamp-purple-bright "
                    : "text-stamp-purple hover:text-stamp-purple-bright"
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
            src="/img/wallet/icon_setting.svg"
            alt="Tools icon"
            class="bg-stamp-purple rounded-md p-[12px] cursor-pointer"
            onClick={() => handleOpen(true)}
          />
        )}
    </div>
  );
}
