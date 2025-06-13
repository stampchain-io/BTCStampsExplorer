import { useEffect, useRef, useState } from "preact/hooks";
import { Icon } from "$components/icon/IconBase.tsx";
import { tooltipIcon } from "$notification";

interface SortProps {
  searchParams?: URLSearchParams | undefined;
  initSort?: "ASC" | "DESC" | undefined;
  sortParam?: string;
  onChangeSort?: (newSort: "ASC" | "DESC") => void;
}

export function SortButton(
  { searchParams, initSort, sortParam = "sortBy", onChangeSort }: SortProps,
) {
  // Initialize sort based on URL parameter or initSort prop
  const sort = (() => {
    // Use initSort prop if provided
    if (initSort) {
      return initSort;
    }
    // Otherwise use the current URL if available, or fallback to searchParams
    if (typeof globalThis !== "undefined" && globalThis?.location) {
      const currentSort = new URL(globalThis.location.href)
        .searchParams.get(sortParam);
      return currentSort === "ASC" ? "ASC" : "DESC";
    }
    return searchParams?.get(sortParam) === "ASC" ? "ASC" : "DESC";
  })();

  // Add tooltip state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const handleSort = () => {
    const url = new URL(globalThis.location.href);
    const currentSort = url.searchParams.get(sortParam) || "DESC";

    // Toggle between ASC and DESC
    const newSort = currentSort === "ASC" ? "DESC" : "ASC";

    // Don't update state before page reload
    setIsTooltipVisible(false);
    setAllowTooltip(false);

    // Call the onChangeSort callback if provided
    onChangeSort?.(newSort);

    // Update URL and reload page
    url.searchParams.set(sortParam, newSort);
    globalThis.location.href = url.toString();
  };

  // Add tooltip handlers
  const handleMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsTooltipVisible(true);
      }, 1500);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setAllowTooltip(true);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Icon
        type="iconButton"
        name={sort === "DESC" ? "sortAsc" : "sortDesc"}
        weight="bold"
        size="custom"
        color="purple"
        className="mt-[5px] w-[26px] h-[26px] tablet:w-[24px] tablet:h-[24px] transform transition-all duration-300"
        ariaLabel={`Sort ${sort === "DESC" ? "ascending" : "descending"}`}
        onClick={handleSort}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      <div
        className={`${tooltipIcon} ${
          isTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        SORT
      </div>
    </div>
  );
}
