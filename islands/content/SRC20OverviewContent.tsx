/* ===== SRC20 OVERVIEW CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
import { SRC20Row } from "$globals";
import { SRC20Gallery } from "$section";
import { SRC20OverviewHeader } from "$header";

/* ===== TYPES ===== */
interface SRC20OverviewContentProps {
  initialData: SRC20Row[];
  page: number;
  totalPages: number;
  filterBy: any[];
  sortBy: "ASC" | "DESC";
  timeframe: "24H" | "3D" | "7D";
}

/* ===== COMPONENT ===== */
export function SRC20OverviewContent({
  initialData,
  page,
  totalPages,
  _filterBy,
  _sortBy,
  timeframe,
}: SRC20OverviewContentProps) {
  const [viewType, setViewType] = useState<"minted" | "minting">("minted");
  const [_currentTimeframe, setCurrentTimeframe] = useState<
    "24H" | "3D" | "7D"
  >(
    timeframe,
  );

  const handleViewTypeChange = () => {
    setViewType(viewType === "minted" ? "minting" : "minted");
  };

  return (
    <div class="w-full">
      <SRC20OverviewHeader
        onViewTypeChange={handleViewTypeChange}
        viewType={viewType}
        onTimeframeChange={setCurrentTimeframe}
      />
      <SRC20Gallery
        viewType={viewType}
        fromPage="src20"
        initialData={initialData}
        timeframe={_currentTimeframe}
        pagination={{
          page,
          totalPages,
          onPageChange: (newPage: number) => {
            const url = new URL(globalThis.location.href);
            url.searchParams.set("page", newPage.toString());
            globalThis.location.href = url.toString();
          },
        }}
      />
    </div>
  );
}
