/* ===== CLOSE ICON COMPONENT ===== */
import { Icon } from "$icon";
import type { IconVariants } from "$icon";

/* ===== TYPES ===== */
interface CloseIconProps {
  onClick: (e?: MouseEvent) => void;
  size: IconVariants["size"];
  weight: IconVariants["weight"];
  color: "greyGradient" | "purpleGradient";
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  "aria-label"?: string;
}

/* ===== COMPONENT ===== */
export function CloseIcon({
  onClick,
  weight,
  size,
  color,
  className = "",
  onMouseEnter,
  onMouseLeave,
  "aria-label": ariaLabel,
}: CloseIconProps) {
  /* ===== EVENT HANDLERS ===== */
  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };

  /* ===== STYLES ===== */
  const colorClasses = color === "greyGradient"
    ? `stroke-[url(#greyGradient)] hover:stroke-stamp-grey-light transform transition-colors duration-300`
    : color === "purpleGradient"
    ? `stroke-[url(#purpleGradient)] hover:stroke-stamp-purple-bright transform transition-colors duration-300`
    : "";

  /* ===== RENDER ICON ===== */
  return (
    <>
      <svg width="0" height="0">
        <defs>
          {color === "greyGradient" && (
            <linearGradient
              id="greyGradient"
              gradientTransform="rotate(45)"
            >
              <stop offset="0%" stop-color="#666666" />
              <stop offset="40%" stop-color="#999999" />
              <stop offset="70%" stop-color="#999999" />
              <stop offset="100%" stop-color="#CCCCCC" />
            </linearGradient>
          )}
          {color === "purpleGradient" && (
            <linearGradient
              id="purpleGradient"
              gradientTransform="rotate(130)"
            >
              <stop offset="0%" stop-color="#AA00FF" />
              <stop offset="40%" stop-color="#8800CC" />
              <stop offset="70%" stop-color="#8800CC" />
              <stop offset="100%" stop-color="#660099" />
            </linearGradient>
          )}
        </defs>
      </svg>
      <Icon
        type="iconButton"
        name="close"
        weight={weight}
        size={size}
        color="custom"
        className={`${colorClasses} ${className}`.trim()}
        onClick={handleClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        ariaLabel={ariaLabel || "Close"}
      />
    </>
  );
}

/* ===== CLOSE ICON COMPONENT DOCUMENTATION ===== */
/**
 * CloseIcon Component
 * A customizable close icon with gradient color options
 *
 * @example
 * // Grey gradient close icon
 * <CloseIcon
 *   size="lg"
 *   weight="light"
 *   color="greyGradient"
 *   onClick={() => handleClose()}
 * />
 *
 * // Purple gradient close icon
 * <CloseIcon
 *   size="md"
 *   weight="bold"
 *   color="purpleGradient"
 *   onClick={() => {
 *     if (open) {
 *       closeMenu();
 *     }
 *   }}
 * />
 *
 * // With custom className
 * <CloseIcon
 *   size="lg"
 *   weight="normal"
 *   color="greyGradient"
 *   onClick={handleClose}
 *   className="ml-2"
 * />
 */
