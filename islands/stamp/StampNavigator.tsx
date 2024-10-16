import { useEffect, useState } from "preact/hooks";
import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

interface StampNavigatorProps {
  initFilter?: STAMP_FILTER_TYPES[];
  initSort?: "ASC" | "DESC";
  initType?: STAMP_TYPES;
  open1: boolean;
  handleOpen1: (open: boolean) => void;
}

export function StampNavigator({
  initFilter = [],
  initSort = "DESC",
  initType,
  open1,
  handleOpen1,
}: StampNavigatorProps) {
  const [localFilters, setLocalFilters] = useState<STAMP_FILTER_TYPES[]>(
    initFilter,
  );
  const [localSort, setLocalSort] = useState<"ASC" | "DESC">(initSort);

  useEffect(() => {
    setLocalFilters(initFilter);
    setLocalSort(initSort);
  }, [initFilter, initSort, initType]);

  const updateURL = (
    params: Partial<{
      sortBy: "ASC" | "DESC";
      filterBy: STAMP_FILTER_TYPES[];
      type: STAMP_TYPES;
    }>,
  ) => {
    if (typeof self === "undefined") return;

    const url = new URL(self.location.href);
    if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
    if (params.filterBy !== undefined) {
      params.filterBy.length > 0
        ? url.searchParams.set("filterBy", params.filterBy.join(","))
        : url.searchParams.delete("filterBy");
    }
    if (params.type) url.searchParams.set("type", params.type);
    url.searchParams.set("page", "1");

    self.history.pushState({}, "", url.toString());
    self.dispatchEvent(
      new CustomEvent("urlChanged", { detail: url.toString() }),
    );
    self.location.href = url.toString();
  };

  const handleSortChange = () => {
    const newSort = localSort === "DESC" ? "ASC" : "DESC";
    setLocalSort(newSort);
    updateURL({ sortBy: newSort });
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

  const filterButtons: STAMP_FILTER_TYPES[] = [
    "pixel",
    "vector",
    "for_sale",
    "trendy sales",
    "sold",
  ];

  return (
    <div class="relative flex items-center gap-3">
      <button
        onClick={handleSortChange}
        class="border-2 border-[#660099] px-[10px] py-[10px] rounded-md"
      >
        <img
          src={`/img/stamp/Sort${
            localSort === "DESC" ? "Ascending" : "Descending"
          }.png`}
          alt={`Sort ${localSort === "DESC" ? "ascending" : "descending"}`}
        />
      </button>
      <div class="border-2 border-[#660099] px-6 py-4 rounded-md flex flex-col items-center gap-1 relative">
        {open1
          ? (
            <>
              <img
                class="cursor-pointer absolute top-5 right-2"
                src="/img/stamp/navigator-close.png"
                alt="Navigator close"
                onClick={() => handleOpen1(false)}
              />
              <p className="text-lg font-black text-[#AA00FF] mb-1">FILTERS</p>
              {filterButtons.map((filter) => (
                <button
                  key={filter}
                  class="cursor-pointer text-xs md:text-sm font-black text-[#660099] hover:text-[#AA00FF]"
                  onClick={() => handleFilterChange(filter)}
                >
                  {filter.toUpperCase()}
                </button>
              ))}
            </>
          )
          : (
            <img
              class="cursor-pointer"
              src="/img/stamp/navigator-list.png"
              alt="Navigator list"
              onClick={() => handleOpen1(true)}
            />
          )}
      </div>
    </div>
  );
}
