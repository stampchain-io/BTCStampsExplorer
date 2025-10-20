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
  const colorClasses = color === "grey"
    ? `stroke-[url(#grey)] hover:stroke-color-neutral-light transform transition-colors duration-200`
    : color === "purple"
    ? `stroke-[url(#purple)] hover:stroke-color-primary-light transform transition-colors duration-200`
    : "";

  /* ===== RENDER ICON ===== */
  return (
    <>
      <svg width="0" height="0">
        <defs>
          {color === "grey" && (
            <linearGradient
              id="grey"
              gradientTransform="rotate(45)"
            >
              <stop offset="0%" stop-color="var(--color-neutral-semidark)" />
              <stop offset="40%" stop-color="var(--color-neutral)" />
              <stop offset="70%" stop-color="var(--color-neutral)" />
              <stop offset="100%" stop-color="var(--color-neutral-semilight)" />
            </linearGradient>
          )}
          {color === "purple" && (
            <linearGradient
              id="purple"
              gradientTransform="rotate(130)"
            >
              <stop offset="0%" stop-color="var(--color-primary-light)" />
              <stop offset="40%" stop-color="var(--color-primary-semilight)" />
              <stop offset="70%" stop-color="var(--color-primary-semilight)" />
              <stop offset="100%" stop-color="var(--color-primary)" />
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
 *   color="grey"
 *   onClick={() => handleClose()}
 * />
 *
 * // Purple gradient close icon
 * <CloseIcon
 *   size="md"
 *   weight="bold"
 *   color="purple"
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
 *   color="grey"
 *   onClick={handleClose}
 *   className="ml-2"
 * />
 */
