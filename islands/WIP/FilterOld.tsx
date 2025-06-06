import { useEffect, useRef, useState } from "preact/hooks";
import {
  COLLECTION_FILTER_TYPES,
  LISTING_FILTER_TYPES,
  SRC20_FILTER_TYPES,
  STAMP_FILTER_TYPES,
  WALLET_FILTER_TYPES,
} from "$globals";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";
import { Icon } from "$icon";

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

export function FilterOld({
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
                  type="button"
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
            <Icon
              type="iconLink"
              name="filter"
              weight="bold"
              size="custom"
              color="purple"
              className="mt-[6px] w-[23px] h-[23px] tablet:w-[21px] tablet:h-[21px] group-hover:fill-stamp-purple-bright transition-all duration-300"
              onClick={() => handleOpen(true)}
            />
          )}
      </div>
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full right-[0.3px] mb-2 z-10 px-3 py-2 text-sm font-medium text-white bg-stamp-bg-grey-darkest rounded-lg shadow-md"
        >
          FILTERS
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
                      type="button"
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
