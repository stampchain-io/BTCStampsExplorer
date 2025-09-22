/* ===== ICON COMPONENT ===== */
import * as iconPaths from "$components/icon/pathsHugeIcons.ts";
import {
  BadgeVariants,
  globalSvgAttributes,
  iconStyles,
  IconVariants,
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
    colorAccent,
    colorAccentHover,
    isOpen: _isOpen,
    onClick,
    ["f-partial"]: _fPartial,
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
    const iconNameMap = {
      // Social Media Icons
      stampchain: "stampchain",
      twitter: "twitter",
      telegram: "telegram",
      github: "github",
      discord: "discord",
      website: "globe",
      email: "envelope",

      // UI Icons
      menu: "listMenu",
      close: "x",
      expand: "plus",
      search: "magnifingGlass",
      filter: "funnel",
      listAsc: "listAsc",
      listDesc: "listDesc",
      sortAsc: "listAsc",
      sortDesc: "listDesc",
      tools: "gearWrench",

      // Caret Icons
      caretUp: "caretUp",
      caretDown: "caretDown",
      caretLeft: "caretLeft",
      caretRight: "caretRight",
      caretDoubleLeft: "caretDoubleLeft",
      caretDoubleRight: "caretDoubleRight",

      // Stamp Specific
      // - Image Right Panel Icons
      share: "share",
      copyLink: "copyLink",
      twitterImage: "twitterImage",
      previewImage: "image",
      previewCode: "imageCode",
      previewImageRaw: "imageOut",
      // - Media Icons
      play: "play",
      pause: "pause",
      // - Status Icons
      locked: "lockClosed",
      unlocked: "lockOpen",
      keyburned: "flame",
      divisible: "imageDivide",
      atom: "atom",
      dispenserListings: "imagesStar",

      // Wallet Specific Icons
      view: "eye",
      hide: "eyeSlash",
      collection: "images",
      copy: "copy",

      // Bitcoin Specific Icons
      bitcoin: "bitcoin",
      bitcoins: "bitcoins",
      bitcoinTx: "bitcoinTx",
      bitcoinBlock: "bitcoinBlock",
      version: "bitcoinShield",
      send: "bitcoinOut",
      receive: "bitcoinIn",
      history: "bitcoinHistory",
      wallet: "bitcoinWallet",
      donate: "bitcoinHand",

      // Misc Icons
      // - Tools, loader placeholder and donate CTA icons
      stamp: "stamp",
      uploadImage: "imageUpload",

      // Error Display Icons (fallback to existing icons)
      "info": "magnifingGlass", // Using magnifying glass as placeholder for info
      "alert-triangle": "flame", // Using flame as placeholder for warning triangle
      "alert-circle": "atom", // Using atom as placeholder for alert circle
      "x-circle": "x", // Using x as placeholder for x-circle
      "x": "x",

      // Other common icons
      "external-link": "imageOut", // Using imageOut as external link
      "loading": "refresh", // Loading spinner
      "refresh": "refresh", // Refresh spinner
      "eye": "eye",
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
        const isLast = index === pathData.length - 1;
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

          // Parse custom attributes from style string
          const styleParts = pathItem.style.split(" ");
          const attributes: Record<string, string> = {};

          styleParts.forEach((part) => {
            if (part.startsWith("fill-rule-")) {
              attributes["fill-rule"] = part.replace("fill-rule-", "");
            } else if (part.startsWith("clip-rule-")) {
              attributes["clip-rule"] = part.replace("clip-rule-", "");
            }
          });

          return (
            <path
              key={index}
              d={pathItem.path}
              class={`${pathItem.style} ${fillColor} ${
                isLast && colorAccent
                  ? "stroke-[var(--color-accent)] group-hover:stroke-[var(--color-accent-hover)]"
                  : ""
              }`}
              {...attributes}
            />
          );
        }
        // Handle regular string path
        return (
          <path
            key={index}
            d={pathItem as string}
            class={isLast && colorAccent
              ? "stroke-[var(--color-accent)] group-hover:stroke-[var(--color-accent-hover)]"
              : undefined}
          />
        );
      });
    }

    // Handle single path
    return <path d={pathData as string} />;
  };

  /* ===== SVG ELEMENT ===== */
  const svgProps: Record<string, unknown> = {
    ...commonProps,
    ...globalSvgAttributes,
  };
  if (colorAccent) {
    (svgProps as any).style = {
      "--color-accent": colorAccent,
      "--color-accent-hover": colorAccentHover || colorAccent,
    };
  }

  const svgElement = (
    <svg {...(svgProps as any)}>
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
      class={`
        flex items-center justify-center
        absolute top-[-4px] left-[-12px] z-10
        size-5 rounded-full
        font-bold text-[10px] text-stamp-grey group-hover:text-black tracking-wider
        bg-stamp-purple group-hover:bg-stamp-purple-bright
        transition-all duration-200 cursor-pointer
        ${text === "0" ? "opacity-0" : "opacity-100"}
        ${className}
      `}
    >
      {text}
    </span>
  );
}
