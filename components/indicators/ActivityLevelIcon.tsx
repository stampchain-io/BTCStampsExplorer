/* ===== ACTIVITY LEVEL ICON COMPONENT ===== */
import { bitcoinGraph } from "$components/icon/paths.ts";
import { containerPill } from "$layout";
import { tooltipButton } from "$notification";
import type { ActivityLevelIndicatorProps } from "$types/ui.d.ts";
import { VNode } from "preact";
import { useRef, useState } from "preact/hooks";

/**
 * Icon variant of ActivityLevelIndicator — renders the bitcoinGraph icon
 * instead of dots. Path colors match ActivityLevelIndicator's dot scale.
 * path[0] = 30d, path[1] = 7d, path[2] = 24h.
 * Paths are cumulative — HOT lights all three, WARM lights two, COOL lights one.
 * DORMANT shows the icon with all-neutral paths.
 * path[3] is the bitcoin symbol — always displayed, colored the same as the
 * highest active tier: path[0] for COOL (30d), path[1] for WARM (7d), path[2]
 * for HOT (24h).
 * COLD shows "none" text with no icon.
 */
const STROKE_ON = [
  "stroke-color-secondary-300",
  "stroke-color-secondary-400",
  "stroke-color-secondary-500",
] as const;
const STROKE_OFF = "stroke-color-neutral-600";

const TOOLTIP_LABEL: Record<string, string> = {
  HOT: "24H SALES",
  WARM: "7D SALES",
  COOL: "30D SALES",
  DORMANT: "NO SALES",
  COLD: "NO DISPENSERS",
};

const STROKES_BY_LEVEL: Record<string, [string, string, string]> = {
  HOT: [STROKE_ON[0], STROKE_ON[1], STROKE_ON[2]],
  WARM: [STROKE_ON[0], STROKE_ON[1], STROKE_OFF],
  COOL: [STROKE_ON[0], STROKE_OFF, STROKE_OFF],
  DORMANT: [STROKE_OFF, STROKE_OFF, STROKE_OFF],
};

// Bitcoin symbol path mirrors the highest active tier's color.
const LAST_PATH_STROKE_BY_LEVEL: Record<string, string> = {
  HOT: STROKE_ON[2],
  WARM: STROKE_ON[1],
  COOL: STROKE_ON[0],
  DORMANT: STROKE_OFF,
};

export function ActivityLevelIcon({
  level,
  className = "",
}: ActivityLevelIndicatorProps): VNode<any> | null {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const tooltipTimeoutRef = useRef<number | null>(null);

  if (!level) return null;

  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsTooltipVisible(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
  };

  const isCold = level === "COLD";
  const strokes = STROKES_BY_LEVEL[level] ??
    [STROKE_OFF, STROKE_OFF, STROKE_OFF];
  const lastPathStroke = LAST_PATH_STROKE_BY_LEVEL[level] ?? STROKE_OFF;

  return (
    <div class={`relative w-fit ${className}`}>
      <div
        className={containerPill}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isCold
          ? (
            <span className="text-[10px] text-color-neutral-600 tracking-wide select-none">
              none
            </span>
          )
          : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke-linecap="round"
              stroke-linejoin="round"
              fill="none"
              className="w-4 h-4 [stroke-width:1.5]"
            >
              <path d={bitcoinGraph[0]} className={strokes[0]} />
              <path d={bitcoinGraph[1]} className={strokes[1]} />
              <path d={bitcoinGraph[2]} className={strokes[2]} />
              <path d={bitcoinGraph[3]} className={lastPathStroke} />
            </svg>
          )}
      </div>
      <div
        className={`${tooltipButton} transition-opacity duration-150 ${
          isTooltipVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {TOOLTIP_LABEL[level] ?? level}
      </div>
    </div>
  );
}
