import { ComponentChildren, useEffect, useRef, useState } from "preact/hooks";
import { SRC20Filters } from "$islands/filter/FilterOptionsSRC20.tsx";

const chevronIcon = (size: "sm" | "lg") => {
  const iconSize = {
    sm: "w-4 h-4 mobileLg:w-5 mobileLg:h-5",
    lg: "w-5 h-5 mobileLg:w-6 mobileLg:h-6",
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
  w-4 h-4 mobileLg:w-[18px] mobileLg:h-[18px]
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
  after:w-1.5 after:h-1.5 mobileLg:after:w-2 mobileLg:after:h-2
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
  inline-block ml-[9px] mobileLg:ml-3 text-sm mobileLg:text-base font-bold 
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
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-xs mobileLg:text-sm font-extrabold text-stamp-grey tracking-[0.05em] h-8 mobileLg:h-9 px-3 mobileLg:px-4 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

const buttonGreyOutlineActive =
  "inline-flex items-center justify-center border-2 border-stamp-grey-light rounded-md text-xs mobileLg:text-sm font-extrabold text-stamp-grey-light tracking-[0.05em] h-8 mobileLg:h-9 px-3 mobileLg:px-4 transition-colors";

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
  variant: "header" | "subheader";
}) => {
  const [canHover, setCanHover] = useState(true);

  const handleClick = () => {
    toggle();
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  const isHeader = variant === "header";

  return (
    <div>
      <button
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        className={`
          flex items-center w-full group transition-colors duration-300
          ${
          isHeader ? "justify-between py-2 mobileLg:py-3" : "mt-2 mobileLg:mt-3"
        }
        `}
      >
        {!isHeader && (
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
        )}

        <span
          className={`
            transition-colors duration-300 !font-light
            ${
            isHeader
              ? `text-lg mobileLg:text-xl font-light ${
                expanded
                  ? `text-stamp-grey ${
                    canHover ? "group-hover:text-stamp-grey-light" : ""
                  }`
                  : `text-stamp-grey-light ${
                    canHover ? "group-hover:text-stamp-grey" : ""
                  }`
              }`
              : filterLabelSm(expanded, canHover)
          }
          `}
        >
          {title}
        </span>

        {isHeader && (
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
        )}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="-mt-2 mobileLg:-mt-1.5 pb-3 pl-0.5">
          {children}
        </div>
      </div>
    </div>
  );
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
        className="flex items-center py-1.5 mobileLg:py-1.5 cursor-pointer group"
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
      className="flex items-center py-1.5 mobileLg:py-1.5 cursor-pointer group"
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

  // For a real implementation, you would need to add the actual slider logic
  // This is just a visual representation for now

  return (
    <div className="w-full px-1">
      <div className="mb-3 flex w-full justify-center">
        <div className="flex items-center text-sm">
          <div className="min-w-16 text-center text-stamp-grey-light">
            {minValue}
          </div>
          <span className="mx-2 text-stamp-grey">-</span>
          <div className="min-w-16 text-center text-stamp-grey-light">
            {maxValue}
          </div>
        </div>
      </div>

      <div className="relative h-2 rounded-full bg-stamp-grey/30">
        <div
          className="absolute top-0 h-2 bg-stamp-grey-light rounded-full"
          style={{
            left: `${((minValue - min) / (max - min)) * 100}%`,
            width: `${((maxValue - minValue) / (max - min)) * 100}%`,
          }}
        >
        </div>

        <div
          className="absolute top-1/2 size-4 bg-black border-[3px] border-stamp-grey-light rounded-full -translate-y-1/2 cursor-grab"
          style={{ left: `${((minValue - min) / (max - min)) * 100}%` }}
        >
        </div>

        <div
          className="absolute top-1/2 size-4 bg-black border-[3px] border-stamp-grey-light rounded-full -translate-y-1/2 cursor-grab"
          style={{ left: `${((maxValue - min) / (max - min)) * 100}%` }}
        >
        </div>
      </div>
    </div>
  );
};

// Time Period Button Group
const TimePeriodButtons = ({
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
      return filters.mint.outminted ||
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
    status: "outminted" | "minting" | "trendingMints",
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        mint: {
          ...prevFilters.mint,
          outminted: prevFilters.mint.outminted === true
            ? false
            : status === "outminted",
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

  // Modify the handler functions to handle the combined Specs + Market group
  const handleSpecsAndMarketChange = (
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
    <div className="space-y-1 mobileLg:space-y-1.5">
      {/* STATUS SECTION - Independent group */}
      <CollapsibleSection
        title="STATUS"
        section="mint"
        expanded={expandedSections.mint}
        toggle={() => toggleSection("mint")}
        variant="header"
      >
        <Radio
          label="OUTMINTED"
          value="outminted"
          checked={filters.mint.outminted}
          onChange={() => handleStatusChange("outminted")}
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
        title="SPECS"
        section="details"
        expanded={expandedSections.details}
        toggle={() => toggleSection("details")}
        variant="header"
      >
        <Radio
          label="DEPLOY"
          value="deploy"
          checked={filters.details.deploy}
          onChange={() => handleSpecsAndMarketChange("details", "deploy")}
          name="specsAndMarket"
        />

        <Radio
          label="SUPPLY"
          value="supply"
          checked={filters.details.supply}
          onChange={() => handleSpecsAndMarketChange("details", "supply")}
          name="specsAndMarket"
        />

        <Radio
          label="HOLDERS"
          value="holders"
          checked={filters.details.holders}
          onChange={() => handleSpecsAndMarketChange("details", "holders")}
          name="specsAndMarket"
        />

        {/* Show range slider only when HOLDERS is selected */}
        {filters.details.holders && (
          <div className="ml-0.5 mt-1 mb-2">
            <RangeSlider
              min={1}
              max={10000}
              initialMin={1}
              initialMax={10000}
              onChange={handleHoldersRangeChange}
            />
          </div>
        )}
      </CollapsibleSection>

      {/* MARKET SECTION - Part of combined group */}
      <CollapsibleSection
        title="MARKET"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="header"
      >
        <Radio
          label="MARKET CAP"
          value="marketcap"
          checked={filters.market.marketcap}
          onChange={() => handleSpecsAndMarketChange("market", "marketcap")}
          name="specsAndMarket"
        />

        <Radio
          label="VOLUME"
          value="volume"
          checked={filters.market.volume}
          onChange={() => handleSpecsAndMarketChange("market", "volume")}
          name="specsAndMarket"
        />

        <Radio
          label="PRICE CHANGE"
          value="priceChange"
          checked={filters.market.priceChange}
          onChange={() => handleSpecsAndMarketChange("market", "priceChange")}
          name="specsAndMarket"
        />

        {/* Show time period buttons when volume is selected */}
        {filters.market.volume && (
          <div className="ml-0.5 mt-1 mb-2">
            <TimePeriodButtons
              selected={volumePeriod}
              onChange={setVolumePeriod}
            />
          </div>
        )}

        {/* Show time period buttons when price change is selected */}
        {filters.market.priceChange && (
          <div className="ml-0.5 mt-1 mb-2">
            <TimePeriodButtons
              selected={priceChangePeriod}
              onChange={setPriceChangePeriod}
            />
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentSRC20;
