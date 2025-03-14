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
import { CloseIcon } from "$islands/filter/FilterComponents.tsx";
import { button } from "$islands/filter/FilterStyles.ts";

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

  // Add a new state to control when transitions should be applied
  const [isResizing, setIsResizing] = useState(false);

  // Modify the open/close handlers
  const handleCloseDrawerUpdate = () => {
    setIsResizing(true);
    const queryString = getFiltersToQueryParams(
      globalThis.location.search,
      currentFilters,
    );
    globalThis.location.href = globalThis.location.pathname + "?" + queryString;
    setOpen(false);
  };

  // Close the drawer with no updates
  const handleCloseDrawer = () => {
    setIsResizing(true);
    setOpen(false);
  };

  // Handle open and close events
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Combined handler for keyboard shortcuts and click outside
    const handleCloseEvents = (e: KeyboardEvent | MouseEvent) => {
      // Handle keyboard shortcuts
      if (e.type === "keydown") {
        const keyEvent = e as KeyboardEvent;

        // Close on Escape key
        if (keyEvent.key === "Escape" && open) {
          e.preventDefault();
          handleCloseDrawer();
        }

        // Toggle on Cmd/Ctrl+F
        if ((keyEvent.metaKey || keyEvent.ctrlKey) && keyEvent.key === "f") {
          e.preventDefault();
          if (open) {
            handleCloseDrawer();
          } else {
            setOpen(true);
          }
        }
      }

      // Handle click outside
      if (e.type === "mousedown" && open) {
        // Check if the click was outside the drawer
        if (
          drawerRef.current && !drawerRef.current.contains(e.target as Node)
        ) {
          handleCloseDrawer();
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleCloseEvents);
    document.addEventListener("mousedown", handleCloseEvents);

    // Clean up event listeners
    return () => {
      document.removeEventListener("keydown", handleCloseEvents);
      document.removeEventListener("mousedown", handleCloseEvents);
    };
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

  // Get the appropriate drawer ID based on type
  const drawerId = `drawer-form-${type}`;

  // Handle browser resize and toggle open state
  useEffect(() => {
    const drawer = drawerRef.current;

    const handleResized = () => setIsResizing(false);

    if (drawer) {
      drawer.addEventListener("transitionend", handleResized);
      return () => drawer.removeEventListener("transitionend", handleResized);
    }
  }, []);

  // Set resizing when opening
  useEffect(() => {
    if (open) setIsResizing(true);
  }, [open]);

  return (
    <div
      id={drawerId}
      ref={drawerRef}
      class={`fixed top-0 z-40 h-screen
        bg-gradient-to-b from-[#000000]/80 to-[#000000] 
        ${isResizing ? "transition-transform duration-300" : ""}
        
        left-0 right-auto w-full min-[420px]:w-[340px] shadow-[12px_0_12px_-6px_rgba(0,0,0,0.5)]
        tablet:right-0 tablet:left-auto tablet:w-[320px] tablet:shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
        
        ${
        open ? "translate-x-0" : "-translate-x-full tablet:translate-x-full"
      }`}
      aria-labelledby="drawer-form-label"
    >
      {/* Scrollable content area */}
      <div className="h-[calc(100vh-92px)] tablet:h-[calc(100vh-88px)] p-6 overflow-y-auto scrollbar-black">
        <div className="flex flex-col mb-8 tablet:mb-6">
          <div className="flex justify-between ">
            <p className="tablet:hidden text-3xl font-black gray-gradient1 cursor-default select-none">
              FILTERS
            </p>
            <button
              onClick={handleCloseDrawer}
              onMouseEnter={handleCloseMouseEnter}
              onMouseLeave={handleCloseMouseLeave}
              className="relative tablet:hidden top-0 left-0 flex items-center justify-center"
              aria-label="Close filter menu"
            >
              <div
                className={`${tooltipIcon} ${
                  isCloseTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {closeTooltipText}
              </div>
              <CloseIcon />
            </button>
            <p className="hidden tablet:block text-3xl font-black gray-gradient1 cursor-default select-none">
              FILTERS
            </p>
          </div>
        </div>

        {/* Filter content based on type */}
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
      {/* Sticky buttons */}
      <div className="flex justify-between sticky bottom-0 p-6 gap-6 bg-[#000000]/80 shadow-[0_-12px_12px_-6px_rgba(0,0,0,1)]">
        <button
          onClick={() => {
            setCurrentFilters(emptyFilters);
          }}
          className={`w-full ${button("outlineGrey", "lg")}`}
        >
          CLEAR
        </button>
        <button
          onClick={handleCloseDrawerUpdate}
          className={`w-full ${button("flatGrey", "lg")}`}
        >
          APPLY
        </button>
      </div>
    </div>
  );
};

export default FilterDrawer;
