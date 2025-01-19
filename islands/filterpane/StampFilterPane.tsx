import { useRef, useState } from "preact/hooks";
// import { ChevronDown, ChevronUp, Search, Sliders, X } from "lucide-react";

const ChevronUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const SlidersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 6h16M4 12h8m-8 6h16M14 5v2m0 6v2m0 6v2"
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
  <label className="flex items-center space-x-2 py-1 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="rounded border-purple-300 text-stamp-table-text focus:ring-purple-500"
    />
    <span className="text-sm text-stamp-grey">{label}</span>
  </label>
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
  fileType: {
    svg: false,
    pixel: false,
    gif: false,
    html: false,
    olga: false,
    src721: false,
    src101: false,
  },
  stampRange: {
    min: "",
    max: "",
  },
  priceRange: {
    min: "",
    max: "",
  },
  sortOrder: "descending",
};

export function filtersToQueryParams(
  search: string,
  filters: typeof defaultFilters,
) {
  const queryParams = new URLSearchParams(search);
  Object.entries(filters).forEach(([category, value]) => {
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        const strVal = val.toString();
        console.log(key, strVal);
        if (typeof val === "boolean") {
          if (strVal !== "false") {
            queryParams.append(`${category}[${key}]`, strVal);
          }
        } else {
          queryParams.append(`${category}[${key}]`, strVal);
        }
      });
    } else {
      const strVal = value.toString();
      if (typeof value === "boolean" && strVal !== "false") {
        queryParams.append(category, value.toString());
      }
    }
  });
  return queryParams.toString();
}

function filtersToServicePayload(filters: typeof defaultFilters) {
}

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
              filtersPartial[category] = {};
            }
            filtersPartial[category][key] = value;
          }
        });
      } else {
        const value = params.get(category);
        if (value !== null) {
          filtersPartial[category] = value;
        }
      }
    }
  });

  return {
    ...defaultFilters,
    ...filtersPartial,
  };
}

export function queryParamsToServicePayload(query: string) {
  return filtersToServicePayload(queryParamsToFilters(query));
}

export const StampFilters = (
  {
    onFilterChange,
    debounceTimeout,
    initialFilters = defaultFilters,
    showClose,
    onClose,
  },
) => {
  console.log(onFilterChange, initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    buyNow: true,
    status: true,
    fileType: true,
    stampRange: true,
    priceRange: true,
  });
  const debouncedOnFilterChange = useDebouncedCallback(
    (str) => {
      console.log("hello");
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    debounceTimeout,
  );

  const handleFilterChange = (category, value) => {
    const newFilters = {
      ...filters,
      [category]: typeof value === "object"
        ? { ...filters[category], ...value }
        : value,
    };
    setFilters(newFilters);
    debouncedOnFilterChange?.(
      filtersToQueryParams(globalThis.location.search, newFilters),
    );
    console.log(filtersToQueryParams(globalThis.location.search, newFilters));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  return (
    <div className="w-64 bg-stamp-bg-purple-dark shadow-lg rounded-lg">
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
      {
        /* <input
            type="text"
            placeholder="Search stamps..."
            className="w-full pl-10 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          /> */
      }
      {
        /* </div>
      </div> */
      }

      <div className="p-4 border-b border-stamp-purple-highlight/20">
        <button
          onClick={clearAllFilters}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-black bg-stamp-purple rounded-lg hover:bg-stamp-primary-hover transition-colors"
        >
          {/* <X size={16} className="mr-2" /> */}
          <CrossIcon /> Clear All Filters
        </button>
      </div>

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
          "OLGA": "olga",
          "SRC-721": "src721",
          "SRC-101": "src101",
        }).map(([label, key]) => (
          <Checkbox
            key={key}
            label={label}
            checked={filters.fileType[key]}
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
            {[100, 1000, 5000, 10000].map((value) => (
              <label
                key={value}
                className="flex items-center space-x-2 py-1 cursor-pointer"
              >
                <input
                  type="radio"
                  name="stampRange"
                  value={`>${value}`}
                  checked={filters.stampRange.preset === `>${value}`}
                  onChange={(e) =>
                    handleFilterChange("stampRange", {
                      preset: e.target.value,
                    })}
                  className="text-stamp-grey focus:ring-purple-500"
                />
                <span className="text-sm text-stamp-grey">
                  {`>${value.toLocaleString()}`}
                </span>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-stamp-purple-highlight/20">
            <div className="flex items-center gap-2 mb-2 text-stamp-grey-light">
              {/* <Sliders size={16} className="text-black" /> */}
              <SlidersIcon />
              <span className="text-sm font-medium text-stamp-grey-light">
                Custom Range
              </span>
            </div>
            <div className="space-y-2">
              <RangeInput
                label="Min Stamp Number"
                value={filters.stampRange.min}
                onChange={(value) =>
                  handleFilterChange("stampRange", {
                    min: value,
                    preset: "",
                    // custom: { ...filters.stampRange.custom,  },
                  })}
              />
              <RangeInput
                label="Max Stamp Number"
                value={filters.stampRange.max}
                onChange={(value) =>
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
            onChange={(value) =>
              handleFilterChange("priceRange", {
                ...filters.priceRange,
                min: value,
              })}
          />
          <RangeInput
            label="Max Price"
            value={filters.priceRange.max}
            onChange={(value) =>
              handleFilterChange("priceRange", {
                ...filters.priceRange,
                max: value,
              })}
          />
        </div>
      </FilterSection>

      <div className="p-4 border-t border-stamp-purple-highlight/20">
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
      </div>
    </div>
  );
};
