import { useEffect, useRef, useState } from "preact/hooks";
import { FilterContentStamp } from "$islands/filter/FilterContentStamp.tsx";
import {
  defaultFilters as stampDefaultFilters,
  filtersToQueryParams as stampFiltersToQueryParams,
  queryParamsToFilters as stampQueryParamsToFilters,
  StampFilters,
} from "$islands/filter/FilterOptionsStamp.tsx";
// Import SRC20 filter options
import {
  defaultFilters as src20DefaultFilters,
  filtersToQueryParams as src20FiltersToQueryParams,
  queryParamsToFilters as src20QueryParamsToFilters,
  SRC20Filters,
} from "$islands/filter/FilterOptionsSRC20.tsx";
// Import SRC20 filter content
import { FilterContentSRC20 } from "$islands/filter/FilterContentSRC20.tsx";
import { FilterType } from "$islands/filter/FilterButton.tsx";

// Define a type for all possible filter types
type AllFilters = StampFilters | SRC20Filters;

const FilterDrawer = (
  { open, setOpen, searchparams, type = "stamp" }: {
    open: boolean;
    setOpen: (status: boolean) => void;
    searchparams: URLSearchParams;
    type?: FilterType;
  },
) => {
  // Parse the current URL parameters to initialize filters
  const getInitialFilters = (): AllFilters => {
    const searchString = searchparams.toString();

    switch (type) {
      case "src20":
        return src20QueryParamsToFilters(searchString);
      case "src101":
        // For future implementation
        return src20QueryParamsToFilters(searchString); // Temporary fallback
      default:
        return stampQueryParamsToFilters(searchString);
    }
  };

  // Get empty filters for the CLEAR button
  const getEmptyFilters = (): AllFilters => {
    switch (type) {
      case "src20":
        return { ...src20DefaultFilters };
      case "src101":
        // For future implementation
        return { ...src20DefaultFilters }; // Temporary fallback
      default:
        return { ...stampDefaultFilters };
    }
  };

  // Get the appropriate filters to query params function based on type
  const getFiltersToQueryParams = (
    search: string,
    filters: AllFilters,
  ): string => {
    switch (type) {
      case "src20":
        return src20FiltersToQueryParams(search, filters as SRC20Filters);
      case "src101":
        // For future implementation
        return src20FiltersToQueryParams(search, filters as SRC20Filters); // Temporary fallback
      default:
        return stampFiltersToQueryParams(search, filters as StampFilters);
    }
  };

  const emptyFilters = getEmptyFilters();
  const [currentFilters, setCurrentFilters] = useState<AllFilters>(
    getInitialFilters(),
  );

  // Update filters when searchparams or type changes
  useEffect(() => {
    setCurrentFilters(getInitialFilters());
  }, [searchparams.toString(), type]);

  // Close the drawer, update the URL with the new filters and reload the page
  const handleCloseDrawerUpdate = () => {
    // Clean filters before converting to query params
    const queryString = getFiltersToQueryParams(
      globalThis.location.search,
      currentFilters,
    );
    globalThis.location.href = globalThis.location.pathname + "?" + queryString;
    setOpen(false);
  };

  // Close the drawer with no updates
  const handleCloseDrawer = () => {
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        if (open) {
          handleCloseDrawer();
        } else {
          setOpen(true);
        }
      }
      if (e.key === "Escape") {
        if (open) {
          e.preventDefault();
          handleCloseDrawer();
        }
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [open, currentFilters]);

  // Add tooltip state for close button
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);

  // Add cleanup effect for tooltip timeout
  useEffect(() => {
    return () => {
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseMouseEnter = () => {
    if (allowCloseTooltip) {
      setCloseTooltipText("CLOSE");

      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }

      closeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsCloseTooltipVisible(true);
      }, 1500);
    }
  };

  const handleCloseMouseLeave = () => {
    if (closeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(closeTooltipTimeoutRef.current);
    }
    setIsCloseTooltipVisible(false);
    setAllowCloseTooltip(true);
  };

  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";

  const CrossIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      class="size-7 tablet:size-6 hover:fill-stamp-grey-light"
      role="button"
      aria-label="Close Filter"
      fill="url(#closeFilterGradient)"
    >
      <defs>
        <linearGradient
          id="closeFilterGradient"
          gradientTransform="rotate(45)"
        >
          <stop offset="0%" stop-color="#666666" />
          <stop offset="50%" stop-color="#999999" />
          <stop offset="100%" stop-color="#CCCCCC" />
        </linearGradient>
      </defs>
      <path d="M26.0612 23.9387C26.343 24.2205 26.5013 24.6027 26.5013 25.0012C26.5013 25.3997 26.343 25.7819 26.0612 26.0637C25.7794 26.3455 25.3972 26.5038 24.9987 26.5038C24.6002 26.5038 24.218 26.3455 23.9362 26.0637L15.9999 18.125L8.0612 26.0612C7.7794 26.343 7.39721 26.5013 6.9987 26.5013C6.60018 26.5013 6.21799 26.343 5.9362 26.0612C5.6544 25.7794 5.49609 25.3972 5.49609 24.9987C5.49609 24.6002 5.6544 24.218 5.9362 23.9362L13.8749 16L5.9387 8.06122C5.6569 7.77943 5.49859 7.39724 5.49859 6.99872C5.49859 6.60021 5.6569 6.21802 5.9387 5.93622C6.22049 5.65443 6.60268 5.49612 7.0012 5.49612C7.39971 5.49612 7.7819 5.65443 8.0637 5.93622L15.9999 13.875L23.9387 5.93497C24.2205 5.65318 24.6027 5.49487 25.0012 5.49487C25.3997 5.49487 25.7819 5.65318 26.0637 5.93497C26.3455 6.21677 26.5038 6.59896 26.5038 6.99747C26.5038 7.39599 26.3455 7.77818 26.0637 8.05998L18.1249 16L26.0612 23.9387Z" />
    </svg>
  );

  const buttonGreyFlat =
    "inline-flex items-center justify-center bg-stamp-grey border-2 border-stamp-grey rounded-md text-sm tablet:text-xs font-extrabold text-black tracking-[0.05em] h-11 tablet:h-10 px-5 tablet:px-4 hover:border-stamp-grey-light hover:bg-stamp-grey-light transition-colors";
  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm tablet:text-xs font-extrabold text-stamp-grey tracking-[0.05em] h-11 tablet:h-10 px-5 tablet:px-4 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  // Get the appropriate drawer ID based on type
  const drawerId = `drawer-form-${type}`;

  return (
    <div
      id={drawerId}
      class={`fixed top-0 right-0 z-40 
      w-full min-[420px]:w-[340px] tablet:w-[320px] h-screen
      bg-gradient-to-b from-[#000000]/80 to-[#000000] 
      backdrop-blur-md transition-transform duration-300 ease-in-out
       ${open ? "translate-x-0" : "translate-x-full"}`}
      aria-labelledby="drawer-form-label"
    >
      {/* Scrollable content area */}
      <div className="h-[calc(100vh-92px)] tablet:h-[calc(100vh-88px)] p-6 overflow-y-auto scrollbar-black">
        <div className="flex flex-col mb-5 tablet:mb-3 space-y-3">
          <div className="flex justify-between">
            <button
              onClick={handleCloseDrawer}
              onMouseEnter={handleCloseMouseEnter}
              onMouseLeave={handleCloseMouseLeave}
              className="relative top-0 left-0 flex items-center justify-center"
              aria-label="Close filter menu"
            >
              <div
                className={`${tooltipIcon} ${
                  isCloseTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {closeTooltipText}
              </div>
              <CrossIcon />
            </button>
            <p className="text-3xl tablet:text-2xl font-black gray-gradient1">
              FILTERS
            </p>
          </div>
        </div>

        {/* Filter content based on type */}
        <div className="">
          {type === "stamp" && (
            <FilterContentStamp
              initialFilters={currentFilters as StampFilters}
              onFiltersChange={(filters) => {
                console.log("filters changed:", filters);
                setCurrentFilters(filters);
              }}
            />
          )}
          {type === "src20" && (
            <FilterContentSRC20
              initialFilters={currentFilters as SRC20Filters}
              onFiltersChange={(filters) => {
                console.log("filters changed:", filters);
                setCurrentFilters(filters);
              }}
            />
          )}
          {/* Add more filter content components for other types as needed */}
        </div>
      </div>
      {/* Sticky buttons */}
      <div className="flex justify-between sticky bottom-0 p-6 gap-6 bg-[#000000]/80 shadow-[0_-24px_48px_12px_rgba(0,0,0,1)]">
        <button
          onClick={() => {
            setCurrentFilters(emptyFilters);
          }}
          className={`w-full ${buttonGreyOutline}`}
        >
          CLEAR
        </button>
        <button
          onClick={handleCloseDrawerUpdate}
          className={`w-full ${buttonGreyFlat}`}
        >
          APPLY
        </button>
      </div>
    </div>
  );
};

export default FilterDrawer;
