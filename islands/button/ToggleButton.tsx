import { button } from "$button";
import { useState } from "preact/hooks";

// Glassmorphism color effect styling - must be identical to the glassmorphismColor variant in the button/styles.ts file
const glassmorphismColor = `
  [&:hover]:!bg-[#211c21]/10 [&:hover]:border-[var(--color-border)] [&:hover]:!text-[#171417]

  [&:hover::before]:!scale-100 [&:hover::before]:!blur-sm
  [&:hover::before]:!bg-[linear-gradient(to_bottom_right,var(--color-dark)_0%,var(--color-dark)_20%,var(--color-medium)_20%,var(--color-medium)_45%,var(--color-light)_45%,var(--color-light)_52%,var(--color-medium)_52%,var(--color-medium)_70%,var(--color-dark)_70%,var(--color-dark)_100%)]
  shadow-[0_2px_4px_rgba(13,11,13,0.1),inset_0_1px_0_rgba(13,11,13,0.1),inset_0_-1px_0_rgba(13,11,13,0.1),inset_0_0_2px_2px_rgba(13,11,13,0.1)]`;

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
      : `!bg-[#211c21]/20 !border-[var(--color-border)] !text-[var(--color-text)] [&:hover::before]:!bg-none`;
  };

  // Custom button class function
  const getButtonClass = (option: string) => {
    const isSelected = isOptionSelected(option);
    const isDisabled = disabledOptions.includes(option);

    if (isDisabled) {
      return button("glassmorphismDeselected", "grey", size, {
        disabled: true,
      });
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
          return `${
            button("glassmorphismSelected", color, size)
          } cursor-pointer ${getSelectState(option)}`;
        } else {
          return `${
            button("glassmorphismSelected", "grey", size)
          } cursor-pointer ${getSelectState(option)}`;
        }
      } else {
        // Multi select: use glassmorphismSelected for selected state
        // Special case for "dispensers" - show default state since it can't be deselected
        return `${button("glassmorphismSelected", color, size)} ${
          option === "dispensers"
            ? `cursor-default ${glassmorphismColor}`
            : "cursor-pointer"
        }`;
      }
    } else {
      // Unselected state: use glassmorphismDeselected
      // Check if this is a timeframe button that should have pointer cursor when unselected
      const isTimeframe = ["24h", "7d", "30d"].includes(option);
      const cursorClass = isTimeframe ? "cursor-pointer" : "cursor-pointer";

      return `${button("glassmorphismDeselected", "grey", size)} ${
        getSelectState(option)
      } ${cursorClass}`;
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
          </div>
        );
      })}
    </div>
  );
};
