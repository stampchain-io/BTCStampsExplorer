/* ===== VIEW MODE TOGGLE BUTTON COMPONENT ===== */
import { Icon } from "$icon";
import {
  getCurrentPathname,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import { tooltipIcon } from "$notification";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/* ===== TYPES ===== */
type ViewMode = "cardVertical" | "cardSquare" | "cardRow";

/* ===== COMPONENT ===== */
export function ViewButton(
  { viewMode, paramName = "view" }: {
    viewMode: ViewMode;
    paramName?: string;
  },
) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (typeof globalThis === "undefined" || !globalThis?.location) return;
      const params = new URLSearchParams(globalThis.location.search);
      params.set(paramName, mode);
      safeNavigate(getCurrentPathname() + `?${params.toString()}`);
    },
    [paramName],
  );

  const nextMode: ViewMode = viewMode === "cardVertical"
    ? "cardSquare"
    : viewMode === "cardSquare"
    ? "cardRow"
    : "cardVertical";

  const iconName = viewMode === "cardSquare"
    ? "viewCardSquare"
    : viewMode === "cardRow"
    ? "viewCardRow"
    : "viewCardVertical";

  const ariaLabel = viewMode === "cardVertical"
    ? "Switch to minimal grid view"
    : viewMode === "cardSquare"
    ? "Switch to row view"
    : "Switch to detailed grid view";

  return (
    <div
      class="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon
        type="iconButton"
        name={iconName}
        weight="bold"
        size="custom"
        color="greyLight"
        className="w-[16px] h-[16px] tablet:w-[13px] tablet:h-[13px] stroke-width:1.5"
        onClick={() => handleViewModeChange(nextMode)}
        ariaLabel={ariaLabel}
      />
      <div
        className={`${tooltipIcon} ${
          isTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        VIEW
      </div>
    </div>
  );
}
