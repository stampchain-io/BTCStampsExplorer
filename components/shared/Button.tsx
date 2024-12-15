import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

type ButtonVariant =
  | "default"
  | "unselected-filter"
  | "selected"
  | "mint"
  | "wallet"
  | "cancel"
  | "submit";

interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: string;
  iconAlt?: string;
  isSubmitting?: boolean;
}

const VARIANT_STYLES = {
  default:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  "unselected-filter":
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[34px] mobileLg:h-[34px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  selected:
    "inline-flex items-center justify-center bg-stamp-purple-highlight border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[34px] mobileLg:h-[34px] px-4 mobileLg:px-5",
  mint:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-xs mobileLg:text-sm font-extrabold text-black tracking-[0.05em] h-[36px] mobileLg:h-[42px] px-3 mobileLg:px-4 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors",
  wallet: "flex items-center justify-center w-8 h-8 cursor-pointer",
  cancel:
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors",
  submit:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:bg-stamp-purple-highlight transition-colors disabled:bg-stamp-purple-darker disabled:text-black disabled:cursor-not-allowed",
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
