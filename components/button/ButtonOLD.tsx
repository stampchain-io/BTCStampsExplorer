// TODO(@baba): Update and delete this component to use the new button component
// "icon" variant is used in:
// Sort.tsx
// StampSearch.tsx
// Search.tsx
// Filter.tsx
// Setting.tsx
// FilterModal.tsx
// SRC20Search.tsx

import { JSX } from "preact";

interface ButtonProps
  extends Omit<JSX.HTMLAttributes<HTMLButtonElement>, "icon"> {
  icon?: string | JSX.Element;
  iconAlt?: string;
}

const ICON_STYLE = "flex items-end justify-end group cursor-pointer";
const ICON_CLASS =
  "w-5 h-5 mt-1.5 tablet:mt-2 fill-stamp-purple group-hover:fill-stamp-purple-bright cursor-pointer";

export function Button({
  icon,
  iconAlt,
  ...props
}: ButtonProps) {
  const className = props.class ? `${ICON_STYLE} ${props.class}` : ICON_STYLE;

  return (
    <button
      {...props}
      class={className}
      data-type="Icon-Button"
    >
      {icon
        ? typeof icon === "string"
          ? (
            <img
              src={icon}
              alt={iconAlt || ""}
              class={ICON_CLASS}
            />
          )
          : (
            <div class={ICON_CLASS}>
              {icon}
            </div>
          )
        : props.children}
    </button>
  );
}
