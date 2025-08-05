/* ===== GEAR ICON COMPONENT ===== */
import { Icon } from "$icon";
import type { IconVariants } from "$icon";

/* ===== TYPES ===== */
interface GearIconProps {
  isOpen: boolean;
  onToggle: () => void;
  size: IconVariants["size"];
  weight: IconVariants["weight"];
  color: "greyLogicDL" | "greyLogicLD";
  className?: string;
}

/* ===== COMPONENT ===== */
export function GearIcon({
  isOpen,
  onToggle,
  weight,
  size,
  color,
  className = "",
}: GearIconProps) {
  /* ===== EVENT HANDLERS ===== */
  const handleClick: IconVariants["onClick"] = (e) => {
    const target = e.currentTarget;
    target.style.transition = "all 750ms ease-in-out"; // Gear icon timing - must match the timing of the collapsible section in Header.tsx (delay + duration)
    target.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)"; // Gear icon rotation
    onToggle();
  };

  /* ===== STYLES ===== */
  const colorClasses = color === "greyLogicDL"
    ? `${
      isOpen
        ? "stroke-stamp-grey-light hover:stroke-stamp-grey-darker" // Gear icon color when open
        : "stroke-stamp-grey-darker hover:stroke-stamp-grey-light" // Gear icon color when closed
    }`
    : color === "greyLogicLD"
    ? `${
      isOpen
        ? "stroke-stamp-grey-darker hover:stroke-stamp-grey-light" // Gear icon color when open
        : "stroke-stamp-grey-light hover:stroke-stamp-grey-darker" // Gear icon color when closed
    }`
    : "";

  /* ===== RENDER ICON ===== */
  return (
    <Icon
      type="iconButton"
      name="tools"
      weight={weight}
      size={size}
      color="custom"
      className={`fill-none ${colorClasses} ${className}`
        .trim()}
      onClick={handleClick}
    />
  );
}

/* ===== GEAR ICON COMPONENT DOCUMENTATION ===== */
/**
 * GearIcon Component
 * A rotating gear icon with conditional color logic based on open/closed state
 * Includes smooth rotation animation on click
 *
 * @example
 * // Darker to Lighter logic (default in tools menu)
 * <GearIcon
 *   isOpen={toolsOpen}
 *   onToggle={toggleTools}
 *   size="lg"
 *   weight="normal"
 *   color="greyLogicDL"
 * />
 *
 * // Lighter to Darker logic
 * <GearIcon
 *   isOpen={isOpen}
 *   onToggle={() => setIsOpen(!isOpen)}
 *   size="md"
 *   weight="bold"
 *   color="greyLogicLD"
 * />
 *
 * // With custom className
 * <GearIcon
 *   isOpen={menuOpen}
 *   onToggle={handleMenuToggle}
 *   size="lg"
 *   weight="normal"
 *   color="greyLogicDL"
 *   className="ml-2"
 * />
 *
 * Color Logic Patterns:
 * - greyLogicDL: When open: darker, When closed: light
 * - greyLogicLD: When open: light, When closed: darker
 */
