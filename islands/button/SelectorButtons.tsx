import { buttonStyles, color, size as buttonSize, state } from "$button";
import { glassmorphism } from "$layout";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/* ===== TYPES ===== */
interface SelectorOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectorButtonsProps {
  options: SelectorOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
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
  color: "grey" | "purple";
  className?: string;
}

/* ===== COMPONENT ===== */
export const SelectorButtons = ({
  options,
  value,
  defaultValue,
  onChange,
  size,
  color: colorProp,
  className = "",
  disabled: disabledProp = false,
}: SelectorButtonsProps) => {
  const [selectedValue, setSelectedValue] = useState<string>(
    value || defaultValue || options[0]?.value || "",
  );
  const [selectionTransform, setSelectionTransform] = useState(
    "translateX(0px)",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update internal state when controlled value changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Calculate and update selection pill position
  const updateSelectionPosition = useCallback(() => {
    if (!containerRef.current) return;

    const selectedIndex = options.findIndex((option) =>
      option.value === selectedValue
    );
    if (selectedIndex === -1) return;

    const optionElement = optionRefs.current[selectedIndex];
    if (!optionElement) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const optionRect = optionElement.getBoundingClientRect();
    const offsetX = optionRect.left - containerRect.left;

    setSelectionTransform(`translateX(${offsetX}px)`);
  }, [selectedValue, options]);

  // Update position on mount and when selection changes
  useEffect(() => {
    updateSelectionPosition();
  }, [updateSelectionPosition]);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      updateSelectionPosition();
    };

    globalThis.addEventListener("resize", handleResize);
    return () => globalThis.removeEventListener("resize", handleResize);
  }, [updateSelectionPosition]);

  // Handle option selection
  const handleOptionChange = useCallback((optionValue: string) => {
    if (disabledProp) return;

    const option = options.find((opt) => opt.value === optionValue);
    if (option?.disabled) return;

    setSelectedValue(optionValue);
    onChange?.(optionValue);
  }, [disabledProp, options, onChange]);

  // Use imported color from buttonStyles (needs the css variables)
  const colorVariants = {
    grey: color.grey,
    purple: color.purple,
  };

  // Helper function to determine if an option is disabled
  const isOptionDisabled = useCallback((option: SelectorOption) => {
    return option.disabled || disabledProp;
  }, [disabledProp]);

  return (
    <div
      ref={containerRef}
      class={`relative grid p-0.5 select-none
        ${glassmorphism}
        ${colorVariants[colorProp]}
        ${disabledProp ? state.disabled : ""}
        ${className}
      `}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {/* Selection button */}
      <div
        class={`!absolute top-0.5 bottom-0.5 z-10
          ${buttonStyles.variant.glassmorphismColor}
        `}
        style={{
          transform: selectionTransform,
          width: `calc((100% - ${options.length * 2}px) / ${options.length})`,
        }}
      />

      {/* Options */}
      {options.map((option, index) => {
        const optionDisabled = isOptionDisabled(option);

        return (
          <div
            key={option.value}
            ref={(el) => (optionRefs.current[index] = el)}
            class={`
              relative min-w-0
              ${
              optionDisabled
                ? state.disabled
                : selectedValue === option.value
                ? "cursor-default"
                : "cursor-pointer"
            }
            `}
          >
            <input
              type="radio"
              id={`selector-${option.value}`}
              name="selector-buttons"
              value={option.value}
              checked={selectedValue === option.value}
              disabled={optionDisabled}
              onChange={() => handleOptionChange(option.value)}
              class="absolute inset-0 w-full h-full opacity-0"
            />
            <label
              for={`selector-${option.value}`}
              class={`
                relative flex items-center justify-center z-20
                font-semibold text-center
                transition-all duration-50
                ${buttonSize[size]}
                ${
                selectedValue === option.value
                  ? "text-black"
                  : "rounded-lg bg-transparent text-[var(--color-dark)] hover:text-[var(--color-medium)] hover:bg-stamp-grey-darkest/30"
              }
                ${
                optionDisabled
                  ? state.disabled
                  : selectedValue === option.value
                  ? "cursor-default"
                  : "cursor-pointer"
              }
              `}
            >
              <span class="block relative z-20">
                {option.label}
              </span>
            </label>
          </div>
        );
      })}
    </div>
  );
};

export default SelectorButtons;
