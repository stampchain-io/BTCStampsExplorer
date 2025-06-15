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
  const combinedClasses = `${iconStyles.base} ${iconStyles.size[size]} ${
    type === "icon"
      ? iconStyles.icon[color].replace("stroke-1", "")
      : iconStyles.iconButton[color]
  } ${iconStyles.weight[weight]} group ${className}`;

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
      // Social Media Icons
      twitter: "twitter",
      telegram: "telegram",
      github: "github",
      discord: "discord",
      instagram: "instagram",
      website: "globe",
      email: "envelope",
      // List Icons
      list: "list",
      listAsc: "listAsc",
      listDesc: "listDesc",
      dispenserListings: "listStar",
      sortAsc: "listAsc",
      sortDesc: "listDesc",
      // Tools Icons
      tools: "gear",
      close: "x",
      expand: "plus",
      search: "magnifingGlass",
      filter: "funnel",
      share: "share",
      copy: "copy",
      // Image Icons
      image: "image",
      images: "images",
      previewImage: "image",
      previewCode: "imageCode",
      previewImageRaw: "imageOut",
      externalImage: "imageOut",
      uploadImage: "image",
      collection: "images",
      // Coins Icons
      coins: "coins",
      send: "coinsOut",
      receive: "coinsIn",
      donate: "coinsHand",
      // Media Icons
      play: "play",
      pause: "pause",
      // Security Icons
      locked: "lockClosed",
      unlocked: "lockOpen",
      // Caret Icons
      caretUp: "caretUp",
      caretDown: "caretDown",
      caretLeft: "caretLeft",
      caretRight: "caretRight",
      caretDoubleLeft: "caretDoubleLeft",
      caretDoubleRight: "caretDoubleRight",
      // Misc Icons
      keyburned: "flame",
      divisible: "percent",
      atom: "atom",
      history: "clockCounterClockwise",
      pageOut: "pageOut",
      pageIn: "pageIn",
      cornersOut: "cornersOut",
      cornersIn: "cornersIn",
      template: "template", // alias mappings
    };

    const iconName = iconNameMap[name as keyof typeof iconNameMap];
    return iconName ? iconPaths[iconName as keyof typeof iconPaths] || "" : "";
  };

  const renderPaths = () => {
    const pathData = getIconPath() as
      | string
      | string[]
      | (string | { path: string; style: string })[];

    // Handle array of paths - can include path objects with custom styles
    if (Array.isArray(pathData)) {
      return pathData.map((pathItem, index) => {
        // Handle path object with custom styling
        if (typeof pathItem === "object" && pathItem.path && pathItem.style) {
          // Extract stroke colors and convert to fill
          const iconStyleClass = iconStyles[type][color];
          const baseStroke = iconStyleClass.match(/(?:^|\s)(stroke-[a-z0-9-]+)/)
            ?.[1];
          const hoverStroke = iconStyleClass.match(
            /group-hover:(stroke-[a-z0-9-]+)/,
          )?.[1];

          const fillColor = [
            baseStroke?.replace("stroke-", "fill-"),
            hoverStroke &&
            `group-hover:${hoverStroke.replace("stroke-", "fill-")}`,
          ].filter(Boolean).join(" ");

          return (
            <path
              key={index}
              d={pathItem.path}
              className={`${pathItem.style} ${fillColor}`}
            />
          );
        }
        // Handle regular string path
        return <path key={index} d={pathItem as string} />;
      });
    }

    // Handle single path
    return <path d={pathData as string} />;
  };

  /* ===== SVG ELEMENT ===== */
  const svgElement = (
    <svg {...commonProps} {...globalSvgAttributes}>
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
