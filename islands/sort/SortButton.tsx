import { useEffect, useState } from "preact/hooks";
import { Icon } from "$components/icon/IconBase.tsx";

interface SortProps {
  searchParams?: URLSearchParams | undefined;
}

export function SortButton({ searchParams }: SortProps) {
  // Initialize sort based on URL parameter
  const [sort, setSort] = useState<"ASC" | "DESC">(
    searchParams?.get("sortOrder")?.includes("asc") ? "ASC" : "DESC",
  );

  // Update sort state when URL changes
  useEffect(() => {
    if (typeof globalThis !== "undefined" && globalThis?.location) {
      const currentSort = new URL(globalThis.location.href)
        .searchParams.get("sortOrder");
      setSort(currentSort?.includes("asc") ? "ASC" : "DESC");
    }
  }, []);

  const handleSort = () => {
    const url = new URL(globalThis.location.href);
    const currentSort = url.searchParams.get("sortOrder") || "index_desc";

    // Toggle between index_asc and index_desc
    const isAscending = currentSort === "index_asc";
    const newParam = isAscending ? "index_desc" : "index_asc";
    const newSort = isAscending ? "DESC" : "ASC";

    setSort(newSort);

    // Update URL and reload page
    url.searchParams.set("sortOrder", newParam);
    globalThis.location.href = url.toString();
  };

  return (
    <Icon
      type="iconLink"
      name={sort === "DESC" ? "sortAsc" : "sortDesc"}
      weight="bold"
      size="custom"
      color="purple"
      className="mt-[5px] w-[26px] h-[26px] tablet:w-[24px] tablet:h-[24px] transform transition-all duration-300"
      ariaLabel={`Sort ${sort === "DESC" ? "ascending" : "descending"}`}
      onClick={handleSort}
    />
  );
}
