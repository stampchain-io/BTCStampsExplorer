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

const RangeInput = ({ label, value, onChange }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-stamp-table-text">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min="0"
      className="w-full px-2 py-1 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      placeholder="Enter value"
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
  status: {
    locked: false,
    oneOfOne: false,
  },
  forSale: false,
  trendingSales: false,
  sold: false,
  fileType: {
    svg: false,
    pixel: false,
    gif: false,
    jpg: false,
    png: false,
    webp: false,
    bmp: false,
    jpeg: false,
    html: false,
    olga: false,
    src721: false,
    src101: false,
  },
  stampRangePreset: 10000,
  stampRange: {
    min: "",
    max: "",
  },
  priceRange: {
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
  // "pixel"
  // "vector"
  // "for sale"
  // "trending sales"
  // "sold"
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
  };

  if (filters.fileType.svg) {
    filterPayload.vector.suffixFilters.push("svg");
    filterPayload.recursive.suffixFilters.push("svg");
  }

  if (filters.fileType.gif) {
    filterPayload.pixel.suffixFilters.push("gif");
  }

  if (filters.fileType.html) {
    filterPayload.vector.suffixFilters.push("html");
    filterPayload.recursive.suffixFilters.push("html");
  }

  if (filters.fileType.jpg) {
    filterPayload.pixel.suffixFilters.push("jpg");
  }

  if (filters.fileType.jpeg) {
    filterPayload.pixel.suffixFilters.push("jpeg");
  }

  if (filters.fileType.png) {
    filterPayload.pixel.suffixFilters.push("png");
  }

  if (filters.fileType.webp) {
    filterPayload.pixel.suffixFilters.push("webp");
  }

  if (filters.fileType.bmp) {
    filterPayload.pixel.suffixFilters.push("bmp");
  }
  // jpg
  // png
  // webp
  // bmp
  // jpeg;

  // if (filters.fileType.olga) {
  //   filterPayload.pixel.suffixFilters.push("olga");
  // }

  // if (filters.fileType.src721) {
  //   filterPayload.pixel.suffixFilters.push("src721");
  //   filterPayload.recursive.suffixFilters.push("src721");
  // }

  // if (filters.fileType.src101) {
  //   filterPayload.pixel.suffixFilters.push("src101");
  // }

  // const ident = Object.entries(filterPayload).reduce((acc, [key, value]) => {
  //   if (value.suffixFilters.length > 0) {
  //     acc.push(...value.ident);
  //   }
  //   return acc;
  // }, [] as ("STAMP" | "SRC-721")[]);

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
    // handle all for now
    ident: [], // Array.from(new Set(ident)),
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
  "status[locked]",
  "status[oneOfOne]",
  "forSale",
  "trendingSales",
  "sold",
  "stampRangePreset",
  "stampRange[min]",
  "stampRange[max]",
  "priceRange[min]",
  "priceRange[max]",
  // Add any other filter keys used in the application
  // File type filters
  "fileType[svg]",
  "fileType[pixel]",
  "fileType[gif]",
  "fileType[jpg]",
  "fileType[png]",
  "fileType[webp]",
  "fileType[bmp]",
  "fileType[jpeg]",
  "fileType[html]",
  "fileType[olga]",
  "fileType[src721]",
  "fileType[src101]",
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
    filters.forSale = true;
  }
  if (queryParams.get("trendingSales") === "true") {
    filters.trendingSales = true;
  }
  if (queryParams.get("sold") === "true") {
    filters.sold = true;
  }

  // Parse buyNow params
  if (queryParams.get("buyNow[atomic]") === "true") {
    filters.buyNow.atomic = true;
  }
  if (queryParams.get("buyNow[dispenser]") === "true") {
    filters.buyNow.dispenser = true;
  }

  // Parse status params
  if (queryParams.get("status[locked]") === "true") {
    filters.status.locked = true;
  }
  if (queryParams.get("status[oneOfOne]") === "true") {
    filters.status.oneOfOne = true;
  }

  // Parse fileType params
  Object.keys(filters.fileType).forEach((key) => {
    if (queryParams.get(`fileType[${key}]`) === "true") {
      filters.fileType[key] = true;
    }
  });

  // Parse stampRangePreset
  const stampRangePresetParam = queryParams.get("stampRangePreset");
  if (stampRangePresetParam) {
    filters.stampRangePreset = parseInt(stampRangePresetParam, 10);
  }

  // Parse stampRange params
  const stampRangeMinParam = queryParams.get("stampRange[min]");
  if (stampRangeMinParam) {
    filters.stampRange.min = stampRangeMinParam;
  }
  const stampRangeMaxParam = queryParams.get("stampRange[max]");
  if (stampRangeMaxParam) {
    filters.stampRange.max = stampRangeMaxParam;
  }

  // Parse priceRange params
  const priceRangeMinParam = queryParams.get("priceRange[min]");
  if (priceRangeMinParam) {
    filters.priceRange.min = priceRangeMinParam;
  }
  const priceRangeMaxParam = queryParams.get("priceRange[max]");
  if (priceRangeMaxParam) {
    filters.priceRange.max = priceRangeMaxParam;
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
    status: Object.entries(filters.status)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    forSale: filters.forSale,
    trendingSales: filters.trendingSales,
    sold: filters.sold,
    stampRange: filters.stampRange,
    priceRange: filters.priceRange,
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
    status: true,
    market: true,
    fileType: true,
    stampRange: true,
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
        title="Buy Now"
        section="buyNow"
        expanded={expandedSections["buyNow"]}
        toggle={() => toggleSection("buyNow")}
      >
        <Checkbox
          label="Atomic"
          checked={filters.buyNow.atomic}
          onChange={() =>
            handleFilterChange("buyNow", { atomic: !filters.buyNow.atomic })}
        />
        <Checkbox
          label="Dispenser"
          checked={filters.buyNow.dispenser}
          onChange={() =>
            handleFilterChange("buyNow", {
              dispenser: !filters.buyNow.dispenser,
            })}
        />
      </FilterSection>

      <FilterSection
        title="Status"
        section="status"
        expanded={expandedSections["status"]}
        toggle={() => toggleSection("status")}
      >
        <Checkbox
          label="Locked"
          checked={filters.status.locked}
          onChange={() =>
            handleFilterChange("status", { locked: !filters.status.locked })}
        />
        <Checkbox
          label="1/1"
          checked={filters.status.oneOfOne}
          onChange={() =>
            handleFilterChange("status", {
              oneOfOne: !filters.status.oneOfOne,
            })}
        />
      </FilterSection>

      <FilterSection
        title="Market"
        section="market"
        expanded={expandedSections["market"]}
        toggle={() => toggleSection("market")}
      >
        <Checkbox
          label="For sale"
          checked={filters.forSale}
          onChange={() => handleFilterChange("forSale", !filters.forSale)}
        />
        <Checkbox
          label="Trending sales"
          checked={filters.trendingSales}
          onChange={() =>
            handleFilterChange("trendingSales", !filters.trendingSales)}
        />
        <Checkbox
          label="Sold"
          checked={filters.sold}
          onChange={() => handleFilterChange("sold", !filters.sold)}
        />
      </FilterSection>

      <FilterSection
        title="File Type"
        section="fileType"
        expanded={expandedSections["fileType"]}
        toggle={() => toggleSection("fileType")}
      >
        {Object.entries({
          "SVG": "svg",
          "Pixel": "pixel",
          "GIF": "gif",
          "HTML": "html",
          "JPG": "jpg",
          "PNG": "png",
          "WEBP": "webp",
          "BMP": "bmp",
          "JPEG": "jpeg",
          "OLGA": "olga",
          "SRC-721": "src721",
          "SRC-101": "src101",
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
        title="Stamp Range"
        section="stampRange"
        expanded={expandedSections["stampRange"]}
        toggle={() => toggleSection("stampRange")}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            {[100, 1000, 5000, 10000].map((value) => {
              return (
                <div className="flex items-center space-x-2 py-1 cursor-pointer">
                  <input
                    className="relative float-left h-5 w-5 text-stamp-grey focus:ring-stamp-grey appearance-none rounded-full border-2 border-solid border-neutral-300 before:pointer-events-none before:absolute before:h-4 before:w-4 before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] after:absolute after:z-[1] after:block after:h-4 after:w-4 after:rounded-full after:content-[''] checked:border-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:left-1/2 checked:after:top-1/2 checked:after:h-[0.625rem] checked:after:w-[0.625rem] checked:after:rounded-full checked:after:border-white checked:after:bg-white checked:after:content-[''] checked:after:[transform:translate(-50%,-50%)] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:outline-none focus:ring-0 focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:border-primary checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s]"
                    type="radio"
                    name="stampRange"
                    value={value}
                    checked={filters.stampRange.min === "" &&
                      filters.stampRange.max === "" &&
                      Number(filters.stampRangePreset) === Number(value)}
                    onChange={(e: any) => {
                      handleFilterChange(
                        "stampRangePreset",
                        parseInt(e.target.value),
                      );
                    }}
                  />
                  <label
                    className="text-sm text-stamp-grey select-none"
                    htmlFor="inlineRadio1"
                  >
                    {`>${value.toLocaleString()}`}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stamp-purple-highlight/20">
            <div className="flex items-center gap-2 mb-2 text-stamp-grey-light">
              {/* <Sliders size={16} className="text-black" /> */}
              {/* <SlidersIcon /> */}
              <span className="text-sm font-medium text-stamp-grey-light">
                Custom Range
              </span>
            </div>
            <div className="space-y-2">
              <RangeInput
                label="Min Stamp Number"
                value={filters.stampRange.min}
                onChange={(value: string) =>
                  handleFilterChange("stampRange", {
                    min: value,
                    preset: "",
                    // custom: { ...filters.stampRange.custom,  },
                  })}
              />
              <RangeInput
                label="Max Stamp Number"
                value={filters.stampRange.max}
                onChange={(value: string) =>
                  handleFilterChange("stampRange", {
                    max: value,
                    preset: "",
                    // custom: { ...filters.stampRange.custom,  },
                  })}
              />
            </div>
          </div>
        </div>
      </FilterSection>

      <FilterSection
        title="Price Filter"
        section="priceRange"
        expanded={expandedSections["priceRange"]}
        toggle={() => toggleSection("priceRange")}
      >
        <div className="space-y-2">
          <RangeInput
            label="Min Price"
            value={filters.priceRange.min}
            onChange={(value: string) =>
              handleFilterChange("priceRange", {
                ...filters.priceRange,
                min: value,
              })}
          />
          <RangeInput
            label="Max Price"
            value={filters.priceRange.max}
            onChange={(value: string) =>
              handleFilterChange("priceRange", {
                ...filters.priceRange,
                max: value,
              })}
          />
        </div>
      </FilterSection>

      {
        /* <div className="p-4 border-t border-stamp-purple-highlight/20">
        <label className="block text-sm font-medium mb-2 text-stamp-grey">
          Sort By
        </label>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
          className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-stamp-grey"
        >
          <option value="index_desc">Stamp Index: High to Low</option>
          <option value="index_asc">Stamp Index: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="price_asc">Price: Low to High</option>
        </select>
      </div> */
      }

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
