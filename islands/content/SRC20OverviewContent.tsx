/* ===== SRC20 OVERVIEW CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
// import { SRC20Row } from "$globals"; // Removed unused import
import { SRC20Gallery } from "$section";
import { SRC20OverviewHeader } from "$header";
import type { EnrichedSRC20Row } from "$globals"; // CHANGED: Import from $globals

/* ===== TYPES ===== */
interface SRC20OverviewContentProps {
  mintedData: {
    data: EnrichedSRC20Row[];
    total: number;
    page: number;
    totalPages: number;
  };
  mintingData: {
    data: EnrichedSRC20Row[];
    total: number;
    page: number;
    totalPages: number;
  };
  timeframe: "24H" | "3D" | "7D";
  sortBy?: string;
  sortDirection?: string;
}

/* ===== COMPONENT ===== */
export function SRC20OverviewContent({
  mintedData,
  mintingData,
  timeframe,
  sortBy = "TRENDING",
  sortDirection = "desc",
}: SRC20OverviewContentProps) {
  const [viewType, setViewType] = useState<"minted" | "minting">("minted");
  const [_currentTimeframe, setCurrentTimeframe] = useState<
    "24H" | "3D" | "7D"
  >(timeframe);
  const [currentSort, setCurrentSort] = useState<{
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null;
    direction: "asc" | "desc";
  }>({
    filter: sortBy as "TRENDING" | "DEPLOY" | "HOLDERS",
    direction: sortDirection as "asc" | "desc",
  });

  // Get the current data based on view type (sorting is done server-side)
  const getCurrentData = () => {
    return viewType === "minted" ? mintedData.data : mintingData.data;
  };

  // Handle filter changes
  const handleFilterChange = (
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null,
    direction: "asc" | "desc",
  ) => {
    setCurrentSort({ filter, direction });

    // Redirect to the same page with sort parameters
    const url = new URL(globalThis.location.href);
    url.searchParams.set("sortBy", filter || "TRENDING");
    url.searchParams.set("sortDirection", direction);
    url.searchParams.set("page", "1"); // Reset to page 1 when sorting changes
    globalThis.location.href = url.toString();
  };

  // Handle view type changes
  const handleViewTypeChange = () => {
    setViewType((prev) => prev === "minted" ? "minting" : "minted");
    setCurrentSort({ filter: "TRENDING", direction: "desc" });
  };

  const currentData = getCurrentData();

  return (
    <div class="w-full">
      <SRC20OverviewHeader
        onViewTypeChange={handleViewTypeChange}
        viewType={viewType}
        onTimeframeChange={setCurrentTimeframe}
        onFilterChange={handleFilterChange}
        currentSort={currentSort}
      />
      <SRC20Gallery
        viewType={viewType}
        fromPage="src20"
        initialData={currentData}
        timeframe={_currentTimeframe}
        pagination={{
          page: viewType === "minted" ? mintedData.page : mintingData.page,
          totalPages: viewType === "minted"
            ? mintedData.totalPages
            : mintingData.totalPages,
          onPageChange: (newPage: number) => {
            const url = new URL(globalThis.location.href);
            url.searchParams.set("page", newPage.toString());
            globalThis.location.href = url.toString();
          },
        }}
        useClientFetch={false}
      />
    </div>
  );
}
