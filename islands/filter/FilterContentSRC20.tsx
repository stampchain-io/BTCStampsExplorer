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
}

const Checkbox = ({ label, checked, onChange }: CheckboxProps) => {
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
        type="checkbox"
        checked={checked}
        readOnly
      />
      <label className={filterLabelSm(checked, canHover)}>
        {label}
      </label>
    </div>
  );
};

interface RangeInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: "number" | "price" | "percentage" | "date";
}

const RangeInput = (
  { label, placeholder, value, onChange, type }: RangeInputProps,
) => (
  <div className="flex flex-col space-y-1 pt-[9px]">
    <label className="text-xs text-stamp-table-text">{label}</label>
    <input
      type={type === "date" ? "date" : "text"}
      value={value}
      onKeyDown={(e) => {
        if (
          ["e", "E", "+", "-"].includes(e.key) ||
          (type === "number" && e.key === ".")
        ) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        const value = e.target.value;

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
        } else if (type === "percentage") {
          // For percentage, allow decimals with custom validation
          let sanitized = value.replace(/[^0-9.]/g, "");
          const parts = sanitized.split(".");

          // Ensure only one decimal point
          if (parts.length > 2) {
            sanitized = parts[0] + "." + parts[1];
          }

          // Limit decimal places to 2
          if (parts.length === 2 && parts[1].length > 2) {
            sanitized = parts[0] + "." + parts[1].slice(0, 2);
          }

          if (sanitized !== value) {
            onChange(sanitized);
          } else {
            onChange(value);
          }
        } else if (type === "number") {
          // For number, only allow integers
          if (/^\d*$/.test(value)) {
            onChange(value);
          }
        } else {
          // For date or other types, pass through
          onChange(value);
        }
      }}
      min="0"
      step={type === "price"
        ? "0.00000001"
        : type === "percentage"
        ? "0.01"
        : "1"}
      inputMode={type === "date" ? "text" : "decimal"}
      pattern={type === "price"
        ? "[0-9]*[.]?[0-9]*"
        : type === "percentage"
        ? "[0-9]*[.]?[0-9]*"
        : "[0-9]*"}
      className="h-10 mobileLg:h-11 px-3 mobileLg:px-4 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
      placeholder={placeholder}
    />
  </div>
);

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
      return filters.market.marketcap.min !== "" ||
        filters.market.marketcap.max !== "" ||
        filters.market.volume.min !== "" ||
        filters.market.volume.max !== "" ||
        filters.market.priceChange.period !== "" ||
        filters.market.priceChange.direction !== "" ||
        filters.market.priceChange.percentage !== "";
    case "details":
      return filters.details.deploy.from !== "" ||
        filters.details.deploy.to !== "" ||
        filters.details.supply.min !== "" ||
        filters.details.supply.max !== "" ||
        filters.details.holders.min !== "" ||
        filters.details.holders.max !== "";
    case "mint":
      return filters.mint.minting ||
        filters.mint.trendingMints ||
        filters.mint.mintProgress.min !== "" ||
        filters.mint.mintProgress.max !== "";
    case "marketcap":
      return filters.market.marketcap.min !== "" ||
        filters.market.marketcap.max !== "";
    case "volume":
      return filters.market.volume.min !== "" ||
        filters.market.volume.max !== "";
    case "priceChange":
      return filters.market.priceChange.period !== "" ||
        filters.market.priceChange.direction !== "" ||
        filters.market.priceChange.percentage !== "";
    case "deploy":
      return filters.details.deploy.from !== "" ||
        filters.details.deploy.to !== "";
    case "supply":
      return filters.details.supply.min !== "" ||
        filters.details.supply.max !== "";
    case "holders":
      return filters.details.holders.min !== "" ||
        filters.details.holders.max !== "";
    case "mintProgress":
      return filters.mint.mintProgress.min !== "" ||
        filters.mint.mintProgress.max !== "";
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

  // Add this effect to watch for changes to initialFilters
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const [expandedSections, setExpandedSections] = useState({
    market: hasActiveFilters("market", filters),
    details: hasActiveFilters("details", filters),
    mint: hasActiveFilters("mint", filters),
    marketcap: hasActiveFilters("marketcap", filters),
    volume: hasActiveFilters("volume", filters),
    priceChange: hasActiveFilters("priceChange", filters),
    deploy: hasActiveFilters("deploy", filters),
    supply: hasActiveFilters("supply", filters),
    holders: hasActiveFilters("holders", filters),
    mintProgress: hasActiveFilters("mintProgress", filters),
  });

  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    500,
  );

  const handleFilterChange = (category: string, value: unknown) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: typeof value === "object"
          ? { ...prevFilters[category], ...value }
          : value,
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

  const filterCollectionSm =
    "flex justify-end text-xs mobileLg:text-sm font-light text-stamp-grey-darker mt-1 mobileLg:mt-0 -mb-5 cursor-default";

  return (
    <div className="space-y-1 mobileLg:space-y-1.5">
      {/* MARKET SECTION */}
      <CollapsibleSection
        title="MARKET"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="header"
      >
        {/* Market Cap Range */}
        <CollapsibleSection
          title="MARKET CAP"
          section="marketcap"
          expanded={expandedSections.marketcap}
          toggle={() => toggleSection("marketcap")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="MIN"
              placeholder="0.00000000"
              type="price"
              value={filters.market.marketcap.min || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  marketcap: {
                    ...filters.market.marketcap,
                    min: value,
                  },
                });
              }}
            />
            <RangeInput
              label="MAX"
              placeholder="∞ BTC"
              type="price"
              value={filters.market.marketcap.max || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  marketcap: {
                    ...filters.market.marketcap,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Volume Range */}
        <CollapsibleSection
          title="VOLUME"
          section="volume"
          expanded={expandedSections.volume}
          toggle={() => toggleSection("volume")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="MIN"
              placeholder="0.00000000"
              type="price"
              value={filters.market.volume.min || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  volume: {
                    ...filters.market.volume,
                    min: value,
                  },
                });
              }}
            />
            <RangeInput
              label="MAX"
              placeholder="∞ BTC"
              type="price"
              value={filters.market.volume.max || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  volume: {
                    ...filters.market.volume,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Price Change */}
        <CollapsibleSection
          title="PRICE CHANGE"
          section="priceChange"
          expanded={expandedSections.priceChange}
          toggle={() => toggleSection("priceChange")}
          variant="subheader"
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="text-xs text-stamp-table-text mb-1 block">
                  PERIOD
                </label>
                <select
                  className="h-10 mobileLg:h-11 px-3 mobileLg:px-4 rounded-md bg-stamp-grey text-stamp-grey-darkest text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
                  value={filters.market.priceChange.period}
                  onChange={(e) => {
                    handleFilterChange("market", {
                      ...filters.market,
                      priceChange: {
                        ...filters.market.priceChange,
                        period: e.target.value as "24h" | "7d" | "",
                      },
                    });
                  }}
                >
                  <option value="">SELECT</option>
                  <option value="24h">24 HOURS</option>
                  <option value="7d">7 DAYS</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-stamp-table-text mb-1 block">
                  DIRECTION
                </label>
                <select
                  className="h-10 mobileLg:h-11 px-3 mobileLg:px-4 rounded-md bg-stamp-grey text-stamp-grey-darkest text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
                  value={filters.market.priceChange.direction}
                  onChange={(e) => {
                    handleFilterChange("market", {
                      ...filters.market,
                      priceChange: {
                        ...filters.market.priceChange,
                        direction: e.target.value as "up" | "down" | "",
                      },
                    });
                  }}
                >
                  <option value="">SELECT</option>
                  <option value="up">UP</option>
                  <option value="down">DOWN</option>
                </select>
              </div>
            </div>
            <RangeInput
              label="PERCENTAGE"
              placeholder="0.00%"
              type="percentage"
              value={filters.market.priceChange.percentage || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  priceChange: {
                    ...filters.market.priceChange,
                    percentage: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>
      </CollapsibleSection>

      {/* DETAILS SECTION */}
      <CollapsibleSection
        title="DETAILS"
        section="details"
        expanded={expandedSections.details}
        toggle={() => toggleSection("details")}
        variant="header"
      >
        {/* Deploy Date Range */}
        <CollapsibleSection
          title="DEPLOY DATE"
          section="deploy"
          expanded={expandedSections.deploy}
          toggle={() => toggleSection("deploy")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="FROM"
              placeholder="SELECT DATE"
              type="date"
              value={filters.details.deploy.from || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  deploy: {
                    ...filters.details.deploy,
                    from: value,
                  },
                });
              }}
            />
            <RangeInput
              label="TO"
              placeholder="SELECT DATE"
              type="date"
              value={filters.details.deploy.to || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  deploy: {
                    ...filters.details.deploy,
                    to: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Supply Range */}
        <CollapsibleSection
          title="SUPPLY"
          section="supply"
          expanded={expandedSections.supply}
          toggle={() => toggleSection("supply")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="MIN"
              placeholder="0"
              type="number"
              value={filters.details.supply.min || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  supply: {
                    ...filters.details.supply,
                    min: value,
                  },
                });
              }}
            />
            <RangeInput
              label="MAX"
              placeholder="∞"
              type="number"
              value={filters.details.supply.max || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  supply: {
                    ...filters.details.supply,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>

        {/* Holders Range */}
        <CollapsibleSection
          title="HOLDERS"
          section="holders"
          expanded={expandedSections.holders}
          toggle={() => toggleSection("holders")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="MIN"
              placeholder="0"
              type="number"
              value={filters.details.holders.min || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  holders: {
                    ...filters.details.holders,
                    min: value,
                  },
                });
              }}
            />
            <RangeInput
              label="MAX"
              placeholder="∞"
              type="number"
              value={filters.details.holders.max || ""}
              onChange={(value) => {
                handleFilterChange("details", {
                  ...filters.details,
                  holders: {
                    ...filters.details.holders,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>
      </CollapsibleSection>

      {/* MINT SECTION */}
      <CollapsibleSection
        title="MINT"
        section="mint"
        expanded={expandedSections.mint}
        toggle={() => toggleSection("mint")}
        variant="header"
      >
        <Checkbox
          label="MINTING"
          checked={filters.mint.minting}
          onChange={() => {
            handleFilterChange("mint", {
              ...filters.mint,
              minting: !filters.mint.minting,
            });
          }}
        />
        <Checkbox
          label="TRENDING MINTS"
          checked={filters.mint.trendingMints}
          onChange={() => {
            handleFilterChange("mint", {
              ...filters.mint,
              trendingMints: !filters.mint.trendingMints,
            });
          }}
        />

        {/* Mint Progress Range */}
        <CollapsibleSection
          title="MINT PROGRESS"
          section="mintProgress"
          expanded={expandedSections.mintProgress}
          toggle={() => toggleSection("mintProgress")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label="MIN %"
              placeholder="0"
              type="percentage"
              value={filters.mint.mintProgress.min || ""}
              onChange={(value) => {
                handleFilterChange("mint", {
                  ...filters.mint,
                  mintProgress: {
                    ...filters.mint.mintProgress,
                    min: value,
                  },
                });
              }}
            />
            <RangeInput
              label="MAX %"
              placeholder="100"
              type="percentage"
              value={filters.mint.mintProgress.max || ""}
              onChange={(value) => {
                handleFilterChange("mint", {
                  ...filters.mint,
                  mintProgress: {
                    ...filters.mint.mintProgress,
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentSRC20;
