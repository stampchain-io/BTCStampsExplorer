/* ===== GEAR ICON COMPONENT ===== */
import { Icon } from "$icons";
import type { IconVariants } from "$icons";

/* ===== COMPONENT INTERFACE ===== */
interface GearIconProps {
  isOpen: boolean;
  onToggle: () => void;
  size: IconVariants["size"];
  weight: IconVariants["weight"];
  color: "greyLogicDL" | "greyLogicLD";
  className?: string;
}

/* ===== COMPONENT IMPLEMENTATION ===== */
export function GearIcon({
  isOpen,
  onToggle,
  weight,
  size,
  color,
  className = "",
}: GearIconProps) {
  /* ===== CLICK HANDLER ===== */
  const handleClick: IconVariants["onClick"] = (e) => {
    const target = e.currentTarget;
    target.style.transition = "all 600ms ease-in-out"; // Gear icon timing and rotation
    target.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
    onToggle();
  };

  /* ===== COLOR CLASSES LOGIC ===== */
  const colorClasses = color === "greyLogicDL"
    ? `${
      isOpen
        ? "fill-stamp-grey-light hover:fill-stamp-grey-darker" // Gear icon color when open
        : "fill-stamp-grey-darker hover:fill-stamp-grey-light" // Gear icon color when closed
    }`
    : color === "greyLogicLD"
    ? `${
      isOpen
        ? "fill-stamp-grey-darker hover:fill-stamp-grey-light" // Gear icon color when open
        : "fill-stamp-grey-light hover:fill-stamp-grey-darker" // Gear icon color when closed
    }`
    : "";

  /* ===== RENDER ICON ===== */
  return (
    <Icon
      type="iconLink"
      name="tools"
      weight={weight}
      size={size}
      color="custom"
      className={`${colorClasses} ${className}`.trim()}
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
