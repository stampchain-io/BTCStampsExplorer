/* ===== SRC20 HEADER COMPONENT ===== */
/* @baba - update search button styling */
import { useState } from "preact/hooks";
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { Button } from "$components/button/ButtonBase.tsx";

/* ===== TYPES ===== */
interface SRC20OverviewHeaderProps {
  onViewTypeChange?: () => void;
  viewType: "minted" | "minting";
  onTimeframeChange?: (timeframe: "24H" | "3D" | "7D") => void;
  onFilterChange?: (
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null,
    direction: "asc" | "desc",
  ) => void;
  currentSort?: {
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null;
    direction: "asc" | "desc";
  };
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
  // Separate hover states for each group
  const [mintingHover, setMintingHover] = useState({
    canHoverSelected: true,
    allowHover: true,
  });

  const [filterHover, setFilterHover] = useState({
    canHoverSelected: true,
    allowHover: true,
  });

  const [timeframeHover, setTimeframeHover] = useState({
    canHoverSelected: true,
    allowHover: true,
  });

  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "24H" | "3D" | "7D"
  >("24H");

  // Add sort state

  // Separate handlers for each group
  const handleMintingMouseEnter = () => {
    if (mintingHover.allowHover) {
      setMintingHover((prev) => ({ ...prev, canHoverSelected: true }));
    }
  };

  const handleMintingMouseLeave = () => {
    setMintingHover({ canHoverSelected: true, allowHover: true });
  };

  const handleMintingClick = () => {
    // Update minting hover state
    setMintingHover({ canHoverSelected: false, allowHover: false });

    // Reset filter hover state
    setFilterHover({ canHoverSelected: false, allowHover: true });

    // Reset timeframe to default (24H)
    setTimeframeHover({ canHoverSelected: true, allowHover: true });
    setSelectedTimeframe("24H");
    onTimeframeChange?.("24H");
    onViewTypeChange?.();
  };

  const handleFilterMouseEnter = () => {
    if (filterHover.allowHover) {
      setFilterHover((prev) => ({ ...prev, canHoverSelected: true }));
    }
  };

  const handleFilterMouseLeave = () => {
    setFilterHover({ canHoverSelected: true, allowHover: true });
  };

  const handleFilterClick = (filter: "TRENDING" | "DEPLOY" | "HOLDERS") => {
    setFilterHover({ canHoverSelected: false, allowHover: false });

    // Toggle sort direction if same filter clicked
    if (currentSort?.filter === filter) {
      const newDirection = currentSort.direction === "desc" ? "asc" : "desc";
      onFilterChange?.(filter, newDirection);
    } else {
      // New filter selected, default to desc
      onFilterChange?.(filter, "desc");
    }
  };

  const handleTimeframeMouseEnter = () => {
    if (timeframeHover.allowHover) {
      setTimeframeHover((prev) => ({ ...prev, canHoverSelected: true }));
    }
  };

  const handleTimeframeMouseLeave = () => {
    setTimeframeHover({ canHoverSelected: true, allowHover: true });
  };

  const handleTimeframeClick = (timeframe: "24H" | "3D" | "7D") => {
    setTimeframeHover({ canHoverSelected: false, allowHover: false });
    setSelectedTimeframe(timeframe);
    onTimeframeChange?.(timeframe);
  };

  const getTimeframeVariant = (timeframe: "24H" | "3D" | "7D") => {
    if (timeframe === selectedTimeframe) {
      return "flatOutlineSelector";
    }
    return "outlineFlatSelector";
  };

  const getFilterVariant = (filter: "TRENDING" | "DEPLOY" | "HOLDERS") => {
    if (filter === currentSort?.filter) {
      return "flatOutlineSelector";
    }
    return "outlineFlatSelector";
  };

  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-col w-full gap-1.5">
      <div class="flex flex-row justify-between items-start w-full">
        {/* ===== RESPONSIVE TITLE ===== */}
        <h1 className={`${titlePurpleLD} block mobileLg:hidden`}>TOKENS</h1>
        <h1 className={`${titlePurpleLD} hidden mobileLg:block`}>
          SRC-20 TOKENS
        </h1>

        {/* ===== CONTROLS SECTION ===== */}
        <div className="flex flex-col">
          <div className="flex relative items-start justify-between gap-4 tablet:gap-3">
            <SearchSRC20Modal showButton />
            <Button
              variant={viewType === "minting"
                ? mintingHover.canHoverSelected ? "flatOutline" : "outlineFlat"
                : mintingHover.canHoverSelected
                ? "outlineFlat"
                : "flatOutline"}
              color="purple"
              size="xs"
              class="mt-0.5"
              onClick={handleMintingClick}
              onMouseEnter={handleMintingMouseEnter}
              onMouseLeave={handleMintingMouseLeave}
            >
              MINTING
            </Button>
          </div>
        </div>
      </div>

      {/* ===== FILTER AND TIMEFRAME BUTTONS ===== */}
      <div className="flex flex-col tablet:flex-row justify-between w-full">
        {/* Filter Buttons */}
        <div className="flex gap-3">
          {(["TRENDING", "DEPLOY", "HOLDERS"] as const).map((filter) => (
            <Button
              key={filter}
              variant={getFilterVariant(filter)}
              color="purpleDark"
              size="xs"
              onClick={() => handleFilterClick(filter)}
              onMouseEnter={handleFilterMouseEnter}
              onMouseLeave={handleFilterMouseLeave}
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
                  <div className="relative">
                    <span
                      className={`transition-opacity duration-150 ${
                        filter === currentSort?.filter
                          ? "group-hover:opacity-0"
                          : ""
                      }`}
                    >
                      {filter}
                    </span>
                    {filter === currentSort?.filter && (
                      <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        SORT
                      </span>
                    )}
                  </div>
                )
                : filter}
            </Button>
          ))}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex pt-3 tablet:pt-0 gap-3">
          {(["24H", "3D", "7D"] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={getTimeframeVariant(timeframe)}
              color="purpleDark"
              size="xs"
              onClick={() => handleTimeframeClick(timeframe)}
              onMouseEnter={handleTimeframeMouseEnter}
              onMouseLeave={handleTimeframeMouseLeave}
              class={timeframe === selectedTimeframe ? "cursor-default" : ""}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
