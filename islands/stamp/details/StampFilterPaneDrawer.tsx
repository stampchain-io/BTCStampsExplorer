import { useEffect, useRef, useState } from "preact/hooks";
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

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 hover:fill-stamp-grey-light"
    role="button"
    aria-label="Close Filter"
    fill="url(#closeFilterGradient)"
  >
    <defs>
      <linearGradient
        id="closeFilterGradient"
        gradientTransform="rotate(-45)"
      >
        <stop offset="0%" stop-color="#666666" />
        <stop offset="50%" stop-color="#999999" />
        <stop offset="100%" stop-color="#CCCCCC" />
      </linearGradient>
    </defs>
    <path d="M26.0612 23.9387C26.343 24.2205 26.5013 24.6027 26.5013 25.0012C26.5013 25.3997 26.343 25.7819 26.0612 26.0637C25.7794 26.3455 25.3972 26.5038 24.9987 26.5038C24.6002 26.5038 24.218 26.3455 23.9362 26.0637L15.9999 18.125L8.0612 26.0612C7.7794 26.343 7.39721 26.5013 6.9987 26.5013C6.60018 26.5013 6.21799 26.343 5.9362 26.0612C5.6544 25.7794 5.49609 25.3972 5.49609 24.9987C5.49609 24.6002 5.6544 24.218 5.9362 23.9362L13.8749 16L5.9387 8.06122C5.6569 7.77943 5.49859 7.39724 5.49859 6.99872C5.49859 6.60021 5.6569 6.21802 5.9387 5.93622C6.22049 5.65443 6.60268 5.49612 7.0012 5.49612C7.39971 5.49612 7.7819 5.65443 8.0637 5.93622L15.9999 13.875L23.9387 5.93497C24.2205 5.65318 24.6027 5.49487 25.0012 5.49487C25.3997 5.49487 25.7819 5.65318 26.0637 5.93497C26.3455 6.21677 26.5038 6.59896 26.5038 6.99747C26.5038 7.39599 26.3455 7.77818 26.0637 8.05998L18.1249 16L26.0612 23.9387Z" />
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

  const ChevronIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M19.5 8.25L12 15.75L4.5 8.25"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );

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
      className="relative float-left h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
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
  buyNow: {
    atomic: false,
    dispenser: false,
  },
  editions: {
    locked: false,
    oneOfOne: false,
    multiple: false,
    unlocked: false,
    divisible: false,
  },
  market: {
    forSale: false,
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
  rarityPreset: 10000,
  rarity: {
    min: "",
    max: "",
  },
  sortOrder: "",
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
  "buyNow[atomic]",
  "buyNow[dispenser]",
  "editions[locked]",
  "editions[oneOfOne]",
  "editions[multiple]",
  "editions[unlocked]",
  "editions[divisible]",
  "forSale",
  "trendingSales",
  "sold",
  "rarityPreset",
  "rarity[min]",
  "rarity[max]",
  "priceRange[min]",
  "priceRange[max]",
  // Add any other filter keys used in the application
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
];

export function queryParamsToFilters(search: string) {
  const queryParams = new URLSearchParams(search);
  const filters = { ...defaultFilters };

  // Parse search param
  const searchParam = queryParams.get("search");
  if (searchParam) {
    filters.search = searchParam;
  }

  // Parse sort order
  const sortOrderParam = queryParams.get("sortOrder");
  if (sortOrderParam) {
    filters.sortOrder = sortOrderParam;
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

  // Parse buyNow params
  if (queryParams.get("buyNow[atomic]") === "true") {
    filters.buyNow.atomic = true;
  }
  if (queryParams.get("buyNow[dispenser]") === "true") {
    filters.buyNow.dispenser = true;
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
    filters.rarityPreset = parseInt(rarityPresetParam, 10);
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

  // Parse priceRange params
  const priceRangeMinParam = queryParams.get("priceRange[min]");
  if (priceRangeMinParam) {
    filters.market.priceRange.min = priceRangeMinParam;
  }
  const priceRangeMaxParam = queryParams.get("priceRange[max]");
  if (priceRangeMaxParam) {
    filters.market.priceRange.max = priceRangeMaxParam;
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
    buyNow: Object.entries(filters.buyNow)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    editions: Object.entries(filters.editions)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    forSale: filters.market.forSale,
    trendingSales: filters.market.trendingSales,
    sold: filters.market.sold,
    rarity: filters.rarity,
    priceRange: filters.market.priceRange,
    sortOrder: filters.sortOrder,
  };
}

export const StampDrawerFilters = (
  {
    debounceTimeout,
    initialFilters = defaultFilters,
    showClose,
    onClose,
  },
) => {
  const [filters, setFilters] = useState(initialFilters);
  console.log("[StampDrawerFilters] Initial filters:", initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    buyNow: true,
    editions: true,
    market: true,
    fileType: true,
    rarity: true,
    priceRange: true,
  });
  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    debounceTimeout,
  );

  // const handleFilterChange = (category, value) => {
  //   const newFilters = {
  //     ...filters,
  //     [category]: typeof value === "object"
  //       ? { ...filters[category], ...value }
  //       : value,
  //   };
  //   console.log("new=====>", newFilters, "====",filtersToQueryParams(globalThis.location.search, newFilters))
  // setFilters(newFilters);
  // debouncedOnFilterChange?.(
  //   filtersToQueryParams(globalThis.location.search, newFilters),
  // );
  // };

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

  // Add tooltip state for close button
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);

  // Add cleanup effect for tooltip timeout
  useEffect(() => {
    return () => {
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Replace the existing handler functions with these complete versions
  const handleCloseMouseEnter = () => {
    if (allowCloseTooltip) {
      setCloseTooltipText("CLOSE");

      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }

      closeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsCloseTooltipVisible(true);
      }, 1500);
    }
  };

  const handleCloseMouseLeave = () => {
    if (closeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(closeTooltipTimeoutRef.current);
    }
    setIsCloseTooltipVisible(false);
    setAllowCloseTooltip(true);
  };

  // Replace the existing tooltipIcon with this exact styling
  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";

  return (
    <div
      className={`
        fixed top-0 left-0 z-40 
        w-full min-[420px]:w-72 mobileLg:w-80 h-screen 
        p-6 backdrop-blur-md 
        bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 
        overflow-y-auto transition-transform scrollbar-black
        ${expandedSections["buyNow"] ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex flex-col space-y-3 mb-3 mobileLg:mb-[18px]">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            onMouseEnter={handleCloseMouseEnter}
            onMouseLeave={handleCloseMouseLeave}
            className="relative top-0 right-0 w-8 h-8 flex items-center justify-center"
          >
            <div
              className={`${tooltipIcon} ${
                isCloseTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {closeTooltipText}
            </div>
            <CrossIcon />
          </button>
        </div>
        <div className="flex justify-start">
          <p className="text-2xl mobileLg:text-3xl font-black text-stamp-grey-darker">
            FILTERS
          </p>
        </div>
      </div>

      {showClose && (
        <div class="flex justify-end">
          <button onClick={onClose} className="p-4 text-stamp-grey">
            <CrossIcon />
          </button>
        </div>
      )}

      <FilterSection
        title="FILE TYPE"
        section="fileType"
        expanded={expandedSections["fileType"]}
        toggle={() => toggleSection("fileType")}
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
            checked={filters.fileType[key.toLowerCase()]}
            onChange={() =>
              handleFilterChange("fileType", { [key]: !filters.fileType[key] })}
          />
        ))}
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
        title="MARKET"
        section="market"
        expanded={expandedSections["market"]}
        toggle={() => toggleSection("market")}
      >
        <div className="space-y-2">
          <Checkbox
            label="FOR SALE"
            checked={filters.market.forSale}
            onChange={() =>
              handleFilterChange("market", {
                ...filters.market,
                forSale: !filters.market.forSale,
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
          <div>
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
        title="RARITY"
        section="rarity"
        expanded={expandedSections["rarity"]}
        toggle={() => toggleSection("rarity")}
      >
        <div className="space-y-4">
          <div className="space-y-2">
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

          <div>
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
