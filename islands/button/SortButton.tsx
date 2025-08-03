import { Icon } from "$components/icon/IconBase.tsx";
import type { SortProps } from "$types/ui.d.ts";
import { tooltipIcon } from "$notification";
import { useEffect, useRef, useState } from "preact/hooks";

export function SortButton(
  { searchParams, initSort, sortParam = "sortBy" }: SortProps,
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

  // Helper function to determine the anchor based on sort parameter
  const getSectionAnchor = (sortParam: string): string => {
    switch (sortParam) {
      case "stampsSortBy":
        return "stamps";
      case "src20SortBy":
        return "src20";
      case "dispensersSortBy":
        return "dispensers";
      default:
        return "stamps";
    }
  };

  // Generate the sort URL for Fresh.js partial navigation
  const getSortUrl = (): string => {
    // Check if we're in a browser environment
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return "/"; // Fallback URL during SSR
    }

    const url = new URL(globalThis.location.href);
    const currentSort = url.searchParams.get(sortParam) || "DESC";
    const newSort = currentSort === "ASC" ? "DESC" : "ASC";

    url.searchParams.set(sortParam, newSort);
    url.searchParams.set("anchor", getSectionAnchor(sortParam));

    return url.toString();
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
    <div class="relative">
      <a
        href={getSortUrl()}
        f-partial={getSortUrl()}
        class="inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Icon
          type="iconButton"
          name={sort === "DESC" ? "sortAsc" : "sortDesc"}
          weight="bold"
          size="custom"
          color="purple"
          className="mt-[4px] tablet:mt-[5px] w-[28px] h-[28px] tablet:w-[25px] tablet:h-[25px] transform transition-all duration-300"
          ariaLabel={`Sort ${sort === "DESC" ? "ascending" : "descending"}`}
        />
      </a>
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
