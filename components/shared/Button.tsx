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
  icon?: string | JSX.Element;
  iconAlt?: string;
  isSubmitting?: boolean;
}

const VARIANT_STYLES = {
  default:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-purple-bright hover:bg-stamp-purple-bright transition-colors",
  mint:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-xs mobileLg:text-sm font-extrabold text-black tracking-[0.05em] h-[36px] mobileLg:h-[42px] px-4 mobileLg:px-5 hover:border-stamp-purple-bright hover:bg-stamp-purple-bright transition-colors",
  cancel:
    "inline-flex items-center justify-center border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-purple-bright hover:text-stamp-purple-bright transition-colors",
  submit:
    "inline-flex items-center justify-center bg-stamp-purple border-2 border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-black tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-purple-bright hover:bg-stamp-purple-bright transition-colors",
  wallet:
    "flex items-center justify-center w-7 h-7 mobileMd:w-9 mobileMd:h-9 desktop:w-[42px] desktop:h-[42px] w-8 h-8 cursor-pointer",
  icon:
    "flex justify-center items-center w-7 h-7 mobileMd:w-9 mobileMd:h-9 desktop:w-[42px] desktop:h-[42px] bg-stamp-purple rounded-md p-0 cursor-pointer border-2 border-stamp-purple group",
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
  const iconClass =
    "w-[14px] h-[14px] mobileMd:w-[18px] mobileMd:h-[18px] desktop:w-[20px] desktop:h-[20px]";

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled || isSubmitting}
      class={className}
    >
      {icon
        ? typeof icon === "string"
          ? (
            <img
              src={icon}
              alt={iconAlt || ""}
              class={iconClass}
            />
          )
          : (
            <div class={iconClass}>
              {icon}
            </div>
          )
        : isSubmitting
        ? "Processing..."
        : props.children}
    </button>
  );
}
