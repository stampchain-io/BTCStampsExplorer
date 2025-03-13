import { useRef, useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import {
  buttonGreyOutline,
  buttonGreyOutlineActive,
  checkboxIcon,
  filterLabelSm,
  formatNumber,
  handleIcon,
} from "$islands/filter/FilterStyles.ts";

// Chevron icon component - with three size variants
export const ChevronIcon = (size: "sm" | "md" | "lg") => {
  const iconSize = {
    sm: "size-4 tablet:size-3",
    md: "size-5 tablet:size-4",
    lg: "size-6 tablet:size-5",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={iconSize[size]}
    >
      <path d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z" />
    </svg>
  );
};

// Filter icon component
export const FilterIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      role="button"
      aria-label="Filter"
      class="transform transition-all duration-300"
    >
      <path d="M29.2863 5.98875C29.0903 5.54581 28.77 5.16931 28.3641 4.90502C27.9582 4.64072 27.4843 4.50002 27 4.5H5C4.51575 4.50005 4.04193 4.64074 3.63611 4.90497C3.2303 5.16921 2.90997 5.54561 2.71403 5.98846C2.51809 6.43131 2.45499 6.92153 2.53238 7.39956C2.60978 7.87759 2.82434 8.32285 3.15 8.68125L3.165 8.69875L11.5 17.5938V27C11.4999 27.4526 11.6227 27.8967 11.8553 28.285C12.0879 28.6733 12.4215 28.9912 12.8206 29.2047C13.2197 29.4182 13.6692 29.5194 14.1213 29.4974C14.5734 29.4755 15.011 29.3312 15.3875 29.08L19.3875 26.4137C19.73 26.1853 20.0107 25.8757 20.2048 25.5127C20.3989 25.1496 20.5003 24.7442 20.5 24.3325V17.5938L28.8338 8.69875L28.8488 8.68125C29.1746 8.32304 29.3894 7.87791 29.4671 7.39993C29.5448 6.92195 29.4819 6.4317 29.2863 5.98875ZM17.9113 15.975C17.6488 16.2519 17.5017 16.6185 17.5 17V24.065L14.5 26.065V17C14.4996 16.6191 14.3544 16.2527 14.0938 15.975L6.15375 7.5H25.8463L17.9113 15.975Z" />
    </svg>
  );
};

// Badge Icon Component
export const BadgeIcon = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  return (
    <span
      className={`
        absolute top-0 left-0 
        transform -translate-x-1/2 -translate-y-1/2 
        size-6
        flex items-center justify-center
        text-xs font-medium 
        text-black 
        bg-stamp-purple 
        group-hover:bg-stamp-purple-bright
        rounded-full
        transition-all duration-300
        ${text === "0" ? "opacity-0" : "opacity-100"}
        ${className}
      `}
    >
      {text}
    </span>
  );
};

// CollapsibleSection Component
export const CollapsibleSection = ({
  title,
  section,
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
  variant: "collapsibleTitle" | "collapsibleSubTitle" | "collapsibleLabel";
}) => {
  const [canHover, setCanHover] = useState(true);

  const handleClick = () => {
    toggle();
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  // Handle collapsibleTitle variant
  if (variant === "collapsibleTitle") {
    return (
      <div>
        <button
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          className="flex items-center w-full justify-between py-3 tablet:py-2 group transition-colors duration-300"
        >
          <span
            className={`
              text-xl tablet:text-lg font-light transition-colors duration-300
              ${
              expanded
                ? `text-stamp-grey ${
                  canHover ? "group-hover:text-stamp-grey-light" : ""
                }`
                : `text-stamp-grey-light ${
                  canHover ? "group-hover:text-stamp-grey" : ""
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
                    canHover ? "group-hover:fill-stamp-grey-light" : ""
                  }`
                  : `fill-stamp-grey-light ${
                    canHover ? "group-hover:fill-stamp-grey" : ""
                  }`
              } transition-colors duration-300`}
            >
              {ChevronIcon("lg")}
            </div>
          </div>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="-mt-1.5 tablet:-mt-2 pb-3 pl-0.5">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Handle collapsibleSubTitle variant
  if (variant === "collapsibleSubTitle") {
    return (
      <div>
        <button
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          className="flex items-center w-full mt-3 tablet:mt-2 group transition-colors duration-300"
        >
          <div
            className={`transform transition-all duration-300 ${
              expanded ? "scale-y-[-1]" : "mb-0.5"
            } ${
              expanded
                ? `fill-stamp-grey-light ${
                  canHover ? "group-hover:fill-stamp-grey" : ""
                }`
                : `fill-stamp-grey ${
                  canHover ? "group-hover:fill-stamp-grey-light" : ""
                }`
            } transition-colors duration-300`}
          >
            {ChevronIcon("md")}
          </div>

          <span className={filterLabelSm(expanded, canHover)}>
            {title}
          </span>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="-mt-1.5 tablet:-mt-2 pb-3 pl-0.5">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Handle collapsibleLabel variant
  if (variant === "collapsibleLabel") {
    return (
      // Collapsible section
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          expanded ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="ml-0.5 mt-3 mb-2">
          {children}
        </div>
      </div>
    );
  }
};

// Range Buttons Component
export const RangeButtons = ({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (period: string) => void;
}) => {
  return (
    <div className="flex justify-between">
      <button
        className={selected === "24h"
          ? buttonGreyOutlineActive
          : buttonGreyOutline}
        onClick={() => onChange("24h")}
      >
        24H
      </button>
      <button
        className={selected === "3d"
          ? buttonGreyOutlineActive
          : buttonGreyOutline}
        onClick={() => onChange("3d")}
      >
        3D
      </button>
      <button
        className={selected === "7d"
          ? buttonGreyOutlineActive
          : buttonGreyOutline}
        onClick={() => onChange("7d")}
      >
        7D
      </button>
      <button
        className={selected === "1m"
          ? buttonGreyOutlineActive
          : buttonGreyOutline}
        onClick={() => onChange("1m")}
      >
        1M
      </button>
    </div>
  );
};

// Range Slider Component
export const RangeSlider = ({
  onChange,
}: {
  onChange?: (min: number, max: number) => void;
}) => {
  // Define our range segments
  const ranges = {
    min: 0,
    max: 100000,
    segments: [
      { end: 1000, proportion: 1 / 3 }, // First third covers 0-1000
      { end: 10000, proportion: 1 / 3 }, // Second third covers 1000-10000
      { end: 100000, proportion: 1 / 3 }, // Last third covers 10000-100000
    ],
  };

  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100000);
  const [hoveredHandle, setHoveredHandle] = useState<"min" | "max" | null>(
    null,
  );
  const sliderRef = useRef<HTMLDivElement>(null);

  // Convert actual value to slider position (0-100)
  const valueToPosition = (value: number): number => {
    // Find which segment the value falls into
    if (value <= ranges.segments[0].end) {
      // First segment (0-1000)
      return (value / ranges.segments[0].end) *
        (ranges.segments[0].proportion * 100);
    } else if (value <= ranges.segments[1].end) {
      // Second segment (1000-10000)
      const segmentPosition = ranges.segments[0].proportion * 100;
      const segmentValue = value - ranges.segments[0].end;
      const segmentRange = ranges.segments[1].end - ranges.segments[0].end;
      return segmentPosition +
        (segmentValue / segmentRange) * (ranges.segments[1].proportion * 100);
    } else {
      // Third segment (10000-100000)
      const segmentPosition =
        (ranges.segments[0].proportion + ranges.segments[1].proportion) * 100;
      const segmentValue = value - ranges.segments[1].end;
      const segmentRange = ranges.segments[2].end - ranges.segments[1].end;
      return segmentPosition +
        (segmentValue / segmentRange) * (ranges.segments[2].proportion * 100);
    }
  };

  // Convert slider position (0-100) to actual value
  const positionToValue = (position: number): number => {
    // Calculate which segment this position falls into
    const segment0End = ranges.segments[0].proportion * 100;
    const segment1End = segment0End + ranges.segments[1].proportion * 100;

    if (position <= segment0End) {
      // First segment (0-1000)
      return Math.round((position / segment0End) * ranges.segments[0].end);
    } else if (position <= segment1End) {
      // Second segment (1000-10000)
      const segmentPosition = position - segment0End;
      const segmentRange = ranges.segments[1].proportion * 100;
      return Math.round(
        ranges.segments[0].end + (segmentPosition / segmentRange) *
            (ranges.segments[1].end - ranges.segments[0].end),
      );
    } else {
      // Third segment (10000-100000)
      const segmentPosition = position - segment1End;
      const segmentRange = ranges.segments[2].proportion * 100;
      return Math.round(
        ranges.segments[1].end + (segmentPosition / segmentRange) *
            (ranges.segments[2].end - ranges.segments[1].end),
      );
    }
  };

  const handleMinInput = (e: Event) => {
    const sliderValue = parseInt((e.target as HTMLInputElement).value);
    const newMin = positionToValue(sliderValue);

    // Ensure new min value doesn't exceed max value - 10
    const clampedMin = Math.min(newMin, maxValue - 10);
    setMinValue(clampedMin);
    onChange?.(clampedMin, maxValue);
  };

  const handleMaxInput = (e: Event) => {
    const sliderValue = parseInt((e.target as HTMLInputElement).value);
    const newMax = positionToValue(sliderValue);

    // Ensure new max value doesn't go below min value + 10
    const clampedMax = Math.max(newMax, minValue + 10);
    setMaxValue(clampedMax);
    onChange?.(minValue, clampedMax);
  };

  // Define the gradient colors
  const trackGradientFill = (hoveredHandle: "min" | "max" | null) => {
    // Calculate percentages based on our non-linear scale
    const minPercent = valueToPosition(minValue);
    const maxPercent = valueToPosition(maxValue);

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
      <div className="-mt-2 mb-3 flex w-full justify-center">
        <div className="flex items-center text-sm tablet:text-xs font-regular">
          <div
            className={`min-w-12 text-right ${
              hoveredHandle === "min"
                ? "text-stamp-grey-light"
                : "text-stamp-grey-darker"
            } transition-colors duration-300`}
          >
            {formatNumber(minValue)}
          </div>
          <span className="mx-2 text-stamp-grey-darker">-</span>
          <div
            className={`min-w-12 text-left ${
              hoveredHandle === "max"
                ? "text-stamp-grey-light"
                : "text-stamp-grey-darker"
            } transition-colors duration-300`}
          >
            {formatNumber(maxValue)}
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
          className={handleIcon}
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
          className={handleIcon}
        />
      </div>

      {/* Tick marks for the segment boundaries */}
      <div className="relative w-full mt-1.5 tablet:mt-1 flex justify-between px-1 text-xs tablet:text-[10px] font-regular text-stamp-grey-darker">
        <p>0</p>
        <p>1,000</p>
        <p>10,000</p>
        <p>100,000</p>
      </div>
    </div>
  );
};

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
  const [canHover, setCanHover] = useState(true);

  const handleChange = () => {
    onChange();
    setTimeout(() => setCanHover(false), 0);
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <div className="flex flex-col">
      <div
        className="flex items-center py-1.5 cursor-pointer group"
        onMouseLeave={handleMouseLeave}
        onClick={handleChange}
      >
        <input
          className={checkboxIcon(checked, canHover)}
          type="checkbox"
          checked={checked}
          readOnly
        />
        <label className={filterLabelSm(checked, canHover)}>
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
  const [canHover, setCanHover] = useState(true);

  const handleChange = () => {
    onChange();
    setTimeout(() => setCanHover(false), 0);
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <div
      className="flex items-center py-1.5 cursor-pointer group"
      onMouseLeave={handleMouseLeave}
      onClick={handleChange}
    >
      <input
        className={checkboxIcon(checked, canHover)}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        readOnly
      />
      <label className={filterLabelSm(checked, canHover)}>
        {label}
      </label>
    </div>
  );
};
