import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

type ButtonVariant =
  | "default"
  | "mint"
  | "wallet"
  | "cancel"
  | "submit"
  | "icon";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  iconAlt?: string;
  isSubmitting?: boolean;
}

const VARIANT_STYLES = {
  default:
    "inline-flex items-center justify-center w-7 h-7 mobileLg:w-9 mobileLg:h-9 bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  mint:
    "inline-flex items-center justify-center w-[66px] h-[36px] mobileLg:w-[84px] mobileLg:h-[48px] bg-stamp-purple border-2 border-stamp-purple rounded-md text-xs mobileLg:text-sm font-extrabold text-black tracking-[0.05em] px-3 mobileLg:px-4 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  wallet:
    "flex items-center justify-center w-7 h-7 mobileLg:w-9 mobileLg:h-9 w-8 h-8 cursor-pointer",
  cancel:
    "inline-flex items-center justify-center w-7 h-7 mobileLg:w-9 mobileLg:h-9 border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors",
  submit:
    "inline-flex items-center justify-center w-7 h-7 mobileLg:w-9 mobileLg:h-9 bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors disabled:bg-stamp-purple-darker disabled:text-black disabled:cursor-not-allowed",
  icon:
    "flex justify-center items-center w-7 h-7 mobileLg:w-9 mobileLg:h-9 bg-stamp-purple rounded-md p-0 cursor-pointer border-2 border-[#8800CC]",
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
        ? (
          <img
            src={icon}
            alt={iconAlt || ""}
            className="w-[14px] h-[14px] mobileLg:w-[18px] mobileLg:h-[18px]"
          />
        )
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
