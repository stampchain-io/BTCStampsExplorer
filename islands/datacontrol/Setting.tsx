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
import { Button } from "$components/shared/Button.tsx";

type FilterTypes =
  | SRC20_FILTER_TYPES
  | STAMP_FILTER_TYPES
  | WALLET_FILTER_TYPES
  | COLLECTION_FILTER_TYPES
  | LISTING_FILTER_TYPES
  | SRC20_TYPES;

interface SettingProps {
  initFilter: string[];
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: string[];
  onFilterClick?: (filter: string) => void;
}

export function Setting({
  initFilter = [],
  open = false,
  handleOpen,
  filterButtons,
  onFilterClick,
}: SettingProps) {
  const [localFilters, setLocalFilters] = useState<string[]>(initFilter);
  const { updateURL } = useURLUpdate();

  useEffect(() => {
    setLocalFilters(initFilter);
  }, [initFilter]);

  const _handleFilterChange = (value: string) => {
    setLocalFilters((prevFilters) => {
      const newFilters = prevFilters.includes(value)
        ? prevFilters.filter((f) => f !== value)
        : [...prevFilters, value];
      updateURL({ filterBy: newFilters });
      return newFilters;
    });
  };

  const handleFilterClick = (filter: string) => {
    if (onFilterClick) {
      onFilterClick(filter);
    }
    handleOpen(false);
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
                onClick={() => handleFilterClick(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </>
        )
        : (
          <Button
            variant="icon"
            icon="/img/wallet/icon_setting.svg"
            iconAlt="Tools icon"
            class="bg-stamp-purple rounded-md cursor-pointer"
            onClick={() => handleOpen(true)}
          />
        )}
    </div>
  );
}
