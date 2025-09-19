/* ===== LOGO ICON COMPONENT ===== */
import { Icon } from "$components/icon/IconBase.tsx";

interface LogoIconProps {
  weight: "extraLight" | "light" | "normal" | "bold" | "custom";
  size: "sm" | "md" | "lg" | "smR" | "mdR" | "lgR";
  color: "grey" | "greyDark" | "purple" | "purpleDark" | "custom";
  className?: string;
  href?: string;
  "f-partial"?: string;
  onClick?: () => void;
}

export function LogoIcon({
  weight,
  size,
  color,
  className,
  href,
  "f-partial": fPartial,
  onClick,
}: LogoIconProps) {
  return (
    <div className="flex items-center justify-center">
      <Icon
        type="iconButton"
        name="stamp"
        weight={weight}
        size={size}
        color={color}
        className={className}
        href={href}
        f-partial={fPartial}
        onClick={onClick}
      />
    </div>
  );
}
