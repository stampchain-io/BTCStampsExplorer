import { useBreakpoints } from "$lib/hooks/useBreakpoints.ts";
import { StampFilters } from "./StampFilterPane.tsx";

export function StampFilterWrapped({
  onFilterChange,
  filters,
}) {
  const breakpoints = useBreakpoints();
  if (
    breakpoints.isMobile() &&
    window.location.search.includes("stamp-filter-open")
  ) {
    return (
      <div class="fixed inset-y-0 left-0 w-64 bg-white overflow-y-auto z-50 shadow-xl">
        <StampFilters
          onFilterChange={onFilterChange}
          initialFilters={filters}
          showClose
          onClose={() => {
            const url = new URL(globalThis.location.href);
            if (url.searchParams.has("stamp-filter-open")) {
              url.searchParams.delete("stamp-filter-open");
            }
            globalThis.location.href = url.toString();
          }}
        />
      </div>
    );
  } else if (breakpoints.isGreaterThan("tablet")) {
    return (
      <div class="pt-4">
        <StampFilters
          onFilterChange={onFilterChange}
          initialFilters={filters}
        />
      </div>
    );
  }
}
