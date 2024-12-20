import { useEffect, useRef, useState } from "preact/hooks";
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
  dropdownPosition: string;
}

export function Filter({
  initFilter = [],
  open,
  handleOpen,
  filterButtons,
  dropdownPosition,
}: FilterProps) {
  const [localFilters, setLocalFilters] = useState<FilterTypes[]>(initFilter);
  const { updateURL } = useURLUpdate();
  const filterContainerRef = useRef<HTMLDivElement>(null);
  const [_isHovered, _setIsHovered] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterContainerRef.current &&
        !filterContainerRef.current.contains(event.target as Node)
      ) {
        handleOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div
      ref={filterContainerRef}
      class={`rounded-md flex flex-col items-center gap-1 relative z-20 transition-opacity duration-300 ${
        open
          ? `${dropdownPosition} backdrop-blur-md bg-gradient-to-b from-transparent to-[#171717]/30 h-fit px-6 py-4 border-2 border-stamp-purple-bright`
          : "cursor-pointer"
      }`}
      onClick={() => {
        if (open) return;
        handleOpen(true);
      }}
    >
      {open
        ? (
          <>
            <p className="text-lg mobileLg:text-xl font-black text-stamp-purple-bright mb-1">
              FILTERS
            </p>
            {filterButtons.map((filter) => (
              <button
                key={filter}
                class={`cursor-pointer text-xs mobileLg:text-base font-extrabold ${
                  localFilters.includes(filter)
                    ? "text-stamp-purple-bright"
                    : "text-stamp-grey hover:text-stamp-purple-bright"
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
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                role="button"
                aria-label="Filter"
                class="fill-stamp-purple group-hover:fill-stamp-purple-bright"
              >
                <path d="M28.5 16C28.5 16.3978 28.342 16.7794 28.0607 17.0607C27.7794 17.342 27.3978 17.5 27 17.5H5C4.60218 17.5 4.22064 17.342 3.93934 17.0607C3.65804 16.7794 3.5 16.3978 3.5 16C3.5 15.6022 3.65804 15.2206 3.93934 14.9393C4.22064 14.658 4.60218 14.5 5 14.5H27C27.3978 14.5 27.7794 14.658 28.0607 14.9393C28.342 15.2206 28.5 15.6022 28.5 16ZM5 9.5H27C27.3978 9.5 27.7794 9.34196 28.0607 9.06066C28.342 8.77936 28.5 8.39782 28.5 8C28.5 7.60218 28.342 7.22064 28.0607 6.93934C27.7794 6.65804 27.3978 6.5 27 6.5H5C4.60218 6.5 4.22064 6.65804 3.93934 6.93934C3.65804 7.22064 3.5 7.60218 3.5 8C3.5 8.39782 3.65804 8.77936 3.93934 9.06066C4.22064 9.34196 4.60218 9.5 5 9.5ZM27 22.5H5C4.60218 22.5 4.22064 22.658 3.93934 22.9393C3.65804 23.2206 3.5 23.6022 3.5 24C3.5 24.3978 3.65804 24.7794 3.93934 25.0607C4.22064 25.342 4.60218 25.5 5 25.5H27C27.3978 25.5 27.7794 25.342 28.0607 25.0607C28.342 24.7794 28.5 24.3978 28.5 24C28.5 23.6022 28.342 23.2206 28.0607 22.9393C27.7794 22.658 27.3978 22.5 27 22.5Z" />
              </svg>
            }
            class="border-2 border-stamp-purple bg-transparent rounded-md hover:border-stamp-purple-bright"
          />
        )}
    </div>
  );
}
