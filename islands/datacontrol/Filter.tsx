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
  setFilterValue?: (value: FilterTypes) => void;
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: FilterTypes[];
  dropdownPosition: string;
  open2?: boolean;
}

export function Filter({
  initFilter = [],
  setFilterValue,
  open,
  handleOpen,
  filterButtons,
  dropdownPosition,
  open2 = false,
}: FilterProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [localFilters, setLocalFilters] = useState<FilterTypes[]>(initFilter);
  const { updateURL } = useURLUpdate();
  const filterContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFilters(initFilter);
  }, [initFilter]);

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (open2) return;

      if (e.key === "f") {
        e.preventDefault();
        if (!open) {
          handleOpen(true);
        } else {
          handleOpen(false);
        }
      }
      if (e.key === "Escape" && open) {
        handleOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [open, handleOpen, open2]);

  // Handle overflow and resize
  useEffect(() => {
    const handleOverflow = () => {
      const isMobileLg = globalThis.matchMedia("(min-width: 768px)").matches;

      if (open && !isMobileLg) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };

    // Initial check
    handleOverflow();

    // Add resize listener
    globalThis.addEventListener("resize", handleOverflow);

    return () => {
      globalThis.removeEventListener("resize", handleOverflow);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle clicks outside for both modal and dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isMobileLg = globalThis.matchMedia("(min-width: 768px)").matches;

      if (open) {
        // For mobileLg+ (dropdown), check if click is outside filterContainerRef
        if (
          isMobileLg && filterContainerRef.current &&
          !filterContainerRef.current.contains(event.target as Node)
        ) {
          handleOpen(false);
        } // For smaller screens (modal), check if click is on the modal background
        else if (
          !isMobileLg && (event.target as HTMLElement) === event.currentTarget
        ) {
          handleOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleOpen]);

  const handleFilterChange = (value: FilterTypes) => {
    setLocalFilters((prevFilters) => {
      const newFilters = prevFilters.includes(value)
        ? prevFilters.filter((f) => f !== value)
        : [...prevFilters, value];

      setFilterValue?.(newFilters);
      updateURL({ filterBy: newFilters });

      const url = new URL(globalThis.location.href);
      url.searchParams.set(
        "filterBy",
        newFilters.length > 0 ? newFilters.join(",") : "",
      );
      if (typeof setFilterValue !== "function") {
        globalThis.location.href = url.toString();
      }
      return newFilters;
    });
  };

  const modalBgTop =
    "fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-70 backdrop-filter backdrop-blur-md overflow-y-auto mobileLg:hidden";
  const modalFilter = "w-[90%] max-w-[360px] my-12";
  const animatedFilterField = `
    relative rounded-md
    before:absolute before:inset-[-2px] before:rounded-md before:z-[1]
    before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)]
    before:[--angle:0deg] before:animate-rotate
  `;
  const animatedBorderGrey = `
  relative rounded-md !bg-[#080808] p-[2px]
  before:absolute before:inset-0 before:rounded-md before:z-[1]
  before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)]
  before:[--angle:0deg] before:animate-rotate
  [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#080808]
`;

  return (
    <div class="relative">
      <div
        ref={filterContainerRef}
        class={`relative flex flex-col items-center gap-1 rounded-md z-20 transition-opacity duration-300 ${
          open
            ? `hidden mobileLg:flex absolute ${dropdownPosition} backdrop-blur-md bg-gradient-to-b from-transparent to-[#171717]/30 h-fit px-6 py-4 border-2 border-stamp-purple-bright`
            : "cursor-pointer"
        }`}
        onClick={() => {
          if (open) return;
          handleOpen(true);
        }}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      >
        {open
          ? (
            <>
              <p className="text-xl text-stamp-purple-bright font-black tracking-[0.05em] mb-1">
                FILTERS
              </p>
              {filterButtons.map((filter) => (
                <button
                  key={filter}
                  class={`text-base font-extrabold leading-normal cursor-pointer ${
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
                >
                  <path d="M28.5 16C28.5 16.3978 28.342 16.7794 28.0607 17.0607C27.7794 17.342 27.3978 17.5 27 17.5H5C4.60218 17.5 4.22064 17.342 3.93934 17.0607C3.65804 16.7794 3.5 16.3978 3.5 16C3.5 15.6022 3.65804 15.2206 3.93934 14.9393C4.22064 14.658 4.60218 14.5 5 14.5H27C27.3978 14.5 27.7794 14.658 28.0607 14.9393C28.342 15.2206 28.5 15.6022 28.5 16ZM5 9.5H27C27.3978 9.5 27.7794 9.34196 28.0607 9.06066C28.342 8.77936 28.5 8.39782 28.5 8C28.5 7.60218 28.342 7.22064 28.0607 6.93934C27.7794 6.65804 27.3978 6.5 27 6.5H5C4.60218 6.5 4.22064 6.65804 3.93934 6.93934C3.65804 7.22064 3.5 7.60218 3.5 8C3.5 8.39782 3.65804 8.77936 3.93934 9.06066C4.22064 9.34196 4.60218 9.5 5 9.5ZM27 22.5H5C4.60218 22.5 4.22064 22.658 3.93934 22.9393C3.65804 23.2206 3.5 23.6022 3.5 24C3.5 24.3978 3.65804 24.7794 3.93934 25.0607C4.22064 25.342 4.60218 25.5 5 25.5H27C27.3978 25.5 27.7794 25.342 28.0607 25.0607C28.342 24.7794 28.5 24.3978 28.5 24C28.5 23.6022 28.342 23.2206 28.0607 22.9393C27.7794 22.658 27.3978 22.5 27 22.5Z" />
                </svg>
              }
            />
          )}
      </div>
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full right-[0.3px] mb-2 z-10 px-3 py-2 text-sm font-medium text-white bg-stamp-bg-grey-darkest rounded-lg shadow-md"
        >
          Filters
          <div className="tooltip-arrow" />
        </div>
      )}
      {/* Modal for mobile screens */}
      {open && (
        <div
          class={modalBgTop}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleOpen(false);
          }}
        >
          <div class={modalFilter}>
            <div className={animatedBorderGrey}>
              <div class="relative flex flex-col max-h-[90%] overflow-hidden">
                <div class="relative z-[2] !bg-[#080808] text-center rounded-md p-3">
                  <p className="text-lg text-stamp-grey font-light mb-2">
                    FILTERS
                  </p>
                  {filterButtons.map((filter) => (
                    <button
                      key={filter}
                      class={`w-full text-base font-extrabold cursor-pointer py-1 ${
                        localFilters.includes(filter)
                          ? "text-stamp-grey-light"
                          : "text-stamp-grey hover:text-stamp-grey-light"
                      }`}
                      onClick={() => handleFilterChange(filter)}
                    >
                      {filter.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
