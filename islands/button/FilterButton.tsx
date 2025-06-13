import { BadgeIcon, Icon } from "$components/icon/IconBase.tsx";
import { useEffect, useRef, useState } from "preact/hooks";
import { tooltipIcon } from "$notification";

// Define the filter types
export type FilterType = "stamp" | "src20" | "explorer";

export function FilterButton(
  { count, open, setOpen, type = "stamp" }: {
    count: number;
    open: boolean;
    setOpen: (status: boolean) => void;
    type?: FilterType;
  },
) {
  // Define drawer target based on filter type
  const drawerTarget = `drawer-form-${type}`;

  // Add tooltip state
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

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
    <div class="group relative">
      <BadgeIcon text={count !== undefined ? count.toString() : ""} />
      <Icon
        type="iconButton"
        name="filter"
        weight="bold"
        size="custom"
        color="purple"
        className="mt-[6px] w-[23px] h-[23px] tablet:w-[21px] tablet:h-[21px] group-hover:fill-stamp-purple-bright transition-all duration-300"
        onClick={() => {
          setOpen(!open);
          setIsTooltipVisible(false);
          setAllowTooltip(false);
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-drawer-target={drawerTarget}
        data-drawer-show={drawerTarget}
        aria-controls={drawerTarget}
      />
      <div
        className={`${tooltipIcon} ${
          isTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        FILTER
      </div>
    </div>
  );
}
