import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentChildren, JSX } from "preact";
import { Icon } from "$icons";
export const CollapsibleSection = ({
  title,
  expanded,
  toggle,
  children,
  variant,
}: {
  title: string;
  section: string;
  expanded: boolean;
  toggle: () => void;
  children: ComponentChildren;
  variant:
    | "collapsibleTitle"
    | "collapsibleSubTitle"
    | "collapsibleLabel"
    | "collapsibleTools";
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
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="flex items-center w-full justify-between py-4 tablet:py-3 transition-colors duration-300 group"
          >
            <span
              className={`
                font-light text-xl tablet:text-lg transition-colors duration-300
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
                    ? `fill-stamp-grey ${
                      canHoverSelected
                        ? "group-hover:fill-stamp-grey-light"
                        : ""
                    }`
                    : `fill-stamp-grey-light ${
                      canHoverSelected ? "group-hover:fill-stamp-grey" : ""
                    }`
                } transition-colors duration-300`}
              >
                <Icon
                  type="iconLink"
                  name="caretDown"
                  weight="light"
                  size="md"
                  color="grey"
                />
              </div>
            </div>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="-mt-1 tablet:-mt-1.5 pb-3 pl-0.5">
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
            onClick={handleClick}
            onMouseLeave={handleMouseLeave}
            className="flex items-center w-full mt-2 tablet:mt-1.5 group transition-colors duration-300"
          >
            <div
              className={`transform transition-all duration-300 ${
                expanded ? "scale-y-[-1]" : "mb-0.5"
              } ${
                expanded
                  ? `fill-stamp-grey-light ${
                    canHoverSelected ? "group-hover:fill-stamp-grey" : ""
                  }`
                  : `fill-stamp-grey ${
                    canHoverSelected ? "group-hover:fill-stamp-grey-light" : ""
                  }`
              } transition-colors duration-300`}
            >
              <Icon
                type="iconLink"
                name="caretDown"
                weight="light"
                size="sm"
                color="grey"
              />
              {/* {ChevronIcon("sm")} */}
            </div>

            <span
              className={`${
                labelGreySemiboldSmLogic(expanded, canHoverSelected)
              } font-light`}
            >
              {title}
            </span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
            }`}
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
        >
          <div className="pt-2 pl-0.5">
            {children}
          </div>
        </div>
      );
    }

    case "collapsibleTools": {
      return (
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out
            ${expanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="pl-9 pb-9">
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
