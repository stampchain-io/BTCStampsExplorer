import { globalSvgAttributes, iconStyles, type IconVariants } from "$icon";

type WalletIconProps = Omit<IconVariants, "name"> & {
  colorAccent?: string;
  colorAccentHover?: string;
};

export function WalletIcon(props: WalletIconProps) {
  const {
    type,
    weight,
    size,
    color,
    className = "",
    role,
    ariaLabel,
    onClick,
    colorAccent,
    colorAccentHover,
    href,
    target,
    rel,
  } = props;

  const combinedClasses = `${iconStyles.base} ${iconStyles.size[size]} ${
    type === "icon"
      ? iconStyles.icon[color].replace("stroke-1", "")
      : iconStyles.iconButton[color]
  } ${iconStyles.weight[weight]} group ${className}`;

  const commonProps = {
    className: combinedClasses,
    role: role || (type === "iconButton" ? "button" : undefined),
    "aria-label": ariaLabel || "Connect Wallet",
    onClick,
  };

  const paths = [
    "M16 13C16 13.8284 16.6716 14.5 17.5 14.5C18.3284 14.5 19 13.8284 19 13C19 12.1716 18.3284 11.5 17.5 11.5C16.6716 11.5 16 12.1716 16 13Z",
    "M11 19H16C18.8284 19 20.2426 19 21.1213 18.1213C22 17.2426 22 15.8284 22 13V12C22 9.17157 22 7.75736 21.1213 6.87868C20.48 6.23738 19.5534 6.06413 18 6.01732M10 6H16C16.7641 6 17.425 6 18 6.01732M2 10C2 6.22876 2 5.34315 3.17157 4.17157C4.34315 3 6.22876 3 10 3H14.9827C15.9308 3 16.4049 3 16.7779 3.15749C17.2579 3.36014 17.6399 3.7421 17.8425 4.22208C18 4.5951 18 5.06917 18 6.01732",
    "M3.125 19.5L3.125 13.5M5 13.5V12M5 21V19.5M3.125 16.5H6.875M6.875 16.5C7.49632 16.5 8 17.0037 8 17.625V18.375C8 18.9963 7.49632 19.5 6.875 19.5H2M6.875 16.5C7.49632 16.5 8 15.9963 8 15.375V14.625C8 14.0037 7.49632 13.5 6.875 13.5H2",
  ];

  const svg = (
    <svg
      {...(commonProps as any)}
      {...(globalSvgAttributes as any)}
      style={{
        // Use CSS custom properties for hover-safe coloring
        "--color-accent": colorAccent || "currentColor",
        "--color-accent-hover": colorAccentHover || colorAccent ||
          "currentColor",
      } as any}
    >
      {paths.map((d, i) => {
        const isLast = i === paths.length - 1;
        return (
          <path
            d={d}
            class={isLast
              ? "stroke-[var(--color-accent)] group-hover:stroke-[var(--color-accent-hover)]"
              : undefined}
          />
        );
      })}
    </svg>
  );

  if (type === "icon") return svg;

  if (type === "iconButton") {
    return (
      <a href={href} target={target} rel={rel}>
        {svg}
      </a>
    );
  }

  throw new Error("Invalid icon type for WalletIcon");
}
