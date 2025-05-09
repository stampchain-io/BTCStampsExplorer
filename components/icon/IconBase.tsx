/* ===== ICON COMPONENT ===== */
import { BadgeVariants, iconStyles, IconVariants } from "$icon";
import * as iconPaths from "$icon";

/* ===== COMPONENT ===== */
export function Icon(props: IconVariants) {
  const {
    type,
    name,
    weight,
    size,
    color,
    className = "",
    role,
    ariaLabel,
    onClick,
    ...rest
  } = props;

  /* ===== STYLES ===== */
  const combinedClasses = `${iconStyles.base} ${iconStyles.size[size]} ${
    iconStyles[type][color]
  } ${className}`;

  const commonProps = {
    className: combinedClasses,
    role,
    "aria-label": ariaLabel || name,
    onClick,
    ...rest,
  };

  /* ===== HELPERS ===== */
  const getIconPath = () => {
    // Map icon names to their path names
    const iconNameMap = {
      twitter: "twitter",
      telegram: "telegram",
      github: "github",
      discord: "discord",
      instagram: "instagram",
      website: "globe", // alias mapping
      tools: "gear", // alias mapping
      close: "x", // alias mapping
      expand: "plus", // alias mapping
      donate: "handcoins", // alias mapping
      share: "share",
      copy: "copy",
      upload: "image", // alias mapping
      image: "image",
      fullscreen: "cornersOut", // alias mapping - change to previewImage
      previewCode: "code", // alias mapping
      locked: "lockClosed", // alias mapping
      unlocked: "lockOpen", // alias mapping
      keyburned: "flame", // alias mapping
      divisible: "percent", // alias mapping
      caretUp: "caretUp",
      caretDown: "caretDown",
      caretLeft: "caretLeft",
      caretRight: "caretRight",
      caretDoubleLeft: "caretDoubleLeft",
      caretDoubleRight: "caretDoubleRight",
      template: "template",
    };

    const iconName = iconNameMap[name as keyof typeof iconNameMap] || "";
    if (!iconName) return "";

    const pathKey = `${iconName}${weight.charAt(0).toUpperCase()}${
      weight.slice(1)
    }` as keyof typeof iconPaths;
    return iconPaths[pathKey] || "";
  };

  /* ===== SVG ELEMENT ===== */
  const svgElement = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      {...commonProps}
    >
      <path d={getIconPath()} />
    </svg>
  );

  /* ===== RENDER BASED ON TYPE ===== */
  if (type === "icon") {
    return svgElement;
  }

  if (type === "iconLink") {
    const { href, target, rel } = props;
    return (
      <a href={href} target={target} rel={rel}>
        {svgElement}
      </a>
    );
  }

  if (type === "iconButton") {
    return (
      <button type="button" onClick={onClick}>
        {svgElement}
      </button>
    );
  }

  // This ensures TypeScript will catch if type is not one of the expected values
  throw new Error(`Invalid icon type: ${type}`);
}

/* ===== SPECIALIZED ICONS ===== */
// Hambirger menu icon is defined in: MenuIcon.tsx - its built with css/html instead of svg for better animation
// Gradient close menu icon is defined in: CloseIcon.tsx
// Animated gear icon code is in: GearIcon.tsx

/* ===== BADGE ICON COMPONENT - UPDATE WHEN FILTER IS IMPLEMENTED ===== */
export function BadgeIcon({ text, className = "" }: BadgeVariants) {
  return (
    <span
      className={`
        flex items-center justify-center
        absolute top-0 left-0 z-10
        transform -translate-x-1/2 -translate-y-1/2 
        size-6 rounded-full
        font-bold text-xs text-stamp-grey group-hover:text-black tracking-wider
        bg-stamp-purple group-hover:bg-stamp-purple-bright
        transition-all duration-300
        ${text === "0" ? "opacity-0" : "opacity-100"}
        ${className}
      `}
    >
      {text}
    </span>
  );
}

/* ===== ICON COMPONENT DOCUMENTATION ===== */
/**
 * Icon Component
 *
 * How to add a new icon type:
 * 1. Add the icon paths to paths.ts as consts using the "Template icon" code - add all three weights
 * - Name the path according to its Figma name or what it depicts
 *
 * SVG Path Requirements:
 * - Provide all three weights: light, normal, bold
 * - SVG viewBox should be 32x32
 * - Export path data only, not full SVG element
 * - Icons used on the site are from Figma Phosphor Icon Set
 * - https://www.figma.com/community/file/903830135544202908/phosphor-icons
 *
 * 2. Add the icon name to getIconPath() - iconNameMap function copying the "template" code
 * - Initial name (eg: "website") defines the icon name and default aria label, and the icon type to be assigned the icon when inserting it
 * - Secondary name (eg: "globe") is used to map the icon name to the correct path name
 * - A custom aria-label can be added when inserting the icon, see the examples below

 *
 * @example
 * // Basic icon usage
 * <Icon
 *   type="icon"
 *   name="twitter"
 *   weight="light"
 *   size="sm"
 *   color="grey"
 * />
 *
 * // Icon as a link
 * <Icon
 *   type="iconLink"
 *   name="twitter"
 *   weight="light"
 *   size="md"
 *   color="purple"
 *   href="https://twitter.com"
 *   target="_blank"
 *   ariaLabel="Connect with us on Twitter"
 * />
 *
 * // Icon as a button with custom color
 * <Icon
 *   type="iconButton"
 *   name="close"
 *   weight="bold"
 *   size="lg"
 *   color="custom"
 *   className="fill-red-500 hover:fill-green-500"
 *   onClick={() => handleClose()}
 *   ariaLabel="Close Dialog"
 * />
 *
 */
