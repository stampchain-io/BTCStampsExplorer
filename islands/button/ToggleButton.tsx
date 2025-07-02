import { useState } from "preact/hooks";
import { button } from "$button";

export const ToggleButton = ({
  options,
  selected,
  onChange,
  mode = "single",
  size = "smR",
  spacing = "normal",
  disabledOptions = [],
}: {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multi";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xsR" | "smR" | "mdR" | "lgR";
  spacing?: "normal" | "tight" | "even" | "evenFullwidth";
  disabledOptions?: string[];
}) => {
  const [canHoverSelected, setCanHoverSelected] = useState(true);

  const handleClick = (option: string) => {
    // Don't handle clicks on disabled options
    if (disabledOptions.includes(option)) {
      return;
    }

    if (mode === "single") {
      onChange(option);
    } else {
      // Multi-select mode
      const currentSelection = Array.isArray(selected) ? selected : [];
      const isSelected = currentSelection.includes(option);

      if (isSelected) {
        onChange(currentSelection.filter((item) => item !== option));
      } else {
        onChange([...currentSelection, option]);
      }
    }

    // Disable hover effects after click
    setCanHoverSelected(false);
  };

  const handleMouseLeave = () => {
    // Re-enable hover effects when mouse leaves
    setCanHoverSelected(true);
  };

  const isOptionSelected = (option: string): boolean => {
    if (mode === "single") {
      return selected === option;
    }
    return Array.isArray(selected) && selected.includes(option);
  };

  // Custom button class function
  const getButtonClass = (option: string) => {
    const isSelected = isOptionSelected(option);
    const isDisabled = disabledOptions.includes(option);

    // Handle disabled options with 50% opacity and disabled cursor
    if (isDisabled) {
      const color = mode === "single" ? "grey" : "greyDark";
      return `${
        button("outlineFlatSelector", color, size)
      } opacity-50 cursor-not-allowed`;
    }

    // Choose variant and color based on selection state and mode
    if (isSelected) {
      if (mode === "single") {
        // Single select: use flatOutlineSelector for selected state (grey) with default cursor (can't be deselected)
        return `${button("flatOutlineSelector", "grey", size)} cursor-default ${
          !canHoverSelected ? "pointer-events-none" : ""
        }`;
      } else {
        // Multi select: use flatOutlineSelector for selected state (purple)
        // Special case for "dispensers" - show default cursor since it can't be deselected
        const cursorClass = option === "dispensers" ? "cursor-default" : "";
        return `${
          button("flatOutlineSelector", "greyDark", size)
        } ${cursorClass}`;
      }
    } else {
      // Unselected state: use outlineFlatSelector
      const color = mode === "single" ? "grey" : "greyDark";
      return `${button("outlineFlatSelector", color, size)} ${
        !canHoverSelected
          ? "hover:bg-transparent hover:border-[var(--default-color)] hover:text-[var(--default-color)]"
          : ""
      }`;
    }
  };

  // Container class based on spacing type
  const getContainerClass = () => {
    switch (spacing) {
      case "normal":
        return "flex gap-6";
      case "tight":
        return "flex gap-3";
      case "even":
        return "flex justify-between";
      case "evenFullwidth":
        return "flex gap-6 w-full";
    }
  };

  return (
    <div className={getContainerClass()}>
      {options.map((option) => {
        const isDisabled = disabledOptions.includes(option);

        return (
          <div
            key={option}
            className={`relative group ${
              spacing === "evenFullwidth" ? "flex-1" : ""
            }`}
          >
            <button
              type="button"
              className={`${getButtonClass(option)} ${
                spacing === "evenFullwidth" ? "w-full" : ""
              }`}
              onClick={() => handleClick(option)}
              onMouseLeave={handleMouseLeave}
            >
              {option.toUpperCase()}
            </button>

            {/* Coming Soon overlay text for disabled buttons */}
            {isDisabled && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
                <div className="text-stamp-grey-light text-xs font-bold">
                  SOON™
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
