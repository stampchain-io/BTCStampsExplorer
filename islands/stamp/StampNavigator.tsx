import { useEffect, useState } from "preact/hooks";
import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

const filters: STAMP_FILTER_TYPES[] = ["pixel", "recursive", "vector"];
const sorts = ["Latest", "Oldest"];

interface FilterItemProps {
  title: STAMP_FILTER_TYPES;
  value: STAMP_FILTER_TYPES[];
  onChange: (id: STAMP_FILTER_TYPES) => void;
}

interface SortItemProps {
  title: string;
  onChange: (id: string) => void;
  value: string;
}

const FilterItem = (
  { title, onChange, value }: FilterItemProps,
) => (
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
  { initFilter, initSort, initType, selectedTab, open1, handleOpen1 }: {
    initFilter?: STAMP_FILTER_TYPES[];
    initSort?: string;
    initType?: STAMP_TYPES;
    selectedTab: STAMP_TYPES;
    open1: boolean;
    handleOpen1: (open: boolean) => void;
  },
) {
  const [localFilters, setLocalFilters] = useState<STAMP_FILTER_TYPES[]>(
    initFilter || [],
  );
  const [localSort, setLocalSort] = useState<string>(initSort || "DESC");

  useEffect(() => {
    if (initFilter) setLocalFilters(initFilter);
    if (initSort) setLocalSort(initSort);
  }, [initFilter, initSort, initType]);

  const handleSortChange = (value: string) => {
    setLocalSort(value);
    updateURL({ sortBy: value });
  };

  const handleFilterChange = (value: STAMP_FILTER_TYPES) => {
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
    filterBy?: STAMP_FILTER_TYPES[];
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
    <div class="relative flex items-center gap-3">
      <button
        onClick={() => handleSortChange(localSort === "DESC" ? "ASC" : "DESC")}
        className={"border-2 border-[#660099] px-[10px] py-[10px] rounded-md"}
      >
        {localSort === "DESC"
          ? <img src="/img/stamp/SortAscending.png" alt="Sort ascending" />
          : <img src="/img/stamp/SortDescending.png" alt="Sort descending" />}
      </button>
      <div class="border-2 border-[rgb(102,0,153)] px-[10px] py-[10px] rounded-md flex items-center gap-3 max-h-[40px]">
        {open1 && (
          <>
            <button
              className={"cursor-pointer text-sm font-black text-[#660099]"}
              onClick={() => handleFilterChange("for_sale")}
            >
              FOR SALE
            </button>
            <button
              className={"cursor-pointer text-sm font-black text-[#660099]"}
              onClick={() => handleFilterChange("sold")}
            >
              SOLD
            </button>
            <button
              className={"cursor-pointer text-sm font-black text-[#660099]"}
              onClick={() => handleFilterChange("pixel")}
            >
              PIXEL
            </button>
            <button
              className={"cursor-pointer text-sm font-black text-[#660099]"}
              onClick={() => handleFilterChange("vector")}
            >
              VECTOR
            </button>
            <img
              className={"cursor-pointer"}
              src="/img/stamp/navigator-close.png"
              alt="Navigator close"
              onClick={() => handleOpen1(false)}
            />
          </>
        )}
        {!open1 && (
          <img
            className={"cursor-pointer"}
            src="/img/stamp/navigator-list.png"
            alt="Navigator list"
            onClick={() => handleOpen1(true)}
          />
        )}
      </div>
    </div>
  );
}
