import { useState } from "preact/hooks";
import { ComponentChildren, JSX } from "preact";
import { Icon } from "$icon";
import { labelLogicResponsive } from "$text";

// CollapsibleSection Component
export const CollapsibleSection = ({
  title,
  expanded,
  toggle,
  children,
  variant,
  section: _section,
}: {
  title: string;
  expanded: boolean;
  toggle: () => void;
  children: ComponentChildren;
  variant: "collapsibleTitle" | "collapsibleSubTitle" | "collapsibleLabel";
  section?: string;
}): JSX.Element => {
  const [canHoverSelected, setCanHoverSelected] = useState(true);

  const handleClick = () => {
    toggle();
    setCanHoverSelected(false);
  };

  const handleMouseLeave = () => {
    setCanHoverSelected(true);
  };

  switch (variant) {
    case "collapsibleTitle": {
      return (
        <div>
          <button
            type="button"
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="flex items-center w-full justify-between pt-2 pb-4 tablet:pt-2 tablet:pb-3 transition-colors duration-300 group"
            data-section-toggle
          >
            <span
              className={`
                font-light tablet:font-normal text-lg tablet:text-sm transition-colors duration-300
                ${
                expanded
                  ? `text-stamp-grey ${
                    canHoverSelected ? "group-hover:text-stamp-grey-light" : ""
                  }`
                  : `text-stamp-grey-light ${
                    canHoverSelected ? "group-hover:text-stamp-grey" : ""
                  }`
              }`}
            >
              {title}
            </span>

            <div
              className={`transform transition-all duration-300 ${
                expanded ? "scale-y-[-1]" : ""
              }`}
            >
              <div
                className={`${
                  expanded
                    ? `stroke-stamp-grey ${
                      canHoverSelected
                        ? "group-hover:stroke-stamp-grey-light"
                        : ""
                    }`
                    : `stroke-stamp-grey-light ${
                      canHoverSelected ? "group-hover:stroke-stamp-grey" : ""
                    }`
                } transition-colors duration-300`}
              >
                <Icon
                  type="iconButton"
                  name="caretDown"
                  weight="normal"
                  size="xsR"
                  color="custom"
                />
              </div>
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
            }`}
            data-section-expanded={expanded}
          >
            <div className="-mt-2 tablet:-mt-1 pb-4 pl-0.5">
              {children}
            </div>
          </div>
        </div>
      );
    }

    case "collapsibleSubTitle": {
      return (
        <div>
          <button
            type="button"
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="flex items-center w-full mt-2 tablet:mt-1.5 group transition-colors duration-300"
          >
            <div
              className={`transform transition-all duration-300 ${
                expanded ? "scale-y-[-1]" : "mb-0.5"
              } ${
                expanded
                  ? `stroke-stamp-grey-light ${
                    canHoverSelected ? "group-hover:stroke-stamp-grey" : ""
                  }`
                  : `stroke-stamp-grey ${
                    canHoverSelected
                      ? "group-hover:stroke-stamp-grey-light"
                      : ""
                  }`
              } transition-colors duration-300`}
            >
              <Icon
                type="iconButton"
                name="caretDown"
                weight="normal"
                size="xxsR"
                color="custom"
              />
            </div>

            <span
              className={`${
                labelLogicResponsive(expanded, canHoverSelected)
              } font-light`}
            >
              {title}
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
            }`}
            data-section-expanded={expanded}
          >
            <div className="pt-3.5 pl-0.5">
              {children}
            </div>
          </div>
        </div>
      );
    }

    case "collapsibleLabel": {
      return (
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            expanded ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
          }`}
          data-section-expanded={expanded}
        >
          <div className="pt-2 pl-0.5">
            {children}
          </div>
        </div>
      );
    }

    default: {
      // This exhaustiveness check ensures all variants are handled
      const _exhaustiveCheck: never = variant;
      return _exhaustiveCheck;
    }
  }
};
