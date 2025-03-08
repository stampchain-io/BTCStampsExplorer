import { useRef, useState } from "preact/hooks";
import { STAMP_SUFFIX_FILTERS } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6"
  >
    <path d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z" />
  </svg>
);

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
            <ChevronIcon />
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

const Checkbox = ({ label, checked, onChange }) => (
  // <label className="flex items-center space-x-2 py-1 cursor-pointer">
  //   <input
  //     type="checkbox"
  //     checked={checked}
  //     onChange={onChange}
  //     className="rounded border-purple-300 text-stamp-table-text focus:ring-purple-500"
  //   />
  //   <span className="text-sm text-stamp-grey">{label}</span>
  // </label>
  <div className="flex items-center cursor-pointer py-1">
    <input
      className={`
        appearance-none
        w-4 h-4 mobileLg:w-[18px] mobileLg:h-[18px]
        border-2 border-stamp-grey
        rounded-sm
        cursor-pointer
        relative
        transition-colors duration-300
        
        before:content-['']
        before:block
        before:w-1.5 before:h-1.5 mobileLg:before:w-2 mobileLg:before:h-2
        before:rounded-[1px]
        before:absolute
        before:top-1/2 before:left-1/2
        before:-translate-x-1/2 before:-translate-y-1/2
        before:bg-stamp-grey-light
        before:scale-0
        checked:before:scale-100
        before:transition-all
        before:duration-100
      `}
      type="checkbox"
      checked={checked}
      value={checked}
      onChange={onChange}
    />
    <label
      className="inline-block pl-[0.15rem] hover:cursor-pointer text-stamp-grey ml-1 select-none"
      htmlFor="inlineCheckbox1"
    >
      {label}
    </label>
  </div>
);

const RangeInput = (
  { label, value, onChange, placeholder = "Enter value" },
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
    "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

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
            {[100, 1000, 5000, 10000].map((value) => {
              return (
                <div className="flex items-center space-x-2 py-1 cursor-pointer">
                  <input
                    className="relative float-left h-5 w-5 text-stamp-grey focus:ring-stamp-grey appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-white checked:after:bg-white checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s]"
                    type="radio"
                    id={`rarity-${value}`}
                    name="rarity"
                    value={value}
                    checked={filters.rarity.min === "1" &&
                      filters.rarity.max === value.toString()}
                    onChange={() => {
                      handleFilterChange("rarity", {
                        min: "1",
                        max: value.toString(),
                      });
                      handleFilterChange("rarityPreset", value);
                    }}
                  />
                  <label
                    htmlFor={`rarity-${value}`}
                    className="text-sm text-stamp-grey select-none"
                  >
                    1 - {value}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="!mt-3">
            <div className="flex items-center mb-[3px]">
              <p className="text-sm text-stamp-grey font-medium">
                PRICE RANGE
              </p>
            </div>
            <div className="flex gap-6 placeholder:text-xs">
              <RangeInput
                label=""
                value={filters.rarity.min}
                onChange={(value: string) =>
                  handleFilterChange("rarity", {
                    min: value,
                    max: filters.rarity.max,
                  })}
              />
              <RangeInput
                label=""
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
