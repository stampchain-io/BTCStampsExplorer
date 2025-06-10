// TODO(@baba): Move code to global file
import { useEffect, useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { formatNumberWithCommas } from "$lib/utils/formatUtils.ts";
import { handleIcon } from "$icon";
import { labelLogicResponsive } from "$text";
import { inputCheckbox } from "$form";

// Range Buttons Component
export const RangeButtons = ({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (period: string) => void;
}) => {
  const [canHoverSelected, setCanHoverSelected] = useState(true);
  const periods = ["24h", "3d", "7d", "1m"];

  const handleClick = (period: string) => {
    onChange(period);
    // Disable hover effects after click
    setCanHoverSelected(false);
  };

  const handleMouseLeave = () => {
    // Re-enable hover effects when mouse leaves
    setCanHoverSelected(true);
  };

  // Custom button class function
  const getButtonClass = (period: string) => {
    const isSelected = selected === period;

    // Base button styles
    const customButtonClass =
      "inline-flex items-center justify-center border-2 rounded-md text-sm tablet:text-xs font-extrabold tracking-wider transition-colors duration-300 h-9 tablet:h-8 px-3.5 tablet:px-3";

    if (isSelected) {
      // Selected state - always disable pointer events to prevent hover effects
      return `${customButtonClass} bg-stamp-grey-light border-stamp-grey-light text-black pointer-events-none`;
    } else {
      // Normal state - conditionally apply hover effects
      return `${customButtonClass} bg-transparent border-stamp-grey text-stamp-grey ${
        canHoverSelected
          ? "hover:bg-stamp-grey-light hover:border-stamp-grey-light hover:text-black"
          : ""
      }`;
    }
  };

  return (
    <div className="flex justify-between">
      {periods.map((period) => (
        <button
          type="button"
          key={period}
          className={getButtonClass(period)}
          onClick={() => handleClick(period)}
          onMouseLeave={handleMouseLeave}
        >
          {period.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

// Range Slider Component
export const RangeSlider = ({
  variant,
  onChange,
  initialMin,
  initialMax,
}: {
  variant: "holders" | "price" | "range";
  onChange?: (min: number, max: number) => void;
  initialMin?: number;
  initialMax?: number;
}) => {
  // Define range configurations for different variants
  const rangeConfigs = {
    // Holders configuration
    holders: {
      min: 0,
      max: Infinity,
      segments: [
        { end: 1000, proportion: 1 / 3 }, // First third covers 0-1000
        { end: 10000, proportion: 1 / 3 }, // Second third covers 1000-10000
        { end: 100000, proportion: 1 / 3 }, // Last third covers 10000-100000
      ],
      tickMarks: ["0", "1,000", "10,000", "∞"],
      tickMarkPositions: ["left-0", "left-[33%]", "left-[66%]", "right-0"],
      formatValue: (value: number) => {
        if (value === Infinity) return "NO LIMIT";
        return formatNumberWithCommas(value);
      },
    },
    // Price configuration
    price: {
      min: 0,
      max: Infinity,
      segments: [
        { end: 0.0001, proportion: 1 / 3 }, // First third covers 0-0.0001
        { end: 0.01, proportion: 1 / 3 }, // Second third covers 0.0001-0.01
        { end: 1.0, proportion: 1 / 3 }, // Last third covers 0.01-1.0
      ],
      tickMarks: ["0", "0.0001", "0.01", "∞"],
      tickMarkPositions: [
        "left-0",
        "left-[33%]",
        "left-[66%]",
        "right-0",
      ],
      formatValue: (value: number) => {
        if (value === Infinity) return "NO LIMIT";
        return value.toFixed(
          // Use appropriate decimal places based on value range
          value < 0.0001 ? 6 : value < 0.01 ? 5 : 3,
        );
      },
    },
    // range configuration
    range: {
      min: 0,
      max: Infinity,
      segments: [
        { end: 100, proportion: 1 / 3 }, // First third covers 0-100
        { end: 10000, proportion: 1 / 3 }, // Second third covers 100-10000
        { end: 100000, proportion: 1 / 3 }, // Last third covers 10000-100000
      ],
      tickMarks: ["0", "100", "10,000", "∞"],
      tickMarkPositions: [
        "left-0",
        "left-[33%]",
        "left-[66%]",
        "right-0",
      ],
      formatValue: (value: number) => {
        if (value === Infinity) return "NO LIMIT";
        return formatNumberWithCommas(value);
      },
    },
  };

  // Get the configuration for the current variant
  const config = rangeConfigs[variant];

  // Track both current and pending values
  const [minValue, setMinValue] = useState(initialMin || config.min);
  const [maxValue, setMaxValue] = useState(initialMax || config.max);
  const [pendingMin, setPendingMin] = useState(initialMin || config.min);
  const [pendingMax, setPendingMax] = useState(initialMax || config.max);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredHandle, setHoveredHandle] = useState<"min" | "max" | null>(
    null,
  );
  const [lastChangedHandle, setLastChangedHandle] = useState<
    "min" | "max" | null
  >(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Convert actual value to slider position (0-100)
  const valueToPosition = (value: number): number => {
    // Special case for Infinity
    if (value === Infinity) return 100;

    // Find which segment the value falls into
    if (value <= config.segments[0].end) {
      // First segment
      return (value / config.segments[0].end) *
        (config.segments[0].proportion * 100);
    } else if (value <= config.segments[1].end) {
      // Second segment
      const segmentPosition = config.segments[0].proportion * 100;
      const segmentValue = value - config.segments[0].end;
      const segmentRange = config.segments[1].end - config.segments[0].end;
      return segmentPosition +
        (segmentValue / segmentRange) * (config.segments[1].proportion * 100);
    } else {
      // Third segment (up to the end or position 99)
      const segmentPosition =
        (config.segments[0].proportion + config.segments[1].proportion) * 100;
      const segmentValue = Math.min(value, config.segments[2].end) -
        config.segments[1].end;
      const segmentRange = config.segments[2].end - config.segments[1].end;

      // If value is exactly at the end of the third segment, cap at 99 to leave room for infinity
      const position = segmentPosition +
        (segmentValue / segmentRange) * (config.segments[2].proportion * 100);

      return Math.min(position, 99);
    }
  };

  // Modify the positionToValue function to handle price variant better
  const positionToValue = (position: number): number => {
    // Special case for the last step (position 100 or very close to it)
    if (position >= 99.5) return Infinity;

    // Calculate which segment this position falls into
    const segment0End = config.segments[0].proportion * 100;
    const segment1End = segment0End + config.segments[1].proportion * 100;
    const segment2End = 99; // Cap at 99 to leave room for infinity at 100

    if (position <= segment0End) {
      // First segment
      const value = (position / segment0End) * config.segments[0].end;
      return variant === "price"
        ? Number(value.toFixed(6))
        : Number(value.toFixed(0));
    } else if (position <= segment1End) {
      // Second segment
      const segmentPosition = position - segment0End;
      const segmentRange = config.segments[1].proportion * 100;
      const value = config.segments[0].end + (segmentPosition / segmentRange) *
          (config.segments[1].end - config.segments[0].end);

      return variant === "price"
        ? Number(value.toFixed(6))
        : Number(value.toFixed(0));
    } else if (position <= segment2End) {
      // Third segment
      const segmentPosition = position - segment1End;
      const segmentRange = segment2End - segment1End;
      const value = config.segments[1].end + (segmentPosition / segmentRange) *
          (config.segments[2].end - config.segments[1].end);

      return variant === "price"
        ? Number(value.toFixed(4))
        : Number(value.toFixed(0));
    } else {
      // Beyond segment2End (should be handled by the special case above)
      return Infinity;
    }
  };

  // Calculate minimum step size based on variant
  const getMinStep = () => {
    if (variant === "price") {
      return 0.000001; // Smallest step for price
    }
    return 1; // Default step for holders and range
  };

  // Modify the handle functions while preserving decimal precision
  const handleMinInput = (e: Event) => {
    setIsDragging(true);
    const sliderValue = parseInt((e.target as HTMLInputElement).value);
    const newMin = positionToValue(sliderValue);

    const minStep = getMinStep();
    const clampedMin = pendingMax === Infinity
      ? newMin
      : Math.min(newMin, pendingMax - minStep * 10);

    setPendingMin(clampedMin);
    setMinValue(clampedMin);
    setLastChangedHandle("min");
  };

  const handleMaxInput = (e: Event) => {
    setIsDragging(true);
    const sliderValue = parseInt((e.target as HTMLInputElement).value);
    const newMax = positionToValue(sliderValue);

    if (sliderValue >= 99.5) {
      setPendingMax(Infinity);
      setMaxValue(Infinity);
      setLastChangedHandle("max");
      return;
    }

    const minStep = getMinStep();
    const clampedMax = Math.max(newMax, pendingMin + minStep * 10);

    setPendingMax(clampedMax);
    setMaxValue(clampedMax);
    setLastChangedHandle("max");
  };

  // Update useEffect to handle final value updates
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (variant === "price") {
          const finalMin = pendingMin < 0.0001
            ? Number(pendingMin.toFixed(6))
            : pendingMin < 0.01
            ? Number(pendingMin.toFixed(5))
            : Number(pendingMin.toFixed(3));

          const finalMax = pendingMax === Infinity
            ? Infinity
            : pendingMax < 0.0001
            ? Number(pendingMax.toFixed(6))
            : pendingMax < 0.01
            ? Number(pendingMax.toFixed(5))
            : Number(pendingMax.toFixed(3));

          onChange?.(finalMin, finalMax);
        } else {
          onChange?.(
            Math.round(pendingMin),
            pendingMax === Infinity ? Infinity : Math.round(pendingMax),
          );
        }
      }
    };

    globalThis.addEventListener("mouseup", handleMouseUp);
    globalThis.addEventListener("touchend", handleMouseUp);

    return () => {
      globalThis.removeEventListener("mouseup", handleMouseUp);
      globalThis.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, pendingMin, pendingMax, onChange, variant]);

  // Define the gradient colors
  const trackGradientFill = (hoveredHandle: "min" | "max" | null) => {
    // Calculate percentages based on our non-linear scale
    const minPercent = valueToPosition(minValue);
    const maxPercent = maxValue === Infinity ? 100 : valueToPosition(maxValue);

    // Calculate dynamic offsets based on handle positions
    const minHandleOffset = (minPercent / 100) * 3; // 0% to 3% based on position
    const maxHandleOffset = ((100 - maxPercent) / 100) * 3; // 0% to 3% based on position

    const baseStyle = {
      left: `calc(${minPercent}% - ${minHandleOffset}%)`,
      right: `calc(${100 - maxPercent}% - ${maxHandleOffset}%)`,
      width: "auto",
    };

    if (hoveredHandle === "min") {
      return {
        ...baseStyle,
        background: "linear-gradient(90deg, #CCCCCC 5%, #999999 75%)",
      };
    } else if (hoveredHandle === "max") {
      return {
        ...baseStyle,
        background: "linear-gradient(90deg, #999999 25%, #CCCCCC 95%)",
      };
    }

    return {
      ...baseStyle,
      background:
        "linear-gradient(90deg, #999999 5%, #666666 40%, #666666 60%, #999999 95%)",
    };
  };

  return (
    <div className="w-full">
      <div className="flex w-full justify-center pb-1.5 tablet:pb-1">
        <div className="flex items-center text-sm tablet:text-xs font-regular cursor-default select-none">
          <div
            className={`min-w-12 text-right ${
              hoveredHandle === "min"
                ? "text-stamp-grey-light"
                : "text-stamp-grey"
            } transition-colors duration-300`}
          >
            {config.formatValue(minValue)}
          </div>
          <span className="mx-2 text-stamp-grey">-</span>
          <div
            className={`min-w-12 text-left ${
              hoveredHandle === "max"
                ? "text-stamp-grey-light"
                : "text-stamp-grey"
            } transition-colors duration-300`}
          >
            {config.formatValue(maxValue)}
          </div>
        </div>
      </div>

      <div
        className="relative h-5 tablet:h-4 rounded-full bg-stamp-grey-darkest border-2 border-stamp-grey-darkest"
        ref={sliderRef}
      >
        {/* Track fill with dynamic gradient */}
        <div
          className="absolute top-0 bottom-0 h-4 tablet:h-3 rounded-full transition-colors duration-300"
          style={trackGradientFill(hoveredHandle)}
        />

        {/* Min handle input - using 0-100 range for the slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={valueToPosition(minValue)}
          onChange={handleMinInput}
          onInput={handleMinInput}
          onMouseEnter={() => setHoveredHandle("min")}
          onMouseLeave={() => setHoveredHandle(null)}
          className={`${handleIcon} ${
            lastChangedHandle === "min" ? "z-20" : "z-10"
          }`}
        />

        {/* Max handle input - using 0-100 range for the slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={valueToPosition(maxValue)}
          onChange={handleMaxInput}
          onInput={handleMaxInput}
          onMouseEnter={() => setHoveredHandle("max")}
          onMouseLeave={() => setHoveredHandle(null)}
          className={`${handleIcon} ${
            lastChangedHandle === "max" ? "z-20" : "z-10"
          }`}
        />
      </div>

      {/* Tick marks for the segment boundaries */}
      <div className="relative w-full h-6 pt-1.5 tablet:pt-1 text-xs tablet:text-[10px] font-regular text-stamp-grey-darker cursor-default select-none">
        {config.tickMarks.map((mark, index) => {
          const position = config.tickMarkPositions[index];
          const isFirst = index === 0;
          const isLast = index === config.tickMarks.length - 1;

          return (
            <p
              key={index}
              className={`absolute ${position} ${
                isFirst
                  ? "transform-none"
                  : isLast
                  ? "transform-none"
                  : "transform -translate-x-1/2"
              } ${
                hoveredHandle !== null
                  ? "text-stamp-grey"
                  : "text-stamp-grey-darker"
              } transition-colors duration-100`}
            >
              {mark}
            </p>
          );
        })}
      </div>
    </div>
  );
};

interface RangeInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: "stamp" | "price";
}

export const RangeInput = (
  { label, placeholder, value, onChange, type }: RangeInputProps,
) => (
  <div className="flex flex-col space-y-1">
    <label className="text-base tablet:text-xs font-medium text-stamp-grey-light">
      {label}
    </label>
    <input
      type={type === "price" ? "text" : "number"}
      value={value}
      onKeyDown={(e) => {
        if (
          ["e", "E", "+", "-"].includes(e.key) ||
          (type === "stamp" && e.key === ".")
        ) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        // Add type assertion to ensure e.target is an HTMLInputElement
        const target = e.target as HTMLInputElement;
        if (!target) return; // Guard against null target

        const value = target.value;

        if (type === "price") {
          // For price, allow decimals with custom validation
          let sanitized = value.replace(/[^0-9.]/g, "");
          const parts = sanitized.split(".");

          // Ensure only one decimal point
          if (parts.length > 2) {
            sanitized = parts[0] + "." + parts[1];
          }

          // Limit decimal places to 8
          if (parts.length === 2 && parts[1].length > 8) {
            sanitized = parts[0] + "." + parts[1].slice(0, 8);
          }

          if (sanitized !== value) {
            onChange(sanitized);
          } else {
            onChange(value);
          }
        } else {
          // For stamp, only allow integers
          if (/^\d*$/.test(value)) {
            onChange(value);
          }
        }
      }}
      min="0"
      step={type === "price" ? "0.00000001" : "1"}
      inputMode="decimal"
      pattern={type === "price" ? "[0-9]*[.]?[0-9]*" : "[0-9]*"}
      className="h-10 tablet:h-9 px-3 tablet:px-4 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-base tablet:text-sm font-medium placeholder:text-xs w-full outline-none focus:bg-stamp-grey-light"
      placeholder={placeholder}
    />
  </div>
);

// Checkbox Component
interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  hasDropdown?: boolean;
  dropdownContent?: ComponentChildren;
}

export const Checkbox = ({
  label,
  checked,
  onChange,
  hasDropdown = false,
  dropdownContent = null,
}: CheckboxProps) => {
  const [canHoverSelected, setCanHoverSelected] = useState(true);

  const handleChange = () => {
    onChange();
    setTimeout(() => setCanHoverSelected(false), 0);
  };

  const handleMouseLeave = () => {
    setCanHoverSelected(true);
  };

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center py-1.5 tablet:py-1.5 cursor-pointer group"
        onMouseLeave={handleMouseLeave}
        onClick={handleChange}
      >
        <input
          className={inputCheckbox(checked, canHoverSelected)}
          type="checkbox"
          checked={checked}
          readOnly
        />
        <label className={labelLogicResponsive(checked, canHoverSelected)}>
          {label}
        </label>
      </div>

      {hasDropdown && checked && dropdownContent && (
        <div className="ml-0.5 mt-1 mb-2">
          {dropdownContent}
        </div>
      )}
    </div>
  );
};

// Radiobutton Component
interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

export const Radiobutton = (
  { label, value, checked, onChange, name }: RadioProps,
) => {
  const [canHoverSelected, setCanHoverSelected] = useState(true);

  const handleChange = () => {
    onChange();
    setTimeout(() => setCanHoverSelected(false), 0);
  };

  const handleMouseLeave = () => {
    setCanHoverSelected(true);
  };

  return (
    <div
      className="flex items-center cursor-pointer group"
      onMouseLeave={handleMouseLeave}
      onClick={handleChange}
    >
      <input
        className={inputCheckbox(checked, canHoverSelected)}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        readOnly
      />
      <label className={labelLogicResponsive(checked, canHoverSelected)}>
        {label}
      </label>
    </div>
  );
};
