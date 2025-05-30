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
import { CloseIcon, Icon } from "$icon";
import { Button } from "$button";

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
    console.log("FilterDrawer - searchString:", searchString);

    switch (type) {
      case "src20": {
        const src20Filters = src20QueryParamsToFilters(searchString);
        console.log("FilterDrawer - src20Filters:", src20Filters);
        return src20Filters;
      }
      case "src101": {
        // For future implementation
        return src20QueryParamsToFilters(searchString); // Temporary fallback
      }
      default: {
        return stampQueryParamsToFilters(searchString);
      }
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

  // Add a ref to track if we're clearing filters
  const isClearingRef = useRef(false);

  // Modify the useEffect
  useEffect(() => {
    if (!isClearingRef.current) {
      setCurrentFilters(getInitialFilters());
    }
  }, [searchparams.toString(), type]);

  // Handle browser resize
  useEffect(() => {
    let resizeTimer: number | null = null;

    const handleResize = () => {
      // Disable transitions during resize
      if (drawerRef.current) {
        drawerRef.current.style.transition = "none";
      }

      // Re-enable transitions after resize is complete
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }

      resizeTimer = setTimeout(() => {
        if (drawerRef.current) {
          drawerRef.current.style.transition = "";
        }
      }, 100) as unknown as number;
    };

    globalThis.addEventListener("resize", handleResize);
    return () => {
      globalThis.removeEventListener("resize", handleResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, []);

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

  // Modify the open/close handlers
  const handleCloseDrawerUpdate = () => {
    console.log("APPLY button clicked");
    console.log("Filter type:", type);
    console.log(
      "Current filters before query params:",
      JSON.stringify(currentFilters, null, 2),
    );

    // Add type-specific logging that handles both filter types
    if (type === "src20") {
      // Log SRC20-specific properties
      const src20Filters = currentFilters as SRC20Filters;
      console.log(
        "SRC20 status filters:",
        JSON.stringify(src20Filters.status, null, 2),
      );
      console.log(
        "SRC20 details filters:",
        JSON.stringify(src20Filters.details, null, 2),
      );
      console.log(
        "SRC20 market filters:",
        JSON.stringify(src20Filters.market, null, 2),
      );
    } else {
      // Log Stamp-specific properties
      const stampFilters = currentFilters as StampFilters;
      console.log("Market filters:", stampFilters.market);
      console.log("Market min value:", stampFilters.marketMin);
      console.log("Market max value:", stampFilters.marketMax);
      console.log("Market min type:", typeof stampFilters.marketMin);
      console.log("Market max type:", typeof stampFilters.marketMax);
    }

    const queryString = getFiltersToQueryParams(
      globalThis.location.search,
      currentFilters,
    );

    console.log("Generated query string:", queryString);
    console.log("Current URL:", globalThis.location.href);
    console.log("New URL:", globalThis.location.pathname + "?" + queryString);

    // Add a try-catch to catch any errors during URL navigation
    try {
      globalThis.location.href = globalThis.location.pathname + "?" +
        queryString;
      setOpen(false);
    } catch (error) {
      console.error("Error navigating to new URL:", error);
    }
  };

  // Close the drawer with no updates
  const handleCloseDrawer = () => {
    setOpen(false);
  };

  const handleApplyFilters = () => {
    // Convert filters to query params string
    const existingParams = new URLSearchParams(window.location.search);
    const baseParams = existingParams.get("type")
      ? `type=${existingParams.get("type")}`
      : "";

    // Create query string from current filters
    let queryParams;
    if (type === "stamp") {
      // Convert stamp filters to query params
      queryParams = stampFiltersToQueryParams(
        baseParams,
        currentFilters as StampFilters,
      );
      console.log("Applying stamp filters, generated query:", queryParams);
    } else if (type === "src20") {
      // Convert src20 filters to query params
      queryParams = src20FiltersToQueryParams(
        baseParams,
        currentFilters as SRC20Filters,
      );
      console.log("Applying src20 filters, generated query:", queryParams);
    }

    // Construct the new URL with the query params
    const newUrl = globalThis.location.pathname +
      (queryParams ? `?${queryParams}` : "");
    console.log("Navigating to new URL:", newUrl);

    // Update URL and close drawer
    globalThis.location.href = newUrl;
    setOpen(false);
  };

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return;
    } else {
      const timer = setTimeout(() => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }, 400); // Match drawer transition duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <div
      id={drawerId}
      ref={drawerRef}
      class={`fixed top-0 z-40 h-screen
        bg-gradient-to-b from-[#0e0014]/60 via-[#000000]/80 to-[#000000]/100 backdrop-blur-md
        transition-transform duration-500 ease-in-out will-change-transform
        overflow-y-auto overflow-x-hidden scrollbar-black
        left-0 right-auto w-full min-[420px]:w-[340px] shadow-[12px_0_12px_-6px_rgba(0,0,0,0.5)]
        tablet:right-0 tablet:left-auto tablet:w-[300px] tablet:shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
        ${
        open ? "translate-x-0" : "-translate-x-full tablet:translate-x-full"
      }`}
      aria-labelledby="drawer-form-label"
    >
      {/* Scrollable content area */}
      <div className="h-[calc(100vh-92px)] tablet:h-[calc(100vh-88px)] overflow-y-auto scrollbar-black">
        <div className="w-full pt-[30px] px-9 tablet:px-6">
          <div className="relative w-full">
            <div
              className={`${tooltipIcon} ${
                isCloseTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {closeTooltipText}
            </div>

            {/* Mobile CloseIcon - shows by default, hidden on tablet+ */}
            <div className="flex flex-row tablet:hidden justify-between items-center w-ful">
              <h6 className="font-extrabold text-2xl gray-gradient1 mt-[1px] select-none">
                FILTERS
              </h6>
              <CloseIcon
                size="sm"
                weight="bold"
                color="greyGradient"
                onClick={handleCloseDrawer}
                onMouseEnter={handleCloseMouseEnter}
                onMouseLeave={handleCloseMouseLeave}
                aria-label="Close"
              />
            </div>
            {/* Tablet+ Icon - hidden on mobile, shows on tablet+ */}
            <div className="hidden tablet:flex flex-row justify-between items-center w-full">
              <Icon
                type="iconLink"
                name="close"
                weight="bold"
                size="xs"
                color="grey"
                onClick={handleCloseDrawer}
                onMouseEnter={handleCloseMouseEnter}
                onMouseLeave={handleCloseMouseLeave}
                aria-label="Close menu"
              />
              <h6 className="font-normal text-lg gray-gradient1 mt-[-1px] select-none">
                FILTERS
              </h6>
            </div>
          </div>
        </div>

        {/* Filter content based on type */}
        <div className="flex flex-col pt-6 pb-9 px-9 tablet:pt-5 tablet:pb-6 tablet:px-6">
          {type === "stamp" && (
            <FilterContentStamp
              initialFilters={currentFilters as StampFilters}
              onFiltersChange={(filters) => {
                console.log(
                  "filters changed in FilterDrawer:",
                  JSON.stringify(filters, null, 2),
                );
                setCurrentFilters(filters);
              }}
            />
          )}
          {type === "src20" && (
            <FilterContentSRC20
              initialFilters={currentFilters as SRC20Filters}
              onFiltersChange={(filters) => {
                console.log("FilterDrawer - SRC20 filters changed:", filters);
                setCurrentFilters(filters);
              }}
            />
          )}
          {/* Add more filter content components for other types as needed */}
        </div>
      </div>
      {/* Sticky buttons */}
      <div className="flex justify-between w-full sticky bottom-0 py-6 px-9 tablet:px-6 gap-6
       bg-gradient-to-b from-[#000000]/80 to-[#000000]/100
        shadow-[0_-12px_12px_-6px_rgba(0,0,0,1)]">
        <Button
          variant="outline"
          color="grey"
          size="sm"
          onClick={() => {
            isClearingRef.current = true; // Set the flag before clearing
            setCurrentFilters(emptyFilters);
            // Reset the flag after a short delay
            setTimeout(() => {
              isClearingRef.current = false;
            }, 100);
          }}
          class="w-full"
        >
          CLEAR
        </Button>
        <Button
          variant="flat"
          color="grey"
          size="sm"
          onClick={handleApplyFilters}
          class="w-full"
        >
          APPLY
        </Button>
      </div>
    </div>
  );
};

export default FilterDrawer;
