import { buttonStyles } from "$button";
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
  size: "xs" | "sm" | "md" | "lg";
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

  // Size classes
  const padding = {
    xs: "py-[5px] px-[14px]",
    sm: "py-[7px] px-4",
    md: "py-[9px] px-4",
    lg: "py-[11px] px-4",
  };

  const textSize = {
    xs: `text-xs ${padding.xs}`,
    sm: `text-xs ${padding.sm}`,
    md: `text-sm ${padding.md}`,
    lg: `text-sm ${padding.lg}`,
  };

  // Use color from buttonStyles
  const color = {
    grey: buttonStyles.color.grey,
    purple: buttonStyles.color.purple,
  };

  const disabled = "opacity-30 !cursor-not-allowed";

  // Helper function to determine if an option is disabled
  const isOptionDisabled = useCallback((option: SelectorOption) => {
    return option.disabled || disabledProp;
  }, [disabledProp]);

  return (
    <div
      ref={containerRef}
      class={`relative grid p-0.5 select-none
        ${glassmorphism}
        ${color[colorProp]}
        ${disabledProp ? disabled : ""}
        ${className}
      `}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {/* Selection button */}
      <div
        class={`absolute top-0.5 bottom-0.5 z-10
          rounded-lg shadow-lg
          transition-transform duration-200 ease-in-out
          ${padding[size]}
        `}
        style={{
          transform: selectionTransform,
          width: `calc((100% - ${options.length * 2}px) / ${options.length})`,
          background:
            `linear-gradient(135deg, var(--color-light), var(--color-dark))`,
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
              relative min-w-0 cursor-pointer
              ${optionDisabled ? "cursor-not-allowed" : ""}
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
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <label
              for={`selector-${option.value}`}
              class={`
                relative block z-20
                font-semibold text-center
                transition-all duration-200 ease-in-out
                ${textSize[size]}
                ${
                selectedValue === option.value
                  ? "text-black cursor-default"
                  : "text-[var(--color-dark)] hover:text-[var(--color-light)] cursor-pointer"
              }
                ${optionDisabled ? disabled : ""}
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
