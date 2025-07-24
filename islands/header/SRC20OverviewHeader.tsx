/* ===== SRC20 HEADER COMPONENT ===== */
/* @baba - update search button styling */
import { Button } from "$components/button/ButtonBase.tsx";
import { SegmentControl } from "$islands/layout/SegmentControl.tsx";
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { useCallback, useMemo, useState } from "preact/hooks";

/* ===== TYPES ===== */
interface SRC20OverviewHeaderProps {
  onViewTypeChange?: () => void;
  viewType: "minted" | "minting";
  onTimeframeChange?: (timeframe: string) => void;
  onFilterChange?: (filter: string, direction?: "asc" | "desc") => void;
  currentSort?: {
    filter: string | null;
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
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24H");
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

  const handleTimeframeClick = useCallback(
    (timeframe: string) => {
      setSelectedTimeframe(timeframe);
      onTimeframeChange?.(timeframe);
    },
    [onTimeframeChange],
  );

  const handleTrendingClick = useCallback(() => {
    const currentFilter = currentSort?.filter || "TRENDING";
    const newFilter = currentFilter === "TRENDING" ? "DEPLOY" : "TRENDING";
    const newDirection = newFilter === "DEPLOY" ? "asc" : "desc";
    onFilterChange?.(newFilter, newDirection);
  }, [onFilterChange, currentSort?.filter]);

  // 🚀 PREACT OPTIMIZATION: Memoized variant getters
  const getTrendingVariant = useCallback(() => {
    return currentSort?.filter === "TRENDING"
      ? "flatOutlineSelector"
      : "outlineFlatSelector";
  }, [currentSort?.filter]);

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
          <div class="flex">
            <SearchSRC20Modal showButton />
          </div>
        </div>
      </div>

      {/* ===== TRENDING, MINTED/MINTING AND TIMEFRAME BUTTONS ===== */}
      <div class="flex flex-col mobileLg:flex-row justify-between w-full">
        {/* Minting/Minted/Listings */}
        <div class="flex gap-3 w-full mobileMd:w-auto">
          <SegmentControl
            options={[
              { value: "minted", label: "MINTED" },
              { value: "minting", label: "MINTING" },
              { value: "listings", label: "LISTINGS", disabled: true },
            ]}
            value={viewType}
            onChange={() => handleViewTypeClick()}
            size="sm"
            color="purple"
            className="w-full mobileMd:w-auto"
          />
        </div>

        {/* Trending and Timeframes - Right */}
        <div class="flex justify-between pt-3 mobileLg:pt-0 gap-3">
          {/* Trending Button */}
          <Button
            variant={getTrendingVariant()}
            color="custom"
            size="xs"
            onClick={handleTrendingClick}
            class={`
              ${currentSort?.filter === "TRENDING" ? "cursor-default" : ""}
              [--default-color:#333333]
              [--hover-color:#666666]
              mt-[2px]
            `}
          >
            TRENDING
          </Button>

          {/* Timeframe Buttons */}
          <SegmentControl
            options={[
              { value: "24H", label: "24H" },
              { value: "7D", label: "7D" },
              { value: "30D", label: "30D" },
            ]}
            value={selectedTimeframe}
            onChange={handleTimeframeClick}
            size="sm"
            color="grey"
          />
        </div>
      </div>
    </div>
  );
};
