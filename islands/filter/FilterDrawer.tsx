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
import { FilterType } from "$islands/button/FilterButton.tsx";
import { CloseIcon, Icon } from "$icon";
import { Button } from "$button";
import { tooltipIcon } from "$notification";

// Tooltip component
const Tooltip = ({ visible, text }: { visible: boolean; text: string }) => (
  <div className={`${tooltipIcon} ${visible ? "opacity-100" : "opacity-0"}`}>
    {text}
  </div>
);

// Define a type for all possible filter types
type AllFilters = StampFilters | SRC20Filters;

const FilterDrawer = (
  { open, setOpen, type = "stamp" }: {
    open: boolean;
    setOpen: (status: boolean) => void;
    type?: FilterType;
  },
) => {
  // Parse the current URL parameters to initialize filters
  const getInitialFilters = (): AllFilters => {
    if (typeof globalThis.location === "undefined") {
      // SSR: return default filters
      return getEmptyFilters();
    }
    const searchString = globalThis.location.search.startsWith("?")
      ? globalThis.location.search.slice(1)
      : globalThis.location.search;

    let filters;
    switch (type) {
      case "src20": {
        filters = src20QueryParamsToFilters(searchString);
        break;
      }
      case "explorer": {
        filters = src20QueryParamsToFilters(searchString); // Temporary fallback
        break;
      }
      default: {
        filters = stampQueryParamsToFilters(searchString);
        break;
      }
    }
    return filters;
  };

  // Get empty filters for the CLEAR button
  const getEmptyFilters = (): AllFilters => {
    switch (type) {
      case "src20":
        return { ...src20DefaultFilters };
      case "explorer":
        // For future implementation
        return { ...src20DefaultFilters }; // Temporary fallback
      default:
        return { ...stampDefaultFilters };
    }
  };

  const emptyFilters = getEmptyFilters();
  const [currentFilters, setCurrentFilters] = useState<AllFilters>(
    getInitialFilters(),
  );

  // Modify the useEffect
  useEffect(() => {
    const newFilters = getInitialFilters();
    setCurrentFilters(newFilters);
  }, [type]);

  // Add a ref to track if we're clearing filters
  const isClearingRef = useRef(false);

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
  }, [open]); // Remove currentFilters from dependencies

  // Add tooltip state for close button
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);

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

  // Get the appropriate drawer ID based on type
  const drawerId = `drawer-form-${type}`;

  // Close the drawer with no updates
  const handleCloseDrawer = () => {
    setOpen(false);
  };

  const handleApplyFilters = () => {
    const existingParams = new URLSearchParams(globalThis.location.search);
    const baseParams = existingParams.get("type")
      ? `type=${existingParams.get("type")}`
      : "";

    let queryParams: string;
    if (type === "stamp") {
      queryParams = stampFiltersToQueryParams(
        baseParams,
        currentFilters as StampFilters,
      );
    } else if (type === "src20") {
      queryParams = src20FiltersToQueryParams(
        baseParams,
        currentFilters as SRC20Filters,
      );
    } else {
      // Handle explorer case or throw error - @baba - add explorer filter
      throw new Error(`Unsupported filter type: ${type}`);
    }

    // Construct the new URL with the query params
    const newUrl = globalThis.location.pathname +
      (queryParams ? `?${queryParams}` : "");

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
      <div className="h-[calc(100vh-110px)] tablet:h-[calc(100vh-82px)] overflow-y-auto scrollbar-black">
        <div className="w-full pt-[25px] mobileLg:pt-[37px] tablet:pt-[38px] px-9 tablet:px-6">
          <div className="relative w-full">
            {/* Mobile CloseIcon - shows by default, hidden on tablet+ */}
            <div className="flex flex-row tablet:hidden justify-between items-center w-full">
              <h6 className="font-extrabold text-2xl gray-gradient1 mt-[1px] select-none">
                FILTERS
              </h6>
              <div className="relative">
                <Tooltip
                  visible={isCloseTooltipVisible}
                  text={closeTooltipText}
                />
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
            </div>
            {/* Tablet+ Icon - hidden on mobile, shows on tablet+ */}
            <div className="hidden tablet:flex flex-row justify-between items-center w-full">
              <div className="relative">
                <Tooltip
                  visible={isCloseTooltipVisible}
                  text={closeTooltipText}
                />
                <Icon
                  type="iconButton"
                  name="close"
                  weight="bold"
                  size="xs"
                  color="grey"
                  onClick={handleCloseDrawer}
                  onMouseEnter={handleCloseMouseEnter}
                  onMouseLeave={handleCloseMouseLeave}
                  aria-label="Close menu"
                />
              </div>
              <h6 className="font-normal text-lg gray-gradient1 mt-[2px] select-none">
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
                setCurrentFilters(filters);
              }}
            />
          )}
          {type === "src20" && (
            <FilterContentSRC20
              initialFilters={currentFilters as SRC20Filters}
              onFiltersChange={(filters) => {
                setCurrentFilters(filters);
              }}
            />
          )}
          {/* Add more filter content components for other types as needed */}
        </div>
      </div>
      {/* Sticky buttons */}
      <div className="flex justify-between w-full sticky bottom-0 py-9 tablet:py-6 px-9 tablet:px-6 gap-6
       bg-gradient-to-b from-[#000000]/80 to-[#000000]/100
        shadow-[0_-12px_12px_-6px_rgba(0,0,0,1)]">
        <Button
          variant="outline"
          color="grey"
          size="mdR"
          onClick={() => {
            isClearingRef.current = true;
            setCurrentFilters(emptyFilters);
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
          size="mdR"
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
