import { ComponentChildren, useEffect, useRef, useState } from "preact/hooks";
import { SRC20Filters } from "$islands/filter/FilterOptionsSRC20.tsx";

const chevronIcon = (size: "sm" | "lg") => {
  const iconSize = {
    sm: "size-5 tablet:size-4",
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

const checkboxIcon = (checked: boolean, canHover: boolean): string => `
  appearance-none
  size-[18px] tablet:size-4
  border-2 
  rounded-sm
  cursor-pointer
  relative
  transition-colors duration-300
  ${
  checked
    ? canHover
      ? "border-stamp-grey-light after:bg-stamp-grey-light group-hover:border-stamp-grey group-hover:after:bg-stamp-grey"
      : "border-stamp-grey-light after:bg-stamp-grey-light"
    : canHover
    ? "border-stamp-grey group-hover:border-stamp-grey-light"
    : "border-stamp-grey"
}
  after:content-['']
  after:block
  after:size-2 tablet:after:size-1.5
  after:rounded-[1px]
  after:absolute
  after:top-1/2 after:left-1/2
  after:-translate-x-1/2 after:-translate-y-1/2
  after:scale-0
  checked:after:scale-100
  after:transition-all
  after:duration-100
`;

const filterLabelSm = (checked: boolean, canHover: boolean): string => `
  inline-block ml-3 tablet:ml-[9px] text-base tablet:text-sm font-bold 
  transition-colors duration-300
  cursor-pointer
  ${
  checked
    ? canHover
      ? "text-stamp-grey-light group-hover:text-stamp-grey"
      : "text-stamp-grey-light"
    : canHover
    ? "text-stamp-grey group-hover:text-stamp-grey-light"
    : "text-stamp-grey"
}
`;

const buttonGreyOutline =
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm tablet:text-xs font-extrabold text-stamp-grey tracking-[0.05em] h-9 tablet:h-8 px-4 tablet:px-3 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

const buttonGreyOutlineActive =
  "inline-flex items-center justify-center border-2 border-stamp-grey-light rounded-md text-sm tablet:text-xs font-extrabold text-stamp-grey-light tracking-[0.05em] h-9 tablet:h-8 px-4 tablet:px-3 transition-colors";

const CollapsibleSection = ({
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
              {chevronIcon("lg")}
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
            {chevronIcon("sm")}
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

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  hasDropdown?: boolean;
  dropdownContent?: ComponentChildren;
}

const Checkbox = ({
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

// Add this Radio component after the Checkbox component
interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

const Radio = ({ label, value, checked, onChange, name }: RadioProps) => {
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

// Range Slider Component
const RangeSlider = ({
  min = 1,
  max = 10000,
  initialMin = 1,
  initialMax = 10000,
  onChange,
}: {
  min?: number;
  max?: number;
  initialMin?: number;
  initialMax?: number;
  onChange?: (min: number, max: number) => void;
}) => {
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);
  const [hoveredHandle, setHoveredHandle] = useState<"min" | "max" | null>(
    null,
  );
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleMinInput = (e: Event) => {
    const newMin = parseInt((e.target as HTMLInputElement).value);
    // Ensure new min value doesn't exceed max value - 1
    const clampedMin = Math.min(newMin, maxValue - 1);
    setMinValue(clampedMin);
    onChange?.(clampedMin, maxValue);
  };

  const handleMaxInput = (e: Event) => {
    const newMax = parseInt((e.target as HTMLInputElement).value);
    // Ensure new max value doesn't go below min value + 1
    const clampedMax = Math.max(newMax, minValue + 1);
    setMaxValue(clampedMax);
    onChange?.(minValue, clampedMax);
  };

  // Define the gradient colors
  const getTrackFillStyle = (hoveredHandle: "min" | "max" | null) => {
    const baseStyle = {
      left: `${((minValue - min) / (max - min)) * 100}%`,
      width: `${((maxValue - minValue) / (max - min)) * 100}%`,
    };

    if (hoveredHandle === "min") {
      return {
        ...baseStyle,
        background:
          "linear-gradient(90deg, #CCCCCC 5%, #999999 50%, #666666 75%)",
      };
    } else if (hoveredHandle === "max") {
      return {
        ...baseStyle,
        background:
          "linear-gradient(90deg, #666666 25%, #999999 50%, #CCCCCC 95%)",
      };
    }

    return {
      ...baseStyle,
      background:
        "linear-gradient(90deg, #666666 5%, #333333 40%, #333333 60%, #666666 95%)",
    };
  };

  return (
    <div className="w-full">
      <div className="-mt-2 mb-3 flex w-full justify-center">
        <div className="flex items-center text-sm tablet:text-xs">
          <div
            className={`min-w-12 text-right ${
              hoveredHandle === "min"
                ? "text-stamp-grey-light"
                : "text-stamp-grey-darkest"
            } transition-colors duration-200`}
          >
            {minValue}
          </div>
          <span className="mx-2 text-stamp-grey-darkest">-</span>
          <div
            className={`min-w-12 text-left ${
              hoveredHandle === "max"
                ? "text-stamp-grey-light"
                : "text-stamp-grey-darkest"
            } transition-colors duration-200`}
          >
            {maxValue}
          </div>
        </div>
      </div>

      <div
        className="relative h-2.5 tablet:h-2 rounded-full bg-stamp-grey-darkest/50"
        ref={sliderRef}
      >
        {/* Track fill with dynamic gradient */}
        <div
          className="absolute top-0 h-2.5 tablet:h-2 rounded-full transition-colors duration-200"
          style={getTrackFillStyle(hoveredHandle)}
        />

        {/* Min handle input */}
        <input
          type="range"
          min={min}
          max={max}
          value={minValue}
          onChange={handleMinInput}
          onInput={handleMinInput}
          onMouseEnter={() => setHoveredHandle("min")}
          onMouseLeave={() => setHoveredHandle(null)}
          className="absolute w-full h-2.5 tablet:h-2 rounded-full appearance-none bg-transparent pointer-events-none 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:tablet:size-[18px]
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stamp-grey-darker
            [&::-webkit-slider-thumb]:hover:bg-stamp-grey-light [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:tablet:size-[18px]
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-stamp-grey-darker
            [&::-moz-range-thumb]:hover:bg-stamp-grey-light [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-0"
        />

        {/* Max handle input */}
        <input
          type="range"
          min={min}
          max={max}
          value={maxValue}
          onChange={handleMaxInput}
          onInput={handleMaxInput}
          onMouseEnter={() => setHoveredHandle("max")}
          onMouseLeave={() => setHoveredHandle(null)}
          className="absolute w-full h-2.5 tablet:h-2 rounded-full appearance-none bg-transparent pointer-events-none 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto
            [&::-webkit-slider-thumb]:size-[22px] [&::-webkit-slider-thumb]:tablet:size-[18px]
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-stamp-grey-darker
            [&::-webkit-slider-thumb]:hover:bg-stamp-grey-light [&::-webkit-slider-thumb]:cursor-grab
            [&::-webkit-slider-thumb]:active:cursor-grabbing
            [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto
            [&::-moz-range-thumb]:size-[22px] [&::-moz-range-thumb]:tablet:size-[18px]
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-stamp-grey-darker
            [&::-moz-range-thumb]:hover:bg-stamp-grey-light [&::-moz-range-thumb]:cursor-grab
            [&::-moz-range-thumb]:active:cursor-grabbing [&::-moz-range-thumb]:border-0"
        />
      </div>
    </div>
  );
};

// Time Period Button Group
const RangeButtons = ({
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

function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number | null>(null);

  function debouncedCallback(...args: Parameters<T>) {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }

  return debouncedCallback;
}

// Helper function to check if a section has active filters
function hasActiveFilters(section: string, filters: SRC20Filters) {
  switch (section) {
    case "market":
      return filters.market.marketcap ||
        filters.market.volume ||
        filters.market.priceChange;
    case "details":
      return filters.details.deploy ||
        filters.details.supply ||
        filters.details.holders;
    case "mint":
      return filters.mint.fullyminted ||
        filters.mint.minting ||
        filters.mint.trendingMints;
    default:
      return false;
  }
}

export const FilterContentSRC20 = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: SRC20Filters;
  onFiltersChange: (filters: SRC20Filters) => void;
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [volumePeriod, setVolumePeriod] = useState("24h");
  const [priceChangePeriod, setPriceChangePeriod] = useState("24h");

  // Add this effect to watch for changes to initialFilters
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const [expandedSections, setExpandedSections] = useState({
    mint: true,
    market: hasActiveFilters("market", filters),
    details: hasActiveFilters("details", filters),
    holdersRange: false,
    volumePeriod: false,
    priceChangePeriod: false,
  });

  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    500,
  );

  const handleFilterChange = (
    category: string,
    key: string,
    value: boolean,
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: {
          ...prevFilters[category],
          [key]: value,
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleHoldersRangeChange = (min: number, max: number) => {
    // This would update the holders range in the actual implementation
    console.log(`Holders range changed: ${min} - ${max}`);
  };

  // Update the handleStatusChange function to allow deselection
  const handleStatusChange = (
    status: "fullyminted" | "minting" | "trendingMints",
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        mint: {
          ...prevFilters.mint,
          fullyminted: prevFilters.mint.fullyminted === true
            ? false
            : status === "fullyminted",
          minting: prevFilters.mint.minting === true
            ? false
            : status === "minting",
          trendingMints: prevFilters.mint.trendingMints === true
            ? false
            : status === "trendingMints",
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Modify the handler functions to handle the combined Details + Market group
  const handleDetailsAndMarketChange = (
    category: "details" | "market",
    option: string,
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        details: {
          ...prevFilters.details,
          deploy: category === "details" && option === "deploy"
            ? (prevFilters.details.deploy === true ? false : true)
            : false,
          supply: category === "details" && option === "supply"
            ? (prevFilters.details.supply === true ? false : true)
            : false,
          holders: category === "details" && option === "holders"
            ? (prevFilters.details.holders === true ? false : true)
            : false,
        },
        market: {
          ...prevFilters.market,
          marketcap: category === "market" && option === "marketcap"
            ? (prevFilters.market.marketcap === true ? false : true)
            : false,
          volume: category === "market" && option === "volume"
            ? (prevFilters.market.volume === true ? false : true)
            : false,
          priceChange: category === "market" && option === "priceChange"
            ? (prevFilters.market.priceChange === true ? false : true)
            : false,
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  return (
    <div className="space-y-1.5 tablet:space-y-1">
      {/* STATUS SECTION - Independent group */}
      <CollapsibleSection
        title="STATUS"
        section="mint"
        expanded={expandedSections.mint}
        toggle={() => toggleSection("mint")}
        variant="collapsibleTitle"
      >
        <Radio
          label="FULLY MINTED"
          value="fullyminted"
          checked={filters.mint.fullyminted}
          onChange={() => handleStatusChange("fullyminted")}
          name="status"
        />

        <Radio
          label="MINTING"
          value="minting"
          checked={filters.mint.minting}
          onChange={() => handleStatusChange("minting")}
          name="status"
        />

        <Radio
          label="TRENDING MINTS"
          value="trendingMints"
          checked={filters.mint.trendingMints}
          onChange={() => handleStatusChange("trendingMints")}
          name="status"
        />
      </CollapsibleSection>

      {/* SPECIFICATIONS SECTION - Part of combined group */}
      <CollapsibleSection
        title="DETAILS"
        section="details"
        expanded={expandedSections.details}
        toggle={() => toggleSection("details")}
        variant="collapsibleTitle"
      >
        <Radio
          label="DEPLOY DATE"
          value="deploy"
          checked={filters.details.deploy}
          onChange={() => handleDetailsAndMarketChange("details", "deploy")}
          name="specsAndMarket"
        />

        <Radio
          label="SUPPLY"
          value="supply"
          checked={filters.details.supply}
          onChange={() => handleDetailsAndMarketChange("details", "supply")}
          name="specsAndMarket"
        />

        <Radio
          label="HOLDERS"
          value="holders"
          checked={filters.details.holders}
          onChange={() => handleDetailsAndMarketChange("details", "holders")}
          name="specsAndMarket"
        />

        {filters.details.holders && (
          <CollapsibleSection
            title=""
            section="holdersRange"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeSlider
              min={1}
              max={10000}
              initialMin={1}
              initialMax={10000}
              onChange={handleHoldersRangeChange}
            />
          </CollapsibleSection>
        )}
      </CollapsibleSection>

      {/* MARKET SECTION - Part of combined group */}
      <CollapsibleSection
        title="MARKET"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="collapsibleTitle"
      >
        <Radio
          label="MARKET CAP"
          value="marketcap"
          checked={filters.market.marketcap}
          onChange={() => handleDetailsAndMarketChange("market", "marketcap")}
          name="specsAndMarket"
        />

        <Radio
          label="VOLUME"
          value="volume"
          checked={filters.market.volume}
          onChange={() => handleDetailsAndMarketChange("market", "volume")}
          name="specsAndMarket"
        />

        <Radio
          label="PRICE CHANGE"
          value="priceChange"
          checked={filters.market.priceChange}
          onChange={() => handleDetailsAndMarketChange("market", "priceChange")}
          name="specsAndMarket"
        />

        {/* Wrap VOLUME time period buttons in CollapsibleSection */}
        {filters.market.volume && (
          <CollapsibleSection
            title=""
            section="volumePeriod"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeButtons
              selected={volumePeriod}
              onChange={setVolumePeriod}
            />
          </CollapsibleSection>
        )}

        {/* Wrap PRICE CHANGE time period buttons in CollapsibleSection */}
        {filters.market.priceChange && (
          <CollapsibleSection
            title=""
            section="priceChangePeriod"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeButtons
              selected={priceChangePeriod}
              onChange={setPriceChangePeriod}
            />
          </CollapsibleSection>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentSRC20;
