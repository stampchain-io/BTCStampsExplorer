/* ===== SRC20 HEADER COMPONENT ===== */
/* @baba - update search button styling */
import { Button } from "$components/button/ButtonBase.tsx";
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { useCallback, useMemo, useState } from "preact/hooks";

/* ===== TYPES ===== */
type SortOption =
  | "TRENDING"
  | "DEPLOY"
  | "HOLDERS"
  | "PROGRESS"
  | "MARKET_CAP"
  | "VOLUME";

interface SRC20OverviewHeaderProps {
  onViewTypeChange?: () => void;
  viewType: "minted" | "minting";
  onTimeframeChange?: (timeframe: "24H" | "7D" | "30D") => void;
  onFilterChange?: (
    filter: SortOption | null,
    direction: "asc" | "desc",
  ) => void;
  currentSort?: {
    filter: SortOption | null;
    direction: "asc" | "desc";
  };
}

// 🚀 DENO FRESH 2.3+ OPTIMIZATION: Simplified hover state type
interface HoverState {
  canHover: boolean;
  isHovered: boolean;
}

/* ===== COMPONENT ===== */
export const SRC20OverviewHeader = (
  {
    onViewTypeChange,
    viewType,
    onTimeframeChange,
    onFilterChange,
    currentSort,
  }: SRC20OverviewHeaderProps,
) => {
  // 🚀 SIMPLIFIED STATE: Reduced complexity with modern patterns
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "24H" | "7D" | "30D"
  >("24H");
  const [viewTypeHover, setViewTypeHover] = useState<HoverState>({
    canHover: true,
    isHovered: false,
  });

  // 🚀 DENO FRESH 2.3+ OPTIMIZATION: Memoized button text and variant logic
  const viewTypeButton = useMemo(() => {
    // 🎯 FIXED LOGIC: Button shows what you can switch TO, not current state
    const buttonText = viewType === "minted" ? "MINTING" : "MINTED";
    const isActive = viewType === "minting"; // Active when showing minting view

    type ButtonVariant = "flatOutline" | "outlineFlat";
    const variant: ButtonVariant = isActive ? "flatOutline" : "outlineFlat";

    return {
      text: buttonText,
      variant,
      ariaLabel: `Switch to ${buttonText.toLowerCase()} view`,
    };
  }, [viewType, viewTypeHover.isHovered]);

  // 🚀 PREACT OPTIMIZATION: Memoized handlers
  const handleViewTypeClick = useCallback(() => {
    setViewTypeHover({ canHover: false, isHovered: false });
    // Reset timeframe to default when switching views
    setSelectedTimeframe("24H");
    onTimeframeChange?.("24H");
    onViewTypeChange?.();

    // Re-enable hover after a brief delay
    setTimeout(() => {
      setViewTypeHover({ canHover: true, isHovered: false });
    }, 150);
  }, [onViewTypeChange, onTimeframeChange]);

  const handleViewTypeMouseEnter = useCallback(() => {
    if (viewTypeHover.canHover) {
      setViewTypeHover((prev) => ({ ...prev, isHovered: true }));
    }
  }, [viewTypeHover.canHover]);

  const handleViewTypeMouseLeave = useCallback(() => {
    if (viewTypeHover.canHover) {
      setViewTypeHover((prev) => ({ ...prev, isHovered: false }));
    }
  }, [viewTypeHover.canHover]);

  const handleFilterClick = useCallback(
    (filter: SortOption) => {
      // Toggle sort direction if same filter clicked
      if (currentSort?.filter === filter) {
        const newDirection = currentSort.direction === "desc" ? "asc" : "desc";
        onFilterChange?.(filter, newDirection);
      } else {
        // New filter selected, default to desc
        onFilterChange?.(filter, "desc");
      }
    },
    [currentSort, onFilterChange],
  );

  const handleTimeframeClick = useCallback(
    (timeframe: "24H" | "7D" | "30D") => {
      setSelectedTimeframe(timeframe);
      onTimeframeChange?.(timeframe);
    },
    [onTimeframeChange],
  );

  // 🚀 PREACT OPTIMIZATION: Memoized variant getters
  const getTimeframeVariant = useCallback((timeframe: "24H" | "7D" | "30D") => {
    return timeframe === selectedTimeframe
      ? "flatOutlineSelector"
      : "outlineFlatSelector";
  }, [selectedTimeframe]);

  const getFilterVariant = useCallback(
    (filter: SortOption) => {
      return filter === currentSort?.filter
        ? "flatOutlineSelector"
        : "outlineFlatSelector";
    },
    [currentSort?.filter],
  );

  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-col w-full gap-1.5">
      <div class="flex flex-row justify-between items-start w-full">
        {/* ===== RESPONSIVE TITLE ===== */}
        <h1 class={`${titlePurpleLD} block mobileLg:hidden`}>TOKENS</h1>
        <h1 class={`${titlePurpleLD} hidden mobileLg:block`}>
          SRC-20 TOKENS
        </h1>

        {/* ===== CONTROLS SECTION ===== */}
        <div class="flex flex-col">
          <div class="flex relative items-start justify-between gap-[18px] tablet:gap-3">
            <SearchSRC20Modal showButton />

            {/* 🚀 FIXED: Simplified button with correct text logic and modern patterns */}
            <Button
              variant={viewTypeButton.variant}
              color="purple"
              size="xs"
              class="mt-0.5"
              ariaLabel={viewTypeButton.ariaLabel}
              onClick={handleViewTypeClick}
              onMouseEnter={handleViewTypeMouseEnter}
              onMouseLeave={handleViewTypeMouseLeave}
            >
              {viewTypeButton.text}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== FILTER AND TIMEFRAME BUTTONS ===== */}
      <div class="flex flex-col tablet:flex-row justify-between w-full">
        {/* 🚀 ENHANCED: Comprehensive Sorting Options with Backend API Integration */}
        <div class="flex flex-wrap gap-2 tablet:gap-3">
          {/* Primary Sorting Options */}
          {(["TRENDING", "DEPLOY", "HOLDERS"] as const).map((filter) => (
            <Button
              key={filter}
              variant={getFilterVariant(filter)}
              color="purpleDark"
              size="xs"
              onClick={() => handleFilterClick(filter)}
              class={filter === "DEPLOY"
                ? "relative w-[84px]"
                : filter === "HOLDERS"
                ? "relative w-[94px]"
                : filter === "TRENDING" && filter === currentSort?.filter
                ? "cursor-default"
                : ""}
            >
              {(filter === "HOLDERS" || filter === "DEPLOY")
                ? (
                  <div class="relative">
                    <span
                      class={`transition-opacity duration-150 ${
                        filter === currentSort?.filter
                          ? "group-hover:opacity-0"
                          : ""
                      }`}
                    >
                      {filter}
                    </span>
                    {filter === currentSort?.filter && (
                      <span class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        SORT
                      </span>
                    )}
                  </div>
                )
                : filter}
            </Button>
          ))}

          {/* Progress Sorting - Only for MINTING tokens */}
          {viewType === "minting" && (
            <Button
              variant={getFilterVariant("PROGRESS")}
              color="purpleDark"
              size="xs"
              onClick={() => handleFilterClick("PROGRESS")}
              class="relative w-[94px]"
            >
              <div class="relative">
                <span
                  class={`transition-opacity duration-150 ${
                    "PROGRESS" === currentSort?.filter
                      ? "group-hover:opacity-0"
                      : ""
                  }`}
                >
                  PROGRESS
                </span>
                {"PROGRESS" === currentSort?.filter && (
                  <span class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    SORT
                  </span>
                )}
              </div>
            </Button>
          )}

          {/* Market Data Sorting - Only for MINTED tokens */}
          {viewType === "minted" && (
            <>
              {(["MARKET_CAP", "VOLUME"] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={getFilterVariant(filter)}
                  color="purpleDark"
                  size="xs"
                  onClick={() => handleFilterClick(filter)}
                  class={`relative ${
                    filter === "MARKET_CAP"
                      ? "w-[104px]"
                      : filter === "VOLUME"
                      ? "w-[84px]"
                      : "w-[84px]"
                  }`}
                >
                  <div class="relative">
                    <span
                      class={`transition-opacity duration-150 ${
                        filter === currentSort?.filter
                          ? "group-hover:opacity-0"
                          : ""
                      }`}
                    >
                      {filter === "MARKET_CAP" ? "CAP" : filter}
                    </span>
                    {filter === currentSort?.filter && (
                      <span class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        SORT
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </>
          )}
        </div>

        {/* 🚀 OPTIMIZED: Dynamic Timeframe Buttons - Show only available timeframes for each sort */}
        {(currentSort?.filter === "TRENDING" ||
          currentSort?.filter === "VOLUME") && (
          <div class="flex pt-3 tablet:pt-0 gap-3">
            {/* Available timeframes: 24H, 7D, 30D (API doesn't support 3D) */}
            {(["24H", "7D", "30D"] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={getTimeframeVariant(timeframe)}
                color="purpleDark"
                size="xs"
                onClick={() => handleTimeframeClick(timeframe)}
                class={timeframe === selectedTimeframe ? "cursor-default" : ""}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
