/* ===== ICON COMPONENT ===== */
import {
  BadgeVariants,
  globalSvgAttributes,
  iconStyles,
  IconVariants,
} from "$icon";
import * as iconPaths from "$components/icon/paths.ts";

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
  const getIconStyles = () => {
    if (type === "icon") {
      return iconStyles.icon[color].replace("stroke-1", "");
    } else if (type === "iconButton") {
      return iconStyles.iconButton[color];
    }
    return "";
  };

  const combinedClasses = `${iconStyles.base} ${
    iconStyles.size[size]
  } ${getIconStyles()} ${iconStyles.weight[weight]} ${className}`;

  const commonProps = {
    className: combinedClasses,
    role: role || (type === "iconButton" ? "button" : undefined),
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
      list: "list",
      listAsc: "listAsc",
      listDesc: "listDesc",
      dispenserListings: "listStar", // alias mapping
      sortAsc: "listAsc", // alias mapping
      sortDesc: "listDesc", // alias mapping
      tools: "gear", // alias mapping
      close: "x", // alias mapping
      expand: "plus", // alias mapping
      search: "magnifingGlass", // alias mapping
      filter: "funnel", // alias mapping
      donate: "coinsHand", // alias mapping
      share: "share",
      copy: "copy",
      image: "image",
      images: "images",
      previewImage: "image", // alias mapping
      previewCode: "imageCode", // alias mapping
      previewImageRaw: "imageExternal", // alias mapping
      upload: "image", // alias mapping
      play: "play",
      pause: "pause",
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

    const pathKey = iconName as keyof typeof iconPaths;
    return iconPaths[pathKey] || "";
  };

  const renderPaths = () => {
    const pathData = getIconPath() as string | string[];

    // Handle array of paths
    if (Array.isArray(pathData)) {
      return pathData.map((path, index) => <path key={index} d={path} />);
    }

    // Handle single path
    return <path d={pathData} />;
  };

  /* ===== SVG ELEMENT ===== */
  const svgElement = (
    <svg
      xmlns={globalSvgAttributes.xmlns}
      viewBox={globalSvgAttributes.viewBox}
      strokeLinecap={globalSvgAttributes.strokeLinecap}
      strokeLinejoin={globalSvgAttributes.strokeLinejoin}
      {...commonProps}
    >
      {renderPaths()}
    </svg>
  );

  /* ===== RENDER BASED ON TYPE ===== */
  if (type === "icon") {
    return svgElement;
  }

  if (type === "iconButton") {
    const { href, target, rel } = props;
    return (
      <a href={href} target={target} rel={rel}>
        {svgElement}
      </a>
    );
  }

  // This ensures TypeScript will catch if type is not one of the expected values
  throw new Error(`Invalid icon type: ${type}`);
}

/* ===== SPECIALIZED ICONS ===== */
// Hambirger menu icon is defined in: MenuIcon.tsx - its built with css/html instead of svg for better animation
// Gradient close menu icon is defined in: CloseIcon.tsx
// Animated gear icon code is in: GearIcon.tsx

/* ===== BADGE ICON COMPONENT ===== */
export function BadgeIcon({ text, className = "" }: BadgeVariants) {
  return (
    <span
      className={`
        flex items-center justify-center
        absolute top-[-4px] left-[-12px] z-10
        size-5 rounded-full
        font-bold text-[10px] text-stamp-grey group-hover:text-black tracking-wider
        bg-stamp-purple group-hover:bg-stamp-purple-bright
        transition-all duration-300 cursor-pointer
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
 *
 * FILL-BASED ICONS (Traditional):
 * 1. Add the icon paths to paths.ts as consts using the "Template icon" code - add all three weights
 * - Name the path according to its Figma name or what it depicts
 * - Provide all three weights: light, normal, bold
 * - SVG viewBox should be 32x32
 * - Export path data only, not full SVG element
 * - Icons used on the site are from Figma Phosphor Icon Set
 * - https://www.figma.com/community/file/903830135544202908/phosphor-icons
 *
 * STROKE-BASED ICONS (New):
 * 1. Add the icon paths to paths.ts as a single const (no weight variants)
 * - Export as an array of strings for multiple paths: export const iconName = ["path1", "path2"];
 * - Export as a single string for single path: export const iconName = "path";
 * - Stroke width is controlled by weight prop
 * - Add the icon name to strokeBasedIcons array in getIconPath()
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
 * // Icon with stroke-width control
 * <Icon
 *   type="icon"
 *   name="images"
 *   weight="bold"
 *   size="md"
 *   color="purple"
 * />
 *
 * // Icon as a button/link
 * <Icon
 *   type="iconButton"
 *   name="twitter"
 *   weight="light"
 *   size="md"
 *   color="purple"
 *   href="https://twitter.com"
 *   target="_blank"
 *   ariaLabel="Connect with us on Twitter"
 * />
 *
 * // Icon with custom styling
 * <Icon
 *   type="icon"
 *   name="close"
 *   weight="bold"
 *   size="lg"
 *   color="custom"
 *   className="stroke-red-500 hover:stroke-green-500"
 *   onClick={() => handleClose()}
 *   ariaLabel="Close Dialog"
 * />
 */
