/* ===== SRC20 OVERVIEW CONTENT COMPONENT ===== */
import { useState } from "preact/hooks";
// import { SRC20Row } from "$globals"; // Removed unused import
import { SRC20OverviewHeader } from "$header";
import { SRC20Gallery } from "$section";

/* ===== TYPES ===== */
type SortOption =
  | "TRENDING"
  | "DEPLOY"
  | "HOLDERS"
  | "PROGRESS"
  | "MARKET_CAP"
  | "VOLUME";

interface SRC20OverviewContentProps {
  mintingData?: any;
  timeframe: "24H" | "7D" | "30D";
  sortBy: SortOption;
  sortDirection: "asc" | "desc";
  viewType: "minted" | "minting"; // 🎸 NEW: Add viewType prop
  // 🚀 PERFORMANCE: Single BTC price fetch optimization
  btcPrice?: number;
  btcPriceSource?: string;
}

/* ===== COMPONENT ===== */
export function SRC20OverviewContent({
  mintingData,
  timeframe,
  sortBy,
  sortDirection,
  viewType, // 🎸 NEW: Accept viewType prop
  btcPrice, // 🚀 PERFORMANCE: Accept BTC price (for future use)
  btcPriceSource, // 🚀 PERFORMANCE: Accept BTC price source (for future use)
}: SRC20OverviewContentProps) {
  // Note: btcPrice and btcPriceSource are available for future component optimizations
  // Currently passed through context but not directly used in this component
  console.log(
    `[SRC20OverviewContent] BTC price context available: $${btcPrice} from ${btcPriceSource}`,
  );
  // 🤘 PUNK ROCK SIMPLIFICATION: Remove complexity, just use the data directly
  const [_currentTimeframe, setCurrentTimeframe] = useState<
    "24H" | "7D" | "30D"
  >(timeframe);
  const [isNavigating, setIsNavigating] = useState(false);

  // Get the current data (simplified) - all tokens are in mintingData
  const currentData = mintingData?.data || [];
  const totalPages = mintingData?.totalPages || 1;
  const currentPage = mintingData?.page || 1;
  const [currentSort, setCurrentSort] = useState<{
    filter: SortOption | null;
    direction: "asc" | "desc";
  }>({
    filter: sortBy as SortOption,
    direction: sortDirection as "asc" | "desc",
  });

  // Handle filter changes
  const handleFilterChange = (
    filter: SortOption | null,
    direction: "asc" | "desc",
  ) => {
    setCurrentSort({ filter, direction });
    setIsNavigating(true); // ✅ FRESH.JS: Set loading state

    // ✅ FRESH.JS: Use proper Fresh.js anchor link navigation pattern
    if (typeof globalThis !== "undefined" && globalThis?.location) {
      const url = new URL(globalThis.location.href);
      url.searchParams.set("sortBy", filter || "TRENDING");
      url.searchParams.set("sortDirection", direction);
      url.searchParams.set("page", "1"); // Reset to page 1 when sorting changes

      // Create anchor element with f-partial attribute for Fresh.js navigation
      const link = document.createElement("a");
      link.href = url.toString();
      link.setAttribute("f-partial", "");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Reset loading state after a short delay (Fresh.js will handle the actual navigation)
    setTimeout(() => setIsNavigating(false), 100);
  };

  // Handle view type changes
  const handleViewTypeChange = () => {
    // 🎸 MINTING BUTTON: Toggle between minted and minting views
    setIsNavigating(true);

    if (typeof globalThis !== "undefined" && globalThis?.location) {
      const url = new URL(globalThis.location.href);
      const currentViewType = url.searchParams.get("viewType") || "minting";
      const newViewType = currentViewType === "minting" ? "minted" : "minting";

      url.searchParams.set("viewType", newViewType);
      url.searchParams.set("page", "1"); // Reset to page 1 when view changes

      // Create anchor element with f-partial attribute for Fresh.js navigation
      const link = document.createElement("a");
      link.href = url.toString();
      link.setAttribute("f-partial", "");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Reset loading state after a short delay
    setTimeout(() => setIsNavigating(false), 100);
  };

  return (
    <div class="w-full">
      {/* ✅ FRESH.JS: Show loading overlay during navigation */}
      {isNavigating && (
        <div class="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div class="bg-stamp-card-bg rounded-lg p-4 shadow-lg">
            <div class="animate-spin w-6 h-6 border-2 border-stamp-purple-bright border-t-transparent rounded-full">
            </div>
          </div>
        </div>
      )}
      <SRC20OverviewHeader
        onViewTypeChange={handleViewTypeChange}
        viewType={viewType} // 🎸 Pass actual viewType from props
        onTimeframeChange={setCurrentTimeframe}
        onFilterChange={handleFilterChange}
        currentSort={currentSort}
      />
      <SRC20Gallery
        viewType={viewType} // 🎸 Pass actual viewType from props
        fromPage="src20"
        initialData={currentData}
        timeframe={_currentTimeframe}
        pagination={{
          page: currentPage,
          totalPages: totalPages,
          onPageChange: (newPage: number) => {
            // ✅ FRESH.JS: Use proper Fresh.js anchor link navigation for pagination
            if (typeof globalThis !== "undefined" && globalThis?.location) {
              const url = new URL(globalThis.location.href);
              url.searchParams.set("page", newPage.toString());

              // Create anchor element with f-partial attribute for Fresh.js navigation
              const link = document.createElement("a");
              link.href = url.toString();
              link.setAttribute("f-partial", "");
              link.style.display = "none";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          },
        }}
      />
    </div>
  );
}
