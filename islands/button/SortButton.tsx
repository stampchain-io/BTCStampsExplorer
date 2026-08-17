import { Icon } from "$icon";
import { useSSRSafeNavigation } from "$lib/hooks/useSSRSafeNavigation.ts";
import { tooltipIcon } from "$notification";
import type { SortProps } from "$types/ui.d.ts";
import { useEffect, useRef, useState } from "preact/hooks";

export function SortButton(
  { searchParams, initSort, sortParam = "sortBy" }: SortProps,
) {
  const { getSearchParam, isClient, getUrl } = useSSRSafeNavigation();

  // Initialize sort based on URL parameter or initSort prop
  const sort = (() => {
    // Use initSort prop if provided
    if (initSort) {
      return initSort;
    }
    // Use SSR-safe navigation for client-side URL parameters
    if (isClient) {
      const currentSort = getSearchParam(sortParam);
      return currentSort === "ASC" ? "ASC" : "DESC";
    }
    // Fallback to server-side searchParams during SSR
    return searchParams?.get(sortParam) === "ASC" ? "ASC" : "DESC";
  })();

  // Add tooltip state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

  // Generate the sort URL for Fresh.js partial navigation
  const getSortUrl = (): string => {
    // Get current URL in an SSR-safe way
    const url = new URL(getUrl());
    // Fall back to `initSort` (rather than a hardcoded "DESC") so pages that
    // default to ascending sort still toggle correctly before any `sortBy`
    // param exists in the URL.
    const defaultSort = initSort || "DESC";
    const currentSort = isClient
      ? getSearchParam(sortParam) || defaultSort
      : defaultSort;
    const newSort = currentSort === "ASC" ? "DESC" : "ASC";

    url.searchParams.set(sortParam, newSort);

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
    <div
      class="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon
        type="iconButton"
        name={sort === "DESC" ? "sortDesc" : "sortAsc"}
        weight="bold"
        size="custom"
        color="greyLight"
        className="w-[17px] h-[17px] tablet:w-[14px] tablet:h-[14px] stroke-width:1.5"
        href={getSortUrl()}
        f-partial={getSortUrl()}
        ariaLabel={`Sorted ${sort === "DESC" ? "descending" : "ascending"}`}
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
