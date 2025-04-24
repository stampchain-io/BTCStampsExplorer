/* ===== SRC20 HEADER COMPONENT ===== */
import { useState } from "preact/hooks";
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { Button } from "$components/button/ButtonBase.tsx";

/* ===== TYPES ===== */
interface SRC20OverviewHeaderProps {
  onViewTypeChange?: () => void;
  viewType: "minted" | "minting";
  onTimeframeChange?: (timeframe: "24H" | "3D" | "7D") => void;
}

/* ===== COMPONENT ===== */
export const SRC20OverviewHeader = (
  { onViewTypeChange, viewType, onTimeframeChange }: SRC20OverviewHeaderProps,
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
  const [selectedFilter, setSelectedFilter] = useState<
    "DEPLOY" | "HOLDERS" | null
  >("DEPLOY");

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

    // Reset filter to default (DEPLOY)
    setFilterHover({ canHoverSelected: true, allowHover: true });
    setSelectedFilter("DEPLOY");

    // Reset timeframe to default (24H)
    setTimeframeHover({ canHoverSelected: true, allowHover: true });
    setSelectedTimeframe("24H");
    onTimeframeChange?.("24H");

    // Call the view change handler
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

  const handleFilterClick = (filter: "DEPLOY" | "HOLDERS") => {
    setFilterHover({ canHoverSelected: false, allowHover: false });
    setSelectedFilter(selectedFilter === filter ? null : filter);
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
      return timeframeHover.canHoverSelected ? "flatOutline" : "outlineFlat";
    }
    return "outlineFlat";
  };

  const getFilterVariant = (filter: "DEPLOY" | "HOLDERS") => {
    if (filter === selectedFilter) {
      return filterHover.canHoverSelected ? "flatOutline" : "outlineFlat";
    }
    return "outlineFlat";
  };

  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-col w-full gap-3">
      <div class="flex flex-row justify-between items-start w-full">
        {/* ===== RESPONSIVE TITLE ===== */}
        <h1 className={`${titlePurpleLD} block mobileLg:hidden`}>TOKENS</h1>
        <h1 className={`${titlePurpleLD} hidden mobileLg:block`}>
          SRC-20 TOKENS
        </h1>

        {/* ===== CONTROLS SECTION ===== */}
        <div className="flex flex-col">
          <div className="flex relative items-start justify-between gap-4 tablet:gap-3">
            <SearchSRC20Modal showButton={true} />
            <Button
              variant={viewType === "minting"
                ? mintingHover.canHoverSelected ? "flatOutline" : "outlineFlat"
                : mintingHover.canHoverSelected
                ? "outlineFlat"
                : "flatOutline"}
              color="purple"
              size="sm"
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
      <div className="flex justify-between w-full">
        {/* Filter Buttons */}
        <div className="flex gap-4 tablet:gap-3">
          {(["DEPLOY", "HOLDERS"] as const).map((filter) => (
            <Button
              key={filter}
              variant={getFilterVariant(filter)}
              color="greyDark"
              size="xs"
              onClick={() => handleFilterClick(filter)}
              onMouseEnter={handleFilterMouseEnter}
              onMouseLeave={handleFilterMouseLeave}
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Timeframe Buttons */}
        <div className="flex gap-4 tablet:gap-3">
          {(["24H", "3D", "7D"] as const).map((timeframe) => (
            <Button
              key={timeframe}
              variant={getTimeframeVariant(timeframe)}
              color="greyDark"
              size="xs"
              onClick={() => handleTimeframeClick(timeframe)}
              onMouseEnter={handleTimeframeMouseEnter}
              onMouseLeave={handleTimeframeMouseLeave}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
