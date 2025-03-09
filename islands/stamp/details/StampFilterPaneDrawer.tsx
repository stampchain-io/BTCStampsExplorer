import { useRef, useState } from "preact/hooks";
import { STAMP_SUFFIX_FILTERS } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

const chevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6"
  >
    <path d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z" />
  </svg>
);

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
  inline-block ml-[9px] mobileLg:ml-3 mt-0.5 text-sm mobileLg:text-base font-bold 
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

const FilterSection = ({
  title,
  section,
  expanded,
  toggle,
  children,
}: {
  title: string;
  section: string;
  expanded: boolean;
  toggle: () => void;
  children: ComponentChildren;
}) => {
  const [canHover, setCanHover] = useState(true);

  const handleClick = () => {
    toggle();
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        className="flex items-center justify-between w-full py-1.5 mobileLg:py-3 text-lg mobileLg:text-xl font-light group"
      >
        <span
          className={`${
            expanded
              ? `text-stamp-grey ${
                canHover ? "group-hover:text-stamp-grey-light" : ""
              }`
              : `text-stamp-grey-light ${
                canHover ? "group-hover:text-stamp-grey" : ""
              }`
          } transition-colors duration-300`}
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
            {chevronIcon()}
          </div>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-1.5 pb-3 pl-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

const Checkbox = ({ label, checked, onChange }) => {
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
      className="flex items-center cursor-pointer py-1 group"
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

const RangeInput = (
  { label, placeholder, value, onChange },
) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-stamp-table-text">{label}</label>
    <input
      type="number"
      value={value}
      onKeyDown={(e) => {
        // Prevent e, +, -, E, comma, and diaeresis
        if (["e", "E", "+", "-", ",", "¨"].includes(e.key)) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        const value = e.target.value;
        // Only allow digits
        if (/^\d*$/.test(value)) {
          onChange(value);
        }
      }}
      min="0"
      step="1"
      inputMode="numeric"
      pattern="[0-9]*"
      className="h-10 mobileLg:h-11 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
      placeholder={placeholder}
    />
  </div>
);

function useDebouncedCallback(callback: Function, delay: number) {
  const timeoutRef = useRef(null);

  function debouncedCallback(...args) {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callback?.(...args);
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
  rarityPreset: "",
  rarity: {
    min: "",
    max: "",
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
        const strVal = val.toString();
        if (typeof val === "boolean") {
          if (strVal !== "false") {
            if (queryParams.has(`${category}[${key}]`)) {
              queryParams.set(`${category}[${key}]`, strVal);
            } else {
              queryParams.append(`${category}[${key}]`, strVal);
            }
          } else {
            if (queryParams.has(`${category}[${key}]`)) {
              queryParams.delete(`${category}[${key}]`);
            }
          }
        } else if (val !== "") {
          queryParams.set(`${category}[${key}]`, strVal);
        }
      });
    } else {
      if (value === null) {
        // continue on nulls
        return;
      }
      const strVal = value.toString();
      if (typeof value === "boolean" && strVal !== "false") {
        queryParams.set(category, strVal);
      } else if (typeof value === "number") {
        queryParams.set(category, String(value));
      } else if (value !== "") {
        queryParams.set(category, strVal);
      }
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
  "rarityPreset",
  "rarity[min]",
  "rarity[max]",
];

export function queryParamsToFilters(search: string) {
  const queryParams = new URLSearchParams(search);
  const filters = { ...defaultFilters };

  // Parse search param
  const searchParam = queryParams.get("search");
  if (searchParam) {
    filters.search = searchParam;
  }

  // Parse boolean params
  if (queryParams.get("forSale") === "true") {
    filters.market.forSale = true;
  }
  if (queryParams.get("trendingSales") === "true") {
    filters.market.trendingSales = true;
  }
  if (queryParams.get("sold") === "true") {
    filters.market.sold = true;
  }

  // Parse market params
  if (queryParams.get("market[atomic]") === "true") {
    filters.market.atomic = true;
  }
  if (queryParams.get("market[dispenser]") === "true") {
    filters.market.dispenser = true;
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

  // Parse rarityPreset
  const rarityPresetParam = queryParams.get("rarityPreset");
  if (rarityPresetParam) {
    filters.rarityPreset = rarityPresetParam;
  }

  // Parse rarity params
  const rarityMinParam = queryParams.get("rarity[min]");
  if (rarityMinParam) {
    filters.rarity.min = rarityMinParam;
  }
  const rarityMaxParam = queryParams.get("rarity[max]");
  if (rarityMaxParam) {
    filters.rarity.max = rarityMaxParam;
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
      .filter(([key, value]) =>
        value && key !== "priceRange" && key !== "forSale" &&
        key !== "trendingSales" && key !== "sold"
      )
      .map(([key]) => key),
    editions: Object.entries(filters.editions)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    forSale: filters.market.forSale,
    trendingSales: filters.market.trendingSales,
    sold: filters.market.sold,
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
      className="flex items-center cursor-pointer py-1 group"
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

export const StampDrawerFilters = ({
  initialFilters,
}) => {
  const [filters, setFilters] = useState(initialFilters);
  console.log("[StampDrawerFilters] Initial filters:", initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    market: true,
    fileType: false,
    editions: false,
    rarity: false,
  });
  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    500,
  );

  const handleFilterChange = (category, value) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: typeof value === "object"
          ? { ...prevFilters[category], ...value }
          : value,
      };

      debouncedOnFilterChange?.(
        filtersToQueryParams(globalThis.location.search, newFilters),
      );
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    // onFilterChange(defaultFilters);
    const queryParams = new URLSearchParams(globalThis.location.search);
    allQueryKeysFromFilters.forEach((key) => {
      queryParams.delete(key);
    });
    debouncedOnFilterChange?.(
      queryParams.toString(),
    );
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const buttonGreyOutline =
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-semibold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

  return (
    <div className="space-y-1.5 mobileLg:space-y-3">
      <FilterSection
        title="MARKET"
        section="market"
        expanded={expandedSections["market"]}
        toggle={() => toggleSection("market")}
      >
        <div className="space-y-[3px] mobileLg:space-y-1.5">
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
          <div className="!mt-3">
            <div className="flex items-center mb-[3px]">
              <p className="text-sm text-stamp-grey font-medium">
                PRICE RANGE
              </p>
            </div>
            <div className="flex gap-6 placeholder:text-xs">
              <RangeInput
                label=""
                placeholder="0.00000000"
                value={filters.market.priceRange.min}
                onChange={(value: string) =>
                  handleFilterChange("market", {
                    ...filters.market,
                    priceRange: {
                      ...filters.market.priceRange,
                      min: value,
                    },
                  })}
              />
              <RangeInput
                label=""
                placeholder="∞ BTC"
                value={filters.market.priceRange.max}
                onChange={(value: string) =>
                  handleFilterChange("market", {
                    ...filters.market,
                    priceRange: {
                      ...filters.market.priceRange,
                      max: value,
                    },
                  })}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      <FilterSection
        title="FILE TYPE"
        section="fileType"
        expanded={expandedSections["fileType"]}
        toggle={() => toggleSection("fileType")}
      >
        <div className="space-y-[3px] mobileLg:space-y-1.5">
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
              checked={filters.fileType[key.toLowerCase()]}
              onChange={() =>
                handleFilterChange("fileType", {
                  [key]: !filters.fileType[key],
                })}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="EDITIONS"
        section="editions"
        expanded={expandedSections["editions"]}
        toggle={() => toggleSection("editions")}
      >
        <div className="space-y-[3px] mobileLg:space-y-1.5">
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
        </div>
      </FilterSection>

      <FilterSection
        title="RARITY"
        section="rarity"
        expanded={expandedSections["rarity"]}
        toggle={() => toggleSection("rarity")}
      >
        <div className="space-y-4">
          <div className="space-y-[3px] mobileLg:space-y-1.5">
            {[100, 1000, 5000, 10000].map((value) => (
              <Radio
                key={value}
                label={`< ${value}`}
                value={value}
                checked={filters.rarity.min === "0" &&
                  filters.rarity.max === value.toString()}
                onChange={() => {
                  // If checked, uncheck by clearing the values
                  if (
                    filters.rarity.min === "0" &&
                    filters.rarity.max === value.toString()
                  ) {
                    handleFilterChange("rarity", {
                      min: "",
                      max: "",
                    });
                    handleFilterChange("rarityPreset", "");

                    // Update URL by removing rarity parameters
                    const queryParams = new URLSearchParams(
                      globalThis.location.search,
                    );
                    queryParams.delete("rarity[min]");
                    queryParams.delete("rarity[max]");
                    queryParams.delete("rarityPreset");
                    debouncedOnFilterChange?.(queryParams.toString());
                  } else {
                    // If not checked, set the values
                    handleFilterChange("rarity", {
                      min: "0",
                      max: value.toString(),
                    });
                    handleFilterChange("rarityPreset", value);
                  }
                }}
              />
            ))}
          </div>

          {/* Stamp Range Filter */}
          <div className="!mt-3">
            <div className="flex items-center mb-[3px]">
              <p className="text-sm mobileLg:text-base text-stamp-grey font-light">
                CUSTOM RANGE
              </p>
            </div>
            <div className="flex gap-6 placeholder:text-xs">
              <RangeInput
                label=""
                placeholder="MIN"
                value={filters.rarity.min}
                onChange={(value: string) =>
                  handleFilterChange("rarity", {
                    min: value,
                    max: filters.rarity.max,
                  })}
              />
              <RangeInput
                label=""
                placeholder="MAX"
                value={filters.rarity.max}
                onChange={(value: string) =>
                  handleFilterChange("rarity", {
                    min: filters.rarity.min,
                    max: value,
                  })}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Clear Filters Button */}
      <div className="!mt-6">
        <button
          onClick={clearAllFilters}
          className={`w-full ${buttonGreyOutline}`}
        >
          CLEAR FILTERS
        </button>
      </div>
    </div>
  );
};

export default StampDrawerFilters;
