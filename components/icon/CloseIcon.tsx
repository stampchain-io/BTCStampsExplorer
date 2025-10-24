/* ===== CLOSE ICON COMPONENT ===== */
import { Icon } from "$icon";
import type { CloseIconProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function CloseIcon({
  onClick,
  weight = "normal",
  size = "md",
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
  const colorClasses = color === "greyLight"
    ? `stroke-[url(#greyLight)] hover:stroke-color-grey-light transform transition-colors duration-200`
    : color === "purpleLight"
    ? `stroke-[url(#purpleLight)] hover:stroke-color-purple-light transform transition-colors duration-200`
    : "";

  /* ===== RENDER ICON ===== */
  return (
    <>
      <svg width="0" height="0">
        <defs>
          {color === "greyLight" && (
            <linearGradient
              id="greyLight"
              gradientTransform="rotate(45)"
            >
              <stop offset="0%" stop-color="var(--color-grey-semidark)" />
              <stop offset="40%" stop-color="var(--color-grey)" />
              <stop offset="70%" stop-color="var(--color-grey)" />
              <stop offset="100%" stop-color="var(--color-grey-semilight)" />
            </linearGradient>
          )}
          {color === "purpleLight" && (
            <linearGradient
              id="purpleLight"
              gradientTransform="rotate(130)"
            >
              <stop offset="0%" stop-color="var(--color-purple-light)" />
              <stop offset="40%" stop-color="var(--color-purple-semilight)" />
              <stop offset="70%" stop-color="var(--color-purple-semilight)" />
              <stop offset="100%" stop-color="var(--color-purple)" />
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
        {...(onMouseEnter && { onMouseEnter })}
        {...(onMouseLeave && { onMouseLeave })}
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
 *   color="greyLight"
 *   onClick={() => handleClose()}
 * />
 *
 * // Purple gradient close icon
 * <CloseIcon
 *   size="md"
 *   weight="bold"
 *   color="purpleLight"
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
 *   color="greyLight"
 *   onClick={handleClose}
 *   className="ml-2"
 * />
 */
