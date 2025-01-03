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
    "flex items-center justify-center w-[30px] h-[30px] mobileLg:w-9 mobileLg:h-9 p-0 border-2 border-stamp-purple rounded-md hover:border-stamp-purple-bright group cursor-pointer",
  icon:
    "flex items-center justify-center w-[30px] h-[30px] mobileLg:w-9 mobileLg:h-9 p-0 border-2 border-stamp-purple rounded-md hover:border-stamp-purple-bright group cursor-pointer",
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
    "w-[16px] h-[16px] mobileLg:w-[20px] mobileLg:h-[20px] fill-stamp-purple group-hover:fill-stamp-purple-bright cursor-pointer";

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
              className={iconClass}
            />
          )
          : (
            <div className={iconClass}>
              {icon}
            </div>
          )
        : isSubmitting
        ? "Processing..."
        : props.children}
    </button>
  );
}
