import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

type ButtonVariant = "default" | "mint" | "wallet" | "cancel" | "submit";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  iconAlt?: string;
  isSubmitting?: boolean;
}

const VARIANT_STYLES = {
  default:
    "px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors",
  mint:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-xs mobileLg:text-sm font-extrabold text-black tracking-[0.05em] h-[36px] mobileLg:h-[42px] px-3 mobileLg:px-4 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  wallet: "flex items-center justify-center w-8 h-8 cursor-pointer",
  cancel:
    "border-2 border-[#8800CC] text-[#8800CC] w-[108px] h-[48px] rounded-md font-extrabold",
  submit:
    "bg-[#8800CC] text-[#330033] w-[84px] h-[48px] rounded-md font-extrabold disabled:bg-stamp-purple-darker disabled:text-black disabled:cursor-not-allowed",
};

export function Button({
  variant = "default",
  icon,
  iconAlt,
  isSubmitting,
  ...props
}: ButtonProps) {
  const baseClass = VARIANT_STYLES[variant];
  const className = props.class ? `${baseClass} ${props.class}` : baseClass;

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled || isSubmitting}
      class={className}
    >
      {icon
        ? <img src={icon} alt={iconAlt || ""} className="w-full h-full" />
        : isSubmitting
        ? (
          "Processing..."
        )
        : (
          props.children
        )}
    </button>
  );
}
