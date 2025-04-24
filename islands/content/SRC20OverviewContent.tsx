/* ===== SRC20 OVERVIEW CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { SRC20Gallery } from "$section";
import { SRC20OverviewHeader } from "$header";

/* ===== TYPES ===== */
interface SRC20OverviewContentProps {
  mintedData: {
    data: SRC20Row[];
    total: number;
    page: number;
    totalPages: number;
  };
  mintingData: {
    data: SRC20Row[];
    total: number;
    page: number;
    totalPages: number;
  };
  timeframe: "24H" | "3D" | "7D";
}

/* ===== COMPONENT ===== */
export function SRC20OverviewContent({
  mintedData,
  mintingData,
  timeframe,
}: SRC20OverviewContentProps) {
  const [viewType, setViewType] = useState<"minted" | "minting">("minted");
  const [_currentTimeframe, setCurrentTimeframe] = useState<
    "24H" | "3D" | "7D"
  >(timeframe);
  const [currentSort, setCurrentSort] = useState<{
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null;
    direction: "asc" | "desc";
  }>({
    filter: null,
    direction: "desc",
  });

  // Get the current data based on view type and sorting
  const getCurrentData = () => {
    const baseData = viewType === "minted" ? mintedData.data : mintingData.data;

    if (!currentSort.filter) return baseData;

    return sortData(baseData, currentSort.filter, currentSort.direction);
  };

  // Handle filter changes
  const handleFilterChange = (
    filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null,
    direction: "asc" | "desc",
  ) => {
    setCurrentSort({ filter, direction });
    const dataToSort = viewType === "minted"
      ? mintedData.data
      : mintingData.data;
    const newSortedData = sortData(dataToSort, filter, direction);
    // Update your data display with newSortedData
  };

  // Handle view type changes
  const handleViewTypeChange = () => {
    setCurrentSort({ filter: null, direction: "desc" }); // Reset sort when changing views
    setViewType((prev) => prev === "minted" ? "minting" : "minted");
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

const sortData = (
  data: SRC20Row[],
  filter: "TRENDING" | "DEPLOY" | "HOLDERS" | null,
  direction: "asc" | "desc",
) => {
  if (!filter) return data;

  const sortedArray = [...data];

  switch (filter) {
    case "HOLDERS":
      return sortedArray.sort((a, b) => {
        const aHolders = Number(a.holders) || 0;
        const bHolders = Number(b.holders) || 0;
        return direction === "asc" ? aHolders - bHolders : bHolders - aHolders;
      });

    case "DEPLOY":
      return sortedArray.sort((a, b) => {
        const aTime = new Date(a.block_time).getTime();
        const bTime = new Date(b.block_time).getTime();
        return direction === "asc"
          ? aTime - bTime // Oldest first (ascending)
          : bTime - aTime; // Newest first (descending)
      });

    default:
      return data;
  }
};
