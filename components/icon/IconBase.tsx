/* ===== ICON COMPONENT ===== */
import {
  BadgeVariants,
  globalSvgAttributes,
  iconStyles,
  IconVariants,
  strokeWidthMap,
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
    if (
      name === "image2" || name === "imageExternal" || name === "twitter2" ||
      name === "copy2" || name === "share2" || name === "pageExternal"
    ) {
      if (type === "strokeIcon" || type === "icon") {
        return iconStyles.strokeIcon[color].replace("stroke-1", "");
      } else if (type === "strokeIconLink" || type === "iconLink") {
        return iconStyles.strokeIconLink[color];
      } else if (type === "strokeIconButton" || type === "iconButton") {
        return iconStyles.strokeIconButton[color];
      }
    }
    return iconStyles[type][color];
  };

  const strokeWidthClass =
    (name === "image2" || name === "imageExternal" || name === "twitter2" ||
        name === "copy2" || name === "share2" || name === "pageExternal")
      ? iconStyles.strokeWidth[weight]
      : "";

  const combinedClasses = `${iconStyles.base} ${
    iconStyles.size[size]
  } ${getIconStyles()} ${strokeWidthClass} ${className}`;

  const commonProps = {
    className: combinedClasses,
    role,
    "aria-label": ariaLabel || name,
    onClick,
    style:
      (name === "image2" || name === "imageExternal" || name === "twitter2" ||
          name === "copy2" || name === "share2" || name === "pageExternal")
        ? {
          "--stroke-width-light": strokeWidthMap.light,
          "--stroke-width-normal": strokeWidthMap.normal,
          "--stroke-width-bold": strokeWidthMap.bold,
        }
        : {},
    ...rest,
  };

  /* ===== HELPERS ===== */
  const getIconPath = () => {
    // Map icon names to their path names
    const iconNameMap = {
      twitter: "twitter",
      twitter2: "twitter2",
      telegram: "telegram",
      github: "github",
      discord: "discord",
      instagram: "instagram",
      website: "globe", // alias mapping
      tools: "gear", // alias mapping
      close: "x", // alias mapping
      expand: "plus", // alias mapping
      search: "magnifingGlass", // alias mapping
      donate: "handcoins", // alias mapping
      dispenserListings: "listStar",
      share: "share",
      share2: "share2",
      copy: "copy",
      copy2: "copy2",
      upload: "image", // alias mapping
      image: "image",
      image2: "image2",
      imageExternal: "imageExternal",
      linkOut: "linkOut",
      fullscreen: "cornersOut", // alias mapping - change to previewImage
      previewCode: "code", // alias mapping
      play: "play",
      pause: "pause",
      locked: "lockClosed", // alias mapping
      unlocked: "lockOpen", // alias mapping
      keyburned: "flame", // alias mapping
      filter: "funnel", // alias mapping
      divisible: "percent", // alias mapping
      sortAsc: "sortAsc",
      sortDesc: "sortDesc",
      caretUp: "caretUp",
      caretDown: "caretDown",
      caretLeft: "caretLeft",
      caretRight: "caretRight",
      caretDoubleLeft: "caretDoubleLeft",
      caretDoubleRight: "caretDoubleRight",
      template: "template",
      pageExternal: "pageExternal",
    };

    const iconName = iconNameMap[name as keyof typeof iconNameMap] || "";
    if (!iconName) return "";

    // Special handling for stroke-based icons (single variant)
    if (
      iconName === "image2" || iconName === "imageExternal" ||
      iconName === "twitter2" || iconName === "copy2" ||
      iconName === "share2" ||
      iconName === "pageExternal"
    ) {
      const pathKey = iconName as keyof typeof iconPaths;
      return iconPaths[pathKey] || "";
    }

    // For fill-based icons, use weight variants
    const pathKey = `${iconName}${weight.charAt(0).toUpperCase()}${
      weight.slice(1)
    }` as keyof typeof iconPaths;
    return iconPaths[pathKey] || "";
  };

  const renderPaths = () => {
    const pathData = getIconPath() as string | string[];

    // Handle array of paths (for image2 with multiple paths)
    if (Array.isArray(pathData)) {
      return pathData.map((path, index) => <path key={index} d={path} />);
    }

    // Handle single path - special case for stroke-based icons
    if (
      name === "image2" || name === "imageExternal" || name === "twitter2" ||
      name === "copy2" || name === "share2" || name === "pageExternal"
    ) {
      return <path d={pathData} />;
    }

    // Default fill-based icon
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
  if (type === "icon" || type === "strokeIcon") {
    return svgElement;
  }

  if (type === "iconLink" || type === "strokeIconLink") {
    const { href, target, rel } = props;
    return (
      <a href={href} target={target} rel={rel}>
        {svgElement}
      </a>
    );
  }

  if (type === "iconButton" || type === "strokeIconButton") {
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
 * - Stroke width is controlled by strokeWidthMap (light=1, normal=2, bold=3)
 * - Add the icon name to strokeBasedIcons array in getIconPath()
 *
 * 2. Add the icon name to getIconPath() - iconNameMap function copying the "template" code
 * - Initial name (eg: "website") defines the icon name and default aria label, and the icon type to be assigned the icon when inserting it
 * - Secondary name (eg: "globe") is used to map the icon name to the correct path name
 * - A custom aria-label can be added when inserting the icon, see the examples below
 *
 * @example
 * // Basic fill-based icon usage
 * <Icon
 *   type="icon"
 *   name="twitter"
 *   weight="light"
 *   size="sm"
 *   color="grey"
 * />
 *
 * // Stroke-based icon usage (weight controls stroke-width)
 * <Icon
 *   type="icon"
 *   name="image2"
 *   weight="bold"
 *   size="md"
 *   color="purple"
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
 */
