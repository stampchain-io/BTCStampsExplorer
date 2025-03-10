import { ComponentChildren, useRef, useState } from "preact/hooks";
import { STAMP_SUFFIX_FILTERS } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

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
          isHeader ? "justify-between py-3 mobileLg:py-4" : "mt-2 mobileLg:mt-3"
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
  type: "stamp" | "price";
}

const RangeInput = (
  { label, placeholder, value, onChange, type }: RangeInputProps,
) => (
  <div className="flex flex-col space-y-1 pt-[9px]">
    <label className="text-xs text-stamp-table-text">{label}</label>
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
      className="h-10 mobileLg:h-11 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
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

const defaultFilters = {
  market: {
    atomic: false,
    dispenser: false,
    trendingSales: false,
    sold: false,
    priceRange: {
      min: "",
      max: "",
    },
  },
  fileType: {
    jpg: false,
    png: false,
    gif: false,
    webp: false,
    avif: false,
    bmp: false,
    mp3: false,
    svg: false,
    html: false,
    legacy: false,
    olga: false,
  },
  editions: {
    locked: false,
    oneOfOne: false,
    multiple: false,
    unlocked: false,
    divisible: false,
  },
  rarity: {
    sub: false,
    stampRange: {
      min: "",
      max: "",
    },
  },
};

export function filtersToQueryParams(
  search: string,
  filters: typeof defaultFilters,
) {
  const queryParams = new URLSearchParams(search);
  Object.entries(filters).forEach(([category, value]) => {
    if (typeof value !== null && typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        // Handle rarity parameters
        if (category === "rarity") {
          // If we have stampRange values, ignore sub
          if (key === "stampRange") {
            // Always clean up stampRange parameters first
            queryParams.delete(`${category}[${key}][min]`);
            queryParams.delete(`${category}[${key}][max]`);

            // Only add parameters if we have non-empty values
            if (val.min && val.min.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][min]`, val.min);
            }
            if (val.max && val.max.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][max]`, val.max);
            }
          } else if (key === "sub" && val) {
            queryParams.set(`${category}[${key}]`, val.toString());
          }
          return;
        }

        // Handle price range
        if (category === "market" && key === "priceRange") {
          // Always clean up priceRange parameters first
          queryParams.delete(`${category}[${key}][min]`);
          queryParams.delete(`${category}[${key}][max]`);

          // Only add parameters if we have non-empty values
          if (val.min && val.min.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][min]`, val.min);
          }
          if (val.max && val.max.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][max]`, val.max);
          }
          return;
        }

        const strVal = val.toString();
        if (typeof val === "boolean") {
          if (strVal !== "false") {
            queryParams.set(`${category}[${key}]`, strVal);
          } else {
            queryParams.delete(`${category}[${key}]`);
          }
        } else if (val !== "") {
          queryParams.set(`${category}[${key}]`, strVal);
        }
      });
    }
  });
  return queryParams.toString();
}

export function filtersToServicePayload(filters: typeof defaultFilters) {
  const filterPayload = {
    vector: {
      suffixFilters: [] as Partial<
        typeof filterOptions["vector"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    pixel: {
      suffixFilters: [] as Partial<
        typeof filterOptions["pixel"]["suffixFilters"]
      >,
      ident: ["STAMP, SRC-721"],
    },
    recursive: {
      suffixFilters: [] as Partial<
        typeof filterOptions["recursive"]["suffixFilters"]
      >,
      ident: ["SRC-721"],
    },
    audio: {
      suffixFilters: [] as Partial<
        typeof filterOptions["audio"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    encoding: {
      suffixFilters: [] as Partial<
        typeof filterOptions["encoding"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
  };

  // JPG/JPEG (combined)
  if (filters.fileType.jpg) {
    filterPayload.pixel.suffixFilters.push("jpg");
    filterPayload.pixel.suffixFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.png) {
    filterPayload.pixel.suffixFilters.push("png");
  }

  // GIF
  if (filters.fileType.gif) {
    filterPayload.pixel.suffixFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.webp) {
    filterPayload.pixel.suffixFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.avif) {
    filterPayload.pixel.suffixFilters.push("avif");
  }

  // BMP
  if (filters.fileType.bmp) {
    filterPayload.pixel.suffixFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.mp3) {
    filterPayload.audio.suffixFilters.push("mp3");
    filterPayload.audio.suffixFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.svg) {
    filterPayload.vector.suffixFilters.push("svg");
    filterPayload.recursive.suffixFilters.push("svg");
  }

  // HTML
  if (filters.fileType.html) {
    filterPayload.vector.suffixFilters.push("html");
    filterPayload.recursive.suffixFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.legacy) {
    filterPayload.encoding.suffixFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.olga) {
    filterPayload.encoding.suffixFilters.push("olga");
  }

  const suffixFilters = Object.entries(filterPayload).reduce(
    (acc, [key, value]) => {
      if (value.suffixFilters.length > 0) {
        acc.push(...value.suffixFilters);
      }
      return acc;
    },
    [] as STAMP_SUFFIX_FILTERS[],
  );

  return {
    ident: [],
    suffixFilters: Array.from(new Set(suffixFilters)),
  };
}

// export function queryParamsToServicePayload(query: URLSearchParams): {
//   filterBy: STAMP_FILTER_TYPES[];
// } {
//   return {
//     filterBy: [],
//   };
// }

export const allQueryKeysFromFilters = [
  // Market filters
  "market[atomic]",
  "market[dispenser]",
  "market[trendingSales]",
  "market[sold]",
  "market[priceRange][min]",
  "market[priceRange][max]",

  // File type filters
  "fileType[jpg]",
  "fileType[jpeg]",
  "fileType[png]",
  "fileType[gif]",
  "fileType[webp]",
  "fileType[avif]",
  "fileType[bmp]",
  "fileType[mp3]",
  "fileType[mpeg]",
  "fileType[svg]",
  "fileType[html]",
  "fileType[legacy]",
  "fileType[olga]",

  // Editions filters
  "editions[locked]",
  "editions[oneOfOne]",
  "editions[multiple]",
  "editions[unlocked]",
  "editions[divisible]",

  // Rarity filters
  "rarity[sub]",
  "rarity[stampRange][min]",
  "rarity[stampRange][max]",
];

export function queryParamsToFilters(search: string) {
  const queryParams = new URLSearchParams(search);
  const filters = { ...defaultFilters };

  // Parse market params
  if (queryParams.get("market[atomic]") === "true") {
    filters.market.atomic = true;
  }
  if (queryParams.get("market[dispenser]") === "true") {
    filters.market.dispenser = true;
  }
  if (queryParams.get("trendingSales") === "true") {
    filters.market.trendingSales = true;
  }
  if (queryParams.get("sold") === "true") {
    filters.market.sold = true;
  }

  // Parse market price range
  const marketPriceMin = queryParams.get("market[priceRange][min]");
  const marketPriceMax = queryParams.get("market[priceRange][max]");
  if (marketPriceMin) {
    filters.market.priceRange.min = marketPriceMin;
  }
  if (marketPriceMax) {
    filters.market.priceRange.max = marketPriceMax;
  }

  // Parse editions params
  if (queryParams.get("editions[locked]") === "true") {
    filters.editions.locked = true;
  }
  if (queryParams.get("editions[oneOfOne]") === "true") {
    filters.editions.oneOfOne = true;
  }
  if (queryParams.get("editions[multiple]") === "true") {
    filters.editions.multiple = true;
  }
  if (queryParams.get("editions[unlocked]") === "true") {
    filters.editions.unlocked = true;
  }
  if (queryParams.get("editions[divisible]") === "true") {
    filters.editions.divisible = true;
  }

  // Parse fileType params
  if (
    queryParams.get("fileType[jpg]") === "true" ||
    queryParams.get("fileType[jpeg]") === "true"
  ) {
    filters.fileType.jpg = true;
  }
  if (queryParams.get("fileType[png]") === "true") {
    filters.fileType.png = true;
  }
  if (queryParams.get("fileType[gif]") === "true") {
    filters.fileType.gif = true;
  }
  if (queryParams.get("fileType[webp]") === "true") {
    filters.fileType.webp = true;
  }
  if (queryParams.get("fileType[avif]") === "true") {
    filters.fileType.avif = true;
  }
  if (queryParams.get("fileType[bmp]") === "true") {
    filters.fileType.bmp = true;
  }
  if (
    queryParams.get("fileType[mp3]") === "true" ||
    queryParams.get("fileType[mpeg]") === "true"
  ) {
    filters.fileType.mp3 = true;
  }
  if (queryParams.get("fileType[svg]") === "true") {
    filters.fileType.svg = true;
  }
  if (queryParams.get("fileType[html]") === "true") {
    filters.fileType.html = true;
  }
  if (queryParams.get("fileType[legacy]") === "true") {
    filters.fileType.legacy = true;
  }
  if (queryParams.get("fileType[olga]") === "true") {
    filters.fileType.olga = true;
  }

  // Parse rarity params
  const raritySubParam = queryParams.get("rarity[sub]");
  if (raritySubParam) {
    filters.rarity.sub = raritySubParam === "true";
  }

  // Parse rarity range params
  const rarityMinParam = queryParams.get("rarity[stampRange][min]");
  if (rarityMinParam) {
    filters.rarity.stampRange.min = rarityMinParam;
  }
  const rarityMaxParam = queryParams.get("rarity[stampRange][max]");
  if (rarityMaxParam) {
    filters.rarity.stampRange.max = rarityMaxParam;
  }

  return filters;
}

export function queryParamsToServicePayload(search: string) {
  const filters = queryParamsToFilters(search);
  // Convert filters to service payload format
  // This will depend on what your service expects
  return {
    // Map the filters to the format expected by your service
    // This is just an example - adjust based on your actual service requirements
    fileTypes: Object.entries(filters.fileType)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    market: Object.entries(filters.market)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    editions: Object.entries(filters.editions)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    rarity: filters.rarity,
    priceRange: filters.market.priceRange,
  };
}

const Radio = ({ label, value, checked, onChange }) => {
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
        name="rarity"
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

// Helper function to check if a section has active filters
function hasActiveFilters(section: string, filters: typeof defaultFilters) {
  switch (section) {
    case "fileType":
      return Object.values(filters.fileType).some((value) => value === true);
    case "editions":
      return Object.values(filters.editions).some((value) => value === true);
    case "rarity":
      return filters.rarity.sub !== false ||
        filters.rarity.stampRange.min !== "" ||
        filters.rarity.stampRange.max !== "";
    case "market":
      return filters.market.atomic ||
        filters.market.dispenser ||
        filters.market.trendingSales ||
        filters.market.sold ||
        filters.market.priceRange.min !== "" ||
        filters.market.priceRange.max !== "";
    case "customRange": // For rarity custom range subsection
      return filters.rarity.stampRange.min !== "" ||
        filters.rarity.stampRange.max !== "";
    case "priceRange": // For market price range subsection
      return filters.market.priceRange.min !== "" ||
        filters.market.priceRange.max !== "";
    default:
      return false;
  }
}

export const StampDrawerFilters = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: typeof defaultFilters;
  onFiltersChange: (filters: typeof defaultFilters) => void;
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    fileType: hasActiveFilters("fileType", filters),
    editions: hasActiveFilters("editions", filters),
    rarity: hasActiveFilters("rarity", filters),
    market: hasActiveFilters("market", filters),
    customRange: hasActiveFilters("customRange", filters),
    priceRange: hasActiveFilters("priceRange", filters),
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

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  return (
    <div className="space-y-1 mobileLg:space-y-1.5">
      <CollapsibleSection
        title="MARKET"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="header"
      >
        <Checkbox
          label="ATOMIC LISTINGS"
          checked={filters.market.atomic}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              atomic: !filters.market.atomic,
            })}
        />
        <Checkbox
          label="DISPENSERS"
          checked={filters.market.dispenser}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              dispenser: !filters.market.dispenser,
            })}
        />
        <Checkbox
          label="TRENDING SALES"
          checked={filters.market.trendingSales}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              trendingSales: !filters.market.trendingSales,
            })}
        />
        <Checkbox
          label="SOLD"
          checked={filters.market.sold}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              sold: !filters.market.sold,
            })}
        />

        {/* Price Range Filter */}
        <CollapsibleSection
          title="PRICE RANGE"
          section="priceRange"
          expanded={expandedSections.priceRange}
          toggle={() => toggleSection("priceRange")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label=""
              placeholder="0.00000000"
              type="price"
              value={filters.market.priceRange.min || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  priceRange: {
                    min: value,
                    max: filters.market.priceRange.max || "",
                  },
                });
              }}
            />
            <RangeInput
              label=""
              placeholder="∞ BTC"
              type="price"
              value={filters.market.priceRange.max || ""}
              onChange={(value) => {
                handleFilterChange("market", {
                  ...filters.market,
                  priceRange: {
                    min: filters.market.priceRange.min || "",
                    max: value,
                  },
                });
              }}
            />
          </div>
        </CollapsibleSection>
      </CollapsibleSection>

      <CollapsibleSection
        title="FILE TYPE"
        section="fileType"
        expanded={expandedSections.fileType}
        toggle={() => toggleSection("fileType")}
        variant="header"
      >
        {Object.entries({
          "JPG/JPEG": "jpg",
          "PNG": "png",
          "GIF": "gif",
          "WEBP": "webp",
          "AVIF": "avif",
          "BMP": "bmp",
          "MP3/MPEG": "mp3",
          "SVG": "svg",
          "HTML": "html",
          "LEGACY": "legacy",
          "OLGA": "olga",
        }).map(([label, key]) => (
          <Checkbox
            key={key}
            label={label}
            checked={filters.fileType[key]}
            onChange={() =>
              handleFilterChange("fileType", {
                ...filters.fileType,
                [key]: !filters.fileType[key],
              })}
          />
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="EDITIONS"
        section="editions"
        expanded={expandedSections["editions"]}
        toggle={() => toggleSection("editions")}
        variant="header"
      >
        <Checkbox
          label="1/1"
          checked={filters.editions.oneOfOne}
          onChange={() =>
            handleFilterChange("editions", {
              oneOfOne: !filters.editions.oneOfOne,
            })}
        />
        <Checkbox
          label="MULTIPLE"
          checked={filters.editions.multiple}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              multiple: !filters.editions.multiple,
            })}
        />
        <Checkbox
          label="LOCKED"
          checked={filters.editions.locked}
          onChange={() =>
            handleFilterChange("editions", {
              locked: !filters.editions.locked,
            })}
        />
        <Checkbox
          label="UNLOCKED"
          checked={filters.editions.unlocked}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              unlocked: !filters.editions.unlocked,
            })}
        />
        <Checkbox
          label="DIVISIBLE"
          checked={filters.editions.divisible}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              divisible: !filters.editions.divisible,
            })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="RARITY"
        section="rarity"
        expanded={expandedSections["rarity"]}
        toggle={() => toggleSection("rarity")}
        variant="header"
      >
        {[100, 1000, 5000, 10000].map((value) => (
          <Radio
            key={value}
            label={`< ${value}`}
            checked={filters.rarity?.sub === value.toString()}
            onChange={() => {
              if (filters.rarity?.sub === value.toString()) {
                // Unselect the radio button
                handleFilterChange("rarity", {
                  sub: false,
                  stampRange: {
                    min: filters.rarity?.stampRange?.min || "",
                    max: filters.rarity?.stampRange?.max || "",
                  },
                });
              } else {
                // Select the radio button and clear stampRange
                handleFilterChange("rarity", {
                  sub: value.toString(),
                  stampRange: {
                    min: "", // Clear min
                    max: "", // Clear max
                  },
                });
              }
            }}
          />
        ))}

        {/* Custom Range Section */}
        <CollapsibleSection
          title="CUSTOM RANGE"
          section="customRange"
          expanded={expandedSections.customRange}
          toggle={() => toggleSection("customRange")}
          variant="subheader"
        >
          <div className="flex gap-6 placeholder:text-xs">
            <RangeInput
              label=""
              placeholder="MIN"
              type="stamp"
              value={filters.rarity.stampRange.min || ""}
              onChange={(value) => {
                handleFilterChange("rarity", {
                  ...filters.rarity,
                  sub: false,
                  stampRange: {
                    min: value,
                    max: filters.rarity.stampRange.max || "",
                  },
                });
              }}
            />
            <RangeInput
              label=""
              placeholder="MAX"
              type="stamp"
              value={filters.rarity.stampRange.max || ""}
              onChange={(value) => {
                handleFilterChange("rarity", {
                  ...filters.rarity,
                  sub: false,
                  stampRange: {
                    min: filters.rarity.stampRange.min || "",
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

export default StampDrawerFilters;
