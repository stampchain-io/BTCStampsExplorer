import { button } from "$button";
import { useState } from "preact/hooks";

// Glassmorphism color effect styling - must be identical to the glassmorphismColor variant in the button/styles.ts file
const glassmorphismColor =
  "[&:hover]:!bg-stamp-grey-darkest/10 [&:hover]:!border-[var(--color-border-hover)] [&:hover]:!text-[#1e1723] [&:hover::before]:!scale-100 [&:hover::before]:!blur-[5px] [&:hover::before]:!bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]";

export const ToggleButton = ({
  options,
  selected,
  onChange,
  mode = "single",
  size = "smR",
  spacing = "normal",
  disabledOptions = [],
  color = "purple",
  className = "",
}: {
  options: string[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multi";
  size:
    | "xxs"
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxsR"
    | "xsR"
    | "smR"
    | "mdR"
    | "lgR";
  spacing?: "normal" | "tight" | "even" | "evenFullwidth";
  disabledOptions?: string[];
  color?:
    | "grey"
    | "greyDark"
    | "purple"
    | "purpleDark"
    | "test"
    | "custom";
  className?: string;
}) => {
  const [selectState, setselectState] = useState<
    {
      option: string;
      action: "select" | "deselect";
    } | null
  >(null);

  const handleClick = (option: string) => {
    // Don't handle clicks on disabled options
    if (disabledOptions.includes(option)) {
      return;
    }

    const wasSelected = isOptionSelected(option);

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

    // Track the button and whether it was being selected or deselected
    setselectState({
      option,
      action: wasSelected ? "deselect" : "select",
    });
  };

  const handleMouseLeave = () => {
    // Don't clear selectState for TRENDING to keep visual effect visible
    if (selectState?.option !== "TRENDING") {
      setselectState(null);
    }
  };

  const isOptionSelected = (option: string): boolean => {
    if (mode === "single") {
      return selected === option;
    }
    return Array.isArray(selected) && selected.includes(option);
  };

  // Helper function to get select state styling for clicked buttons - overrukles hover states
  const getSelectState = (option: string): string => {
    if (selectState?.option !== option) return "";

    return selectState.action === "select"
      ? glassmorphismColor
      : `!bg-stamp-grey-darkest/15 !border-stamp-grey-darkest/20 !text-[var(--color-dark)] [&:hover::before]:!bg-none`;
  };

  // Custom button class function
  const getButtonClass = (option: string) => {
    const isSelected = isOptionSelected(option);
    const isDisabled = disabledOptions.includes(option);

    if (isDisabled) {
      return `${
        button("glassmorphismDeselected", "grey", size)
      } opacity-50 cursor-not-allowed`;
    }

    // Choose variant and color based on selection state and mode
    if (isSelected) {
      if (mode === "single") {
        // Single select: use glassmorphismSelected for selected state
        // Special case for timeframe buttons - show default state since they can't be deselected
        // Interactive buttons like marketplace and trending get special select state behavior
        const isTimeframe = ["24h", "7d", "30d"].includes(option);

        // Special handling for TRENDING button
        const isTrending = option === "TRENDING";

        if (isTimeframe) {
          return `${
            button("glassmorphismSelected", "grey", size)
          } cursor-default ${glassmorphismColor}`;
        } else if (isTrending) {
          // Force TRENDING to always show special effect with persistent animation
          const trendingClickState = selectState?.option === "TRENDING"
            ? glassmorphismColor
            : `hover:bg-stamp-grey-darkest/15 hover:border-stamp-grey-darkest/20 hover:text-[var(--color-dark)] hover:before:bg-none `;
          return `${
            button("glassmorphismSelected", color, size)
          } cursor-pointer ${trendingClickState} ${getSelectState(option)}`;
        } else {
          return `${
            button("glassmorphismSelected", "grey", size)
          } cursor-pointer ${getSelectState(option)}`;
        }
      } else {
        // Multi select: use glassmorphismSelected for selected state
        // Special case for "dispensers" - show default state since it can't be deselected
        return `${button("glassmorphismSelected", color, size)} ${
          option === "dispensers" ? `cursor-default ${glassmorphismColor}` : ""
        }`;
      }
    } else {
      // Unselected state: use glassmorphismDeselected
      return `${button("glassmorphismDeselected", "grey", size)} ${
        getSelectState(option)
      }`;
    }
  };

  // Container class based on spacing type
  const getContainerClass = () => {
    switch (spacing) {
      case "normal":
        return "flex gap-5";
      case "tight":
        return "flex gap-2.5";
      case "even":
        return "flex justify-between";
      case "evenFullwidth":
        return "flex gap-5 w-full";
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
              } ${className}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(option);
              }}
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