import { useEffect, useState } from "preact/hooks";
import { FILTER_TYPES, STAMP_TYPES } from "globals";

const filters: FILTER_TYPES[] = ["pixel", "recursive", "vector"];
const sorts = ["Latest", "Oldest"];

interface FilterItemProps {
  title: FILTER_TYPES;
  value: FILTER_TYPES[];
  onChange: (id: FILTER_TYPES) => void;
}

interface SortItemProps {
  title: string;
  onChange: (id: string) => void;
  value: string;
}

const FilterItem = ({ title, onChange, value }: FilterItemProps) => (
  <div
    class="flex items-center cursor-pointer py-2 px-2"
    onClick={() => onChange(title)}
  >
    <input
      type="checkbox"
      checked={value.includes(title)}
      class="form-checkbox h-5 w-5 text-[#8800CC] border-[#8A8989] rounded bg-[#3F2A4E] focus:ring-[#8800CC]"
      onChange={() => onChange(title)}
    />
    <span class="text-white ml-2">{title}</span>
  </div>
);

const SortItem = ({ title, onChange, value }: SortItemProps) => (
  <div
    class={`flex items-center cursor-pointer py-2 px-2 ${
      value === title ? "text-[#8800CC]" : "text-white"
    }`}
    onClick={() => onChange(title)}
  >
    <span>{title}</span>
  </div>
);

export function StampNavigator(
  { initFilter, initSort, initType, selectedTab }: {
    initFilter?: FILTER_TYPES[];
    initSort?: string;
    initType?: STAMP_TYPES;
    selectedTab: STAMP_TYPES;
  },
) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FILTER_TYPES[]>(
    initFilter || [],
  );
  const [localSort, setLocalSort] = useState<string>(initSort || "DESC");

  useEffect(() => {
    if (initFilter) setLocalFilters(initFilter);
    if (initSort) setLocalSort(initSort);
  }, [initFilter, initSort, initType]);

  const handleSortChange = (value: string) => {
    const newSortOrder = value === "Latest" ? "DESC" : "ASC";
    setLocalSort(newSortOrder);
    updateURL({ sortBy: newSortOrder });
  };

  const handleFilterChange = (value: FILTER_TYPES) => {
    setLocalFilters((prevFilters) => {
      const newFilters = prevFilters.includes(value)
        ? prevFilters.filter((f) => f !== value)
        : [...prevFilters, value];
      updateURL({ filterBy: newFilters });
      return newFilters;
    });
  };

  const updateURL = (params: {
    sortBy?: string;
    filterBy?: FILTER_TYPES[];
    type?: STAMP_TYPES;
  }) => {
    if (typeof self !== "undefined") {
      const url = new URL(self.location.href);
      if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
      if (params.filterBy !== undefined) {
        if (params.filterBy.length > 0) {
          url.searchParams.set("filterBy", params.filterBy.join(","));
        } else {
          url.searchParams.delete("filterBy");
        }
      }
      if (params.type) url.searchParams.set("type", params.type);
      if (!params.type) url.searchParams.set("type", selectedTab);

      url.searchParams.set("page", "1");
      self.history.pushState({}, "", url.toString());
      self.dispatchEvent(
        new CustomEvent("urlChanged", { detail: url.toString() }),
      );

      // Force page reload
      self.location.href = url.toString();
    }
  };

  return (
    <div class="relative">
      <button
        class="bg-[#3F2A4E] hover:bg-[#5503A6] text-white flex justify-between items-center p-4 min-w-[120px] w-[120px] h-[54px] rounded cursor-pointer mb-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span class="text-xl">Filter</span>
        <img
          src={isOpen ? "/img/icon_filter_hover.png" : "/img/icon_filter.png"}
          class="w-[18px] h-[12px]"
          alt="Filter icon"
        />
      </button>
      {isOpen && (
        <div class="absolute top-full left-0 z-[100] bg-[#3E2F4C] text-white p-6 rounded-lg shadow-lg min-w-[250px]">
          <div class="mb-6">
            <span class="text-lg font-semibold mb-2 block">Filter by:</span>
            <div class="flex flex-wrap border-b border-[#8A8989] py-2">
              {filters.map((item) => (
                <FilterItem
                  key={`${item}-${localFilters.includes(item)}`}
                  title={item}
                  onChange={handleFilterChange}
                  value={localFilters}
                />
              ))}
            </div>
          </div>
          <div>
            <span class="text-lg font-semibold mb-2 block">Sort by:</span>
            <div class="flex flex-wrap border-b border-[#8A8989] py-2">
              {sorts.map((item) => (
                <SortItem
                  key={item}
                  title={item}
                  onChange={handleSortChange}
                  value={localSort === "DESC" ? "Latest" : "Oldest"}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
