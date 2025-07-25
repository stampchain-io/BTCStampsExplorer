import { button } from "$button";
import { useState } from "preact/hooks";

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

    if (isDisabled) {
      const color = mode === "single" ? "grey" : "greyDark";
      return `${
        button("outlineFlat", color, size)
      } opacity-30 cursor-not-allowed`;
    }

    // Choose variant and color based on selection state and mode
    if (isSelected) {
      if (mode === "single") {
        // Single select: use flatOutline for selected state (grey) with default cursor (can't be deselected)
        return `${button("flatOutline", "grey", size)} cursor-default ${
          !canHoverSelected ? "pointer-events-none" : ""
        }`;
      } else {
        // Multi select: use flatOutline for selected state
        // Special case for "dispensers" - show default cursor since it can't be deselected
        const cursorClass = option === "dispensers"
          ? "cursor-default [&:hover]:!bg-gradient-to-br [&:hover]:!from-[var(--color-light)] [&:hover]:!to-[var(--color-dark)] [&:hover]:!text-black"
          : "";
        return `${button("flatOutline", "greyDark", size)} ${cursorClass}`;
      }
    } else {
      // Unselected state: use outlineFlat
      const color = mode === "single" ? "grey" : "greyDark";
      return `${button("outlineFlat", color, size)} ${
        !canHoverSelected
          ? "hover:bg-gradient-to-br hover:from-transparent hover:to-transparent hover:border-[var(--color-dark)] hover:text-[var(--color-dark)]"
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
    <div class={getContainerClass()}>
      {options.map((option) => {
        const isDisabled = disabledOptions.includes(option);

        return (
          <div
            key={option}
            class={`relative group ${
              spacing === "evenFullwidth" ? "flex-1" : ""
            }`}
          >
            <button
              type="button"
              class={`${getButtonClass(option)} ${
                spacing === "evenFullwidth" ? "w-full" : ""
              }`}
              onClick={() => handleClick(option)}
              onMouseLeave={handleMouseLeave}
            >
              {option.toUpperCase()}
            </button>

            {/* Coming Soon overlay text for disabled buttons */}
            {isDisabled && (
              <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ease-in-out duration-200 pointer-events-none z-10">
                <div class="text-stamp-grey-light text-xs font-bold">
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
