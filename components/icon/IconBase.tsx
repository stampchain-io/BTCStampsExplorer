/* ===== ICON COMPONENT ===== */
import {
  BadgeVariants,
  globalSvgAttributes,
  iconStyles,
  IconVariants,
} from "$icon";
// Only import the icons that are actually used in the codebase
import {
  caretDown,
  caretUp,
  clockCounterClockwise,
  coinsIn,
  coinsOut,
  copy,
  discord,
  envelope,
  eye,
  eyeSlash,
  flame,
  funnel,
  gear,
  github,
  globe,
  image,
  imageCode,
  imageOut,
  images,
  listAsc,
  listDesc,
  listStar,
  lockClosed,
  lockOpen,
  magnifingGlass,
  percent,
  plus,
  share,
  stamp,
  telegram,
  twitter,
  x,
} from "$icon";

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
    // Create icon paths object from selective imports
    const iconPaths = {
      // Social Media
      twitter,
      telegram,
      discord,
      github,
      envelope,
      globe,
      // UI/Tools
      x,
      gear,
      plus,
      funnel,
      magnifingGlass,
      copy,
      share,
      // List Icons
      listAsc,
      listDesc,
      listStar,
      // Images
      image,
      images,
      imageCode,
      imageOut,
      stamp,
      // Coins
      coinsOut,
      coinsIn,
      // Security
      lockClosed,
      lockOpen,
      // Misc
      eye,
      eyeSlash,
      clockCounterClockwise,
      caretUp,
      caretDown,
      percent,
      flame,
    };

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
      profile: "imageProfile",
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
      view: "eye",
      hide: "eyeSlash",
      pageOut: "pageOut",
      pageIn: "pageIn",
      cornersOut: "cornersOut",
      cornersIn: "cornersIn",
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
