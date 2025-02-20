import { useRef, useState } from "preact/hooks";
// import { ChevronDown, ChevronUp, Search, Sliders, X } from "lucide-react";
import { useBreakpoints } from "$lib/hooks/useBreakpoints.ts";
import { STAMP_SUFFIX_FILTERS } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";

const ChevronUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M26.7075 20.7076C26.6146 20.8005 26.5043 20.8743 26.3829 20.9246C26.2615 20.9749 26.1314 21.0008 26 21.0008C25.8686 21.0008 25.7385 20.9749 25.6171 20.9246C25.4957 20.8743 25.3854 20.8005 25.2925 20.7076L16 11.4138L6.70751 20.7076C6.51987 20.8952 6.26537 21.0006 6.00001 21.0006C5.73464 21.0006 5.48015 20.8952 5.29251 20.7076C5.10487 20.5199 4.99945 20.2654 4.99945 20.0001C4.99945 19.7347 5.10487 19.4802 5.29251 19.2926L15.2925 9.29255C15.3854 9.19958 15.4957 9.12582 15.6171 9.07549C15.7385 9.02517 15.8686 8.99927 16 8.99927C16.1314 8.99927 16.2615 9.02517 16.3829 9.07549C16.5043 9.12582 16.6146 9.19958 16.7075 9.29255L26.7075 19.2926C26.8005 19.3854 26.8742 19.4957 26.9246 19.6171C26.9749 19.7385 27.0008 19.8686 27.0008 20.0001C27.0008 20.1315 26.9749 20.2616 26.9246 20.383C26.8742 20.5044 26.8005 20.6147 26.7075 20.7076Z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z"
      fill="currentColor"
    />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M25.7076 24.2925C25.8005 24.3854 25.8742 24.4957 25.9245 24.6171C25.9747 24.7385 26.0006 24.8686 26.0006 25C26.0006 25.1314 25.9747 25.2615 25.9245 25.3829C25.8742 25.5043 25.8005 25.6146 25.7076 25.7075C25.6147 25.8004 25.5044 25.8741 25.383 25.9244C25.2616 25.9747 25.1315 26.0006 25.0001 26.0006C24.8687 26.0006 24.7386 25.9747 24.6172 25.9244C24.4958 25.8741 24.3855 25.8004 24.2926 25.7075L16.0001 17.4138L7.70757 25.7075C7.51993 25.8951 7.26543 26.0006 7.00007 26.0006C6.7347 26.0006 6.48021 25.8951 6.29257 25.7075C6.10493 25.5199 5.99951 25.2654 5.99951 25C5.99951 24.7346 6.10493 24.4801 6.29257 24.2925L14.5863 16L6.29257 7.70751C6.10493 7.51987 5.99951 7.26537 5.99951 7.00001C5.99951 6.73464 6.10493 6.48015 6.29257 6.29251C6.48021 6.10487 6.7347 5.99945 7.00007 5.99945C7.26543 5.99945 7.51993 6.10487 7.70757 6.29251L16.0001 14.5863L24.2926 6.29251C24.4802 6.10487 24.7347 5.99945 25.0001 5.99945C25.2654 5.99945 25.5199 6.10487 25.7076 6.29251C25.8952 6.48015 26.0006 6.73464 26.0006 7.00001C26.0006 7.26537 25.8952 7.51987 25.7076 7.70751L17.4138 16L25.7076 24.2925Z"
      fill="currentColor"
    />
  </svg>
);

const SlidersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M8.00003 13.125V5C8.00003 4.73478 7.89467 4.48043 7.70714 4.29289C7.5196 4.10536 7.26525 4 7.00003 4C6.73481 4 6.48046 4.10536 6.29292 4.29289C6.10539 4.48043 6.00003 4.73478 6.00003 5V13.125C5.13962 13.3453 4.37699 13.8457 3.83239 14.5473C3.28779 15.2489 2.99219 16.1118 2.99219 17C2.99219 17.8882 3.28779 18.7511 3.83239 19.4527C4.37699 20.1543 5.13962 20.6547 6.00003 20.875V27C6.00003 27.2652 6.10539 27.5196 6.29292 27.7071C6.48046 27.8946 6.73481 28 7.00003 28C7.26525 28 7.5196 27.8946 7.70714 27.7071C7.89467 27.5196 8.00003 27.2652 8.00003 27V20.875C8.86045 20.6547 9.62307 20.1543 10.1677 19.4527C10.7123 18.7511 11.0079 17.8882 11.0079 17C11.0079 16.1118 10.7123 15.2489 10.1677 14.5473C9.62307 13.8457 8.86045 13.3453 8.00003 13.125ZM7.00003 19C6.60447 19 6.21779 18.8827 5.88889 18.6629C5.55999 18.4432 5.30365 18.1308 5.15227 17.7654C5.0009 17.3999 4.96129 16.9978 5.03846 16.6098C5.11563 16.2219 5.30611 15.8655 5.58582 15.5858C5.86552 15.3061 6.22189 15.1156 6.60985 15.0384C6.99781 14.9613 7.39995 15.0009 7.7654 15.1522C8.13085 15.3036 8.44321 15.56 8.66297 15.8889C8.88273 16.2178 9.00003 16.6044 9.00003 17C9.00003 17.5304 8.78932 18.0391 8.41424 18.4142C8.03917 18.7893 7.53046 19 7.00003 19ZM17 7.125V5C17 4.73478 16.8947 4.48043 16.7071 4.29289C16.5196 4.10536 16.2652 4 16 4C15.7348 4 15.4805 4.10536 15.2929 4.29289C15.1054 4.48043 15 4.73478 15 5V7.125C14.1396 7.3453 13.377 7.8457 12.8324 8.54731C12.2878 9.24892 11.9922 10.1118 11.9922 11C11.9922 11.8882 12.2878 12.7511 12.8324 13.4527C13.377 14.1543 14.1396 14.6547 15 14.875V27C15 27.2652 15.1054 27.5196 15.2929 27.7071C15.4805 27.8946 15.7348 28 16 28C16.2652 28 16.5196 27.8946 16.7071 27.7071C16.8947 27.5196 17 27.2652 17 27V14.875C17.8604 14.6547 18.6231 14.1543 19.1677 13.4527C19.7123 12.7511 20.0079 11.8882 20.0079 11C20.0079 10.1118 19.7123 9.24892 19.1677 8.54731C18.6231 7.8457 17.8604 7.3453 17 7.125ZM16 13C15.6045 13 15.2178 12.8827 14.8889 12.6629C14.56 12.4432 14.3036 12.1308 14.1523 11.7654C14.0009 11.3999 13.9613 10.9978 14.0385 10.6098C14.1156 10.2219 14.3061 9.86549 14.5858 9.58579C14.8655 9.30608 15.2219 9.1156 15.6098 9.03843C15.9978 8.96126 16.3999 9.00087 16.7654 9.15224C17.1308 9.30362 17.4432 9.55996 17.663 9.88886C17.8827 10.2178 18 10.6044 18 11C18 11.5304 17.7893 12.0391 17.4142 12.4142C17.0392 12.7893 16.5305 13 16 13ZM29 21C28.9992 20.1132 28.7042 19.2517 28.1614 18.5505C27.6185 17.8493 26.8584 17.3479 26 17.125V5C26 4.73478 25.8947 4.48043 25.7071 4.29289C25.5196 4.10536 25.2652 4 25 4C24.7348 4 24.4805 4.10536 24.2929 4.29289C24.1054 4.48043 24 4.73478 24 5V17.125C23.1396 17.3453 22.377 17.8457 21.8324 18.5473C21.2878 19.2489 20.9922 20.1118 20.9922 21C20.9922 21.8882 21.2878 22.7511 21.8324 23.4527C22.377 24.1543 23.1396 24.6547 24 24.875V27C24 27.2652 24.1054 27.5196 24.2929 27.7071C24.4805 27.8946 24.7348 28 25 28C25.2652 28 25.5196 27.8946 25.7071 27.7071C25.8947 27.5196 26 27.2652 26 27V24.875C26.8584 24.6521 27.6185 24.1507 28.1614 23.4495C28.7042 22.7483 28.9992 21.8868 29 21ZM25 23C24.6045 23 24.2178 22.8827 23.8889 22.6629C23.56 22.4432 23.3036 22.1308 23.1523 21.7654C23.0009 21.3999 22.9613 20.9978 23.0385 20.6098C23.1156 20.2219 23.3061 19.8655 23.5858 19.5858C23.8655 19.3061 24.2219 19.1156 24.6098 19.0384C24.9978 18.9613 25.3999 19.0009 25.7654 19.1522C26.1308 19.3036 26.4432 19.56 26.663 19.8889C26.8827 20.2178 27 20.6044 27 21C27 21.5304 26.7893 22.0391 26.4142 22.4142C26.0392 22.7893 25.5305 23 25 23Z"
      fill="currentColor"
    />
  </svg>
);

const FilterSection = ({ title, children, section, expanded, toggle }) => (
  <div className="border-b border-stamp-purple-highlight/20 py-4">
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between px-4 py-2 text-lg font-medium text-stamp-table-text"
    >
      {title}
      {expanded ? <ChevronUp /> : <ChevronDown />}
    </button>
    {expanded && (
      <div className="px-4 pt-2">
        {children}
      </div>
    )}
  </div>
);

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
      className="relative float-left h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:focus:after:-mt-px checked:focus:after:ml-[0.25rem] checked:focus:after:h-[0.8125rem] checked:focus:after:w-[0.375rem] checked:focus:after:rotate-45 checked:focus:after:rounded-none checked:focus:after:border-[0.125rem] checked:focus:after:border-l-0 checked:focus:after:border-t-0 checked:focus:after:border-solid checked:focus:after:border-white checked:focus:after:bg-transparent dark:border-neutral-600 dark:checked:border-primary dark:checked:bg-primary dark:focus:before:shadow-[0px_0px_0px_13px_rgba(255,255,255,0.4)] dark:checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca]"
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
  search: "",
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

export const allQueryKeysFromFilters = Object.keys(defaultFilters).reduce(
  (acc, key) => {
    if (typeof defaultFilters[key] === "object") {
      Object.keys(defaultFilters[key]).forEach((subKey) => {
        acc.push(`${key}[${subKey}]`);
      });
    } else {
      acc.push(key);
    }
    return acc;
  },
  [],
);

export function queryParamsToFilters(query: string) {
  const params = new URLSearchParams(query);
  const filtersPartial = {};
  Object.keys(defaultFilters).forEach((category) => {
    if (category in defaultFilters) {
      const filter = defaultFilters[category];
      if (typeof filter === "object") {
        Object.keys(filter).forEach((key) => {
          const value = params.get(`${category}[${key}]`);
          if (value !== null) {
            if (!filtersPartial[category]) {
              filtersPartial[category] = { ...defaultFilters[category] };
            }
            const coercedValue =
              typeof defaultFilters[category][key] === "boolean"
                ? JSON.parse(value)
                : typeof defaultFilters[category][key] === "number"
                ? parseInt(value)
                : value;
            filtersPartial[category][key] = coercedValue;
          }
        });
      } else {
        const value = params.get(category);
        if (value !== null) {
          const coercedValue = typeof defaultFilters[category] === "boolean"
            ? JSON.parse(value)
            : typeof defaultFilters[category] === "number"
            ? parseInt(value)
            : value;
          filtersPartial[category] = coercedValue;
        }
      }
    }
  });
  return { ...defaultFilters, ...filtersPartial };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}

export const StampFilters = (
  {
    debounceTimeout,
    initialFilters = defaultFilters,
    showClose,
    onClose,
  },
) => {
  const [filters, setFilters] = useState(initialFilters);
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

  return (
    <div class="w-full">
      {showClose && (
        <div class="flex justify-end">
          <button onClick={onClose} className="p-4 text-stamp-grey">
            <CrossIcon />
          </button>
        </div>
      )}
      {
        /* <div className="p-4 border-b border-purple-800/20">
        <div className="relative"> */
      }
      {/* 🔍 */}
      {
        /* <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400"
            size={20}
          /> */
      }

      <div className="border-b border-stamp-purple-highlight/20">
        <button
          onClick={clearAllFilters}
          variant="outline"
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-stamp-grey bg-stamp-purple rounded-lg hover:bg-stamp-primary-hover transition-colors"
        >
          {/* <X size={16} className="mr-2" /> */}
          <CrossIcon /> Clear All Filters
        </button>
      </div>

      {
        /* <input
        type="text"
        placeholder="Search stamps..."
        className="w-full pl-10 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
        initialValue={filters.search}
        value={filters.search}
        onBlur={(ev) => {
          handleFilterChange("search", ev.target.value);
        }}
      /> */
      }
      {
        /* </div>
      </div> */
      }

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
    </div>
  );
};
