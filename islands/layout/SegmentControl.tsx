import { useCallback, useEffect, useRef, useState } from "preact/hooks";

/* ===== TYPES ===== */
interface SegmentOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SegmentControlProps {
  options: SegmentOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size: "xs" | "sm" | "md" | "lg";
  color: "grey" | "purple";
  className?: string;
}

/* ===== COMPONENT ===== */
export const SegmentControl = ({
  options,
  value,
  defaultValue,
  onChange,
  disabled = false,
  size,
  color,
  className = "",
}: SegmentControlProps) => {
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
    if (disabled) return;

    const option = options.find((opt) => opt.value === optionValue);
    if (option?.disabled) return;

    setSelectedValue(optionValue);
    onChange?.(optionValue);
  }, [disabled, options, onChange]);

  // Size classes
  const sizeClasses = {
    xs: "text-xs py-[5px] px-[14px]",
    sm: "text-xs py-[7px] px-4",
    md: "text-sm py-[9px] px-4",
    lg: "text-sm py-[11px] px-4",
  };

  const pillSizeClasses = {
    xs: "py-[5px] px-[14px]",
    sm: "py-[7px] px-4",
    md: "py-[9px] px-4",
    lg: "py-[11px] px-4",
  };

  // Color variants using CSS custom properties
  const colorClasses = {
    grey: `
      [--default-color:#666666]
      [--hover-color:#999999]
      [--selected-color:#666666]
    `,
    purple: `
      [--default-color:#8800CC]
      [--hover-color:#AA00FF]
      [--selected-color:#8800CC]
    `,
  };

  return (
    <div
      ref={containerRef}
      class={`
        ios-segmented-control
        bg-stamp-grey-darkest/15
        rounded-lg
        p-0.5
        grid
        select-none
        relative
        ${colorClasses[color]}
        ${disabled ? "opacity-33 cursor-not-allowed" : ""}
        ${className}
      `}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {/* Selection pill - positioned absolutely to match one column width */}
      <div
        class={`
          selection-pill
          bg-[var(--selected-color)]
          border-[var(--selected-color)]
          shadow-lg
          rounded-md
          z-10
          transition-transform
          duration-100
          ease-out
          absolute
          top-0.5
          bottom-0.5
          ${pillSizeClasses[size]}
        `}
        style={{
          transform: selectionTransform,
          width: `calc((100% - ${options.length * 2}px) / ${options.length})`,
        }}
      />

      {/* Options */}
      {options.map((option, index) => (
        <div
          key={option.value}
          ref={(el) => (optionRefs.current[index] = el)}
          class={`
            option
            relative
            cursor-pointer
            min-w-0
            ${option.disabled || disabled ? "cursor-not-allowed" : ""}
          `}
        >
          <input
            type="radio"
            id={`segment-${option.value}`}
            name="segment-control"
            value={option.value}
            checked={selectedValue === option.value}
            disabled={option.disabled || disabled}
            onChange={() => handleOptionChange(option.value)}
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <label
            for={`segment-${option.value}`}
            class={`
              block
              text-center
              font-semibold
              transition-all
              duration-100
              ease-out
              relative
              z-20
              ${sizeClasses[size]}
              ${
              selectedValue === option.value
                ? "text-black cursor-default"
                : "text-[var(--default-color)] hover:text-[var(--hover-color)] cursor-pointer"
            }
              ${
              option.disabled || disabled
                ? "opacity-50 !cursor-not-allowed"
                : ""
            }
            `}
          >
            <span class="block relative z-20">
              {option.label}
            </span>
          </label>
        </div>
      ))}
    </div>
  );
};

export default SegmentControl;
