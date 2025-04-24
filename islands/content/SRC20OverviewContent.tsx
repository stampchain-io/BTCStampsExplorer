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
  const [selectedFilter, setSelectedFilter] = useState<
    "DEPLOY" | "HOLDERS" | null
  >("DEPLOY");

  return (
    <div class="w-full">
      <SRC20OverviewHeader
        onViewTypeChange={() =>
          setViewType((prev) => prev === "minted" ? "minting" : "minted")}
        viewType={viewType}
        onTimeframeChange={setCurrentTimeframe}
        onFilterChange={setSelectedFilter}
      />
      <SRC20Gallery
        viewType={viewType}
        fromPage="src20"
        initialData={viewType === "minted" ? mintedData.data : mintingData.data}
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
